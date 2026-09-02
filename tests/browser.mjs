/* Browser-Tests für das Strategy Toolkit.
   Laufen gegen die echte index.html in Chromium – ohne Server, ohne Build.

   Voraussetzung:  cd tests && npm install
   Ausführen:      cd tests && npm test

   Geprüft werden: Hash-Routing, entprelltes Speichern, Import-Validierung,
   die Regeln des Analyse-Coachs und die Druckausgabe. */

import { chromium } from 'playwright-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'file://' + path.join(ROOT, 'index.html');
const SRC = fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-tests-'));

// Chromium finden: bevorzugt der von Playwright installierte Browser.
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) {
      const exe = path.join(base, dir, 'chrome-linux', 'chrome');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return undefined; // Playwright entscheidet selbst
}

let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};
const openDetails = (page) =>
  page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));

const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox'] });

/* ---------- Routing ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await page.goto(FILE);
  await page.waitForTimeout(300);
  await openDetails(page);
  check('Seite lädt ohne JS-Fehler', errs.length === 0, errs.join(' | '));
  check('Startansicht ist der Prozess', await page.locator('#view-prozess.is-active').count() === 1);

  await page.click('#nav .nav-item[data-view="swot"]');
  await page.waitForTimeout(150);
  check('Klick auf die Navigation setzt den URL-Hash', page.url().endsWith('#swot'));
  check('Die SWOT-Ansicht ist aktiv', await page.locator('#view-swot.is-active').count() === 1);

  await page.goBack();
  await page.waitForTimeout(200);
  check('Der Zurück-Button wechselt die Ansicht', await page.locator('#view-prozess.is-active').count() === 1);

  await page.goto(FILE + '#bcg');
  await page.waitForTimeout(300);
  check('Ein Deep-Link öffnet die Ansicht direkt', await page.locator('#view-bcg.is-active').count() === 1);

  await page.goto(FILE + '#gibtesnicht');
  await page.waitForTimeout(300);
  check('Ein ungültiger Hash fällt auf die Startseite zurück', await page.locator('#view-prozess.is-active').count() === 1);
  await ctx.close();
}

/* ---------- Speichern ---------- */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(FILE + '#dossier');
  await page.waitForTimeout(200);
  await openDetails(page);
  await page.fill('#fs-titel', 'Strategische Analyse Musterfirma');
  const hasIt = () => page.evaluate(() =>
    (localStorage.getItem('strategy-toolkit-v1') || '').includes('Musterfirma'));
  check('Speichern ist entprellt (schreibt nicht bei jedem Zeichen)', !(await hasIt()));
  await page.waitForTimeout(700);
  check('Nach kurzer Pause ist der Wert gesichert', await hasIt());

  await page.reload();
  await page.waitForTimeout(300);
  await openDetails(page);
  check('Der Wert überlebt das Neuladen', await page.inputValue('#fs-titel') === 'Strategische Analyse Musterfirma');

  await page.fill('#fs-gruppe', 'Gruppe 7');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  check('Beim Verlassen der Seite wird sofort gesichert', await page.evaluate(() =>
    (localStorage.getItem('strategy-toolkit-v1') || '').includes('Gruppe 7')));

  const version = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('strategy-toolkit-v1')).schemaVersion);
  check('Die Schema-Version wird mitgeschrieben', version === 1, 'schemaVersion=' + version);
  await ctx.close();
}

/* ---------- Import ---------- */
{
  const fremd = path.join(TMP, 'fremd.json');
  fs.writeFileSync(fremd, JSON.stringify({ irgendwas: 1, foo: 'bar' }));
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let msg = '';
  page.on('dialog', (d) => { msg = d.message(); d.accept(); });
  await page.goto(FILE + '#dossier');
  await page.waitForTimeout(200);
  await openDetails(page);
  await page.fill('#fs-titel', 'Behalten');
  await page.waitForTimeout(600);
  await page.setInputFiles('#import-file', fremd);
  await page.waitForTimeout(400);
  check('Eine fremde JSON-Datei wird abgelehnt', msg.includes('Import fehlgeschlagen'));
  await page.goto(FILE + '#dossier');
  await page.waitForTimeout(250);
  await openDetails(page);
  check('Der Arbeitsstand bleibt nach abgelehntem Import erhalten',
    await page.inputValue('#fs-titel') === 'Behalten');

  const gut = path.join(TMP, 'projekt.json');
  fs.writeFileSync(gut, JSON.stringify({
    schemaVersion: 1,
    swot: { strengths: ['Importierte Stärke'], weaknesses: [], opportunities: [], threats: [] },
    pestel: { political: [], economic: [], social: [], technological: [], environmental: [], legal: [] },
    fallstudie: { company: '', titel: 'Importiertes Projekt', gruppe: '',
      sections: { einleitung: '', ueberblick: '', extern: '', intern: '', swotopt: '', diskussion: '', fazit: '' } },
  }));
  await page.setInputFiles('#import-file', gut);
  await page.waitForTimeout(500);
  await page.goto(FILE + '#dossier');
  await page.waitForTimeout(250);
  await openDetails(page);
  check('Eine gültige Projektdatei wird importiert',
    await page.inputValue('#fs-titel') === 'Importiertes Projekt');
  await ctx.close();
}

