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

// Minimaler gültiger Stand; einzelne Werkzeuge werden je Test daraufgesetzt.
const BASE = {
  schemaVersion: 1,
  swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
  pestel: { political: [], economic: [], social: [], technological: [], environmental: [], legal: [] },
};
const leer = (keys) => Object.fromEntries(keys.map((k) => [k, []]));

// Treiber-Richtungen der Five Forces aus der Quelle lesen, um jede Kraft gezielt
// auf einen Wert zu bringen (Beitrag = "hoch" ? Wert : 6 - Wert).
const forceDirs = (() => {
  const block = SRC.slice(SRC.indexOf('const FORCES = ['), SRC.indexOf('const driverContribution'));
  const out = {};
  for (const part of block.split('{ key: "').slice(1)) {
    out[part.slice(0, part.indexOf('"'))] = [...part.matchAll(/"(hoch|niedrig)"\]/g)].map((m) => m[1]);
  }
  return out;
})();
const forcesAt = (z) => Object.fromEntries(Object.entries(forceDirs).map(([k, dirs]) =>
  [k, { v: z, note: '', drivers: dirs.map((d) => (d === 'hoch' ? z : 6 - z)) }]));

// Seite mit vorgegebenem Stand öffnen.
async function openWith(patch, hash) {
  const ctx = await browser.newContext();
  const stand = JSON.stringify(Object.assign({}, BASE, patch));
  await ctx.addInitScript(
    `try{localStorage.setItem('strategy-toolkit-v1', ${JSON.stringify(stand)})}catch(e){}`);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(FILE + (hash ? '#' + hash : ''));
  await page.waitForTimeout(220);
  return { ctx, page, errs };
}

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
      { pestel: Object.assign({}, BASE.pestel,
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
    ['abell', 'Markt erst in zwei von drei Dimensionen',
      { abell: { groups: ['B2B'], functions: ['Kosten senken'], technologies: [] } },
      'von 3 Dimensionen gefüllt'],
  ];

  for (const [view, name, patch, erwartet] of CASES) {
    const { ctx, page, errs } = await openWith(patch, view);
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

/* ---------- Der Coach schweigt im frühen Zwischenstand ----------
   Lückenhinweise erscheinen erst, wenn ein Werkzeug halbwegs bearbeitet ist –
   sonst meldet der Coach beim ersten Eintrag den offensichtlichen Rest. */
{
  const STILL = [
    ['abell', 'Erst eine von drei Marktdimensionen',
      { abell: { groups: ['B2B'], functions: [], technologies: [] } }, 'Dimensionen'],
    ['pestel', 'Erst ein PESTEL-Feld gefüllt',
      { pestel: Object.assign({}, BASE.pestel, { political: [{ text: 'Regulierung', sign: -1 }] }) },
      'ohne Eintrag'],
    ['bmc', 'Erst zwei von neun Bausteinen gefüllt',
      { bmc: Object.assign(leer(['partners', 'activities', 'resources', 'value', 'relationships',
        'channels', 'segments', 'costs', 'revenues']), { partners: ['P'], value: ['V'] }) },
      'noch leer'],
    ['swot', 'Kleine, noch unfertige SWOT',
      { swot: { strengths: ['S1', 'S2', 'S3'], weaknesses: ['W1'], opportunities: [], threats: [] } },
      'dominiert'],
  ];
  for (const [view, name, patch, unerwuenscht] of STILL) {
    const { ctx, page } = await openWith(patch, view);
    const panel = page.locator(`#view-${view} .coach-panel`);
    const txt = (await panel.count()) && !(await panel.first().isHidden())
      ? await panel.first().innerText() : '';
    check(`Coach schweigt · ${name}`, !txt.includes(unerwuenscht),
      txt.replace(/\n/g, ' | ').slice(0, 140));
    await ctx.close();
  }
}

/* ---------- Fachliche Rechenkerne ----------
   Hier entscheidet sich, ob das Toolkit fachlich richtig rechnet. Ein stiller
   Fehler in der TOWS-Zuordnung oder in der EVA-Formel würde über Semester
   hinweg Falsches vermitteln, ohne dass es jemandem auffällt. */
{
  /* EBITDA, Marge, Kapitalkosten und EVA */
  {
    const { ctx, page } = await openWith(
      { kennzahlen: { ebit: '120', da: '40', umsatz: '800', nopat: '90', kapital: '600', wacc: '8' } },
      'kennzahlen');
    const ebitda = await page.locator('#out-ebitda').innerText();
    const eva = await page.locator('#out-eva').innerText();
    // EBITDA = 120 + 40 = 160; Marge = 160/800 = 20 %
    check('EBITDA = EBIT + Abschreibungen', /160/.test(ebitda), ebitda.replace(/\n/g, ' '));
    check('EBITDA-Marge = EBITDA / Umsatz', /20\s*%/.test(ebitda));
    // Kapitalkosten = 600 × 8 % = 48; EVA = 90 − 48 = 42
    check('Kapitalkosten = Kapital × WACC', /48/.test(eva), eva.replace(/\n/g, ' '));
    check('EVA = NOPAT − Kapitalkosten', /42/.test(eva));
    check('Positiver EVA wird als Wertschaffung ausgewiesen', /Wert geschaffen/.test(eva));
    await ctx.close();
  }
  {
    const { ctx, page } = await openWith(
      { kennzahlen: { ebit: '', da: '', umsatz: '', nopat: '30', kapital: '600', wacc: '8' } },
      'kennzahlen');
    const eva = await page.locator('#out-eva').innerText();
    // 30 − 48 = −18
    check('Negativer EVA wird als Wertvernichtung ausgewiesen',
      /Wert vernichtet/.test(eva) && /-?18/.test(eva), eva.replace(/\n/g, ' '));
    await ctx.close();
  }

  /* Branchenattraktivität = (5 − Ø Kräfte) / 4 */
  for (const [stufe, score, urteil] of [[1, '100', 'hohe'], [3, '50', 'mittlere'], [5, '0', 'geringe']]) {
    const { ctx, page } = await openWith({ forces: forcesAt(stufe) }, 'forces');
    const s = await page.locator('#forces-score').innerText();
    const v = await page.locator('#forces-verdict').innerText();
    check(`Branchenattraktivität bei Kräften auf ${stufe}: ${score} %`,
      s.trim() === score && v.includes(urteil), `${s} % / ${v}`);
    await ctx.close();
  }

  /* TOWS: die vier Normstrategien dürfen nicht vertauscht sein */
  {
    const { ctx, page } = await openWith(
      { swot: { strengths: ['S1'], weaknesses: ['W1'], opportunities: ['O1'], threats: ['T1'] } },
      'swot');
    const feld = async (id) => (await page.locator('#' + id + ' li').allInnerTexts()).join(';');
    check('TOWS · SO verknüpft Stärken mit Chancen', (await feld('tows-so')) === 'S1 × O1');
    check('TOWS · ST verknüpft Stärken mit Risiken', (await feld('tows-st')) === 'S1 × T1');
    check('TOWS · WO verknüpft Schwächen mit Chancen', (await feld('tows-wo')) === 'W1 × O1');
    check('TOWS · WT verknüpft Schwächen mit Risiken', (await feld('tows-wt')) === 'W1 × T1');
    await ctx.close();
  }

  /* VRIO: Prüfreihenfolge V → R → I → O nach Barney */
  {
    const { ctx, page } = await openWith({ vrio: [
      { name: 'A', v: 0, r: 0, i: 0, o: 0 },
      { name: 'B', v: 1, r: 0, i: 0, o: 0 },
      { name: 'C', v: 1, r: 1, i: 0, o: 0 },
      { name: 'D', v: 1, r: 1, i: 1, o: 0 },
      { name: 'E', v: 1, r: 1, i: 1, o: 1 },
    ] }, 'ansaetze');
    const got = await page.locator('#vrio-table .vrio-imp').allInnerTexts();
    const soll = ['Wettbewerbsnachteil', 'Wettbewerbsparität', 'Temporärer Vorteil',
                  'Ungenutzter Vorteil', 'Dauerhafter Vorteil'];
    check('VRIO leitet die Wettbewerbsimplikation korrekt ab',
      JSON.stringify(got) === JSON.stringify(soll), got.join(' | '));
    await ctx.close();
  }

  /* Nutzwertanalyse: gewichtetes Mittel und K.-o.-Kriterium */
  {
    const { ctx, page } = await openWith({ strategiewahl: {
      criteria: [{ name: 'Wichtig', weight: 3 }, { name: 'Nebensache', weight: 1 }],
      options: [{ name: 'O1', scores: [5, 1] }, { name: 'O2', scores: [1, 5] }] } }, 'strategiewahl');
    // O1 = (5×3 + 1×1) / 4 = 4,00 · O2 = (1×3 + 5×1) / 4 = 2,00
    const totals = await page.locator('#sw-matrix .sw-total').allInnerTexts();
    check('Nutzwert ist das gewichtete Mittel der Bewertungen',
      totals.join(',') === '4.00,2.00', totals.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await openWith({ strategiewahl: {
      criteria: [{ name: 'Muss', weight: 1, ko: true }, { name: 'Kann', weight: 1 }],
      options: [{ name: 'Erfüllt', scores: [5, 5] }, { name: 'Reißt K.o.', scores: [1, 5] }] } },
      'strategiewahl');
    const totals = await page.locator('#sw-matrix .sw-total').allInnerTexts();
    check('Ein gerissenes K.-o.-Kriterium schließt die Option aus',
      totals[0] === '5.00' && totals[1] === '–', totals.join(' | '));
    await ctx.close();
  }

  /* SMART-Prüfung zählt die erfüllten Kriterien */
  {
    const { ctx, page } = await openWith({ ziele: [
      { ziel: 'Teilweise', s: 'spezifisch', m: 'messbar', a: '', r: '', t: '' },
      { ziel: 'Vollständig', s: 'a', m: 'b', a: 'c', r: 'd', t: 'e' },
    ] }, 'ziele');
    const badges = await page.locator('.smart-head .badge').allInnerTexts();
    check('SMART zählt die erfüllten Kriterien', badges[0].trim() === '2/5', badges.join(' | '));
    check('Ein vollständiges Ziel wird als SMART ausgewiesen', badges[1].includes('SMART'));
    await ctx.close();
  }

  /* Automatischer Datenfluss in die SWOT */
  {
    const { ctx, page } = await openWith({
      pestel: Object.assign({}, BASE.pestel, {
        political: [{ text: 'Förderprogramm', sign: 1 }, { text: 'Handelskonflikt', sign: -1 }] }),
      valuechain: Object.assign(leer(['inbound', 'operations', 'outbound', 'marketing', 'service',
        'infrastructure', 'hr', 'technology', 'procurement']), {
        operations: [{ text: 'Effiziente Fertigung', sign: 1 }, { text: 'Alte Anlagen', sign: -1 }] }),
      vrio: [{ name: 'Patentportfolio', v: 1, r: 1, i: 1, o: 1 },
             { name: 'Altsystem', v: 0, r: 0, i: 0, o: 0 }],
      forces: Object.assign(forcesAt(3), {
        buyers: { v: 5, note: '', drivers: forceDirs.buyers.map((d) => (d === 'hoch' ? 5 : 1)) },
        substitutes: { v: 1, note: '', drivers: forceDirs.substitutes.map((d) => (d === 'hoch' ? 1 : 5)) },
      }),
    }, 'swot');
    const feld = async (f) =>
      (await page.locator(`[data-derived="${f}"] li`).allInnerTexts()).join(' ;; ');
    const st = await feld('strengths'), sw = await feld('weaknesses');
    const ch = await feld('opportunities'), ri = await feld('threats');
    check('Positive Wertketten-Einträge werden zu Stärken', st.includes('Effiziente Fertigung'), st);
    check('Negative Wertketten-Einträge werden zu Schwächen', sw.includes('Alte Anlagen'), sw);
    check('VRIO-Vorteile werden zu Stärken', st.includes('Patentportfolio'), st);
    check('VRIO-Nachteile werden zu Schwächen', sw.includes('Altsystem'), sw);
    check('Positive PESTEL-Einträge werden zu Chancen', ch.includes('Förderprogramm'), ch);
    check('Negative PESTEL-Einträge werden zu Risiken', ri.includes('Handelskonflikt'), ri);
    check('Eine starke Wettbewerbskraft wird zum Risiko', /Hohe .*Abnehmer/i.test(ri), ri);
    check('Eine schwache Wettbewerbskraft wird zur Chance', /Geringe Bedrohung durch Ersatzprodukte/.test(ch), ch);
    await ctx.close();
  }
}

/* ---------- Darstellung des Konsistenz-Checks ----------
   Startseite: Warnungen sofort sichtbar, Hinweise eingeklappt.
   Dossier: vollständig und nach Werkzeug gruppiert. */
{
  const unfertig = {
    swot: { strengths: ['A', 'B', 'C'], weaknesses: [], opportunities: [], threats: [] },
    vrio: [1, 2, 3].map((n) => ({ name: 'R' + n, v: 1, r: 1, i: 1, o: 1 })),
    abell: { groups: ['B2B'], functions: [], technologies: [] },
    kennzahlen: { ebit: '', da: '', umsatz: '', nopat: '90', kapital: '', wacc: '' },
  };
  {
    const { ctx, page } = await openWith(unfertig, '');
    const warn = await page.locator('#dash-consistency > .consistency-list .cons-warn').count();
    const zugeklappt = await page.locator('#dash-consistency .cons-more').count();
    const offen = await page.locator('#dash-consistency .cons-more[open]').count();
    check('Startseite zeigt Warnungen unmittelbar', warn >= 2, warn + ' Warnungen');
    check('Startseite klappt die übrigen Hinweise ein', zugeklappt === 1 && offen === 0);
    const summary = await page.locator('#dash-consistency .cons-more > summary').innerText();
    check('Der Aufklapper nennt die Zahl der Hinweise', /^\d+ weitere/.test(summary), summary);
    await ctx.close();
  }
  {
    const { ctx, page } = await openWith(unfertig, 'dossier');
    const gruppen = await page.locator('.consistency-panel .cons-group').count();
    const ohneDetails = await page.locator('.consistency-panel .cons-more').count();
    check('Das Dossier gruppiert die Befunde nach Werkzeug', gruppen >= 3, gruppen + ' Gruppen');
    check('Im Dossier ist nichts eingeklappt', ohneDetails === 0);
    const kopf = await page.locator('.consistency-panel .cons-group-head').first().innerText();
    check('Jede Gruppe trägt den Namen ihres Werkzeugs', kopf.trim().length > 0, kopf);
    await ctx.close();
  }
  {
    // Eine in sich schlüssige (wenn auch schlanke) Analyse: keine Befunde.
    const { ctx, page } = await openWith({
      abell: { groups: ['B2B'], functions: ['Kosten senken'], technologies: ['Cloud'] },
      pestel: Object.assign({}, BASE.pestel, {
        political: [{ text: 'Förderung', sign: 1 }], economic: [{ text: 'Zinsen', sign: -1 }],
        social: [{ text: 'Demografie', sign: -1 }], technological: [{ text: 'KI', sign: 1 }],
        environmental: [{ text: 'CO2-Preis', sign: -1 }], legal: [{ text: 'Datenschutz', sign: -1 }] }),
      valuechain: Object.assign(leer(['inbound', 'operations', 'outbound', 'marketing', 'service',
        'infrastructure', 'hr', 'technology', 'procurement']), {
        operations: [{ text: 'Fertigung', sign: 1 }], hr: [{ text: 'Fachkräfte', sign: -1 }] }),
    }, '');
    const txt = await page.locator('#dash-consistency').innerText();
    check('Eine schlüssige Analyse meldet keine Auffälligkeiten',
      txt.includes('Keine Auffälligkeiten'), txt.replace(/\n/g, ' | ').slice(0, 160));
    await ctx.close();
  }
}

/* ---------- Zeitstände & Vergleich ----------
   Der Vergleich beantwortet die Leitfrage der strategischen Kontrolle. Geprüft
   wird das Sichern über die Oberfläche, jede der drei Änderungsarten
   (hinzugekommen / entfallen / geändert) und das Wiederherstellen. */
{
  // Seite mit vorgegebenem Arbeitsstand UND vorgegebenen Zeitständen öffnen.
  async function openWithSnaps(jetzt, snaps, hash) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    const cur = JSON.stringify(Object.assign({}, BASE, jetzt));
    const list = JSON.stringify(snaps.map((s, i) => ({
      id: 'snap' + i, ts: s.ts || '2026-03-01T10:00:00.000Z', label: s.label || ('Stand ' + (i + 1)),
      state: Object.assign({}, BASE, s.state),
    })));
    await ctx.addInitScript(
      `try{localStorage.setItem('strategy-toolkit-v1', ${JSON.stringify(cur)});`
      + `localStorage.setItem('strategy-toolkit-snapshots-v1', ${JSON.stringify(list)})}catch(e){}`);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('dialog', (d) => d.accept());
    await page.goto(FILE + (hash ? '#' + hash : ''));
    await page.waitForTimeout(260);
    return { ctx, page, errs };
  }
  const zeigeVergleich = async (page) => {
    await page.click('#snap-list button[data-act="diff"]');
    await page.waitForTimeout(220);
    return page.locator('#snap-diff').innerText();
  };

  /* Sichern über die Oberfläche */
  {
    const { ctx, page, errs } = await openWith(
      { swot: { strengths: ['Starke Marke'], weaknesses: [], opportunities: [], threats: [] } },
      'kontrolle');
    check('Ohne Zeitstand erscheint ein Hinweis',
      (await page.locator('#snap-list .snap-empty').count()) === 1);
    await page.fill('#snap-form input[name="label"]', 'Nach der Umweltanalyse');
    await page.click('#snap-form button[type="submit"]');
    await page.waitForTimeout(260);
    const eintrag = await page.locator('#snap-list li').count();
    const name = await page.locator('#snap-list .snap-name').first().innerText();
    check('Ein Zeitstand lässt sich sichern und erscheint in der Liste',
      eintrag === 1 && name === 'Nach der Umweltanalyse', `${eintrag} Einträge / ${name}`);
    check('Der frisch gesicherte Stand meldet keine Abweichung',
      (await page.locator('#snap-diff').innerText()).includes('nichts geändert'));
    check('Das Sichern wirft keine Fehler', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  /* Hinzugekommene Einträge */
  {
    const { ctx, page } = await openWithSnaps(
      { swot: { strengths: ['Starke Marke', 'Neues Patent'], weaknesses: [], opportunities: [], threats: [] } },
      [{ state: { swot: { strengths: ['Starke Marke'], weaknesses: [], opportunities: [], threats: [] } } }],
      'kontrolle');
    const txt = await zeigeVergleich(page);
    check('Der Vergleich zeigt hinzugekommene Einträge',
      txt.includes('Neues Patent') && /1 Eintrag hinzugekommen/.test(txt),
      txt.replace(/\n/g, ' | ').slice(0, 160));
    await ctx.close();
  }

  /* Entfallene Einträge */
  {
    const { ctx, page } = await openWithSnaps(
      { pestel: Object.assign({}, BASE.pestel, { political: [] }) },
      [{ state: { pestel: Object.assign({}, BASE.pestel, {
        political: [{ text: 'Subventionen laufen weiter', sign: 1 }] }) } }],
      'kontrolle');
    const txt = await zeigeVergleich(page);
    check('Der Vergleich zeigt entfallene Einträge',
      txt.includes('Subventionen laufen weiter') && /1 Eintrag entfallen/.test(txt),
      txt.replace(/\n/g, ' | ').slice(0, 160));
    await ctx.close();
  }

  /* Geänderte Werte: eine verschobene Anspruchsgruppe ist eine Änderung,
     keine Löschung mit Neuanlage. */
  {
    const { ctx, page } = await openWithSnaps(
      { stakeholders: [{ name: 'Investor:innen', power: 5, interest: 4 }] },
      [{ state: { stakeholders: [{ name: 'Investor:innen', power: 3, interest: 4 }] } }],
      'kontrolle');
    const txt = await zeigeVergleich(page);
    check('Eine verschobene Anspruchsgruppe erscheint als Änderung',
      /Macht 3, Interesse 4 → Macht 5, Interesse 4/.test(txt) && /1 Wert geändert/.test(txt),
      txt.replace(/\n/g, ' | ').slice(0, 200));
    check('Sie erscheint nicht als Löschung plus Neuanlage',
      /0 Einträge hinzugekommen/.test(txt) && /0 Einträge entfallen/.test(txt)
      && !/[+−]\s*Anspruchsgruppen/.test(txt));
    await ctx.close();
  }

  /* Geänderte Bewertung einer Wettbewerbskraft */
  {
    const { ctx, page } = await openWithSnaps({ forces: forcesAt(5) }, [{ state: {} }], 'kontrolle');
    const txt = await zeigeVergleich(page);
    check('Eine neu bewertete Wettbewerbskraft erscheint als Änderung',
      /3\.0 → 5\.0/.test(txt), txt.replace(/\n/g, ' | ').slice(0, 200));
    await ctx.close();
  }

  /* Unveränderter Stand */
  {
    const gleich = { swot: { strengths: ['Starke Marke'], weaknesses: [], opportunities: [], threats: [] } };
    const { ctx, page } = await openWithSnaps(gleich, [{ state: gleich }], 'kontrolle');
    const txt = await zeigeVergleich(page);
    check('Ein unveränderter Stand meldet keine Abweichung',
      txt.includes('nichts geändert'), txt.replace(/\n/g, ' | ').slice(0, 140));
    await ctx.close();
  }

  /* Wiederherstellen */
  {
    const { ctx, page } = await openWithSnaps(
      { swot: { strengths: ['Aktuell'], weaknesses: [], opportunities: [], threats: [] } },
      [{ label: 'Früherer Stand',
         state: { swot: { strengths: ['Von damals'], weaknesses: [], opportunities: [], threats: [] } } }],
      'kontrolle');
    await page.click('#snap-list button[data-act="restore"]');
    await page.waitForTimeout(400);
    const gespeichert = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('strategy-toolkit-v1')).swot.strengths.join(','));
    await page.goto(FILE + '#swot');
    await page.waitForTimeout(250);
    const angezeigt = await page.locator('[data-list="strengths"] li').allInnerTexts();
    check('Ein Zeitstand lässt sich wiederherstellen',
      gespeichert === 'Von damals' && angezeigt.join(',').includes('Von damals'),
      `gespeichert: ${gespeichert} / angezeigt: ${angezeigt.join(',')}`);
    await ctx.close();
  }

  /* Löschen */
  {
    const { ctx, page } = await openWithSnaps({}, [{ label: 'Weg damit', state: {} }], 'kontrolle');
    await page.click('#snap-list button[data-act="del"]');
    await page.waitForTimeout(260);
    check('Ein Zeitstand lässt sich löschen',
      (await page.locator('#snap-list .snap-empty').count()) === 1
      && (await page.evaluate(() => JSON.parse(
        localStorage.getItem('strategy-toolkit-snapshots-v1') || '[]').length)) === 0);
    await ctx.close();
  }

  /* Obergrenze: alte Stände fallen hinten heraus, statt den Speicher zu füllen */
  {
    const viele = Array.from({ length: 14 }, (_, i) => ({ label: 'Stand ' + i, state: {} }));
    const { ctx, page } = await openWithSnaps({}, viele, 'kontrolle');
    await page.fill('#snap-form input[name="label"]', 'Neuester');
    await page.click('#snap-form button[type="submit"]');
    await page.waitForTimeout(280);
    const n = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('strategy-toolkit-snapshots-v1')).length);
    const erster = await page.locator('#snap-list .snap-name').first().innerText();
    check('Die Zahl der Zeitstände ist gedeckelt', n === 12, n + ' gespeichert');
    check('Der neueste Stand steht oben', erster === 'Neuester', erster);
    await ctx.close();
  }
}

await browser.close();
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail ? 1 : 0);