/* ---------- Analyse-Coach ----------
   Je Regel ein Zustand, der sie auslösen muss. Die Treiber-Richtungen der
   Five Forces werden aus der Quelle gelesen, damit sich jede Kraft gezielt
   auf einen Wert bringen lässt (Beitrag = "hoch" ? Wert : 6 - Wert). */
{
  const block = SRC.slice(SRC.indexOf('const FORCES = ['), SRC.indexOf('const driverContribution'));
  const dirsOf = {};
  for (const part of block.split('{ key: "').slice(1)) {
    dirsOf[part.slice(0, part.indexOf('"'))] =
      [...part.matchAll(/"(hoch|niedrig)"\]/g)].map((m) => m[1]);
  }
  const forcesAt = (z) => Object.fromEntries(Object.entries(dirsOf).map(([k, dirs]) =>
    [k, { v: z, note: '', drivers: dirs.map((d) => (d === 'hoch' ? z : 6 - z)) }]));

  const base = {
    schemaVersion: 1,
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    pestel: { political: [], economic: [], social: [], technological: [], environmental: [], legal: [] },
  };
  const leer = (keys) => Object.fromEntries(keys.map((k) => [k, []]));

  const CASES = [
    ['swot', 'Nur Stärken erfasst',
      { swot: { strengths: ['a', 'b', 'c', 'd'], weaknesses: [], opportunities: [], threats: [] } },
      'Nur Stärken, keine Schwächen'],
    ['swot', 'Nur Chancen erfasst',
      { swot: { strengths: [], weaknesses: [], opportunities: ['a', 'b', 'c', 'd'], threats: [] } },
      'Nur Chancen, keine Risiken'],
    ['forces', 'Kräfte nicht differenziert', { forces: forcesAt(4) }, 'gleich stark bewertet'],
    ['forces', 'Kräfte ohne Begründung', { forces: forcesAt(4) }, 'ohne Begründung'],
    ['ansaetze', 'VRIO durchweg dauerhafter Vorteil',
      { vrio: [1, 2, 3].map((n) => ({ name: 'R' + n, v: 1, r: 1, i: 1, o: 1 })) },
      'dann wäre keine davon selten'],
    ['bcg', 'Alle Einheiten im selben Feld',
      { bcg: [{ name: 'A', growth: 15, share: 2, revenue: 10 }, { name: 'B', growth: 20, share: 3, revenue: 10 },
              { name: 'C', growth: 12, share: 1.5, revenue: 10 }] },
      'Alle Geschäftseinheiten liegen im Feld'],
    ['bcg', 'Question Marks ohne Cash Cow',
      { bcg: [{ name: 'A', growth: 15, share: 0.5, revenue: 10 }, { name: 'B', growth: 20, share: 0.4, revenue: 10 },
              { name: 'C', growth: 4, share: 0.5, revenue: 10 }] },
      'keine Cash Cow'],
    ['bsc', 'Nur eine Perspektive gefüllt',
      { bsc: { financial: [{ ziel: 'Z', kennzahl: 'K', zielwert: '10', massnahme: 'M' }],
               customer: [], process: [], learning: [] } },
      'von 4 Perspektiven gefüllt'],
    ['bsc', 'Scorecard-Zeile ohne Kennzahl',
      { bsc: { financial: [{ ziel: 'Z', kennzahl: '', zielwert: '', massnahme: '' }],
               customer: [{ ziel: 'Z2', kennzahl: 'K', zielwert: '5', massnahme: '' }],
               process: [{ ziel: 'Z3', kennzahl: 'K', zielwert: '5', massnahme: '' }],
               learning: [{ ziel: 'Z4', kennzahl: 'K', zielwert: '5', massnahme: '' }] } },
      'ohne Kennzahl oder Zielwert'],
    ['strategiewahl', 'Rang 1 und 2 zu knapp',
      { strategiewahl: { criteria: [{ name: 'A', weight: 1 }, { name: 'B', weight: 1 },
                                    { name: 'C', weight: 1 }, { name: 'D', weight: 10 }],
        options: [{ name: 'Opt1', scores: [5, 5, 5, 5] }, { name: 'Opt2', scores: [4, 5, 5, 5] }] } },
      'nicht robust'],
    ['strategiewahl', 'Alle Kriterien gleich gewichtet',
      { strategiewahl: { criteria: [{ name: 'A', weight: 2 }, { name: 'B', weight: 2 }],
        options: [{ name: 'O1', scores: [5, 5] }, { name: 'O2', scores: [1, 1] }] } },
      'gleich gewichtet'],
    ['szenario', 'Nur ein Szenario beschrieben',
      { szenario: { frage: 'F', factors: ['x'], a: 'Zukunft A', b: '' } }, 'lebt vom Kontrast'],
    ['szenario', 'Szenarien ohne Einflussfaktoren',
      { szenario: { frage: 'F', factors: [], a: 'A', b: 'B' } }, 'ohne Einflussfaktoren'],
    ['bmc', 'Wertangebot fehlt',
      { bmc: Object.assign(leer(['partners', 'activities', 'resources', 'value', 'relationships',
                                 'channels', 'segments', 'costs', 'revenues']), { partners: ['P'] }) },
      'Wertangebot ist leer'],
    ['pestel', 'Einträge ohne Vorzeichen',
      { pestel: Object.assign({}, base.pestel,
        { political: ['a', 'b', 'c'].map((t) => ({ text: t, sign: 0 })) }) },
      'ohne Vorzeichen fließt nichts'],
    ['stakeholder', 'Keine Spreizung in der Matrix',
      { stakeholders: ['A', 'B', 'C'].map((n) => ({ name: n, power: 3, interest: 3 })) },
      'dieselbe Macht- und Interessenlage'],
    ['wettbewerb', 'Keine strategischen Gruppen',
      { wettbewerb: { xLabel: 'x', yLabel: 'y',
        competitors: [{ name: 'A', x: 1, y: 2, group: '' }, { name: 'B', x: 3, y: 4, group: '' },
                      { name: 'C', x: 5, y: 6, group: '' }] } },
      'Punktwolke'],
    ['wertkette', 'Nur Primäraktivitäten betrachtet',
      { valuechain: Object.assign(leer(['inbound', 'operations', 'outbound', 'marketing', 'service',
                                        'infrastructure', 'hr', 'technology', 'procurement']),
        { inbound: [{ text: 'a', sign: 1 }] }) },
      'Nur Primäraktivitäten'],
    ['kennzahlen', 'EVA-Angaben unvollständig',
      { kennzahlen: { ebit: '', da: '', umsatz: '', nopat: '90', kapital: '', wacc: '' } },
      'Für den EVA fehlen'],
    ['abell', 'Nur eine Marktdimension',
      { abell: { groups: ['B2B'], functions: [], technologies: [] } }, 'von 3 Dimensionen gefüllt'],
  ];

  for (const [view, name, patch, erwartet] of CASES) {
    const ctx = await browser.newContext();
    const stand = JSON.stringify(Object.assign({}, base, patch));
    await ctx.addInitScript(
      `try{localStorage.setItem('strategy-toolkit-v1', ${JSON.stringify(stand)})}catch(e){}`);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(FILE + '#' + view);
    await page.waitForTimeout(220);
    const panel = page.locator(`#view-${view} .coach-panel`);
    const txt = (await panel.count()) && !(await panel.first().isHidden())
      ? await panel.first().innerText() : '';
    check(`Coach · ${name}`, txt.includes(erwartet) && errs.length === 0,
      txt.includes(erwartet) ? '' : (txt.replace(/\n/g, ' | ').slice(0, 160) || 'kein Hinweis'));
    await ctx.close();
  }
}

/* ---------- Gegenprobe und Druckausgabe ---------- */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto(FILE);
  await page.waitForTimeout(200);
  await page.click('#btn-example');
  await page.waitForTimeout(400);

  const laut = [];
  for (const v of ['swot', 'forces', 'bcg', 'bsc', 'bmc', 'wertkette', 'stakeholder',
                   'ansaetze', 'szenario', 'wettbewerb', 'strategiewahl', 'abell']) {
    await page.goto(FILE + '#' + v);
    await page.waitForTimeout(180);
    const p = page.locator(`#view-${v} .coach-panel`);
    if (await p.count() && !(await p.first().isHidden())) {
      const w = await p.locator('.cons-warn').count();
      if (w) laut.push(`${v} (${w})`);
    }
  }
  check('Der Beispieldatensatz löst keine Warnungen aus', laut.length === 0, laut.join(', '));

  await page.goto(FILE + '#dossier');
  await page.waitForTimeout(600);
  const pdf = path.join(TMP, 'dossier.pdf');
  await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
  const buf = fs.readFileSync(pdf);
  const raw = buf.toString('latin1');
  const seiten = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const a4 = /\/MediaBox\s*\[\s*0 0 59[45](\.\d+)? 84[12](\.\d+)?/.test(raw);
  check('Die Druckausgabe erzeugt ein mehrseitiges PDF', buf.length > 20000 && seiten >= 2,
    `${seiten} Seiten, ${Math.round(buf.length / 1024)} KB`);
  check('Die Seiten haben A4-Format', a4);
  check('Der Analyse-Coach erscheint nicht im Druck', await page.evaluate(() => {
    const el = document.querySelector('#view-dossier .coach-panel');
    return !el || getComputedStyle(el).display === 'none';
  }));
  await ctx.close();
}

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
