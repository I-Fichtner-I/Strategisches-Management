/* Strategy Toolkit – Werkzeuge für das strategische Management
   Reiner Client, Persistenz über localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "strategy-toolkit-v1";
  // Version des gespeicherten Datenmodells. Wird mit jedem Stand mitgeschrieben,
  // damit spätere Strukturänderungen migriert statt stillschweigend verworfen werden.
  const SCHEMA_VERSION = 1;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const emptyLists = (keys) => keys.reduce((o, k) => ((o[k] = []), o), {});

  const PESTEL_CATS = [
    { key: "political", label: "Politisch" },
    { key: "economic", label: "Ökonomisch" },
    { key: "social", label: "Sozio-kulturell" },
    { key: "technological", label: "Technologisch" },
    { key: "environmental", label: "Ökologisch" },
    { key: "legal", label: "Rechtlich" },
  ];
  const VC_SUPPORT = [
    { key: "infrastructure", label: "Unternehmens­infrastruktur" },
    { key: "hr", label: "Personalwirtschaft" },
    { key: "technology", label: "Technologie­entwicklung" },
    { key: "procurement", label: "Beschaffung" },
  ];
  const VC_PRIMARY = [
    { key: "inbound", label: "Eingangslogistik" },
    { key: "operations", label: "Produktion" },
    { key: "outbound", label: "Ausgangslogistik" },
    { key: "marketing", label: "Marketing & Vertrieb" },
    { key: "service", label: "Kundendienst" },
  ];
  const BMC_BLOCKS = [
    { key: "partners", label: "Schlüsselpartner" },
    { key: "activities", label: "Schlüsselaktivitäten" },
    { key: "resources", label: "Schlüsselressourcen" },
    { key: "value", label: "Wertangebote" },
    { key: "relationships", label: "Kundenbeziehungen" },
    { key: "channels", label: "Kanäle" },
    { key: "segments", label: "Kundensegmente" },
    { key: "costs", label: "Kostenstruktur" },
    { key: "revenue", label: "Einnahmequellen" },
  ];
  const BSC_VIEWS = [
    { key: "financial", label: "Finanzperspektive" },
    { key: "customer", label: "Kundenperspektive" },
    { key: "process", label: "Interne Prozesse" },
    { key: "learning", label: "Lernen & Entwicklung" },
  ];
  const ABELL_CATS = [
    { key: "groups", label: "Kundengruppen (Wer?)" },
    { key: "functions", label: "Kundenfunktionen (Was?)" },
    { key: "technologies", label: "Technologien (Wie?)" },
  ];
  const SZENARIO_CATS = [{ key: "factors", label: "Einflussfaktoren" }];
  const ANSOFF_CELLS = [
    { key: "durchdringung", label: "Marktdurchdringung" },
    { key: "marktentwicklung", label: "Marktentwicklung" },
    { key: "produktentwicklung", label: "Produktentwicklung" },
    { key: "diversifikation", label: "Diversifikation" },
  ];

  const defaultState = () => ({
    schemaVersion: SCHEMA_VERSION,
    swot: emptyLists(["strengths", "weaknesses", "opportunities", "threats"]),
    forces: {
      rivalry: { v: 3, note: "", drivers: [3, 3, 3, 3, 3] },
      newEntrants: { v: 3, note: "", drivers: [3, 3, 3, 3, 3, 3, 3, 3] },
      suppliers: { v: 3, note: "", drivers: [3, 3, 3, 3, 3, 3] },
      buyers: { v: 3, note: "", drivers: [3, 3, 3, 3, 3, 3] },
      substitutes: { v: 3, note: "", drivers: [3, 3] },
    },
    bcg: [],
    stakeholders: [],
    pestel: emptyLists(PESTEL_CATS.map((c) => c.key)),
    valuechain: emptyLists(VC_SUPPORT.concat(VC_PRIMARY).map((c) => c.key)),
    bmc: emptyLists(BMC_BLOCKS.map((c) => c.key)),
    bsc: emptyLists(BSC_VIEWS.map((c) => c.key)),
    abell: emptyLists(ABELL_CATS.map((c) => c.key)),
    ziele: [],
    szenario: { frage: "", factors: [], a: "", b: "" },
    kennzahlen: { ebit: "", da: "", umsatz: "", nopat: "", kapital: "", wacc: "" },
    fallstudie: {
      company: "", titel: "", gruppe: "",
      sections: { einleitung: "", ueberblick: "", extern: "", intern: "", swotopt: "", diskussion: "", fazit: "" },
    },
    strategiewahl: {
      criteria: [
        { name: "Wertziele", weight: 1 },
        { name: "Sachziele", weight: 1 },
        { name: "Sozialziele", weight: 1 },
      ],
      options: [],
    },
    wettbewerb: { xLabel: "Preisniveau", yLabel: "Qualität / Leistung", competitors: [] },
    ansoff: emptyLists(["durchdringung", "marktentwicklung", "produktentwicklung", "diversifikation"]),
    vrio: [],
    kontrolle: { indicators: [], premises: {}, dismissed: [] },
    learn: { known: [] },
  });

  let state = load();

  // Migrationen: Eintrag n hebt einen Stand von Schema n auf n+1. Rein additive
  // Änderungen deckt bereits deepMerge ab; hier stehen nur echte Umbauten.
  const MIGRATIONS = [
    (data) => data, // 0 (unversioniert) -> 1
  ];
  function migrate(data) {
    let v = Number.isInteger(data.schemaVersion) ? data.schemaVersion : 0;
    while (v < SCHEMA_VERSION && MIGRATIONS[v]) { data = MIGRATIONS[v](data) || data; v++; }
    data.schemaVersion = SCHEMA_VERSION;
    return data;
  }
  // Grobprüfung einer Projektdatei: ein Objekt, dessen Schlüssel zum bekannten
  // Schema passen. Verhindert, dass beliebiges JSON den Arbeitsstand überschreibt.
  function isProjectData(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    const known = Object.keys(defaultState());
    return Object.keys(obj).filter((k) => known.indexOf(k) >= 0).length >= 3;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!isProjectData(parsed)) return defaultState();
      return deepMerge(defaultState(), migrate(parsed));
    } catch (e) { return defaultState(); }
  }
  function deepMerge(base, over) {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (over && typeof over === "object" && !Array.isArray(over)) {
      Object.keys(over).forEach((k) => {
        out[k] = (base[k] && typeof base[k] === "object" && !Array.isArray(base[k]))
          ? deepMerge(base[k], over[k]) : over[k];
      });
    }
    return over === undefined ? base : (typeof over === "object" ? out : over);
  }
  // Speichern ist entprellt: Tippen schreibt nicht bei jedem Zeichen den kompletten
  // Stand in den localStorage. Nach spätestens SAVE_MAX_WAIT wird trotzdem
  // geschrieben, damit auch langes Tippen ohne Pause gesichert ist.
  const SAVE_DELAY = 400, SAVE_MAX_WAIT = 2500;
  let saveTimer = null, savePendingSince = 0;
  function writeStore() {
    try { state.schemaVersion = SCHEMA_VERSION; localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function saveNow() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    savePendingSince = 0;
    writeStore();
    const v = activeViewName();
    if (v) renderCoach(v);
  }
  function save() {
    const now = Date.now();
    if (!savePendingSince) savePendingSince = now;
    if (now - savePendingSince >= SAVE_MAX_WAIT) { saveNow(); return; }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, SAVE_DELAY);
  }
  // Ungesicherte Eingaben dürfen beim Verlassen der Seite nicht verloren gehen.
  window.addEventListener("beforeunload", saveNow);
  window.addEventListener("pagehide", saveNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveNow();
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  // HiDPI-Rendering: die Backing-Store-Größe folgt dem devicePixelRatio, gezeichnet
  // wird weiterhin in den logischen Maßen aus den width/height-Attributen.
  function canvas2d(canvas) {
    if (!canvas.dataset.w) { canvas.dataset.w = canvas.width; canvas.dataset.h = canvas.height; }
    const W = +canvas.dataset.w, H = +canvas.dataset.h;
    const dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    const bw = Math.round(W * dpr), bh = Math.round(H * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }

  /* ---------- Wissensbasis (Theorie & Leitfragen je Werkzeug) ---------- */
  const KB = {
    abell: {
      def: "Die Marktabgrenzung nach <strong>Abell</strong> definiert den relevanten Markt nicht über Produkte, sondern über den gestifteten Nutzen – dreidimensional entlang von Kundengruppen (<em>wer</em>), Kundenfunktionen/Bedürfnissen (<em>was</em>) und Technologien (<em>wie</em>). So wird bewusst festgelegt, wie breit oder eng der Markt gefasst wird.",
      vorgehen: ["Kundengruppen bestimmen (Wer wird bedient?)", "Kundenfunktionen/Bedürfnisse bestimmen (Welches Problem wird gelöst?)", "Technologien bestimmen (Womit wird der Nutzen erbracht?)", "Kombinationen betrachten und Markt bewusst breit oder eng abgrenzen"],
      leitfragen: ["Wer sind die relevanten Kundengruppen?", "Welche Funktionen/Bedürfnisse erfüllen wir?", "Mit welchen (alternativen) Technologien?", "Wie verändert sich der Markt bei breiterer/engerer Abgrenzung?"],
    },
    vrio: {
      def: "Das <strong>VRIO-Schema</strong> (Barney) prüft, ob eine Ressource oder Fähigkeit einen dauerhaften Wettbewerbsvorteil begründet: <strong>V</strong>aluable (wertvoll), <strong>R</strong>are (selten), <strong>I</strong>nimitable (schwer imitierbar) und <strong>O</strong>rganized (organisatorisch nutzbar). Erst wenn alle vier Kriterien erfüllt sind, entsteht ein dauerhafter Vorteil – das zentrale Prüfraster des Resource-based View.",
      vorgehen: ["Ressourcen und Fähigkeiten sammeln (materiell, immateriell, organisational)", "Jede Ressource an den vier VRIO-Fragen prüfen", "Wettbewerbsimplikation ablesen (Nachteil → Parität → temporärer → ungenutzter → dauerhafter Vorteil)", "Kernkompetenzen (dauerhafte Vorteile) schützen und gezielt ausbauen"],
      leitfragen: ["Stiftet die Ressource Kundennutzen oder senkt sie Kosten (wertvoll)?", "Verfügen nur wenige Wettbewerber darüber (selten)?", "Ist sie schwer zu imitieren oder zu substituieren?", "Ist das Unternehmen so organisiert, dass es die Ressource voll ausschöpft?"],
    },
    stakeholder: {
      def: "<strong>Stakeholder</strong> sind alle Anspruchsgruppen, die ein Interesse am Unternehmen haben oder von dessen Handeln betroffen sind. Die <strong>Macht-Interesse-Matrix</strong> ordnet sie nach Einfluss (Macht) und Betroffenheit (Interesse) und leitet daraus die Steuerungsstrategie ab.",
      vorgehen: ["Stakeholder identifizieren", "Nach intern/extern sowie primär/sekundär einordnen", "Macht und Interesse einschätzen (1–5)", "Steuerungsstrategie ableiten: Eng managen · Zufrieden halten · Informiert halten · Beobachten"],
      leitfragen: ["Wer beeinflusst uns oder ist betroffen?", "Interne vs. externe, primäre vs. sekundäre Stakeholder?", "Welche (teils widersprüchlichen) Interessen bestehen?", "Wie wirken die Positionen auf die interne Steuerung?"],
    },
    ziele: {
      def: "<strong>SMART</strong> steht für <strong>S</strong>pezifisch, <strong>M</strong>essbar, <strong>A</strong>ttraktiv/akzeptiert, <strong>R</strong>ealistisch und <strong>T</strong>erminiert. In der <strong>Zielhierarchie</strong> werden Ziele von der Vision/dem Leitbild über strategische bis zu operativen Zielen abgeleitet.",
      vorgehen: ["Zielinhalt, -ausmaß und Zeitbezug festlegen", "Ziel an den fünf SMART-Kriterien prüfen", "In die Zielhierarchie einordnen (Vision → strategisch → operativ)", "Zielbeziehungen prüfen (komplementär, konkurrierend, indifferent)"],
      leitfragen: ["Zielfunktionen: Orientierung, Koordination, Motivation, Kontrolle – welche stehen im Vordergrund?", "Ist das Ziel eindeutig und messbar?", "Ist es zugleich anspruchsvoll und erreichbar?", "Bis wann soll es erreicht sein?"],
    },
    pestel: {
      def: "<strong>PESTEL</strong> analysiert die globale (Makro-)Umwelt in sechs Feldern – <strong>P</strong>olitisch, <strong>E</strong>konomisch, <strong>S</strong>ozio-kulturell, <strong>T</strong>echnologisch, <strong>E</strong>kologisch, <strong>L</strong>egal/rechtlich – und identifiziert daraus Chancen und Risiken.",
      leitfragen: ["Welche Faktoren je Feld sind für die Branche relevant?", "Wirkt ein Faktor als Chance (＋) oder Risiko (–)?", "Welche Trends sind besonders dynamisch?", "Welche Faktoren sollten in Szenarien vertieft werden?"],
    },
    forces: {
      def: "Die <strong>Branchenstrukturanalyse (Five Forces)</strong> nach Porter beurteilt die Attraktivität einer Branche anhand von fünf Wettbewerbskräften. Je stärker die Kräfte insgesamt, desto <strong>geringer</strong> das Gewinnpotenzial und die Attraktivität der Branche.",
      leitfragen: ["Wie stark ist jede der fünf Kräfte (aus den Treibern abgeleitet)?", "Welche Kraft dominiert und warum?", "Wie könnte sich die Branchenstruktur künftig verändern?", "Welche strategischen Konsequenzen ergeben sich?"],
    },
    wertkette: {
      def: "Die <strong>Wertkette</strong> nach Porter zerlegt das Unternehmen in wertschöpfende <strong>Primäraktivitäten</strong> (Eingangslogistik, Produktion, Ausgangslogistik, Marketing &amp; Vertrieb, Kundendienst) und <strong>Unterstützungsaktivitäten</strong> (Infrastruktur, Personal, Technologie, Beschaffung). Ziel ist es, Quellen von Wettbewerbsvorteilen (Kosten oder Differenzierung) aufzudecken.",
      leitfragen: ["In welchen Aktivitäten entsteht besonderer Wert?", "Wo liegen Stärken (＋) bzw. Schwächen (–)?", "Wo bestehen Ansatzpunkte für eine Differenzierungsstrategie?", "Wie sind die Aktivitäten verknüpft (Verknüpfungen/Schnittstellen)?"],
    },
    szenario: {
      def: "Die <strong>Szenario-Analyse</strong> entwickelt mehrere plausible, in sich konsistente Zukunftsbilder, um mit Unsicherheit strukturiert umzugehen. Im <em>Szenariotrichter</em> spannen extreme Szenarien (Best/Worst Case) den Möglichkeitsraum auf.",
      vorgehen: ["Problem &amp; Zeithorizont festlegen", "Einflussfaktoren (Deskriptoren) bestimmen", "Je Faktor mögliche Ausprägungen/Projektionen bilden", "Zu konsistenten Szenarien bündeln (z. B. Best/Worst Case)", "Konsequenzen und Strategien ableiten"],
      leitfragen: ["Was genau ist die Problemstellung?", "Welche Einflussfaktoren sind entscheidend und unsicher?", "Wie sieht ein plausibler Entwicklungspfad je Szenario aus?", "Welche Frühindikatoren kündigen ein Szenario an?"],
    },
    kennzahlen: {
      def: "Strategische Steuerungsgrößen unterscheiden sich in <strong>traditionelle</strong> (buchhalterisch, vergangenheitsorientiert – z. B. EBIT, EBITDA, EBITDA-Marge) und <strong>wertorientierte</strong> Kennzahlen (berücksichtigen die Kapitalkosten – z. B. EVA, CFROI). Weitere Dimensionen: absolut vs. relativ, finanziell vs. nicht-finanziell.",
      extra:
        "<div class='kb-cards'>" +
        "<div><h5>EBIT</h5><p>Earnings before Interest and Taxes – operatives Ergebnis vor Zinsen und Steuern.</p></div>" +
        "<div><h5>EBITDA</h5><p>EBIT + Abschreibungen &amp; Amortisation. Zeigt die operative Ertragskraft unabhängig von Investitions-/Abschreibungspolitik.</p></div>" +
        "<div><h5>EBITDA-Marge</h5><p>EBITDA ÷ Umsatz. Relative Kennzahl der operativen Profitabilität; erlaubt Vergleiche zwischen Unternehmen.</p></div>" +
        "<div><h5>NOPAT</h5><p>Net Operating Profit After Taxes – operatives Ergebnis nach Steuern, aber vor Finanzierungskosten (≈ EBIT × (1 − Steuersatz)). Grundlage für wertorientierte Kennzahlen.</p></div>" +
        "<div><h5>WACC</h5><p>Weighted Average Cost of Capital – gewichteter Mischsatz aus Eigen- und Fremdkapitalkosten; die Mindestrendite, die das eingesetzte Kapital erwirtschaften muss.</p></div>" +
        "<div><h5>ROCE</h5><p>Return on Capital Employed = NOPAT ÷ investiertes Kapital. Liegt ROCE über dem WACC, entsteht Wert (positiver Spread).</p></div>" +
        "<div><h5>EVA</h5><p>Economic Value Added = NOPAT − (investiertes Kapital × WACC). Positiver EVA = Wertschaffung über den Kapitalkosten.</p></div>" +
        "<div><h5>CFROI</h5><p>Cash Flow Return on Investment – wertorientierte Rendite auf Basis von Brutto-Cashflow und Bruttoinvestitionsbasis; mit den Kapitalkosten zu vergleichen.</p></div>" +
        "</div>",
      leitfragen: ["Ist die Kennzahl wertorientiert oder traditionell?", "Absolut oder relativ, finanziell oder nicht-finanziell?", "Berücksichtigt sie die Kapitalkosten?", "Wie aussagekräftig ist sie für die strategische Steuerung?"],
    },
    swot: {
      def: "Die <strong>SWOT-Analyse</strong> bündelt interne <strong>Stärken/Schwächen</strong> und externe <strong>Chancen/Risiken</strong>. Über die <strong>TOWS-Matrix</strong> werden daraus Normstrategien abgeleitet: SO (ausbauen), ST (absichern), WO (aufholen), WT (vermeiden).",
      leitfragen: ["Sind interne (S/W) und externe (O/T) Faktoren sauber getrennt?", "Welche Kombinationen ergeben schlagkräftige Strategien?", "Welche SO-Strategie nutzt Stärken für Chancen?", "Wo ist das Unternehmen durch W×T besonders verwundbar?"],
    },
    bcg: {
      def: "Das <strong>BCG-Portfolio</strong> positioniert Geschäftseinheiten nach <strong>Marktwachstum</strong> (y) und <strong>relativem Marktanteil</strong> (x): Stars, Question Marks, Cash Cows und Dogs. Daraus folgen Normstrategien (investieren, selektieren, abschöpfen, desinvestieren).",
      leitfragen: ["Wie ist jede Einheit positioniert?", "Fließen Mittel von Cash Cows zu Stars/Question Marks?", "Welche Question Marks sind ausbauwürdig?", "Bei welchen Dogs ist Desinvestition sinnvoll?"],
    },
    bmc: {
      def: "Das <strong>Business Model Canvas</strong> beschreibt ein Geschäftsmodell in neun Bausteinen und macht die Logik der Wertschöpfung – vom Kundensegment über das Wertangebot bis zu Kosten und Erlösen – auf einen Blick sichtbar.",
      leitfragen: ["Welches Wertangebot löst welches Kundenproblem?", "Passen Kanäle und Kundenbeziehungen zu den Segmenten?", "Welche Schlüsselressourcen/-aktivitäten sind unverzichtbar?", "Tragen die Erlösquellen die Kostenstruktur?"],
    },
    bsc: {
      def: "Die <strong>Balanced Scorecard</strong> übersetzt die Strategie ausgewogen in vier Perspektiven (Finanzen, Kunden, interne Prozesse, Lernen &amp; Entwicklung) und verknüpft je Perspektive Ziele, Kennzahlen, Zielwerte und Maßnahmen über Ursache-Wirkungs-Ketten.",
      leitfragen: ["Sind alle vier Perspektiven ausgewogen berücksichtigt?", "Bestehen plausible Ursache-Wirkungs-Beziehungen?", "Ist jedes Ziel mit Kennzahl und Zielwert hinterlegt?", "Sind konkrete Maßnahmen zugeordnet?"],
    },
    strategiewahl: {
      def: "Die <strong>Nutzwertanalyse</strong> bewertet strategische Optionen anhand gewichteter Kriterien und bildet eine nachvollziehbare Rangfolge. Bewährt sind die drei Kriterien nach Johnson/Scholes: <strong>Eignung</strong> (passt zur Ausgangslage/SWOT), <strong>Akzeptanz</strong> (Rendite, Risiko, Stakeholder) und <strong>Machbarkeit</strong> (Ressourcen &amp; Fähigkeiten).",
      vorgehen: ["Optionen sammeln (z. B. aus den TOWS-Normstrategien)", "Kriterien festlegen und gewichten", "Jede Option je Kriterium bewerten (1–5)", "Gewichteten Nutzwert berechnen und Rangfolge ableiten", "Ergebnis kritisch prüfen (Robustheit, Szenarien)"],
      leitfragen: ["Sind die Kriterien vollständig und überschneidungsfrei?", "Spiegeln die Gewichte die strategische Bedeutung?", "Ist die Bewertung nachvollziehbar begründet?", "Wie robust ist die Rangfolge gegenüber anderen Gewichten?"],
    },
    fallstudie: {
      def: "Ein <strong>Fallstudien-Report</strong> analysiert die aktuelle Lage, das Umfeld und die Strategie eines gewählten Unternehmens und diskutiert diese kritisch – mit den passenden Methoden dieses Toolkits.",
      vorgehen: ["Unternehmen wählen und einen Überblick verschaffen", "Externe Analyse (PESTEL, Five Forces) und interne Analyse (Wertkette, Ressourcen)", "In SWOT/Portfolio bündeln und strategische Optionen ableiten", "Bestehende Strategie kritisch diskutieren", "Ergebnisse strukturiert dokumentieren"],
      leitfragen: ["Sind Fachbegriffe präzise definiert?", "Ist der Text klar strukturiert und aufs Wesentliche fokussiert?", "Führt der rote Faden von der Analyse nachvollziehbar zur Empfehlung?"],
    },
  };

  function renderKnowledge() {
    $$(".kb-slot").forEach((slot) => {
      const k = KB[slot.dataset.kb];
      if (!k) return;
      let inner = `<p>${k.def}</p>`;
      if (k.vorgehen) inner += `<h4>Vorgehen</h4><ol>${k.vorgehen.map((x) => `<li>${x}</li>`).join("")}</ol>`;
      if (k.extra) inner += k.extra;
      if (k.leitfragen) inner += `<h4>Leitfragen</h4><ul>${k.leitfragen.map((x) => `<li>${x}</li>`).join("")}</ul>`;
      slot.innerHTML = `<details class="kb"><summary>Theorie &amp; Leitfragen</summary><div class="kb-body">${inner}</div></details>`;
    });
  }

  /* ---------- Navigation (Kapitelstruktur) ---------- */
  // Reihenfolge der Seiten (entspricht der Sidebar) für die Zurück/Weiter-Navigation
  const PAGES = [
    { v: "prozess", t: "1 · Einführung" },
    { v: "ansaetze", t: "2 · Ansätze" },
    { v: "stakeholder", t: "3.1 Stakeholder" },
    { v: "ziele", t: "3.2 Ziele" },
    { v: "kennzahlen", t: "3.3 Kennzahlen" },
    { v: "abell", t: "3.4 Abell" },
    { v: "pestel", t: "4.1.1 PESTEL" },
    { v: "forces", t: "4.1.2 Five Forces" },
    { v: "wettbewerb", t: "4.1.3 Wettbewerbsumfeld" },
    { v: "wertkette", t: "4.2 Wertkette" },
    { v: "swot", t: "4.3 SWOT" },
    { v: "bcg", t: "4.3 BCG-Portfolio" },
    { v: "szenario", t: "Szenario-Analyse" },
    { v: "strategietypen", t: "5.1 Typen von Strategien" },
    { v: "strategiewahl", t: "5.2 Bewertung & Auswahl" },
    { v: "bmc", t: "6.1 Business Model Canvas" },
    { v: "bsc", t: "6.2 Balanced Scorecard" },
    { v: "kontrolle", t: "6.3 Kontrolle & Frühaufklärung" },
    { v: "quiz", t: "Selbsttest" },
    { v: "glossar", t: "Glossar" },
    { v: "dossier", t: "Strategie-Dossier" },
  ];
  function setNavActive(el) {
    $$("#nav .nav-item").forEach((i) => { i.classList.remove("is-active"); i.removeAttribute("aria-current"); });
    if (el) {
      el.classList.add("is-active"); el.setAttribute("aria-current", "page");
      // Überkapitel des aktiven Eintrags aufklappen (übrige bleiben, wie sie sind)
      const grp = el.closest("details.nav-group");
      if (grp) grp.open = true;
    }
  }
  /* Routing über den URL-Hash: #<view> bzw. #<view>/<anker>.
     Damit funktionieren Zurück-Button, Neuladen und geteilte Links. Gerendert
     wird ausschließlich über renderRoute(); navTo() setzt zusätzlich den Hash,
     der hashchange-Handler fängt Browser-Navigation ab. */
  let currentRoute = "";
  const routeKey = (view, anchor) => view + (anchor ? "/" + anchor : "");
  function routeFromHash() {
    const raw = decodeURIComponent(String(location.hash || "").replace(/^#/, ""));
    if (!raw) return null;
    const parts = raw.split("/");
    const view = parts[0], anchor = parts[1];
    if (!view || !document.getElementById("view-" + view)) return null;
    return { view, anchor: anchor || undefined };
  }
  function navItemFor(view, anchor) {
    return (anchor && $(`#nav .nav-item[data-view="${view}"][data-anchor="${anchor}"]`))
      || $(`#nav .nav-item[data-view="${view}"]`);
  }
  function renderRoute(view, anchor) {
    currentRoute = routeKey(view, anchor);
    showView(view, anchor);
    setNavActive(navItemFor(view, anchor));
  }
  function navTo(view, anchor) {
    const key = routeKey(view, anchor);
    if (location.hash.replace(/^#/, "") !== key) location.hash = "#" + key;
    renderRoute(view, anchor);
  }
  function applyRoute() {
    const r = routeFromHash();
    const key = r ? routeKey(r.view, r.anchor) : "prozess";
    if (key === currentRoute) return;
    renderRoute(r ? r.view : "prozess", r ? r.anchor : undefined);
  }
  window.addEventListener("hashchange", applyRoute);
  function updatePager(name) {
    const idx = PAGES.findIndex((p) => p.v === name);
    const prev = $("#pager-prev"), next = $("#pager-next");
    if (!prev || !next) return;
    if (idx < 0) { prev.style.visibility = next.style.visibility = "hidden"; return; }
    const p = PAGES[idx - 1], n = PAGES[idx + 1];
    if (p) { prev.style.visibility = "visible"; prev.innerHTML = `<span class="pager-dir">‹ Zurück</span><span class="pager-name">${p.t}</span>`; prev.dataset.view = p.v; }
    else { prev.style.visibility = "hidden"; }
    if (n) { next.style.visibility = "visible"; next.innerHTML = `<span class="pager-dir">Weiter ›</span><span class="pager-name">${n.t}</span>`; next.dataset.view = n.v; }
    else { next.style.visibility = "hidden"; }
  }
  function showView(name, anchor) {
    $$(".view").forEach((v) => v.classList.toggle("is-active", v.id === "view-" + name));
    if (name === "bcg") drawBCG();
    if (name === "stakeholder") drawStakeholder();
    if (name === "forces") drawForcesRadar();
    if (name === "wettbewerb") drawWettbewerb();
    if (name === "kennzahlen") { drawWaterfall(); renderKzCompare(); }
    if (name === "strategiewahl") renderStrategiewahl();
    if (name === "kontrolle") { syncKpiFromBsc(); renderKpi(); renderPraemissen(); renderSnapshots(); }
    if (name === "bsc") buildBSC();
    if (name === "bmc") buildBMCTool();
    if (name === "forces" || name === "bcg" || name === "wettbewerb") renderAbellAnchors();
    if (name === "prozess") renderDashboard();
    if (name === "dossier") buildDossier();
    renderCoach(name);
    updatePager(name);
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const sidebar = $("#sidebar");
  function closeSidebarOnMobile() {
    if (sidebar && window.matchMedia("(max-width: 900px)").matches) {
      sidebar.classList.remove("open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    }
  }
  $("#nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    navTo(btn.dataset.view, btn.dataset.anchor);
    closeSidebarOnMobile();
  });
  const navToggle = $("#nav-toggle");
  if (navToggle) navToggle.addEventListener("click", () => {
    if (!sidebar) return;
    navToggle.setAttribute("aria-expanded", sidebar.classList.toggle("open") ? "true" : "false");
  });
  ["#pager-prev", "#pager-next"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", () => { if (el.dataset.view) { navTo(el.dataset.view); closeSidebarOnMobile(); } });
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) {
      e.preventDefault();
      navTo(g.dataset.goto, g.dataset.anchor);
      closeSidebarOnMobile();
    }
  });

  /* ---------- Generisches Listen-Werkzeug (PESTEL, Wertkette, BMC) ----------
     opts.sentiment = true → jedes Item erhält eine +/–-Bewertung; markierte Items
     fließen über opts.onChange in die SWOT. */
  function initListTool(rootSel, store, cats, opts) {
    opts = opts || {};
    const root = $(rootSel);
    if (!root) return;
    root.innerHTML = ""; // idempotent: erneutes Aufrufen baut sauber neu auf
    const isGrid = root.dataset.grid === "1";
    const sentiment = !!opts.sentiment;
    cats.forEach((cat) => {
      if (!store[cat.key]) store[cat.key] = [];
      if (sentiment) {
        store[cat.key] = store[cat.key].map((x) =>
          typeof x === "string" ? { text: x, sign: 0 } : { text: x.text, sign: x.sign || 0 });
      }
      const card = document.createElement("div");
      card.className = "list-card";
      if (isGrid) card.style.gridArea = cat.key;
      const h = document.createElement("h3");
      h.innerHTML = cat.label;
      const ul = document.createElement("ul");
      ul.className = "item-list";
      const sugBox = document.createElement("div");
      sugBox.className = "list-suggest";
      const form = document.createElement("form");
      form.className = "add-form";
      form.innerHTML = '<input type="text" placeholder="Hinzufügen …" /><button type="submit">+</button>';

      const renderSug = () => {
        sugBox.innerHTML = "";
        if (!opts.suggest) return;
        const have = new Set(store[cat.key].map((x) => (sentiment ? x.text : x)));
        const seen = new Set();
        const avail = (opts.suggest(cat.key) || [])
          .map((s) => (s || "").trim())
          .filter((s) => s && !have.has(s) && !seen.has(s) && seen.add(s)).slice(0, 8);
        if (!avail.length) return;
        avail.forEach((s) => {
          const chip = document.createElement("button");
          chip.type = "button"; chip.className = "sw-chip"; chip.textContent = "+ " + s;
          chip.title = "Übernehmen";
          chip.addEventListener("click", () => {
            store[cat.key].push(sentiment ? { text: s, sign: 0 } : s);
            save(); render(); if (opts.onChange) opts.onChange();
          });
          sugBox.appendChild(chip);
        });
      };

      const render = () => {
        renderSug();
        ul.innerHTML = "";
        store[cat.key].forEach((item, i) => {
          const text = sentiment ? item.text : item;
          const li = document.createElement("li");
          if (sentiment) {
            const sign = item.sign || 0;
            const tog = document.createElement("button");
            tog.type = "button";
            tog.className = "sign-toggle sign-" + (sign > 0 ? "pos" : sign < 0 ? "neg" : "neu");
            tog.textContent = sign > 0 ? "＋" : sign < 0 ? "–" : "±";
            tog.title = `Bewertung wechseln (${opts.pos || "positiv"} / ${opts.neg || "negativ"})`;
            tog.addEventListener("click", () => {
              item.sign = sign > 0 ? -1 : sign < 0 ? 0 : 1;
              save(); render(); if (opts.onChange) opts.onChange();
            });
            li.appendChild(tog);
          }
          const span = document.createElement("span");
          span.textContent = text;
          const btn = document.createElement("button");
          btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
          btn.addEventListener("click", () => {
            store[cat.key].splice(i, 1); save(); render(); if (opts.onChange) opts.onChange();
          });
          li.append(span, btn); ul.appendChild(li);
        });
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const inp = form.querySelector("input");
        const v = inp.value.trim();
        if (!v) return;
        store[cat.key].push(sentiment ? { text: v, sign: 0 } : v);
        inp.value = ""; save(); render(); if (opts.onChange) opts.onChange();
      });
      card.append(h, ul, sugBox, form);
      root.appendChild(card);
      render();
    });
  }

  // Business Model Canvas mit Werkzeug-Verzahnung: Bausteine aus Abell, Wertkette
  // und Stakeholdern befüllbar (Übernahme-Chips).
  function bmcSuggest(key) {
    const vc = (cats) => cats.flatMap((c) => (state.valuechain[c.key] || []).map((x) => x.text)).filter(Boolean);
    switch (key) {
      case "segments": return state.abell.groups || [];
      case "value": return state.abell.functions || [];
      case "activities": return vc(VC_PRIMARY);
      case "resources": return vc(VC_SUPPORT);
      case "partners": return (state.stakeholders || []).map((s) => s.name);
      default: return [];
    }
  }
  function buildBMCTool() { initListTool("#bmc-root", state.bmc, BMC_BLOCKS, { suggest: bmcSuggest }); }

  // Abell-Marktanker: die definierte Marktabgrenzung (Wer/Was/Wie) verankert die
  // Branchen- und Portfolioanalyse (Brief 3.4: Abell-Schema definiert das SGF).
  function abellMarketSummary() {
    const g = (state.abell.groups || []).join(", ");
    const f = (state.abell.functions || []).join(", ");
    const t = (state.abell.technologies || []).join(", ");
    if (!g && !f && !t) return null;
    const seg = [];
    if (g) seg.push(`<strong>Wer:</strong> ${escapeHtml(g)}`);
    if (f) seg.push(`<strong>Was:</strong> ${escapeHtml(f)}`);
    if (t) seg.push(`<strong>Wie:</strong> ${escapeHtml(t)}`);
    return seg.join(" · ");
  }
  function renderAbellAnchors() {
    const sum = abellMarketSummary();
    $$("[data-abell-anchor]").forEach((el) => {
      el.hidden = false;
      el.innerHTML = sum
        ? `<span class="anchor-label">Betrachteter Markt (Abell)</span> ${sum}`
        : `<span class="anchor-label">Markt noch nicht abgegrenzt</span> <a href="#" data-goto="abell">In der Abell-Marktabgrenzung definieren →</a>`;
    });
  }

  /* ---------- VRIO-Check (2.2 Resource-based View) ----------
     Jede Ressource wird an den vier Kriterien geprüft; die Reihenfolge der
     Prüfung (V → R → I → O) bestimmt die Wettbewerbsimplikation nach Barney. */
  const VRIO_CRITERIA = [
    { key: "v", label: "Wertvoll?" },
    { key: "r", label: "Selten?" },
    { key: "i", label: "Schwer imitierbar?" },
    { key: "o", label: "Organisatorisch genutzt?" },
  ];
  function vrioImplication(r) {
    if (!r.v) return { label: "Wettbewerbsnachteil", cls: 0, rank: 0 };
    if (!r.r) return { label: "Wettbewerbsparität", cls: 1, rank: 1 };
    if (!r.i) return { label: "Temporärer Vorteil", cls: 2, rank: 2 };
    if (!r.o) return { label: "Ungenutzter Vorteil", cls: 3, rank: 3 };
    return { label: "Dauerhafter Vorteil", cls: 4, rank: 4 };
  }
  function renderVrio() {
    const tbl = $("#vrio-table"); if (!tbl) return;
    if (!state.vrio.length) {
      tbl.innerHTML = '<tbody><tr><td class="sw-empty">Noch keine Ressourcen – oben eine Ressource oder Fähigkeit hinzufügen.</td></tr></tbody>';
      return;
    }
    const head = "<thead><tr><th>Ressource / Fähigkeit</th>"
      + VRIO_CRITERIA.map((c) => `<th class="vrio-crit">${c.label}</th>`).join("")
      + "<th>Implikation</th><th></th></tr></thead>";
    const body = "<tbody>" + state.vrio.map((r, ri) => {
      const imp = vrioImplication(r);
      const cells = VRIO_CRITERIA.map((c) =>
        `<td><button type="button" class="vrio-toggle ${r[c.key] ? "yes" : "no"}" data-r="${ri}" data-c="${c.key}" aria-pressed="${r[c.key] ? "true" : "false"}" title="${c.label} umschalten">${r[c.key] ? "✓ ja" : "– nein"}</button></td>`).join("");
      return `<tr><td class="sw-optname">${escapeHtml(r.name)}</td>${cells}`
        + `<td><span class="vrio-imp vrio-${imp.cls}">${imp.label}</span></td>`
        + `<td><button type="button" class="sw-optdel" data-r="${ri}" aria-label="Entfernen">×</button></td></tr>`;
    }).join("") + "</tbody>";
    tbl.innerHTML = head + body;
    $$(".vrio-toggle", tbl).forEach((b) => b.addEventListener("click", () => {
      const r = state.vrio[+b.dataset.r];
      r[b.dataset.c] = r[b.dataset.c] ? 0 : 1;
      save(); renderVrio(); refreshSwotDerived();
    }));
    $$(".sw-optdel", tbl).forEach((b) => b.addEventListener("click", () => {
      state.vrio.splice(+b.dataset.r, 1); save(); renderVrio(); refreshSwotDerived();
    }));
  }
  function wireVrio() {
    const form = $("#vrio-form"); if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = form.querySelector("input");
      const name = inp.value.trim(); if (!name) return;
      state.vrio.push({ name, v: 1, r: 0, i: 0, o: 0 });
      inp.value = ""; save(); renderVrio(); refreshSwotDerived();
    });
  }

  // Prämissenkontrolle (Brief 6.3): die Einflussfaktoren der Szenario-Analyse als
  // Planungsannahmen laufend prüfen – gilt noch / beobachten / überholt.
  const PREM_STATUS = { ok: "🟢 gilt", watch: "🟡 beobachten", broken: "🔴 überholt" };
  function renderPraemissen() {
    const box = $("#praemissen-box"); if (!box) return;
    if (!state.kontrolle.premises) state.kontrolle.premises = {};
    const factors = (state.szenario.factors || []).slice();
    // Status verwaister Prämissen (Faktor in der Szenario-Analyse gelöscht) aufräumen
    const valid = new Set(factors);
    let pruned = false;
    Object.keys(state.kontrolle.premises).forEach((k) => {
      if (!valid.has(k)) { delete state.kontrolle.premises[k]; pruned = true; }
    });
    if (pruned) save();
    if (!factors.length) {
      box.innerHTML = '<p class="prem-empty">Noch keine Einflussfaktoren – in der <a href="#" data-goto="szenario">Szenario-Analyse</a> erfassen. Sie werden hier zur Prämissenkontrolle.</p>';
      return;
    }
    box.innerHTML = `<table class="bcg-table prem-table"><thead><tr><th>Prämisse (Einflussfaktor)</th><th>Status</th></tr></thead><tbody>${
      factors.map((f, i) => {
        const st = state.kontrolle.premises[f] || "ok";
        return `<tr><td>${escapeHtml(f)}</td><td><button type="button" class="prem-btn prem-${st}" data-i="${i}">${PREM_STATUS[st]}</button></td></tr>`;
      }).join("")
    }</tbody></table>`;
    $$(".prem-btn", box).forEach((b) => b.addEventListener("click", () => {
      const f = factors[+b.dataset.i];
      const cur = state.kontrolle.premises[f] || "ok";
      state.kontrolle.premises[f] = cur === "ok" ? "watch" : cur === "watch" ? "broken" : "ok";
      save(); renderPraemissen();
    }));
  }

  /* ---------- SWOT ---------- */
  const SWOT_FIELDS = ["strengths", "weaknesses", "opportunities", "threats"];
  function renderSwotList(field) {
    const ul = $(`[data-list="${field}"]`);
    ul.innerHTML = "";
    state.swot[field].forEach((text, i) => {
      const li = document.createElement("li");
      const span = document.createElement("span"); span.textContent = text;
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.swot[field].splice(i, 1); save(); renderSwotList(field); renderTows(); });
      li.append(span, btn); ul.appendChild(li);
    });
  }
  function wireSwotForms() {
    $$(".add-form[data-add]").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const field = form.dataset.add;
        const input = form.querySelector("input");
        const val = input.value.trim();
        if (!val) return;
        state.swot[field].push(val); input.value = "";
        save(); renderSwotList(field); renderTows();
      });
    });
  }
  /* Aus den Analyse-Werkzeugen abgeleitete SWOT-Einträge:
     Wertkette (+/–) → Stärken/Schwächen, VRIO (Vorteil/Nachteil) → Stärken/Schwächen,
     PESTEL (+/–) → Chancen/Risiken, Five Forces stark (≥4) → Risiko, schwach (≤2) → Chance. */
  const VC_ALL = VC_SUPPORT.concat(VC_PRIMARY);
  function derivedSwot() {
    const S = [], W = [], O = [], T = [];
    VC_ALL.forEach((c) => (state.valuechain[c.key] || []).forEach((it) => {
      if (!it || typeof it !== "object") return;
      if (it.sign > 0) S.push(it.text); else if (it.sign < 0) W.push(it.text);
    }));
    (state.vrio || []).forEach((r) => {
      const imp = vrioImplication(r);
      if (imp.rank >= 2) S.push(`${r.name} (VRIO: ${imp.label})`);
      else if (imp.rank === 0) W.push(`${r.name} (VRIO: Wettbewerbsnachteil)`);
    });
    PESTEL_CATS.forEach((c) => (state.pestel[c.key] || []).forEach((it) => {
      if (!it || typeof it !== "object") return;
      if (it.sign > 0) O.push(it.text); else if (it.sign < 0) T.push(it.text);
    }));
    FORCES.forEach((f) => {
      const v = state.forces[f.key].v;
      if (v >= 4) T.push("Hohe " + f.short);
      else if (v <= 2) O.push("Geringe " + f.short);
    });
    return { strengths: S, weaknesses: W, opportunities: O, threats: T };
  }

  function renderDerived() {
    const d = derivedSwot();
    Object.keys(d).forEach((k) => {
      const ul = $(`[data-derived="${k}"]`); if (!ul) return;
      ul.innerHTML = "";
      d[k].forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
      const wrap = ul.closest(".derived-wrap");
      if (wrap) wrap.style.display = d[k].length ? "block" : "none";
    });
  }

  function renderTows() {
    const d = derivedSwot();
    const S = state.swot.strengths.concat(d.strengths);
    const W = state.swot.weaknesses.concat(d.weaknesses);
    const O = state.swot.opportunities.concat(d.opportunities);
    const T = state.swot.threats.concat(d.threats);
    const combine = (a, b) => a.flatMap((x) => b.map((y) => `${x} × ${y}`)).slice(0, 8);
    const fill = (id, items) => {
      const ul = $("#" + id); ul.innerHTML = "";
      items.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    };
    fill("tows-so", combine(S, O)); fill("tows-st", combine(S, T));
    fill("tows-wo", combine(W, O)); fill("tows-wt", combine(W, T));
  }

  function refreshSwotDerived() { renderDerived(); renderTows(); if (document.getElementById("sw-matrix")) renderStrategiewahl(); }

  /* ---------- Five Forces ----------
     Jede Kraft wird nicht direkt bewertet, sondern über ihre einzelnen Treiber.
     Jeder Treiber wird von "sehr niedrig" (1) bis "sehr hoch" (5) eingestellt;
     das zweite Element gibt an, bei welcher Ausprägung die Kraft STARK ist
     ("hoch" oder "niedrig"). Daraus ergibt sich die Stärke der Kraft. */
  const FORCES = [
    { key: "rivalry", label: "Rivalität unter Wettbewerbern", short: "Wettbewerbsrivalität",
      note: "stark, wenn der Verdrängungswettbewerb intensiv ist", drivers: [
      ["Kapazitätsauslastung", "niedrig"], ["Produkthomogenität", "hoch"], ["Bindung der Abnehmer", "niedrig"],
      ["Marktaustrittsbarrieren", "hoch"], ["Härte der Branchenkultur", "hoch"],
    ]},
    { key: "newEntrants", label: "Bedrohung durch neue Anbieter", short: "Bedrohung durch neue Anbieter",
      note: "stark, wenn die Markteintrittsbarrieren niedrig sind", drivers: [
      ["Skaleneffekte (Economies of Scale)", "niedrig"], ["Produktdifferenzierung", "niedrig"], ["Kapitalbedarf", "niedrig"],
      ["Wechselkosten", "niedrig"], ["Kontrolle der Vertriebskanäle durch Etablierte", "niedrig"],
      ["Geschütztes Wissen der Etablierten", "niedrig"], ["Zugang der Etablierten zu Rohstoffen", "niedrig"], ["Staatliche Subventionen für Etablierte", "niedrig"],
    ]},
    { key: "suppliers", label: "Verhandlungsmacht der Lieferanten", short: "Lieferantenmacht",
      note: "stark, wenn Lieferanten Druck ausüben können", drivers: [
      ["Konzentration der Lieferanten (relativ zur Abnehmerbranche)", "hoch"], ["Verfügbarkeit von Substituten", "niedrig"],
      ["Bedeutung des Kunden für den Lieferanten", "niedrig"], ["Differenzierung der Lieferantenprodukte", "hoch"],
      ["Wechselkosten des Abnehmers", "hoch"], ["Drohung der Vorwärtsintegration durch Lieferanten", "hoch"],
    ]},
    { key: "buyers", label: "Verhandlungsmacht der Abnehmer", short: "Abnehmermacht",
      note: "stark, wenn Abnehmer Druck ausüben können", drivers: [
      ["Konzentration der Abnehmer (relativ zu Anbietern)", "hoch"], ["Wechselkosten der Abnehmer", "niedrig"],
      ["Produktdifferenzierung der Anbieter", "niedrig"], ["Drohung der Rückwärtsintegration durch Abnehmer", "hoch"],
      ["Gewinnsituation der Abnehmer", "niedrig"], ["Bedeutung des Inputs für die Qualität des Abnehmerprodukts", "niedrig"],
    ]},
    { key: "substitutes", label: "Bedrohung durch Ersatzprodukte", short: "Bedrohung durch Ersatzprodukte",
      note: "stark, wenn attraktive Substitute existieren", drivers: [
      ["Differenzierung/Attraktivität des Substituts", "hoch"], ["Verbesserungsrate des Preis-Leistungs-Verhältnisses des Substituts", "hoch"],
    ]},
  ];
  // Beitrag eines Treibers zur Stärke der Kraft (1..5); bei Zielrichtung "hoch"
  // direkt, bei "niedrig" invertiert (niedrige Ausprägung = starke Kraft).
  const driverContribution = (val, dir) => (dir === "hoch" ? val : (6 - val));
  // Auswirkung der aktuellen Einstellung auf die Branchenattraktivität.
  // Starker Beitrag zur Kraft = geringere Attraktivität = "unattraktiv".
  const IMPACT_WORDS = ["Chance", "eher Chance", "neutral", "eher Risiko", "Risiko"];
  const driverImpact = (val, dir) => IMPACT_WORDS[Math.round(driverContribution(val, dir)) - 1] || "neutral";
  // Auswirkung der gesamten Kraft (1..5) auf die Attraktivität: je stärker die
  // Kraft, desto geringer die Attraktivität der Branche.
  const forceImpact = (v) => IMPACT_WORDS[Math.min(4, Math.max(0, Math.round(v) - 1))] || "neutral";
  function computeForce(f) {
    const arr = state.forces[f.key].drivers || [];
    const contribs = f.drivers.map((d, i) => {
      const val = arr[i] != null ? arr[i] : 3;
      return driverContribution(val, d[1]);
    });
    const avg = contribs.reduce((a, b) => a + b, 0) / (contribs.length || 1);
    return Math.round(avg * 10) / 10;
  }
  function ensureForceDrivers() {
    FORCES.forEach((f) => {
      const fx = state.forces[f.key];
      if (!Array.isArray(fx.drivers)) fx.drivers = [];
      for (let i = 0; i < f.drivers.length; i++) if (fx.drivers[i] == null) fx.drivers[i] = 3;
      fx.drivers.length = f.drivers.length;
    });
  }
  function buildForces() {
    ensureForceDrivers();
    const box = $("#forces-list"); box.innerHTML = "";
    FORCES.forEach((f) => {
      const cur = state.forces[f.key];
      const el = document.createElement("div");
      el.className = "force";
      el.innerHTML = `
        <div class="force-top">
          <h3>${f.label}</h3>
          <span class="force-badge"><span class="force-val" id="val-${f.key}">${cur.v}</span><span class="force-level" id="lvl-${f.key}"></span></span>
        </div>
        <p class="force-note-hint">Kraft ${f.note}. Die Stärke ergibt sich aus den Treibern.</p>
        <div class="drivers">${
          f.drivers.map((d, i) => `
            <div class="driver">
              <div class="driver-head"><span class="driver-label">${d[0]}</span><span class="driver-val" id="dv-${f.key}-${i}">${driverImpact(cur.drivers[i], d[1])}</span></div>
              <input type="range" min="1" max="5" step="1" value="${cur.drivers[i]}" data-i="${i}" aria-label="${d[0]}" />
              <div class="scale-hint"><span>sehr niedrig</span><span>sehr hoch</span></div>
            </div>`).join("")
        }</div>
        <textarea placeholder="Begründung / Notizen …">${escapeHtml(cur.note || "")}</textarea>`;
      el.querySelectorAll(".driver input").forEach((range) => {
        range.addEventListener("input", () => {
          const i = Number(range.dataset.i);
          state.forces[f.key].drivers[i] = Number(range.value);
          $("#dv-" + f.key + "-" + i).textContent = driverImpact(range.value, f.drivers[i][1]);
          save(); updateForcesResult();
        });
      });
      const ta = el.querySelector("textarea");
      ta.addEventListener("input", () => { state.forces[f.key].note = ta.value; save(); });
      box.appendChild(el);
    });
  }
  function updateForcesResult() {
    ensureForceDrivers();
    FORCES.forEach((f) => {
      const v = computeForce(f);
      state.forces[f.key].v = v;
      const badge = $("#val-" + f.key); if (badge) badge.textContent = v.toFixed(1);
      const lvl = $("#lvl-" + f.key);
      if (lvl) lvl.textContent = forceImpact(v);
    });
    const vals = FORCES.map((f) => state.forces[f.key].v);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const attractiveness = ((5 - avg) / 4) * 100;
    const gauge = $("#forces-gauge");
    gauge.style.width = attractiveness + "%";
    let color = "var(--good)", verdict = "hohe Attraktivität";
    if (attractiveness < 35) { color = "var(--critical)"; verdict = "geringe Attraktivität"; }
    else if (attractiveness < 60) { color = "var(--warning)"; verdict = "mittlere Attraktivität"; }
    gauge.style.background = color;
    $("#forces-score").textContent = Math.round(attractiveness);
    $("#forces-verdict").textContent = verdict + " · Ø Kräfte " + avg.toFixed(1);
    drawForcesRadar();
    refreshSwotDerived();
  }
  const RADAR_LABEL = { rivalry: "Rivalität", newEntrants: "Neue Anbieter", suppliers: "Lieferanten", buyers: "Abnehmer", substitutes: "Substitute" };
  function drawForcesRadar() {
    const canvas = $("#forces-radar"); if (!canvas) return;
    const { ctx, W, H } = canvas2d(canvas);
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2 + 4, R = Math.min(W, H) / 2 - 78;
    const muted = cssVar("--muted"), grid = cssVar("--grid"), series = cssVar("--series-1"), surface = cssVar("--surface-1");
    const n = FORCES.length;
    const ang = (i) => -Math.PI / 2 + i * 2 * Math.PI / n;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const a = ang(i), rr = R * r / 5, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
    }
    ctx.fillStyle = muted; ctx.font = "11px system-ui, sans-serif";
    FORCES.forEach((f, i) => {
      const a = ang(i), x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
      const lx = cx + Math.cos(a) * (R + 14), ly = cy + Math.sin(a) * (R + 12);
      ctx.textAlign = Math.abs(Math.cos(a)) < 0.3 ? "center" : (Math.cos(a) > 0 ? "left" : "right");
      ctx.textBaseline = Math.abs(Math.sin(a)) < 0.3 ? "middle" : (Math.sin(a) > 0 ? "top" : "bottom");
      ctx.fillText(RADAR_LABEL[f.key], lx, ly);
    });
    ctx.beginPath();
    FORCES.forEach((f, i) => { const v = state.forces[f.key].v, a = ang(i), rr = R * v / 5, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath();
    ctx.globalAlpha = 0.22; ctx.fillStyle = series; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = series; ctx.lineWidth = 2; ctx.stroke();
    FORCES.forEach((f, i) => {
      const v = state.forces[f.key].v, a = ang(i), rr = R * v / 5, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = series; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
    });
  }

  /* ---------- Stakeholder-Matrix ---------- */
  const stkForm = $("#stk-form");
  stkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(stkForm);
    const s = {
      name: String(fd.get("name")).trim(),
      power: clamp(Number(fd.get("power")), 1, 5),
      interest: clamp(Number(fd.get("interest")), 1, 5),
    };
    if (!s.name || !isFinite(s.power) || !isFinite(s.interest)) return;
    state.stakeholders.push(s); save(); stkForm.reset(); renderStkTable(); drawStakeholder();
  });
  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function renderStkTable() {
    const tb = $("#stk-tbody"); tb.innerHTML = "";
    state.stakeholders.forEach((s, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(s.name)}</td><td>${s.power}</td><td>${s.interest}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.stakeholders.splice(i, 1); save(); renderStkTable(); drawStakeholder(); });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function drawStakeholder() {
    const canvas = $("#stk-canvas"); if (!canvas) return;
    const { ctx, W, H } = canvas2d(canvas);
    const pad = { l: 64, r: 24, t: 24, b: 52 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-primary"), muted = cssVar("--muted"), grid = cssVar("--grid"), surface = cssVar("--surface-1"), series = cssVar("--series-1");
    ctx.clearRect(0, 0, W, H);
    // x = Interesse (1..5, links niedrig), y = Macht (1..5, oben hoch)
    const xToPx = (i) => pad.l + ((clamp(i,1,5) - 1) / 4) * plotW;
    const yToPx = (p) => pad.t + (1 - (clamp(p,1,5) - 1) / 4) * plotH;
    const xMid = pad.l + plotW / 2, yMid = pad.t + plotH / 2;
    const quads = [
      { x: pad.l, y: pad.t, w: plotW/2, h: plotH/2, label: "Zufrieden halten", c: series },
      { x: xMid, y: pad.t, w: plotW/2, h: plotH/2, label: "Eng managen", c: cssVar("--good") },
      { x: pad.l, y: yMid, w: plotW/2, h: plotH/2, label: "Beobachten", c: muted },
      { x: xMid, y: yMid, w: plotW/2, h: plotH/2, label: "Informiert halten", c: cssVar("--warning") },
    ];
    quads.forEach((q) => {
      ctx.globalAlpha = 0.06; ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(q.label, q.x + q.w / 2, q.y + 8);
    });
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = cssVar("--baseline");
    ctx.beginPath(); ctx.moveTo(xMid, pad.t); ctx.lineTo(xMid, pad.t + plotH);
    ctx.moveTo(pad.l, yMid); ctx.lineTo(pad.l + plotW, yMid); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Interesse (niedrig → hoch)", pad.l + plotW / 2, H - 22);
    ctx.save(); ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle"; ctx.fillText("Macht (niedrig → hoch)", 0, 0); ctx.restore();
    // Punkte (leichtes Jitter gegen Überlappung identischer Positionen)
    const seen = {};
    state.stakeholders.forEach((s) => {
      const kkey = s.power + ":" + s.interest; const n = (seen[kkey] = (seen[kkey] || 0) + 1);
      const off = (n - 1) * 12;
      const cx = xToPx(s.interest) + off, cy = yToPx(s.power) + off;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = series; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif";
      ctx.textBaseline = "middle";
      const nearRight = cx > pad.l + plotW * 0.72;
      ctx.textAlign = nearRight ? "right" : "left";
      ctx.fillText(s.name, cx + (nearRight ? -13 : 13), cy);
    });
    if (state.stakeholders.length === 0) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Stakeholder – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }

  /* ---------- BCG-Portfolio ---------- */
  const bcgForm = $("#bcg-form");
  bcgForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(bcgForm);
    const unit = {
      name: String(fd.get("name")).trim(),
      growth: Number(fd.get("growth")), share: Number(fd.get("share")), revenue: Number(fd.get("revenue")),
    };
    if (!unit.name || !isFinite(unit.growth) || !(unit.share > 0) || !(unit.revenue >= 0)) return;
    state.bcg.push(unit); save(); bcgForm.reset(); renderBcgTable(); drawBCG();
  });
  function renderBcgTable() {
    const tb = $("#bcg-tbody"); tb.innerHTML = "";
    state.bcg.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(u.name)}</td><td>${u.growth}%</td><td>${u.share}×</td><td>${u.revenue}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.bcg.splice(i, 1); save(); renderBcgTable(); drawBCG(); });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function drawBCG() {
    const canvas = $("#bcg-canvas"); if (!canvas) return;
    const { ctx, W, H } = canvas2d(canvas);
    const pad = { l: 64, r: 24, t: 24, b: 52 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-primary"), muted = cssVar("--muted"), grid = cssVar("--grid"), surface = cssVar("--surface-1"), series = cssVar("--series-1");
    ctx.clearRect(0, 0, W, H);
    const xMin = Math.log10(0.1), xMax = Math.log10(10);
    const xToPx = (share) => {
      const v = Math.log10(Math.min(10, Math.max(0.1, share)));
      return pad.l + (1 - (v - xMin) / (xMax - xMin)) * plotW;
    };
    const maxGrowth = Math.max(20, ...state.bcg.map((u) => u.growth + 2));
    const yToPx = (g) => pad.t + (1 - Math.min(maxGrowth, Math.max(0, g)) / maxGrowth) * plotH;
    const xMid = xToPx(1), yMid = yToPx(10);
    const quad = [
      { x: pad.l, y: pad.t, w: xMid - pad.l, h: yMid - pad.t, label: "Stars", c: cssVar("--good") },
      { x: xMid, y: pad.t, w: pad.l + plotW - xMid, h: yMid - pad.t, label: "Question Marks", c: cssVar("--warning") },
      { x: pad.l, y: yMid, w: xMid - pad.l, h: pad.t + plotH - yMid, label: "Cash Cows", c: series },
      { x: xMid, y: yMid, w: pad.l + plotW - xMid, h: pad.t + plotH - yMid, label: "Dogs", c: muted },
    ];
    quad.forEach((q) => {
      ctx.globalAlpha = 0.06; ctx.fillStyle = q.c; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.globalAlpha = 1;
      ctx.fillStyle = muted; ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(q.label, q.x + q.w / 2, q.y + 8);
    });
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = cssVar("--baseline");
    ctx.beginPath(); ctx.moveTo(xMid, pad.t); ctx.lineTo(xMid, pad.t + plotH);
    ctx.moveTo(pad.l, yMid); ctx.lineTo(pad.l + plotW, yMid); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("Relativer Marktanteil (hoch → niedrig)", pad.l + plotW / 2, H - 22);
    [10, 1, 0.1].forEach((t) => ctx.fillText(t + "×", xToPx(t), pad.t + plotH + 6));
    ctx.save(); ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = "middle"; ctx.fillText("Marktwachstum (%)", 0, 0); ctx.restore();
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [0, 10, maxGrowth].forEach((g) => ctx.fillText(Math.round(g) + "%", pad.l - 8, yToPx(g)));
    const maxRev = Math.max(1, ...state.bcg.map((u) => u.revenue));
    state.bcg.forEach((u) => {
      const cx = xToPx(u.share), cy = yToPx(u.growth);
      const r = 10 + Math.sqrt(u.revenue / maxRev) * 32;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.globalAlpha = 0.55; ctx.fillStyle = series; ctx.fill();
      ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(u.name, cx, cy);
    });
    if (state.bcg.length === 0) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Geschäftseinheiten – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }

  /* ---------- Balanced Scorecard ---------- */
  function buildBSC() {
    const root = $("#bsc-root"); root.innerHTML = "";
    const best = swBest();
    if (best) {
      const banner = document.createElement("div");
      banner.className = "bsc-strategy-banner";
      banner.innerHTML = `Diese Scorecard setzt die gewählte Strategie um: <strong>${escapeHtml(best.name)}</strong>`;
      root.appendChild(banner);
    }
    BSC_VIEWS.forEach((p) => {
      if (!state.bsc[p.key]) state.bsc[p.key] = [];
      const card = document.createElement("div");
      card.className = "bsc-card";
      card.innerHTML = `<h3>${p.label}</h3>
        <table class="bsc-table"><thead><tr><th>Ziel</th><th>Kennzahl</th><th>Zielwert</th><th>Maßnahme</th><th></th></tr></thead>
        <tbody></tbody></table>
        <form class="bsc-form">
          <input type="text" name="ziel" placeholder="Ziel" required />
          <input type="text" name="kennzahl" placeholder="Kennzahl" />
          <input type="text" name="zielwert" placeholder="Zielwert" />
          <input type="text" name="massnahme" placeholder="Maßnahme" />
          <button type="submit">+</button>
        </form>`;
      const tbody = card.querySelector("tbody");
      const render = () => {
        tbody.innerHTML = "";
        state.bsc[p.key].forEach((row, i) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${escapeHtml(row.ziel)}</td><td>${escapeHtml(row.kennzahl)}</td><td>${escapeHtml(row.zielwert)}</td><td>${escapeHtml(row.massnahme)}</td>`;
          const td = document.createElement("td");
          const btn = document.createElement("button");
          btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
          btn.addEventListener("click", () => { state.bsc[p.key].splice(i, 1); save(); render(); });
          td.appendChild(btn); tr.appendChild(td); tbody.appendChild(tr);
        });
      };
      card.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const row = {
          ziel: String(fd.get("ziel")).trim(), kennzahl: String(fd.get("kennzahl")).trim(),
          zielwert: String(fd.get("zielwert")).trim(), massnahme: String(fd.get("massnahme")).trim(),
        };
        if (!row.ziel) return;
        state.bsc[p.key].push(row); save(); e.target.reset(); render();
        // Kennzahl sofort in den Frühwarn-Tracker übernehmen (6.2 → 6.3)
        if (syncKpiFromBsc()) renderKpi();
      });
      root.appendChild(card);
      render();
    });
  }

  /* ---------- SMART-Ziele (geführt) ---------- */
  const SMART = ["s", "m", "a", "r", "t"];
  const SMART_LABEL = { s: "Spezifisch", m: "Messbar", a: "Attraktiv", r: "Realistisch", t: "Terminiert" };
  function smartMet(z, c) { const v = z[c]; return typeof v === "string" ? v.trim() !== "" : !!v; }
  function smartText(z, c) { return typeof z[c] === "string" ? z[c] : (z[c] ? "✓" : ""); }
  function smartSentence(z) {
    return `${z.s || z.ziel}${z.m ? ` – messbar an ${z.m}` : ""}${z.t ? `, bis ${z.t}` : ""}`
      + `${z.r ? ` (realistisch: ${z.r})` : ""}${z.a ? `. Nutzen: ${z.a}` : ""}.`;
  }
  $("#ziele-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const z = { ziel: String(fd.get("ziel")).trim() };
    SMART.forEach((c) => (z[c] = String(fd.get(c) || "").trim()));
    if (!z.ziel) return;
    state.ziele.push(z); save(); e.target.reset(); renderZiele();
  });
  function renderZiele() {
    const list = $("#ziele-list"); if (!list) return;
    list.innerHTML = "";
    if (!state.ziele.length) {
      list.innerHTML = '<p class="smart-empty">Noch keine Ziele – oben ein Ziel geführt formulieren.</p>';
      return;
    }
    state.ziele.forEach((z, i) => {
      const count = SMART.filter((c) => smartMet(z, c)).length;
      const full = count === 5;
      const card = document.createElement("div");
      card.className = "smart-card";
      const rows = SMART.map((c) => `<div class="smart-row ${smartMet(z, c) ? "ok" : "miss"}">`
        + `<span class="smart-badge">${c.toUpperCase()}</span>`
        + `<span class="smart-lab">${SMART_LABEL[c]}</span>`
        + `<span class="smart-val">${smartMet(z, c) ? escapeHtml(smartText(z, c)) : "—"}</span></div>`).join("");
      card.innerHTML = `<div class="smart-head"><h3>${escapeHtml(z.ziel)}</h3>`
        + `<span class="badge ${full ? "ok" : "warn"}">${full ? "SMART ✓" : count + "/5"}</span>`
        + `<button type="button" class="smart-del" aria-label="Entfernen">×</button></div>`
        + `<div class="smart-meter"><span style="width:${count / 5 * 100}%"></span></div>`
        + `<div class="smart-rows">${rows}</div>`
        + (full ? `<p class="smart-sentence">„${escapeHtml(smartSentence(z))}"</p>` : "");
      card.querySelector(".smart-del").addEventListener("click", () => { state.ziele.splice(i, 1); save(); renderZiele(); });
      list.appendChild(card);
    });
  }

  /* ---------- Szenario-Analyse ---------- */
  function wireSzenario() {
    const map = { frage: "#szenario-frage", a: "#szenario-a", b: "#szenario-b" };
    Object.keys(map).forEach((key) => {
      const el = $(map[key]);
      el.addEventListener("input", () => { state.szenario[key] = el.value; save(); });
    });
  }
  function setSzenarioValues() {
    $("#szenario-frage").value = state.szenario.frage || "";
    $("#szenario-a").value = state.szenario.a || "";
    $("#szenario-b").value = state.szenario.b || "";
  }

  /* ---------- Strategische Kennzahlen ---------- */
  function numOf(v) { const n = parseFloat(v); return isFinite(n) ? n : null; }
  function fmtNum(n) { return n == null ? "–" : n.toLocaleString("de-DE", { maximumFractionDigits: 2 }); }
  function wireKennzahlen() {
    ["#calc-ebitda", "#calc-eva"].forEach((sel) => {
      const form = $(sel);
      form.addEventListener("submit", (e) => e.preventDefault());
      $$("input", form).forEach((inp) => {
        inp.addEventListener("input", () => { state.kennzahlen[inp.name] = inp.value; save(); computeKennzahlen(); });
      });
    });
  }
  function setKennzahlenValues() {
    ["#calc-ebitda", "#calc-eva"].forEach((sel) => {
      $$("input", $(sel)).forEach((inp) => {
        const v = state.kennzahlen[inp.name];
        inp.value = (v === undefined || v === null) ? "" : v;
      });
    });
    computeKennzahlen();
  }
  function computeKennzahlen() {
    const k = state.kennzahlen;
    const ebit = numOf(k.ebit), da = numOf(k.da), umsatz = numOf(k.umsatz);
    let ebitda = null, marge = null;
    if (ebit != null && da != null) ebitda = ebit + da;
    if (ebitda != null && umsatz != null && umsatz !== 0) marge = ebitda / umsatz * 100;
    $("#out-ebitda").innerHTML = `EBITDA: <strong>${fmtNum(ebitda)}</strong> Mio. €<br>EBITDA-Marge: <strong>${marge == null ? "–" : fmtNum(marge) + " %"}</strong>`;
    const nopat = numOf(k.nopat), kapital = numOf(k.kapital), wacc = numOf(k.wacc);
    let kk = null, eva = null;
    if (kapital != null && wacc != null) kk = kapital * wacc / 100;
    if (nopat != null && kk != null) eva = nopat - kk;
    const verdict = eva == null ? "" : (eva >= 0 ? ' <span class="badge ok">Wert geschaffen</span>' : ' <span class="badge warn">Wert vernichtet</span>');
    $("#out-eva").innerHTML = `Kapitalkosten: <strong>${fmtNum(kk)}</strong> Mio. €<br>EVA: <strong>${fmtNum(eva)}</strong> Mio. €${verdict}`;
    drawWaterfall();
    renderKzCompare();
  }
  function kzMetrics() {
    const k = state.kennzahlen;
    const ebit = numOf(k.ebit), da = numOf(k.da), um = numOf(k.umsatz), nopat = numOf(k.nopat), kap = numOf(k.kapital), wacc = numOf(k.wacc);
    const ebitda = (ebit != null && da != null) ? ebit + da : null;
    const ebitdaMarge = (ebitda != null && um) ? ebitda / um * 100 : null;
    const ebitMarge = (ebit != null && um) ? ebit / um * 100 : null;
    const kk = (kap != null && wacc != null) ? kap * wacc / 100 : null;
    const eva = (nopat != null && kk != null) ? nopat - kk : null;
    const roce = (nopat != null && kap) ? nopat / kap * 100 : null;
    const spread = (roce != null && wacc != null) ? roce - wacc : null;
    return { ebit, da, um, nopat, kap, wacc, ebitda, ebitdaMarge, ebitMarge, kk, eva, roce, spread };
  }
  function drawWaterfall() {
    const c = $("#kz-waterfall"); if (!c) return;
    const { ctx, W, H } = canvas2d(c);
    ctx.clearRect(0, 0, W, H);
    const m = kzMetrics();
    const muted = cssVar("--muted"), ink = cssVar("--text-primary"), grid = cssVar("--grid"),
      series = cssVar("--series-1"), good = cssVar("--good"), crit = cssVar("--critical"), surface = cssVar("--surface-1");
    ctx.font = "12px system-ui, sans-serif";
    if (m.nopat == null || m.kk == null) {
      ctx.fillStyle = muted; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("NOPAT, investiertes Kapital und WACC eingeben,", W / 2, H / 2 - 9);
      ctx.fillText("um den Wertbeitrag (EVA) zu sehen.", W / 2, H / 2 + 9);
      return;
    }
    const nopat = m.nopat, kk = m.kk, eva = m.eva;
    const pad = { l: 24, r: 24, t: 34, b: 48 };
    const hi = Math.max(nopat, eva, 0), lo = Math.min(eva, 0);
    const span = (hi - lo) || 1;
    const plotH = H - pad.t - pad.b;
    const yOf = (v) => pad.t + (hi - v) / span * plotH;
    const y0 = yOf(0);
    const cols = [
      { label: "NOPAT", top: yOf(nopat), bot: y0, color: series, val: nopat },
      { label: "− Kapitalkosten", top: yOf(nopat), bot: yOf(eva), color: crit, val: -kk },
      { label: eva >= 0 ? "= EVA" : "= EVA (negativ)", top: yOf(Math.max(eva, 0)), bot: yOf(Math.min(eva, 0)), color: eva >= 0 ? good : crit, val: eva },
    ];
    const gap = 26, n = cols.length, colW = (W - pad.l - pad.r - gap * (n - 1)) / n;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
    cols.forEach((it, i) => {
      const x = pad.l + i * (colW + gap);
      const h = Math.max(2, it.bot - it.top);
      ctx.fillStyle = it.color; ctx.fillRect(x, it.top, colW, h);
      if (i < n - 1) {
        const y = (i === 0) ? yOf(nopat) : yOf(eva);
        ctx.strokeStyle = cssVar("--baseline"); ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(x + colW, y); ctx.lineTo(x + colW + gap, y); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText(fmtNum(it.val) + " Mio. €", x + colW / 2, it.top - 5);
      ctx.fillStyle = muted; ctx.textBaseline = "top";
      ctx.fillText(it.label, x + colW / 2, H - pad.b + 10);
    });
  }
  function renderKzCompare() {
    const box = $("#kz-compare"); if (!box) return;
    const m = kzMetrics();
    const val = (x, unit) => x == null ? "–" : fmtNum(x) + (unit || "");
    const evaBadge = m.eva == null ? "" : (m.eva >= 0 ? '<span class="badge ok">Wert geschaffen</span>' : '<span class="badge warn">Wert vernichtet</span>');
    // ROCE vs WACC Balken
    let bars = '<p class="kz-empty">NOPAT, Kapital und WACC eingeben für ROCE vs. WACC.</p>';
    if (m.roce != null && m.wacc != null) {
      const mx = Math.max(m.roce, m.wacc, 1);
      const w = (v) => Math.max(2, v / mx * 100);
      const spreadPos = m.spread >= 0;
      bars = `<div class="kz-bars">
        <div class="kz-bar-row"><span class="kz-bar-lab">ROCE</span><span class="kz-bar"><span style="width:${w(m.roce)}%;background:var(--series-1)"></span></span><span class="kz-bar-val">${fmtNum(m.roce)} %</span></div>
        <div class="kz-bar-row"><span class="kz-bar-lab">WACC</span><span class="kz-bar"><span style="width:${w(m.wacc)}%;background:var(--muted)"></span></span><span class="kz-bar-val">${fmtNum(m.wacc)} %</span></div>
        <p class="kz-spread ${spreadPos ? "pos" : "neg"}">Spread (ROCE − WACC): <strong>${fmtNum(m.spread)} %-Punkte</strong> – ${spreadPos ? "Rendite über den Kapitalkosten → Wert entsteht" : "Rendite unter den Kapitalkosten → Wert wird vernichtet"}</p>
      </div>`;
    }
    box.innerHTML = `<div class="kz-cols">
      <div class="kz-col">
        <h4>Traditionell <span>buchhalterisch, ohne Kapitalkosten</span></h4>
        <div class="kz-row"><span>EBITDA</span><span>${val(m.ebitda, " Mio. €")}</span></div>
        <div class="kz-row"><span>EBITDA-Marge</span><span>${val(m.ebitdaMarge, " %")}</span></div>
        <div class="kz-row"><span>EBIT</span><span>${val(m.ebit, " Mio. €")}</span></div>
        <div class="kz-row"><span>EBIT-Marge</span><span>${val(m.ebitMarge, " %")}</span></div>
      </div>
      <div class="kz-col kz-value">
        <h4>Wertorientiert <span>berücksichtigt die Kapitalkosten</span></h4>
        <div class="kz-row"><span>ROCE (NOPAT ÷ Kapital)</span><span>${val(m.roce, " %")}</span></div>
        <div class="kz-row"><span>WACC (Kapitalkosten)</span><span>${val(m.wacc, " %")}</span></div>
        <div class="kz-row"><span>EVA</span><span>${val(m.eva, " Mio. €")} ${evaBadge}</span></div>
        ${bars}
      </div>
    </div>`;
  }

  /* ---------- Wettbewerbsumfeld: Strategische-Gruppen-Karte ---------- */
  const WB_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#7248d4", "#e34948", "#e87ba4", "#eb6834", "#008300"];
  function groupColorMap() {
    const map = {}; let i = 0;
    state.wettbewerb.competitors.forEach((c) => {
      const g = (c.group || "").trim();
      if (g && !(g in map)) { map[g] = WB_COLORS[i % WB_COLORS.length]; i++; }
    });
    return map;
  }
  function renderWbTable() {
    const tb = $("#wb-tbody"); if (!tb) return; tb.innerHTML = "";
    state.wettbewerb.competitors.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(c.name)}</td><td>${c.x}</td><td>${c.y}</td><td>${escapeHtml(c.group || "")}</td>`;
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => { state.wettbewerb.competitors.splice(i, 1); save(); renderWbTable(); drawWettbewerb(); renderWbLegend(); });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function renderWbLegend() {
    const box = $("#wb-legend"); if (!box) return;
    const cmap = groupColorMap();
    const parts = Object.keys(cmap).map((g) => `<span class="wb-leg"><span class="wb-dot" style="background:${cmap[g]}"></span>${escapeHtml(g)}</span>`);
    if (state.wettbewerb.competitors.some((c) => !(c.group || "").trim())) parts.push('<span class="wb-leg"><span class="wb-dot" style="background:var(--muted)"></span>ohne Gruppe</span>');
    box.innerHTML = parts.join("");
  }
  function drawWettbewerb() {
    const canvas = $("#wb-canvas"); if (!canvas) return;
    const { ctx, W, H } = canvas2d(canvas);
    const pad = { l: 60, r: 24, t: 24, b: 58 }, plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-primary"), muted = cssVar("--muted"), grid = cssVar("--grid"), surface = cssVar("--surface-1");
    ctx.clearRect(0, 0, W, H);
    const xToPx = (v) => pad.l + (clamp(v, 1, 10) - 1) / 9 * plotW;
    const yToPx = (v) => pad.t + (1 - (clamp(v, 1, 10) - 1) / 9) * plotH;
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.strokeRect(pad.l, pad.t, plotW, plotH);
    for (let g = 2; g < 10; g++) {
      ctx.globalAlpha = 0.5; ctx.beginPath();
      ctx.moveTo(xToPx(g), pad.t); ctx.lineTo(xToPx(g), pad.t + plotH);
      ctx.moveTo(pad.l, yToPx(g)); ctx.lineTo(pad.l + plotW, yToPx(g)); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = muted; ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText((state.wettbewerb.xLabel || "X") + " →", pad.l + plotW / 2, H - 26);
    ctx.save(); ctx.translate(16, pad.t + plotH / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = "middle";
    ctx.fillText((state.wettbewerb.yLabel || "Y") + " →", 0, 0); ctx.restore();
    const cmap = groupColorMap(), seen = {};
    state.wettbewerb.competitors.forEach((c) => {
      const key = c.x + ":" + c.y, nn = (seen[key] = (seen[key] || 0) + 1), off = (nn - 1) * 10;
      const cx = xToPx(c.x) + off, cy = yToPx(c.y) + off;
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = cmap[(c.group || "").trim()] || muted; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = surface; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = "600 12px system-ui, sans-serif"; ctx.textBaseline = "middle";
      const nearRight = cx > pad.l + plotW * 0.8; ctx.textAlign = nearRight ? "right" : "left";
      ctx.fillText(c.name, cx + (nearRight ? -12 : 12), cy);
    });
    if (!state.wettbewerb.competitors.length) {
      ctx.fillStyle = muted; ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Noch keine Wettbewerber – rechts hinzufügen.", pad.l + plotW / 2, pad.t + plotH / 2);
    }
  }
  function wireWettbewerb() {
    const xl = $("#wb-xlabel"), yl = $("#wb-ylabel");
    xl.addEventListener("input", () => { state.wettbewerb.xLabel = xl.value; save(); drawWettbewerb(); });
    yl.addEventListener("input", () => { state.wettbewerb.yLabel = yl.value; save(); drawWettbewerb(); });
    $("#wb-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const c = { name: String(fd.get("name")).trim(), x: clamp(Number(fd.get("x")), 1, 10), y: clamp(Number(fd.get("y")), 1, 10), group: String(fd.get("group") || "").trim() };
      if (!c.name || !isFinite(c.x) || !isFinite(c.y)) return;
      state.wettbewerb.competitors.push(c); save(); e.target.reset(); renderWbTable(); drawWettbewerb(); renderWbLegend();
    });
  }
  function setWbValues() { $("#wb-xlabel").value = state.wettbewerb.xLabel || ""; $("#wb-ylabel").value = state.wettbewerb.yLabel || ""; }

  /* ---------- Frühwarn- & KPI-Tracker (6.3) ---------- */
  const KPI_STATUS = { green: "🟢 im Plan", amber: "🟡 beobachten", red: "🔴 kritisch" };
  const KPI_DIR = { hoch: "↑ höher besser", niedrig: "↓ niedriger besser" };
  // BSC-Kennzahlen werden automatisch als Frühwarn-Indikatoren übernommen
  // (Verzahnung 6.2 → 6.3) und sind danach im Tracker frei anpassbar.
  // Bewusst entfernte Indikatoren landen in "dismissed" und werden nicht erneut angelegt.
  function bscKpiList() {
    const out = [];
    BSC_VIEWS.forEach((p) => (state.bsc[p.key] || []).forEach((row) => {
      const name = (row.kennzahl || "").trim();
      if (name) out.push({ name, target: (row.zielwert || "").trim() });
    }));
    return out;
  }
  function kpiDismissed() {
    if (!Array.isArray(state.kontrolle.dismissed)) state.kontrolle.dismissed = [];
    return state.kontrolle.dismissed;
  }
  function undismissKpi(name) {
    const d = kpiDismissed(); const i = d.indexOf(name);
    if (i >= 0) { d.splice(i, 1); }
  }
  function syncKpiFromBsc() {
    const have = new Set(state.kontrolle.indicators.map((i) => i.name));
    const dismissed = new Set(kpiDismissed());
    let added = false;
    bscKpiList().forEach((c) => {
      if (have.has(c.name) || dismissed.has(c.name)) return;
      state.kontrolle.indicators.push({ name: c.name, target: c.target, actual: "", dir: "hoch", status: "green", src: "bsc" });
      have.add(c.name); added = true;
    });
    if (added) save();
    return added;
  }
  // Frühwarn-Indikatoren aus SMART-Zielen (Kontrollfunktion: Soll-Ist) und aus
  // BSC-Kennzahlen (Zielwert) vorschlagen – schließt den Ziel-Kennzahl-Kontroll-Kreis.
  function kpiCandidates() {
    const out = [];
    (state.ziele || []).forEach((z) => {
      const name = (z.m || "").trim() || (z.ziel || "").trim();
      if (name) out.push({ name, target: "" });
    });
    BSC_VIEWS.forEach((p) => (state.bsc[p.key] || []).forEach((row) => {
      const name = (row.kennzahl || "").trim() || (row.ziel || "").trim();
      if (name) out.push({ name, target: (row.zielwert || "").trim() });
    }));
    return out;
  }
  function renderKpiSuggest() {
    const box = $("#kpi-suggest"); if (!box) return;
    const have = new Set(state.kontrolle.indicators.map((i) => i.name));
    const seen = new Set();
    const avail = kpiCandidates().filter((c) => !have.has(c.name) && !seen.has(c.name) && seen.add(c.name)).slice(0, 12);
    box.innerHTML = avail.length
      ? '<span class="sw-sug-label">Als Frühwarn-Indikator übernehmen (SMART-Ziele · BSC):</span>'
        + avail.map((c, i) => `<button type="button" class="sw-chip" data-i="${i}">+ ${escapeHtml(c.name)}</button>`).join("")
      : "";
    $$(".sw-chip", box).forEach((b) => b.addEventListener("click", () => {
      const c = avail[+b.dataset.i];
      undismissKpi(c.name);
      state.kontrolle.indicators.push({ name: c.name, target: c.target || "", actual: "", dir: "hoch", status: "green" });
      save(); renderKpi();
    }));
  }
  function renderKpi() {
    renderKpiSuggest();
    const tb = $("#kpi-tbody"); if (!tb) return; tb.innerHTML = "";
    state.kontrolle.indicators.forEach((ind, i) => {
      const tr = document.createElement("tr");
      const opts = (map, cur) => Object.keys(map).map((k) =>
        `<option value="${k}"${cur === k ? " selected" : ""}>${map[k]}</option>`).join("");
      tr.innerHTML = `<td>${escapeHtml(ind.name)}${ind.src === "bsc" ? ' <span class="kpi-src" title="Automatisch aus der Balanced Scorecard übernommen – Werte hier frei anpassbar">BSC</span>' : ""}</td>`
        + `<td><input type="text" data-f="target" value="${escapeHtml(ind.target || "")}" placeholder="Zielwert" aria-label="Zielwert für ${escapeHtml(ind.name)}" /></td>`
        + `<td><input type="text" data-f="actual" value="${escapeHtml(ind.actual || "")}" placeholder="Ist-Wert" aria-label="Ist-Wert für ${escapeHtml(ind.name)}" /></td>`
        + `<td><select data-f="dir" aria-label="Zielrichtung">${opts(KPI_DIR, ind.dir)}</select></td>`
        + `<td><select data-f="status" class="kpi-status-sel kpi-${ind.status}" aria-label="Ampel-Status">${opts(KPI_STATUS, ind.status)}</select></td>`;
      $$("input[data-f], select[data-f]", tr).forEach((el) => {
        el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
          ind[el.dataset.f] = el.value; save();
          if (el.dataset.f === "status") el.className = "kpi-status-sel kpi-" + el.value;
        });
      });
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button"; btn.textContent = "×"; btn.setAttribute("aria-label", "Entfernen");
      btn.addEventListener("click", () => {
        // Aus der BSC stammende Kennzahl beim Löschen merken, sonst würde sie
        // bei der nächsten Synchronisation sofort wieder angelegt.
        if (bscKpiList().some((c) => c.name === ind.name) && !kpiDismissed().includes(ind.name))
          state.kontrolle.dismissed.push(ind.name);
        state.kontrolle.indicators.splice(i, 1); save(); renderKpi();
      });
      td.appendChild(btn); tr.appendChild(td); tb.appendChild(tr);
    });
  }
  function wireKpi() {
    $("#kpi-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const ind = {
        name: String(fd.get("name")).trim(), target: String(fd.get("target") || "").trim(),
        actual: String(fd.get("actual") || "").trim(), dir: fd.get("dir") || "hoch", status: fd.get("status") || "green",
      };
      if (!ind.name) return;
      undismissKpi(ind.name);
      state.kontrolle.indicators.push(ind); save(); e.target.reset(); renderKpi();
    });
  }

  /* ---------- Strategiewahl (Nutzwertanalyse) ---------- */
  function computeTowsOptions() {
    const d = derivedSwot();
    const S = state.swot.strengths.concat(d.strengths);
    const W = state.swot.weaknesses.concat(d.weaknesses);
    const O = state.swot.opportunities.concat(d.opportunities);
    const T = state.swot.threats.concat(d.threats);
    const combine = (a, b) => a.flatMap((x) => b.map((y) => `${x} × ${y}`)).slice(0, 5);
    return [].concat(
      combine(S, O).map((t) => ({ g: "SO", t })),
      combine(S, T).map((t) => ({ g: "ST", t })),
      combine(W, O).map((t) => ({ g: "WO", t })),
      combine(W, T).map((t) => ({ g: "WT", t }))
    );
  }
  const BCG_STRATEGY = { "Star": "ausbauen/investieren", "Question Mark": "selektiv fördern", "Cash Cow": "abschöpfen & halten", "Dog": "desinvestieren" };
  function computeStrategyOptions() {
    const tows = computeTowsOptions().map((o) => `[${o.g}] ${o.t}`);
    const ansoff = [];
    ANSOFF_CELLS.forEach((c) => (state.ansoff[c.key] || []).forEach((t) => ansoff.push(`[Ansoff] ${t}`)));
    const bcg = state.bcg.map((u) => `[BCG] ${u.name}: ${BCG_STRATEGY[bcgQuadrant(u)]}`);
    // Round-Robin über die Quellen, damit Ansoff und BCG nicht hinter der
    // Menge an TOWS-Normstrategien verschwinden, sondern gleichberechtigt
    // als übernehmbare Optionen erscheinen.
    const groups = [tows, ansoff, bcg].filter((g) => g.length);
    const out = [];
    const max = Math.max(0, ...groups.map((g) => g.length));
    for (let i = 0; i < max; i++) {
      groups.forEach((g) => { if (i < g.length) out.push(g[i]); });
    }
    return out;
  }
  function swNormalize() {
    const st = state.strategiewahl;
    const n = st.criteria.length;
    st.options.forEach((o) => {
      if (!Array.isArray(o.scores)) o.scores = [];
      while (o.scores.length < n) o.scores.push(3);
      if (o.scores.length > n) o.scores.length = n;
    });
  }
  // Unabdingbares (K.-o.-)Kriterium nicht erfüllt (Bewertung 1) -> Option ausgeschlossen.
  function swExcluded(o) {
    return state.strategiewahl.criteria.some((c, i) => c.ko && Number(o.scores[i]) <= 1);
  }
  function swTotals() {
    const st = state.strategiewahl;
    const wsum = st.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    return st.options.map((o) => swExcluded(o) ? 0 : (wsum ? o.scores.reduce((s, v, i) => s + (Number(v) || 0) * (Number(st.criteria[i].weight) || 0), 0) / wsum : 0));
  }
  // Siegerstrategie (höchster Nutzwert) – speist Umsetzung (BSC) und Dossier-Fazit.
  function swBest() {
    swNormalize();
    const st = state.strategiewahl;
    if (!st.options.length) return null;
    const totals = swTotals();
    let bi = -1, bv = -1;
    totals.forEach((t, i) => { if (!swExcluded(st.options[i]) && t > bv) { bv = t; bi = i; } });
    return bi < 0 ? null : { name: st.options[bi].name, total: bv };
  }
  function renderStrategiewahl() {
    const st = state.strategiewahl; swNormalize();
    const sug = $("#sw-suggest");
    const existing = new Set(st.options.map((o) => o.name));
    const avail = computeStrategyOptions().filter((n) => !existing.has(n)).slice(0, 15);
    sug.innerHTML = avail.length ? '<span class="sw-sug-label">Optionen übernehmen (TOWS · Ansoff · BCG):</span>'
      + avail.map((n, i) => `<button type="button" class="sw-chip" data-i="${i}">+ ${escapeHtml(n)}</button>`).join("") : "";
    $$(".sw-chip", sug).forEach((b) => b.addEventListener("click", () => {
      st.options.push({ name: avail[+b.dataset.i], scores: st.criteria.map(() => 3) }); save(); renderStrategiewahl();
    }));

    // Kriterien aus SMART-Zielen (Entscheidungsfunktion: Ziele liefern die Bewertungskriterien)
    const critBox = $("#sw-crit-suggest");
    if (critBox) {
      const haveCrit = new Set(st.criteria.map((c) => c.name));
      const zieleCrit = (state.ziele || []).map((z) => (z.ziel || "").trim())
        .filter((n) => n && !haveCrit.has(n)).slice(0, 10);
      critBox.innerHTML = zieleCrit.length
        ? '<span class="sw-sug-label">Kriterien aus SMART-Zielen übernehmen:</span>'
          + zieleCrit.map((n, i) => `<button type="button" class="sw-chip" data-i="${i}">+ ${escapeHtml(n)}</button>`).join("")
        : "";
      $$(".sw-chip", critBox).forEach((b) => b.addEventListener("click", () => {
        st.criteria.push({ name: zieleCrit[+b.dataset.i], weight: 1 });
        st.options.forEach((o) => o.scores.push(3)); save(); renderStrategiewahl();
      }));
    }

    const tbl = $("#sw-matrix");
    if (!st.options.length) {
      tbl.innerHTML = '<tbody><tr><td class="sw-empty">Noch keine Optionen – oben aus TOWS, Ansoff oder BCG übernehmen oder eigene hinzufügen.</td></tr></tbody>';
      return;
    }
    const totals = swTotals();
    const best = Math.max.apply(null, totals);
    const head = "<thead><tr><th>Option</th>" + st.criteria.map((c, ci) =>
      `<th class="sw-crit${c.ko ? " sw-ko" : ""}"><span class="sw-cname">${escapeHtml(c.name)}</span>`
      + `<label class="sw-kolabel" title="Unabdingbar: Option mit Bewertung 1 (nicht erfüllt) wird ausgeschlossen"><input type="checkbox" class="sw-ko-toggle" data-crit="${ci}"${c.ko ? " checked" : ""}/> K.-o.</label>`
      + `<span class="sw-w">Gew. <input type="number" min="0" step="1" value="${c.weight}" data-crit="${ci}" class="sw-weight"${c.ko ? " disabled" : ""} /></span>`
      + `<button type="button" class="sw-critdel" data-crit="${ci}" aria-label="Kriterium entfernen">×</button></th>`).join("")
      + "<th>Nutzwert</th><th></th></tr></thead>";
    const body = "<tbody>" + st.options.map((o, oi) => {
      const excl = swExcluded(o);
      const cells = st.criteria.map((c, ci) => `<td><select class="sw-score" data-opt="${oi}" data-crit="${ci}">`
        + [1, 2, 3, 4, 5].map((v) => `<option value="${v}"${Number(o.scores[ci]) === v ? " selected" : ""}>${v}</option>`).join("")
        + "</select></td>").join("");
      const isBest = !excl && totals[oi] === best && best > 0;
      return `<tr class="${isBest ? "sw-best" : ""}${excl ? " sw-excluded" : ""}"><td class="sw-optname">${escapeHtml(o.name)}`
        + `${isBest ? ' <span class="badge ok">Top</span>' : ""}${excl ? ' <span class="badge warn">ausgeschlossen</span>' : ""}</td>`
        + `${cells}<td class="sw-total">${excl ? "–" : totals[oi].toFixed(2)}</td>`
        + `<td><button type="button" class="sw-optdel" data-opt="${oi}" aria-label="Option entfernen">×</button></td></tr>`;
    }).join("") + "</tbody>";
    tbl.innerHTML = head + body;
    $$(".sw-ko-toggle", tbl).forEach((chk) => chk.addEventListener("change", () => { st.criteria[+chk.dataset.crit].ko = chk.checked; save(); renderStrategiewahl(); }));
    $$(".sw-weight", tbl).forEach((inp) => inp.addEventListener("change", () => { st.criteria[+inp.dataset.crit].weight = Number(inp.value); save(); renderStrategiewahl(); }));
    $$(".sw-critdel", tbl).forEach((b) => b.addEventListener("click", () => { st.criteria.splice(+b.dataset.crit, 1); st.options.forEach((o) => o.scores.splice(+b.dataset.crit, 1)); save(); renderStrategiewahl(); }));
    $$(".sw-score", tbl).forEach((sel) => sel.addEventListener("change", () => { st.options[+sel.dataset.opt].scores[+sel.dataset.crit] = Number(sel.value); save(); renderStrategiewahl(); }));
    $$(".sw-optdel", tbl).forEach((b) => b.addEventListener("click", () => { st.options.splice(+b.dataset.opt, 1); save(); renderStrategiewahl(); }));
  }
  function wireStrategiewahl() {
    $("#sw-add").addEventListener("submit", (e) => {
      e.preventDefault(); const inp = e.target.querySelector("input"); const v = inp.value.trim(); if (!v) return;
      state.strategiewahl.options.push({ name: v, scores: state.strategiewahl.criteria.map(() => 3) });
      inp.value = ""; save(); renderStrategiewahl();
    });
    $("#sw-crit-add").addEventListener("submit", (e) => {
      e.preventDefault(); const inp = e.target.querySelector("input"); const v = inp.value.trim(); if (!v) return;
      state.strategiewahl.criteria.push({ name: v, weight: 1 });
      state.strategiewahl.options.forEach((o) => o.scores.push(3));
      inp.value = ""; save(); renderStrategiewahl();
    });
  }

  /* ---------- Fallstudien-Report ---------- */
  const COMPANIES = window.TOOLKIT_COMPANIES || [];
  const FS_SECTIONS = [
    { key: "einleitung", label: "1 · Einleitung & Zielsetzung", en: "Introduction & objectives" },
    { key: "ueberblick", label: "2 · Unternehmensüberblick", en: "Company overview" },
    { key: "extern", label: "3 · Externe Analyse (Umwelt & Branche)", en: "External analysis" },
    { key: "intern", label: "4 · Interne Analyse (Ressourcen & Wertkette)", en: "Internal analysis" },
    { key: "swotopt", label: "5 · SWOT & strategische Optionen", en: "SWOT & strategic options" },
    { key: "diskussion", label: "6 · Kritische Diskussion der Strategie", en: "Critical discussion of the strategy" },
    { key: "fazit", label: "7 · Fazit", en: "Conclusion" },
  ];
  function fsProfileText(c) {
    return `${c.name} (${c.legal}, Sitz: ${c.hq}) ist in der Branche ${c.sector} tätig. `
      + `Geschäftsfelder: ${c.fields.join(", ")}. Märkte: ${c.markets}. `
      + `Größe: Umsatz ${c.revenue}, ${c.employees} Mitarbeitende (${c.fy}). `
      + `Strategischer Fokus: ${c.strategy}`;
  }

  function populateCompanySelect() {
    const sel = $("#example-company");
    if (!sel || sel.dataset.filled) return;
    COMPANIES.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.name; o.textContent = c.name; sel.appendChild(o);
    });
    sel.dataset.filled = "1";
  }

  // Das Unternehmen wird über "Beispiel-Datensatz laden" (Startseite) gesetzt;
  // im Dossier-Editor wird es nur noch angezeigt.
  function renderFsCompanyDisplay() {
    const disp = $("#fs-company-display");
    if (disp) disp.textContent = state.fallstudie.company || "– noch keines gewählt –";
  }

  function buildFsSections() {
    const root = $("#fs-sections");
    if (!root || root.dataset.built) return;
    FS_SECTIONS.forEach((s) => {
      const wrap = document.createElement("div");
      wrap.className = "fs-section";
      const lab = document.createElement("label");
      lab.className = "field-label";
      lab.innerHTML = `${s.label} <span class="fs-en">${s.en}</span>`;
      const ta = document.createElement("textarea");
      ta.id = "fs-sec-" + s.key;
      ta.addEventListener("input", () => { state.fallstudie.sections[s.key] = ta.value; save(); });
      lab.appendChild(ta); wrap.appendChild(lab); root.appendChild(wrap);
    });
    root.dataset.built = "1";
  }

  function wireFallstudie() {
    $("#fs-titel").addEventListener("input", (e) => { state.fallstudie.titel = e.target.value; save(); });
    $("#fs-gruppe").addEventListener("input", (e) => { state.fallstudie.gruppe = e.target.value; save(); });
    buildFsSections();
  }

  function setFallstudieValues() {
    $("#fs-titel").value = state.fallstudie.titel || "";
    $("#fs-gruppe").value = state.fallstudie.gruppe || "";
    FS_SECTIONS.forEach((s) => { const ta = $("#fs-sec-" + s.key); if (ta) ta.value = state.fallstudie.sections[s.key] || ""; });
    renderFsCompanyDisplay();
  }

  /* ---------- Selbsttest: Lernkarten & Quiz ---------- */
  const FLASHCARDS = [
    ["Strategie", "Langfristig orientierte Entscheidungen zur Sicherung der erfolgreichen Existenz eines Unternehmens – legt Domänen und Ressourcenverwendung fest."],
    ["Strategisches vs. operatives Management", "Strategisch: langfristige Existenzsicherung, zukunfts- und umweltorientiert. Operativ: kurz-/mittelfristig, intern, Umsatz-/Gewinn-/Liquiditätsziele."],
    ["Abell-Schema", "Marktabgrenzung über drei Dimensionen: Kundengruppen (wer), Kundenfunktionen (was) und Technologien (wie)."],
    ["Five Forces", "Rivalität, Bedrohung durch neue Anbieter, Verhandlungsmacht von Lieferanten und Abnehmern sowie Ersatzprodukte bestimmen die Branchenattraktivität."],
    ["Wertkette", "Zerlegt das Unternehmen in Primär- und Unterstützungsaktivitäten, um Quellen von Kosten- oder Differenzierungsvorteilen zu finden."],
    ["SWOT / TOWS", "Interne Stärken/Schwächen × externe Chancen/Risiken → Normstrategien SO (ausbauen), ST (absichern), WO (aufholen), WT (vermeiden)."],
    ["BCG-Portfolio", "Marktwachstum × relativer Marktanteil → Stars, Question Marks, Cash Cows, Dogs."],
    ["MBV vs. RBV", "Market-based View: Vorteile aus der Marktpositionierung (outside-in). Resource-based View: Vorteile aus internen Ressourcen/Kernkompetenzen (inside-out)."],
    ["EVA", "Economic Value Added = NOPAT − (investiertes Kapital × WACC). Positiv = Wertschaffung über den Kapitalkosten."],
    ["EBITDA / EBITDA-Marge", "EBITDA = EBIT + Abschreibungen & Amortisation. Marge = EBITDA ÷ Umsatz (operative Profitabilität)."],
    ["SMART-Ziele", "Spezifisch, Messbar, Attraktiv/akzeptiert, Realistisch, Terminiert."],
    ["Balanced Scorecard", "Strategieumsetzung über vier Perspektiven: Finanzen, Kunden, interne Prozesse, Lernen & Entwicklung."],
    ["Szenario-Analyse", "Entwicklung mehrerer konsistenter Zukunftsbilder (Szenariotrichter, z. B. Best/Worst Case) zum Umgang mit Unsicherheit."],
    ["Stakeholder", "Anspruchsgruppen, die Interesse am Unternehmen haben oder betroffen sind; Steuerung über die Macht-Interesse-Matrix."],
  ];

  const QUIZ = [
    { cat: "Grundlagen", q: "Wodurch ist das strategische Management vor allem gekennzeichnet?", o: ["Fokus auf die langfristige Existenzsicherung des Unternehmens", "Steuerung der täglichen Liquidität", "Kurzfristige Umsatzmaximierung", "Ausschließlich interne Betrachtung"], c: 0, e: "Strategisches Management sichert langfristig Existenz und Erfolg; operatives Management ist kurz-/mittelfristig und intern orientiert." },
    { cat: "Grundlagen", q: "Der Resource-based View erklärt Wettbewerbsvorteile primär durch …", o: ["die Attraktivität der Branche", "die Marktpositionierung", "interne Ressourcen und Kernkompetenzen", "staatliche Subventionen"], c: 2, e: "Der RBV ist inside-out: einzigartige, wertvolle Ressourcen und Kernkompetenzen begründen dauerhafte Vorteile." },
    { cat: "Analyse", q: "Über welche drei Dimensionen grenzt das Abell-Schema einen Markt ab?", o: ["Preis, Menge, Qualität", "Kundengruppen, Kundenfunktionen, Technologien", "Stärken, Schwächen, Chancen", "Politik, Ökonomie, Technologie"], c: 1, e: "Abell definiert den Markt über Wer (Kundengruppen), Was (Kundenfunktionen) und Wie (Technologien)." },
    { cat: "Analyse", q: "Die Bedrohung durch neue Anbieter ist tendenziell hoch, wenn …", o: ["die Skaleneffekte hoch sind", "der Kapitalbedarf hoch ist", "die Skaleneffekte niedrig sind", "die Wechselkosten hoch sind"], c: 2, e: "Niedrige Markteintrittsbarrieren (z. B. geringe Skaleneffekte, geringer Kapitalbedarf, niedrige Wechselkosten) erhöhen die Bedrohung durch neue Anbieter." },
    { cat: "Analyse", q: "Welche fünf Felder umfasst die PESTEL-Analyse neben „Political“?", o: ["Economic, Social, Technological, Environmental, Legal", "Economic, Structural, Technical, Ethical, Legal", "Political, Social, Strategic, Technological, Legal", "Economic, Social, Tactical, Environmental, Local"], c: 0, e: "PESTEL steht für Political, Economic, Social, Technological, Environmental und Legal – die sechs Felder der globalen Umweltanalyse." },
    { cat: "Analyse", q: "Zu den Primäraktivitäten der Wertkette zählt NICHT …", o: ["Eingangslogistik", "Marketing & Vertrieb", "Beschaffung", "Kundendienst"], c: 2, e: "Beschaffung, Technologieentwicklung, Personal und Infrastruktur sind unterstützende Aktivitäten; Primäraktivitäten bilden den direkten Leistungsfluss." },
    { cat: "Analyse", q: "Wann ist der Economic Value Added (EVA) positiv?", o: ["Wenn der Umsatz steigt", "Wenn der NOPAT die Kapitalkosten übersteigt", "Wenn das EBIT positiv ist", "Wenn die Abschreibungen sinken"], c: 1, e: "EVA = NOPAT − (Kapital × WACC). Positiv, wenn der operative Gewinn nach Steuern über den Kapitalkosten liegt." },
    { cat: "Analyse", q: "Wie berechnet sich das EBITDA?", o: ["Umsatz − alle Kosten", "EBIT − Steuern", "EBIT + Abschreibungen und Amortisation", "NOPAT + Zinsen"], c: 2, e: "EBITDA = EBIT zzgl. Abschreibungen und Amortisation – zeigt die operative Ertragskraft unabhängig von der Abschreibungspolitik." },
    { cat: "Analyse", q: "Damit eine Ressource nach VRIO einen dauerhaften Vorteil begründet, muss sie u. a. sein:", o: ["verfügbar, riskant, imitierbar, offen", "wertvoll, selten, schwer imitierbar, organisational nutzbar", "variabel, robust, integriert, offen", "wertvoll, standardisiert, imitierbar, ordentlich"], c: 1, e: "VRIO = Valuable, Rare, Inimitable, Organized. Nur Ressourcen mit allen vier Eigenschaften stiften dauerhafte Wettbewerbsvorteile." },
    { cat: "Analyse", q: "Ein Stakeholder mit hoher Macht, aber geringem Interesse sollte …", o: ["eng gemanagt werden", "zufrieden gehalten werden", "nur beobachtet werden", "ignoriert werden"], c: 1, e: "Hohe Macht / geringes Interesse → „Zufrieden halten“, um Widerstand zu vermeiden." },
    { cat: "Zielplanung", q: "Wofür steht das „A“ in SMART?", o: ["Absolut", "Attraktiv/akzeptiert", "Analytisch", "Aktuell"], c: 1, e: "SMART = Spezifisch, Messbar, Attraktiv/akzeptiert, Realistisch, Terminiert." },
    { cat: "Zielplanung", q: "Was ist das zentrale Ziel der Szenario-Analyse?", o: ["Eine einzige exakte Prognose zu erstellen", "Mehrere plausible, konsistente Zukunftsbilder zu entwickeln", "Den Marktanteil zu berechnen", "Kennzahlen zu vergleichen"], c: 1, e: "Die Szenario-Analyse spannt mit mehreren konsistenten Zukunftsbildern (z. B. Best/Worst Case) den Möglichkeitsraum auf." },
    { cat: "Strategiewahl", q: "Was besagt die TOWS-Strategie „SO“?", o: ["Stärken nutzen, um Chancen zu ergreifen", "Schwächen abbauen, um Chancen zu nutzen", "Stärken nutzen, um Risiken abzuwehren", "Schwächen und Risiken begrenzen"], c: 0, e: "SO = Strengths × Opportunities: eigene Stärken einsetzen, um externe Chancen zu nutzen (Ausbaustrategie)." },
    { cat: "Strategiewahl", q: "Ein Geschäft mit hohem Marktwachstum und niedrigem relativem Marktanteil ist im BCG-Portfolio ein …", o: ["Star", "Cash Cow", "Dog", "Question Mark"], c: 3, e: "Hohes Wachstum + niedriger Anteil = Question Mark (Fragezeichen); Investition oder Rückzug ist zu prüfen." },
    { cat: "Strategiewahl", q: "Welches Feld der Ansoff-Matrix gilt als am riskantesten?", o: ["Marktdurchdringung", "Marktentwicklung", "Produktentwicklung", "Diversifikation"], c: 3, e: "Diversifikation (neue Produkte in neuen Märkten) verbindet die höchste Unsicherheit, weil weder Markt noch Produkt vertraut sind." },
    { cat: "Strategiewahl", q: "Was beschreibt Porters „stuck in the middle“?", o: ["Eine bewusste Nischenstrategie", "Fehlende klare Ausrichtung zwischen Kostenführerschaft und Differenzierung", "Die Marktmitte mit dem höchsten Absatz", "Eine Kombination aus Fokus und Wachstum"], c: 1, e: "Wer weder konsequent Kosten führt noch klar differenziert, bleibt „stuck in the middle“ – ohne dauerhaften Wettbewerbsvorteil." },
    { cat: "Umsetzung", q: "Welche ist KEINE Perspektive der Balanced Scorecard?", o: ["Finanzperspektive", "Kundenperspektive", "Lieferantenperspektive", "Lern- und Entwicklungsperspektive"], c: 2, e: "Die vier BSC-Perspektiven sind Finanzen, Kunden, interne Prozesse sowie Lernen & Entwicklung." },
    { cat: "Umsetzung", q: "Die strategische Frühaufklärung reagiert vor allem auf …", o: ["abgeschlossene Jahresabschlüsse", "schwache Signale und Diskontinuitäten im Umfeld", "die Tagesliquidität", "bereits eingetretene Krisen"], c: 1, e: "Frühaufklärung erfasst „schwache Signale“ früh, um auf Diskontinuitäten reagieren zu können, bevor sie voll wirksam werden." },
  ];

  const GLOSSARY = [
    ["Strategie", "Grundsätzliche, langfristig orientierte Ausrichtung eines Unternehmens: legt Geschäftsfelder, Wettbewerbsvorteile und die Verwendung der Ressourcen fest."],
    ["Strategisches vs. operatives Management", "Strategisch = langfristige, zukunfts- und umweltorientierte Existenzsicherung. Operativ = kurz-/mittelfristige, interne Steuerung von Umsatz, Gewinn und Liquidität."],
    ["Vision", "Konkretes, ambitioniertes Zukunftsbild („Wo wollen wir hin?“), das Orientierung und Motivation gibt."],
    ["Leitbild / Mission", "Grundlegendes Selbstverständnis eines Unternehmens: Zweck, Werte und Verhaltensgrundsätze gegenüber den Anspruchsgruppen."],
    ["Abell-Schema", "Marktabgrenzung über drei Dimensionen: Kundengruppen (wer), Kundenfunktionen (was) und Technologien (wie)."],
    ["PESTEL", "Analyse der globalen Umwelt anhand von Political, Economic, Social, Technological, Environmental und Legal."],
    ["Five Forces", "Branchenstrukturanalyse nach Porter: Rivalität, neue Anbieter, Ersatzprodukte sowie Verhandlungsmacht von Lieferanten und Abnehmern."],
    ["Strategische Gruppen", "Unternehmen einer Branche mit ähnlicher Strategie; die Positionierung zeigt Wettbewerbsintensität und Mobilitätsbarrieren."],
    ["Stakeholder", "Anspruchsgruppen mit Interesse am oder Einfluss auf das Unternehmen; Priorisierung über die Macht-Interesse-Matrix."],
    ["SWOT", "Gegenüberstellung interner Stärken/Schwächen und externer Chancen/Risiken als Grundlage der Strategieentwicklung."],
    ["TOWS", "Verknüpfung der SWOT-Felder zu Normstrategien: SO (ausbauen), ST (absichern), WO (aufholen), WT (vermeiden)."],
    ["Wertkette", "Zerlegung des Unternehmens in Primär- und Unterstützungsaktivitäten, um Quellen von Kosten- oder Differenzierungsvorteilen zu finden."],
    ["Kernkompetenz", "Wettbewerbsentscheidende, schwer imitierbare Fähigkeit, die Zugang zu mehreren Märkten eröffnet und Kundennutzen stiftet."],
    ["VRIO", "Prüfraster für Ressourcen: Valuable, Rare, Inimitable, Organized – nur wenn alles erfüllt ist, entsteht ein dauerhafter Vorteil."],
    ["MBV (Market-based View)", "Erklärt Wettbewerbsvorteile aus der Branchen- und Marktpositionierung (outside-in)."],
    ["RBV (Resource-based View)", "Erklärt Wettbewerbsvorteile aus einzigartigen internen Ressourcen und Kernkompetenzen (inside-out)."],
    ["Erfahrungskurve", "Empirischer Zusammenhang, dass die Stückkosten mit kumulierter Ausbringungsmenge sinken – Basis von Kostenführerschaftsstrategien."],
    ["Produktlebenszyklus", "Idealtypischer Verlauf Einführung, Wachstum, Reife, Sättigung, Rückgang – mit unterschiedlichen strategischen Schwerpunkten."],
    ["BCG-Portfolio", "Vier-Felder-Matrix aus Marktwachstum und relativem Marktanteil: Stars, Question Marks, Cash Cows, Dogs."],
    ["McKinsey-Portfolio", "Neun-Felder-Matrix aus Marktattraktivität und relativer Wettbewerbsstärke zur Portfoliosteuerung."],
    ["Benchmarking", "Systematischer Vergleich von Prozessen, Produkten oder Kennzahlen mit Wettbewerbern oder Best-Practice-Beispielen."],
    ["SMART-Ziele", "Zielformulierung: Spezifisch, Messbar, Attraktiv/akzeptiert, Realistisch, Terminiert."],
    ["Zielhierarchie", "Ableitung von Zielen von der Unternehmensspitze bis zur operativen Ebene (Ober-, Zwischen- und Unterziele)."],
    ["Szenario-Analyse", "Entwicklung mehrerer konsistenter Zukunftsbilder (Szenariotrichter, z. B. Best/Worst Case) zum Umgang mit Unsicherheit."],
    ["Ansoff-Matrix", "Wachstumsstrategien in der Produkt-Markt-Matrix: Marktdurchdringung, Marktentwicklung, Produktentwicklung, Diversifikation."],
    ["Generische Strategien (Porter)", "Kostenführerschaft, Differenzierung und Fokus (Nische) als grundlegende Wege zum Wettbewerbsvorteil."],
    ["Stuck in the middle", "Fehlende klare Ausrichtung zwischen Kostenführerschaft und Differenzierung – gilt als riskante Zwischenposition."],
    ["Diversifikation", "Wachstum mit neuen Produkten in neuen Märkten – die risikoreichste Ansoff-Stoßrichtung (horizontal, vertikal, lateral)."],
    ["Make or Buy", "Entscheidung über Eigenerstellung oder Fremdbezug von Leistungen entlang der Wertschöpfung."],
    ["M&A / externes Wachstum", "Wachstum durch Fusionen und Übernahmen statt aus eigener Kraft (internes Wachstum)."],
    ["Strategische Allianz", "Kooperation rechtlich selbstständiger Unternehmen zur Verfolgung gemeinsamer strategischer Ziele."],
    ["Business Model Canvas", "Neun-Bausteine-Modell zur Beschreibung eines Geschäftsmodells von Kundensegmenten bis Kostenstruktur."],
    ["Balanced Scorecard", "Umsetzungssystem mit vier Perspektiven: Finanzen, Kunden, interne Prozesse, Lernen & Entwicklung."],
    ["Strategy Map", "Ursache-Wirkungs-Diagramm, das die strategischen Ziele der BSC-Perspektiven verknüpft."],
    ["EVA", "Economic Value Added = NOPAT − (investiertes Kapital × WACC). Positiv bedeutet Wertschaffung über den Kapitalkosten."],
    ["WACC", "Weighted Average Cost of Capital – gewichteter Mischzinssatz aus Eigen- und Fremdkapitalkosten."],
    ["NOPAT", "Net Operating Profit After Taxes – operativer Gewinn nach Steuern, aber vor Finanzierungskosten."],
    ["EBIT / EBITDA", "EBIT = Ergebnis vor Zinsen und Steuern. EBITDA = EBIT zzgl. Abschreibungen und Amortisation (operative Ertragskraft)."],
    ["KPI", "Key Performance Indicator – Steuerungskennzahl, die den Fortschritt gegenüber einem strategischen Ziel misst."],
    ["Prämissenkontrolle", "Laufende Überprüfung der Annahmen, auf denen eine Strategie beruht, um bei Abweichungen gegenzusteuern."],
    ["Frühaufklärung / schwache Signale", "Frühzeitiges Erkennen von Diskontinuitäten anhand schwacher Signale, bevor sie voll wirksam werden."],
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Lernkarten
  let fcIndex = 0;
  function isKnown(term) { return state.learn.known.includes(term); }
  function setKnown(term, val) {
    const arr = state.learn.known;
    const i = arr.indexOf(term);
    if (val && i < 0) arr.push(term);
    if (!val && i >= 0) arr.splice(i, 1);
    save();
  }
  function renderFlashcard() {
    const card = FLASHCARDS[fcIndex];
    $("#fc-front-text").textContent = card[0];
    $("#fc-back-text").textContent = card[1];
    const fc = $("#flashcard");
    fc.classList.remove("flipped");
    $("#fc-count").textContent = `${fcIndex + 1} / ${FLASHCARDS.length}`;
    const known = isKnown(card[0]);
    fc.classList.toggle("is-known", known);
    $("#fc-known").classList.toggle("is-active", known);
    const n = state.learn.known.length;
    $("#fc-progress").textContent = `${n} / ${FLASHCARDS.length} als „kann ich“ markiert`;
  }
  function wireFlashcards() {
    const fc = $("#flashcard");
    fc.addEventListener("click", () => fc.classList.toggle("flipped"));
    fc.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fc.classList.toggle("flipped"); } });
    $("#fc-prev").addEventListener("click", () => { fcIndex = (fcIndex - 1 + FLASHCARDS.length) % FLASHCARDS.length; renderFlashcard(); });
    $("#fc-next").addEventListener("click", () => { fcIndex = (fcIndex + 1) % FLASHCARDS.length; renderFlashcard(); });
    $("#fc-known").addEventListener("click", () => {
      const term = FLASHCARDS[fcIndex][0];
      setKnown(term, !isKnown(term));
      if (isKnown(term)) { fcIndex = (fcIndex + 1) % FLASHCARDS.length; }
      renderFlashcard();
    });
    $("#fc-unknown").addEventListener("click", () => {
      setKnown(FLASHCARDS[fcIndex][0], false);
      fcIndex = (fcIndex + 1) % FLASHCARDS.length;
      renderFlashcard();
    });
  }

  // Quiz
  let quizFilter = "all";
  function buildQuizFilter() {
    const sel = $("#quiz-filter");
    if (!sel) return;
    const cats = [...new Set(QUIZ.map((q) => q.cat))];
    sel.innerHTML = `<option value="all">Alle Themen</option>` +
      cats.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    sel.value = quizFilter;
  }
  function renderQuiz() {
    const list = $("#quiz-list");
    list.innerHTML = "";
    const set = shuffle(QUIZ.filter((q) => quizFilter === "all" || q.cat === quizFilter));
    $("#quiz-total").textContent = set.length;
    $("#quiz-score").textContent = "0";
    let score = 0;
    const answered = new Array(set.length).fill(false);
    set.forEach((item, qi) => {
      const card = document.createElement("div");
      card.className = "quiz-card";
      const h = document.createElement("h3");
      h.innerHTML = `${qi + 1}. ${escapeHtml(item.q)} <span class="quiz-tag">${escapeHtml(item.cat)}</span>`;
      const opts = document.createElement("div");
      opts.className = "quiz-opts";
      const choices = shuffle(item.o.map((text, idx) => ({ text, correct: idx === item.c })));
      choices.forEach((choice) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "quiz-opt"; b.textContent = choice.text;
        b.addEventListener("click", () => {
          if (answered[qi]) return;
          answered[qi] = true;
          const buttons = $$(".quiz-opt", opts);
          buttons.forEach((btn, bi) => {
            btn.disabled = true;
            if (choices[bi].correct) btn.classList.add("correct");
          });
          if (choice.correct) { score++; $("#quiz-score").textContent = String(score); }
          else b.classList.add("wrong");
          const ex = document.createElement("p");
          ex.className = "quiz-explain";
          ex.textContent = (choice.correct ? "Richtig. " : "Nicht ganz. ") + item.e;
          card.appendChild(ex);
        });
        opts.appendChild(b);
      });
      card.append(h, opts);
      list.appendChild(card);
    });
  }
  function wireQuiz() {
    $("#quiz-restart").addEventListener("click", renderQuiz);
    const sel = $("#quiz-filter");
    if (sel) sel.addEventListener("change", () => { quizFilter = sel.value; renderQuiz(); });
    $("#quiz-mode").addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn"); if (!btn) return;
      $$(".mode-btn").forEach((m) => m.classList.toggle("is-active", m === btn));
      const mode = btn.dataset.mode;
      $("#mode-cards").classList.toggle("is-active", mode === "cards");
      $("#mode-quiz").classList.toggle("is-active", mode === "quiz");
    });
  }

  // Glossar
  function renderGlossar(filter) {
    const dl = $("#glossar-list");
    if (!dl) return;
    const q = (filter || "").trim().toLowerCase();
    const items = GLOSSARY.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
    dl.innerHTML = items.length
      ? items.map(([t, d]) => `<div class="glossar-item"><dt>${escapeHtml(t)}</dt><dd>${escapeHtml(d)}</dd></div>`).join("")
      : `<p class="glossar-empty">Kein Begriff gefunden.</p>`;
    $("#glossar-count").textContent = q
      ? `${items.length} von ${GLOSSARY.length} Begriffen`
      : `${GLOSSARY.length} Begriffe`;
  }
  function wireGlossar() {
    const s = $("#glossar-search");
    if (!s) return;
    s.addEventListener("input", () => renderGlossar(s.value));
  }

  /* ---------- Strategie-Dossier ---------- */
  function stkQuadrant(s) {
    const hp = s.power >= 3, hi = s.interest >= 3;
    return hp && hi ? "Eng managen" : hp && !hi ? "Zufrieden halten"
      : !hp && hi ? "Informiert halten" : "Beobachten";
  }
  function bcgQuadrant(u) {
    const hg = u.growth >= 10, hs = u.share >= 1;
    return hg && hs ? "Star" : hg && !hs ? "Question Mark" : !hg && hs ? "Cash Cow" : "Dog";
  }
  function forceLevel(v) { return v >= 4 ? "stark" : v <= 2 ? "schwach" : "mittel"; }

  // Konsistenz-Check: die Werkzeuge validieren sich gegenseitig (Meta-Verzahnung).
  // Ein/Mehrzahl korrekt setzen – die Befunde landen im Dossier und damit im
  // Abgabedokument, „1 Kennzahl(en)“ liest sich dort schlecht.
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function computeConsistency() {
    const out = [];
    // view = Werkzeug, zu dem der Befund gehört (null = werkzeugübergreifend).
    const add = (sev, text, view) => out.push({ sev, text, view: view || null });
    const d = derivedSwot();

    if (!abellMarketSummary())
      add("info", "Der relevante Markt ist nicht abgegrenzt (Abell) – Branchen- und Portfolioanalyse ohne definierten Bezug.", "abell");
    if (!PESTEL_CATS.some((c) => (state.pestel[c.key] || []).length))
      add("info", "PESTEL ist leer – keine Chancen/Risiken aus der globalen Umwelt.", "pestel");
    if (!VC_ALL.some((c) => (state.valuechain[c.key] || []).length))
      add("info", "Die Wertkette ist leer – keine Stärken/Schwächen aus der internen Analyse.", "wertkette");

    const fvals = FORCES.map((f) => state.forces[f.key].v);
    const favg = fvals.reduce((a, b) => a + b, 0) / fvals.length;
    const forcesTouched = fvals.some((v) => Math.round(v * 10) / 10 !== 3);
    const allThreats = state.swot.threats.concat(d.threats);
    if (forcesTouched && favg >= 3.5 && !allThreats.length)
      add("warn", "Geringe Branchenattraktivität, aber keine Risiken in der SWOT erfasst – Analyse prüfen.", "swot");

    (state.ziele || []).forEach((z) => {
      const cnt = SMART.filter((c) => smartMet(z, c)).length;
      if (cnt < 5) add("info", `Ziel „${z.ziel}“ ist erst ${cnt}/5 SMART.`, "ziele");
    });

    const best = swBest();
    const bscFilled = BSC_VIEWS.some((p) => (state.bsc[p.key] || []).length);
    if (best && !bscFilled)
      add("warn", `Gewählte Strategie „${best.name}“ ist noch nicht in der Balanced Scorecard umgesetzt.`, "bsc");
    if (!best && state.strategiewahl.options.length)
      add("info", "Strategieoptionen vorhanden, aber keine klare Wahl – Kriterien/Bewertung prüfen.", "strategiewahl");

    // BSC-Kennzahlen werden automatisch in den Tracker übernommen; hier bleiben
    // nur bewusst entfernte (dismissed) übrig – die sind kein Konsistenzproblem.
    const bscKpis = [...new Set(BSC_VIEWS.flatMap((p) => (state.bsc[p.key] || []).map((r) => (r.kennzahl || "").trim()).filter(Boolean)))];
    const tracker = new Set((state.kontrolle.indicators || []).map((i) => i.name));
    const dismissed = new Set(state.kontrolle.dismissed || []);
    const missing = bscKpis.filter((k) => !tracker.has(k) && !dismissed.has(k));
    if (missing.length)
      add("info", `${plural(missing.length, "BSC-Kennzahl ist", "BSC-Kennzahlen sind")} noch nicht im Frühwarn-Tracker.`, "kontrolle");

    const broken = Object.values(state.kontrolle.premises || {}).filter((v) => v === "broken").length;
    if (broken)
      add("warn", `${plural(broken, "Prämisse ist", "Prämissen sind")} als „überholt“ markiert – Strategie überprüfen (Prämissenkontrolle).`, "kontrolle");

    /* ---- Methodische Qualität je Werkzeug ----
       Die folgenden Regeln prüfen nicht, OB ein Werkzeug befüllt ist (das leistet
       das Fortschritts-Dashboard), sondern WIE. Sie greifen typische methodische
       Schwächen auf und sind bewusst heuristisch: Denkanstöße, keine Fehler. */

    // Abell: eine Marktabgrenzung braucht alle drei Dimensionen.
    const abellDims = ABELL_CATS.filter((c) => (state.abell[c.key] || []).length);
    if (abellDims.length >= 2 && abellDims.length < ABELL_CATS.length)
      add("info", `Abell ist erst in ${abellDims.length} von 3 Dimensionen gefüllt – der Markt ist damit nicht eindeutig abgegrenzt.`, "abell");

    // PESTEL: Abdeckung der Felder und gesetzte Vorzeichen.
    const pesAll = PESTEL_CATS.flatMap((c) => state.pestel[c.key] || []);
    const pesEmpty = PESTEL_CATS.filter((c) => !(state.pestel[c.key] || []).length);
    if (PESTEL_CATS.length - pesEmpty.length >= 3 && pesEmpty.length)
      add("info", `${plural(pesEmpty.length, "PESTEL-Feld ist", "PESTEL-Felder sind")} von 6 noch ohne Eintrag (${pesEmpty.map((c) => c.label).join(", ")}).`, "pestel");
    if (pesAll.length >= 3 && !pesAll.some((it) => it && it.sign))
      add("warn", "Kein PESTEL-Eintrag ist als Chance (＋) oder Risiko (–) markiert – ohne Vorzeichen fließt nichts in die SWOT.", "pestel");

    // Wertkette: Vorzeichen und Balance von Primär- und Unterstützungsaktivitäten.
    const vcAll = VC_ALL.flatMap((c) => state.valuechain[c.key] || []);
    if (vcAll.length >= 3 && !vcAll.some((it) => it && it.sign))
      add("warn", "Kein Wertketten-Eintrag ist als Stärke (＋) oder Schwäche (–) markiert – ohne Vorzeichen fließt nichts in die SWOT.", "wertkette");
    const vcPrim = VC_PRIMARY.some((c) => (state.valuechain[c.key] || []).length);
    const vcSup = VC_SUPPORT.some((c) => (state.valuechain[c.key] || []).length);
    if (vcPrim !== vcSup)
      add("info", vcPrim
        ? "Nur Primäraktivitäten betrachtet – auch Unterstützungsaktivitäten können Wettbewerbsvorteile begründen."
        : "Nur Unterstützungsaktivitäten betrachtet – die Primäraktivitäten der Wertkette fehlen.", "wertkette");

    // Five Forces: Differenzierung der Kräfte und Belegbarkeit der Bewertung.
    if (forcesTouched) {
      if (Math.max.apply(null, fvals) - Math.min.apply(null, fvals) < 0.5)
        add("warn", "Alle fünf Kräfte sind praktisch gleich stark bewertet – Branchen differenzieren sich in der Regel deutlicher.", "forces");
      const noNote = FORCES.filter((f) => Math.round(state.forces[f.key].v * 10) / 10 !== 3
        && !(state.forces[f.key].note || "").trim());
      if (noNote.length)
        add("info", `${plural(noNote.length, "Kraft ist", "Kräfte sind")} ohne Begründung bewertet (${noNote.map((f) => f.short).join(", ")}) – die Einschätzung bleibt unbelegt.`, "forces");
    }

    // SWOT: Gleichgewicht von Innen-/Außensicht und von Positiv/Negativ.
    const swCount = (k) => (state.swot[k] || []).length + (d[k] || []).length;
    const intern = swCount("strengths") + swCount("weaknesses");
    const extern = swCount("opportunities") + swCount("threats");
    // Die Schieflage wird erst ab vierfachem Übergewicht gemeldet: wer PESTEL vor
    // der Wertkette ausfüllt, hat einen normalen Zwischenstand und kein Problem.
    if (intern + extern >= 6) {
      if (!extern) add("warn", "Die SWOT enthält nur interne Punkte – Chancen und Risiken der Umwelt fehlen vollständig.", "swot");
      else if (!intern) add("warn", "Die SWOT enthält nur externe Punkte – Stärken und Schwächen des Unternehmens fehlen.", "swot");
      else if (intern >= 4 * extern) add("info", `Die Innensicht dominiert deutlich (${intern} interne gegenüber ${extern} externen Punkten).`, "swot");
      else if (extern >= 4 * intern) add("info", `Die Außensicht dominiert deutlich (${extern} externe gegenüber ${intern} internen Punkten).`, "swot");
    }
    if (swCount("strengths") >= 3 && !swCount("weaknesses"))
      add("warn", "Nur Stärken, keine Schwächen – ein Selbstbild ganz ohne blinde Flecken ist unwahrscheinlich.", "swot");
    if (swCount("opportunities") >= 3 && !swCount("threats"))
      add("warn", "Nur Chancen, keine Risiken – die Umweltanalyse ist einseitig.", "swot");

    // VRIO: Plausibilität der Bewertung (Seltenheit ist definitionsgemäß selten).
    if ((state.vrio || []).length >= 3
      && state.vrio.every((r) => vrioImplication(r).rank === 4))
      add("warn", `Alle ${state.vrio.length} Ressourcen sind als dauerhafter Wettbewerbsvorteil bewertet – dann wäre keine davon selten.`, "ansaetze");

    // BCG: Streuung über die Quadranten und Finanzierungslogik des Portfolios.
    if (state.bcg.length >= 3) {
      const quad = (u) => u.growth >= 10 ? (u.share >= 1 ? "Star" : "Question Mark")
                                         : (u.share >= 1 ? "Cash Cow" : "Dog");
      const counts = {};
      state.bcg.forEach((u) => { const q = quad(u); counts[q] = (counts[q] || 0) + 1; });
      const fields = Object.keys(counts);
      if (fields.length === 1)
        add("warn", `Alle Geschäftseinheiten liegen im Feld „${fields[0]}“ – Wachstumsschwelle (10 %) und relative Marktanteile prüfen.`, "bcg");
      if ((counts["Question Mark"] || 0) >= 2 && !counts["Cash Cow"])
        add("info", "Mehrere Question Marks, aber keine Cash Cow – woraus wird der Ausbau finanziert?", "bcg");
    }

    // Stakeholder: ohne Spreizung liefert die Matrix keine unterschiedlichen Strategien.
    if (state.stakeholders.length >= 3) {
      const pw = state.stakeholders.map((x) => x.power), iv = state.stakeholders.map((x) => x.interest);
      if (Math.max.apply(null, pw) === Math.min.apply(null, pw)
        && Math.max.apply(null, iv) === Math.min.apply(null, iv))
        add("info", "Alle Anspruchsgruppen haben dieselbe Macht- und Interessenlage – die Matrix führt so zu einer einzigen Strategie.", "stakeholder");
    }

    // Wettbewerbsumfeld: strategische Gruppen entstehen erst durch Unterschiede.
    const comps = state.wettbewerb.competitors || [];
    if (comps.length >= 3
      && new Set(comps.map((c) => (c.group || "").trim()).filter(Boolean)).size <= 1)
      add("info", "Alle Wettbewerber sind derselben oder keiner strategischen Gruppe zugeordnet – ohne Gruppen bleibt die Karte eine Punktwolke.", "wettbewerb");

    // Szenario-Analyse: der Erkenntnisgewinn entsteht aus dem Kontrast.
    const szA = (state.szenario.a || "").trim(), szB = (state.szenario.b || "").trim();
    if ((szA || szB) && !(szA && szB))
      add("warn", "Nur ein Szenario beschrieben – die Methode lebt vom Kontrast zweier Zukünfte.", "szenario");
    if ((szA || szB) && !(state.szenario.factors || []).length)
      add("info", "Szenarien ohne Einflussfaktoren – sie sind damit nicht aus Treibern hergeleitet.", "szenario");

    // Business Model Canvas: das Wertangebot ist der Bezugspunkt aller Bausteine.
    const bmcFilled = BMC_BLOCKS.filter((c) => (state.bmc[c.key] || []).length);
    if (bmcFilled.length && !(state.bmc.value || []).length)
      add("warn", "Das Wertangebot ist leer – es ist der Bezugspunkt aller übrigen Bausteine.", "bmc");
    if (bmcFilled.length >= BMC_BLOCKS.length / 2 && bmcFilled.length < BMC_BLOCKS.length)
      add("info", `${plural(BMC_BLOCKS.length - bmcFilled.length, "Baustein ist", "Bausteine sind")} von ${BMC_BLOCKS.length} noch leer.`, "bmc");

    // Balanced Scorecard: vier Perspektiven und messbare Zeilen.
    const bscViewsFilled = BSC_VIEWS.filter((v) => (state.bsc[v.key] || []).length);
    if (bscViewsFilled.length && bscViewsFilled.length < BSC_VIEWS.length)
      add("warn", `Nur ${bscViewsFilled.length} von 4 Perspektiven gefüllt – die Ursache-Wirkungs-Kette der Scorecard bleibt unvollständig.`, "bsc");
    const bscUnmeasured = BSC_VIEWS.flatMap((v) => state.bsc[v.key] || [])
      .filter((r) => !String(r.kennzahl || "").trim() || !String(r.zielwert || "").trim()).length;
    if (bscUnmeasured)
      add("info", `${plural(bscUnmeasured, "Scorecard-Zeile ist", "Scorecard-Zeilen sind")} ohne Kennzahl oder Zielwert – nicht messbar und damit nicht steuerbar.`, "bsc");

    // Strategiewahl: Gewichtung und Robustheit der Rangfolge.
    if (state.strategiewahl.options.length >= 2) {
      const ws = state.strategiewahl.criteria.map((c) => Number(c.weight) || 0);
      if (ws.length >= 2 && Math.max.apply(null, ws) === Math.min.apply(null, ws))
        add("info", "Alle Kriterien sind gleich gewichtet – die Nutzwertanalyse bildet dann keine Prioritäten ab.", "strategiewahl");
      const ranked = swTotals().slice().sort((a, b) => b - a);
      if (ranked[0] > 0 && (ranked[0] - ranked[1]) / ranked[0] < 0.05)
        add("warn", "Rang 1 und 2 liegen weniger als 5 % auseinander – die Wahl ist nicht robust; Gewichte und Bewertungen auf Sensitivität prüfen.", "strategiewahl");
    }

    // Frühwarn-Tracker: ohne Ziel- und Ist-Wert trägt der Ampelstatus nichts.
    const kpiOpen = (state.kontrolle.indicators || [])
      .filter((i) => !String(i.target || "").trim() || !String(i.actual || "").trim()).length;
    if (kpiOpen)
      add("info", `${plural(kpiOpen, "Kennzahl ist", "Kennzahlen sind")} ohne Ziel- oder Ist-Wert – der Ampelstatus ist damit nicht belastbar.`, "kontrolle");

    // Kennzahlen: der EVA braucht alle drei Größen.
    const evaFields = ["nopat", "kapital", "wacc"];
    const evaSet = evaFields.filter((f) => String(state.kennzahlen[f] || "").trim() !== "");
    if (evaSet.length && evaSet.length < evaFields.length)
      add("info", "Für den EVA fehlen noch Angaben – NOPAT, investiertes Kapital und WACC werden alle drei benötigt.", "kennzahlen");

    return out;
  }
  const CONSISTENCY_ICON = { warn: "⚠️", info: "ℹ️", ok: "✅" };
  const VIEW_LABEL = PAGES.reduce((m, pg) => ((m[pg.v] = pg.t), m), {});
  const consItem = (it) =>
    `<li class="cons-${it.sev}">${CONSISTENCY_ICON[it.sev]} ${escapeHtml(it.text)}</li>`;
  const consList = (items) => `<ul class="consistency-list">${items.map(consItem).join("")}</ul>`;
  const consOk = `<ul class="consistency-list"><li class="cons-ok">${CONSISTENCY_ICON.ok} Keine Auffälligkeiten – die Analyse ist in sich schlüssig.</li></ul>`;

  /* Zwei Darstellungen derselben Befunde:
     "dashboard" – Warnungen sofort sichtbar, Hinweise eingeklappt, damit die
                   Startseite nicht zur Textwand wird.
     "dossier"   – vollständig und nach Werkzeug gruppiert, als Qualitätsanhang
                   des Berichts. */
  function consistencyHtml(mode) {
    const items = computeConsistency();
    if (!items.length) return consOk;

    if (mode === "dossier") {
      const order = PAGES.map((pg) => pg.v);
      const groups = [];
      const push = (view, list) => { if (list.length) groups.push({ view, list }); };
      push(null, items.filter((it) => !it.view));
      order.forEach((v) => push(v, items.filter((it) => it.view === v)));
      return groups.map((g) =>
        `<div class="cons-group"><h3 class="cons-group-head">${
          g.view ? escapeHtml(VIEW_LABEL[g.view] || g.view) : "Werkzeugübergreifend"
        }</h3>${consList(g.list)}</div>`).join("");
    }

    const warns = items.filter((it) => it.sev === "warn");
    const infos = items.filter((it) => it.sev !== "warn");
    let html = warns.length ? consList(warns) : "";
    if (infos.length) {
      const n = infos.length;
      html += `<details class="cons-more"${warns.length ? "" : " open"}>`
        + `<summary>${n} ${n === 1 ? "weiterer Hinweis" : "weitere Hinweise"}`
        + `${warns.length ? "" : " zur Analyse"}</summary>${consList(infos)}</details>`;
    }
    return html;
  }

  /* Analyse-Coach: zeigt die Befunde zum gerade geöffneten Werkzeug direkt dort an,
     wo gearbeitet wird. Dashboard und Dossier zeigen weiterhin alle Befunde. */
  function activeViewName() {
    const el = $(".view.is-active");
    return el ? el.id.replace(/^view-/, "") : null;
  }
  function coachSlot(view) {
    const sec = document.getElementById("view-" + view);
    if (!sec) return null;
    let el = sec.querySelector(".coach-panel");
    if (!el) {
      el = document.createElement("div");
      el.className = "coach-panel no-print";
      el.setAttribute("aria-live", "polite");
      const after = sec.querySelector(".kb-slot") || sec.querySelector(".view-head");
      if (after) after.insertAdjacentElement("afterend", el);
      else sec.insertBefore(el, sec.firstChild);
    }
    return el;
  }
  function renderCoach(view) {
    const el = coachSlot(view);
    if (!el) return;
    let items = [];
    try { items = computeConsistency().filter((it) => it.view === view); } catch (e) { items = []; }
    const html = items.length
      ? `<h3 class="coach-head">Hinweise zu dieser Analyse</h3>${consList(items)}` : "";
    // Nur bei tatsächlicher Änderung neu schreiben: der Bereich ist aria-live,
    // ein Neuaufbau bei jedem Speichern würde die Liste erneut vorgelesen.
    if (el.dataset.html === html) return;
    el.dataset.html = html;
    el.innerHTML = html;
    el.hidden = !items.length;
  }

  function buildDossier() {
    const root = $("#dossier-root");
    const esc = escapeHtml;
    const parts = [];
    const now = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
    parts.push(`<header class="dossier-head"><h1>Strategie-Dossier</h1><p class="dossier-date">Erstellt am ${now}</p></header>`);
    parts.push(`<section class="dossier-sec consistency-panel"><h2>Konsistenz-Check</h2>${consistencyHtml("dossier")}</section>`);

    let secNo = 0;
    const section = (title, inner) => { secNo++; return `<section class="dossier-sec"><h2>${secNo} · ${title}</h2>${inner}</section>`; };
    const empty = '<p class="dossier-empty">— keine Einträge —</p>';
    const ulOf = (arr) => arr.length ? `<ul>${arr.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : empty;
    const sentimentUl = (items) => {
      const rel = (items || []).filter((it) => it && typeof it === "object");
      if (!rel.length) return empty;
      const mark = (s) => s > 0 ? '<span class="mk pos">＋</span>' : s < 0 ? '<span class="mk neg">–</span>' : '<span class="mk neu">·</span>';
      return `<ul>${rel.map((it) => `<li>${mark(it.sign)} ${esc(it.text)}</li>`).join("")}</ul>`;
    };
    const catGrid = (cats, store) => `<div class="dossier-grid">${cats.map((c) =>
      `<div class="dossier-block"><h3>${c.label}</h3>${ulOf(store[c.key] || [])}</div>`).join("")}</div>`;

    // Fallstudien-Report
    const fs = state.fallstudie;
    const fsHasContent = fs.company || fs.titel || Object.values(fs.sections).some((x) => String(x).trim() !== "");
    if (fsHasContent) {
      const meta = `${fs.titel ? `<p class="dossier-kpi">Titel: <strong>${esc(fs.titel)}</strong></p>` : ""}`
        + `${fs.company ? `<p class="dossier-kpi">Unternehmen: <strong>${esc(fs.company)}</strong></p>` : ""}`
        + `${fs.gruppe ? `<p class="dossier-kpi">Gruppe: ${esc(fs.gruppe)}</p>` : ""}`;
      const body = FS_SECTIONS.map((s) => fs.sections[s.key]
        ? `<h3 class="dossier-sub">${s.label}</h3><p class="fs-report-text">${esc(fs.sections[s.key]).replace(/\n/g, "<br>")}</p>` : "").join("");
      parts.push(section("Fallstudien-Report", meta + body));
    }

    // Abell
    parts.push(section("Abell-Marktabgrenzung", catGrid(ABELL_CATS, state.abell)));

    // Stakeholder
    const stk = state.stakeholders.length
      ? `<table class="dossier-table"><thead><tr><th>Stakeholder</th><th>Macht</th><th>Interesse</th><th>Strategie</th></tr></thead><tbody>${
          state.stakeholders.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.power}</td><td>${s.interest}</td><td>${stkQuadrant(s)}</td></tr>`).join("")
        }</tbody></table>` + chartImg("#stk-canvas", drawStakeholder)
      : empty;
    parts.push(section("Stakeholder-Matrix", stk));

    // SMART-Ziele
    const ziele = state.ziele.length
      ? `<table class="dossier-table"><thead><tr><th>Ziel</th><th>S</th><th>M</th><th>A</th><th>R</th><th>T</th><th>Bewertung</th></tr></thead><tbody>${
          state.ziele.map((z) => { const cnt = SMART.filter((c) => z[c]).length; return `<tr><td>${esc(z.ziel)}</td>` + SMART.map((c) => `<td>${z[c] ? "✓" : "–"}</td>`).join("") + `<td>${cnt === 5 ? "SMART ✓" : cnt + "/5"}</td></tr>`; }).join("")
        }</tbody></table>` : empty;
    parts.push(section("SMART-Ziele", ziele));

    // PESTEL
    parts.push(section("PESTEL-Analyse",
      `<div class="dossier-grid">${PESTEL_CATS.map((c) =>
        `<div class="dossier-block"><h3>${c.label}</h3>${sentimentUl(state.pestel[c.key])}</div>`).join("")}</div>`));

    // Five Forces
    const vals = FORCES.map((f) => state.forces[f.key].v);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const attractiveness = Math.round(((5 - avg) / 4) * 100);
    const forcesTbl = `<table class="dossier-table"><thead><tr><th>Wettbewerbskraft</th><th>Bewertung</th><th>Notiz</th></tr></thead><tbody>${
      FORCES.map((f) => { const fx = state.forces[f.key]; return `<tr><td>${f.label}</td><td>${fx.v} · ${forceLevel(fx.v)}</td><td>${esc(fx.note || "")}</td></tr>`; }).join("")
    }</tbody></table><p class="dossier-kpi">Branchenattraktivität: <strong>${attractiveness}/100</strong> · Ø Kräfte ${avg.toFixed(1)}</p>`;
    parts.push(section("Porters Five Forces", forcesTbl + chartImg("#forces-radar", drawForcesRadar)));

    // Wettbewerbsumfeld (strategische Gruppen)
    const wb = state.wettbewerb;
    if (wb.competitors.length) {
      const wbRows = wb.competitors.map((c) => `<tr><td>${esc(c.name)}</td><td>${c.x}</td><td>${c.y}</td><td>${esc(c.group || "")}</td></tr>`).join("");
      parts.push(section("Wettbewerbsumfeld (strategische Gruppen)",
        `<p class="dossier-kpi">Achsen: ${esc(wb.xLabel)} (X) · ${esc(wb.yLabel)} (Y)</p>`
        + `<table class="dossier-table"><thead><tr><th>Wettbewerber</th><th>X</th><th>Y</th><th>Gruppe</th></tr></thead><tbody>${wbRows}</tbody></table>`
        + chartImg("#wb-canvas", drawWettbewerb)));
    }

    // VRIO-Check (Resource-based View)
    if (state.vrio.length) {
      const vrioRows = state.vrio.map((r) => {
        const imp = vrioImplication(r);
        return `<tr><td>${esc(r.name)}</td>${VRIO_CRITERIA.map((c) => `<td>${r[c.key] ? "✓" : "–"}</td>`).join("")}<td>${imp.label}</td></tr>`;
      }).join("");
      parts.push(section("VRIO-Check (Ressourcen & Fähigkeiten)",
        `<table class="dossier-table"><thead><tr><th>Ressource</th><th>V</th><th>R</th><th>I</th><th>O</th><th>Implikation</th></tr></thead><tbody>${vrioRows}</tbody></table>`));
    }

    // Wertkette
    parts.push(section("Wertkette",
      `<h3 class="dossier-sub">Unterstützungsaktivitäten</h3><div class="dossier-grid">${
        VC_SUPPORT.map((c) => `<div class="dossier-block"><h3>${c.label}</h3>${sentimentUl(state.valuechain[c.key])}</div>`).join("")
      }</div><h3 class="dossier-sub">Primäraktivitäten</h3><div class="dossier-grid">${
        VC_PRIMARY.map((c) => `<div class="dossier-block"><h3>${c.label}</h3>${sentimentUl(state.valuechain[c.key])}</div>`).join("")
      }</div>`));

    // Szenario-Analyse
    const sz = state.szenario;
    const szInner = (sz.frage || (sz.factors && sz.factors.length) || sz.a || sz.b)
      ? `${sz.frage ? `<p class="dossier-kpi">Problemstellung: <strong>${esc(sz.frage)}</strong></p>` : ""}
         <h3 class="dossier-sub">Einflussfaktoren</h3>${ulOf(sz.factors || [])}
         <div class="dossier-grid cols2">
           <div class="dossier-block"><h3>Positives Szenario</h3>${sz.a ? `<p>${esc(sz.a)}</p>` : empty}</div>
           <div class="dossier-block"><h3>Negatives Szenario</h3>${sz.b ? `<p>${esc(sz.b)}</p>` : empty}</div>
         </div>` : empty;
    parts.push(section("Szenario-Analyse", szInner));

    // Strategische Kennzahlen
    const k = state.kennzahlen;
    const kEbit = numOf(k.ebit), kDa = numOf(k.da), kUm = numOf(k.umsatz);
    const kEbitda = (kEbit != null && kDa != null) ? kEbit + kDa : null;
    const kMarge = (kEbitda != null && kUm != null && kUm !== 0) ? kEbitda / kUm * 100 : null;
    const kNopat = numOf(k.nopat), kKap = numOf(k.kapital), kWacc = numOf(k.wacc);
    const kKk = (kKap != null && kWacc != null) ? kKap * kWacc / 100 : null;
    const kEva = (kNopat != null && kKk != null) ? kNopat - kKk : null;
    const anyK = [kEbit, kDa, kUm, kNopat, kKap, kWacc].some((x) => x != null);
    const kRoce = (kNopat != null && kKap) ? kNopat / kKap * 100 : null;
    const kSpread = (kRoce != null && kWacc != null) ? kRoce - kWacc : null;
    const kInner = anyK ? `<table class="dossier-table"><tbody>
        <tr><td>EBITDA (traditionell)</td><td>${fmtNum(kEbitda)} Mio. €</td></tr>
        <tr><td>EBITDA-Marge</td><td>${kMarge == null ? "–" : fmtNum(kMarge) + " %"}</td></tr>
        <tr><td>ROCE (wertorientiert)</td><td>${kRoce == null ? "–" : fmtNum(kRoce) + " %"}</td></tr>
        <tr><td>WACC</td><td>${kWacc == null ? "–" : fmtNum(kWacc) + " %"}</td></tr>
        <tr><td>Spread (ROCE − WACC)</td><td>${kSpread == null ? "–" : fmtNum(kSpread) + " %-Punkte"}</td></tr>
        <tr><td>EVA</td><td>${fmtNum(kEva)} Mio. €${kEva == null ? "" : (kEva >= 0 ? " (Wert geschaffen)" : " (Wert vernichtet)")}</td></tr>
      </tbody></table>` + chartImg("#kz-waterfall", drawWaterfall) : empty;
    parts.push(section("Strategische Kennzahlen", kInner));

    // SWOT + TOWS
    const d = derivedSwot();
    const swotField = (manual, der) => ulOf(manual.concat(der));
    const swotHtml = `<div class="dossier-grid cols2">
      <div class="dossier-block"><h3>Stärken</h3>${swotField(state.swot.strengths, d.strengths)}</div>
      <div class="dossier-block"><h3>Schwächen</h3>${swotField(state.swot.weaknesses, d.weaknesses)}</div>
      <div class="dossier-block"><h3>Chancen</h3>${swotField(state.swot.opportunities, d.opportunities)}</div>
      <div class="dossier-block"><h3>Risiken</h3>${swotField(state.swot.threats, d.threats)}</div>
    </div>`;
    const tow = (id) => Array.from($$("#" + id + " li")).map((li) => li.textContent);
    const towsHtml = `<h3 class="dossier-sub">Normstrategien (TOWS)</h3><div class="dossier-grid cols2">
      <div class="dossier-block"><h3>SO – Ausbauen</h3>${ulOf(tow("tows-so"))}</div>
      <div class="dossier-block"><h3>ST – Absichern</h3>${ulOf(tow("tows-st"))}</div>
      <div class="dossier-block"><h3>WO – Aufholen</h3>${ulOf(tow("tows-wo"))}</div>
      <div class="dossier-block"><h3>WT – Vermeiden</h3>${ulOf(tow("tows-wt"))}</div>
    </div>`;
    parts.push(section("SWOT & Normstrategien", swotHtml + towsHtml));

    // Ansoff-Matrix (Wachstumsstrategien)
    if (ANSOFF_CELLS.some((c) => (state.ansoff[c.key] || []).length)) {
      parts.push(section("Ansoff-Matrix (Wachstumsstrategien)",
        `<div class="dossier-grid cols2">${ANSOFF_CELLS.map((c) =>
          `<div class="dossier-block"><h3>${c.label}</h3>${ulOf(state.ansoff[c.key] || [])}</div>`).join("")}</div>`));
    }

    // Strategiewahl (Nutzwertanalyse)
    const sw = state.strategiewahl;
    if (sw.options.length) {
      swNormalize();
      const totals = swTotals();
      const order = sw.options.map((o, i) => ({ name: o.name, t: totals[i] })).sort((a, b) => b.t - a.t);
      const critLabel = sw.criteria.map((c) => `${esc(c.name)} (×${c.weight})`).join(", ");
      const rows = order.map((r, idx) => `<tr><td>${idx + 1}</td><td>${esc(r.name)}</td><td>${r.t.toFixed(2)}</td></tr>`).join("");
      const best = swBest();
      const rec = best ? `<p class="dossier-rec"><strong>Empfohlene Strategie</strong> (höchster Nutzwert): ${esc(best.name)} · ${best.total.toFixed(2)}</p>` : "";
      parts.push(section("Strategiewahl (Nutzwertanalyse)",
        rec + `<p class="dossier-kpi">Kriterien: ${critLabel}</p><table class="dossier-table"><thead><tr><th>Rang</th><th>Option</th><th>Nutzwert</th></tr></thead><tbody>${rows}</tbody></table>`));
    }

    // 6 BCG
    const bcg = state.bcg.length
      ? `<table class="dossier-table"><thead><tr><th>Einheit</th><th>Wachstum</th><th>Rel. Anteil</th><th>Umsatz</th><th>Kategorie</th></tr></thead><tbody>${
          state.bcg.map((u) => `<tr><td>${esc(u.name)}</td><td>${u.growth}%</td><td>${u.share}×</td><td>${u.revenue}</td><td>${bcgQuadrant(u)}</td></tr>`).join("")
        }</tbody></table>` + chartImg("#bcg-canvas", drawBCG)
      : empty;
    parts.push(section("BCG-Portfolio", bcg));

    // 7 Business Model Canvas
    parts.push(section("Business Model Canvas",
      `<div class="dossier-grid cols3">${BMC_BLOCKS.map((c) =>
        `<div class="dossier-block"><h3>${c.label}</h3>${ulOf(state.bmc[c.key] || [])}</div>`).join("")}</div>`));

    // 8 Balanced Scorecard
    parts.push(section("Balanced Scorecard",
      BSC_VIEWS.map((p) => {
        const rows = state.bsc[p.key] || [];
        const body = rows.length
          ? `<table class="dossier-table"><thead><tr><th>Ziel</th><th>Kennzahl</th><th>Zielwert</th><th>Maßnahme</th></tr></thead><tbody>${
              rows.map((r) => `<tr><td>${esc(r.ziel)}</td><td>${esc(r.kennzahl)}</td><td>${esc(r.zielwert)}</td><td>${esc(r.massnahme)}</td></tr>`).join("")
            }</tbody></table>` : empty;
        return `<div class="dossier-bsc"><h3 class="dossier-sub">${p.label}</h3>${body}</div>`;
      }).join("")));

    // Frühwarn-/KPI-Tracker
    if (state.kontrolle.indicators.length) {
      const rows = state.kontrolle.indicators.map((ind) =>
        `<tr><td>${esc(ind.name)}</td><td>${esc(ind.target || "")}</td><td>${esc(ind.actual || "")}</td><td>${KPI_STATUS[ind.status] || ""}</td></tr>`).join("");
      parts.push(section("Frühwarn- & KPI-Tracker",
        `<table class="dossier-table"><thead><tr><th>Indikator</th><th>Ziel</th><th>Ist</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`));
    }

    root.innerHTML = parts.join("");
  }

  // Zeichnet ein Canvas und bindet es als statisches Bild in das Dossier ein.
  function chartImg(sel, drawFn) {
    const canvas = $(sel); if (!canvas) return "";
    try { drawFn(); return `<img class="dossier-chart" alt="Diagramm" src="${canvas.toDataURL("image/png")}" />`; }
    catch (e) { return ""; }
  }

  /* ---------- Zeitstände & Vergleich (Prämissen- und Durchführungskontrolle) ----------
     Ein Zeitstand hält die gesamte Analyse fest. Der Vergleich mit dem heutigen
     Stand beantwortet die Leitfrage der strategischen Kontrolle: Gelten die
     Annahmen von damals noch? Damit läuft die Kontrolle nicht als Schlussphase,
     sondern begleitend – wie im Regelkreis vorgesehen. */
  const SNAP_KEY = "strategy-toolkit-snapshots-v1";
  const SNAP_MAX = 12;
  const SWOT_LABEL = { strengths: "Stärken", weaknesses: "Schwächen",
                       opportunities: "Chancen", threats: "Risiken" };
  const KZ_LABEL = { ebit: "EBIT", da: "Abschreibungen", umsatz: "Umsatz",
                     nopat: "NOPAT", kapital: "Investiertes Kapital", wacc: "WACC" };
  let snapCompareId = null;

  const snapLabel = (s) => String((s && s.label) || "").trim() || "Ohne Bezeichnung";
  const snapWhen = (ts) => {
    const d = new Date(ts);
    return isNaN(d) ? "" : d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  };

  function loadSnaps() {
    try {
      const arr = JSON.parse(localStorage.getItem(SNAP_KEY) || "[]");
      return Array.isArray(arr) ? arr.filter((s) => s && s.id && s.ts && s.state) : [];
    } catch (e) { return []; }
  }
  // Bei vollem Speicher die ältesten Stände opfern, statt das Sichern scheitern zu lassen.
  function storeSnaps(list) {
    let arr = list.slice(-SNAP_MAX);
    for (;;) {
      try { localStorage.setItem(SNAP_KEY, JSON.stringify(arr)); return arr; }
      catch (e) {
        if (!arr.length) { try { localStorage.removeItem(SNAP_KEY); } catch (e2) {} return []; }
        arr = arr.slice(1);
      }
    }
  }

  /* Vergleichbare Darstellung eines Stands. Bewusst zweigeteilt:
     - items  = benannte Einträge, die hinzukommen oder wegfallen können
     - values = Ausprägungen zu einem Namen, die sich ändern können
     Dadurch erscheint eine verschobene Anspruchsgruppe als Änderung und nicht
     als Löschung plus Neuanlage. */
  const snapText = (x) => (x && typeof x === "object")
    ? ((x.sign > 0 ? "＋ " : x.sign < 0 ? "– " : "") + (x.text || ""))
    : String(x == null ? "" : x);

  function snapFacts(st) {
    const items = [], values = [];
    const arr = (o, k) => (o && Array.isArray(o[k])) ? o[k] : [];
    const list = (view, group, a, fmt) => (a || []).forEach((x) => {
      const t = (fmt || snapText)(x);
      if (t) items.push({ view, group, text: t });
    });
    const named = (view, group, a, name, value) => (a || []).forEach((x) => {
      const n = String(name(x) || "").trim();
      if (!n) return;
      items.push({ view, group, text: n });
      values.push({ view, label: n, value: String(value(x)) });
    });
    const val = (view, label, v) =>
      values.push({ view, label, value: (v == null || v === "") ? "–" : String(v) });

    ABELL_CATS.forEach((c) => list("abell", c.label, arr(st.abell, c.key)));
    SWOT_FIELDS.forEach((f) => list("swot", SWOT_LABEL[f], arr(st.swot, f)));
    PESTEL_CATS.forEach((c) => list("pestel", c.label, arr(st.pestel, c.key)));
    VC_ALL.forEach((c) => list("wertkette", c.label, arr(st.valuechain, c.key)));
    BMC_BLOCKS.forEach((c) => list("bmc", c.label, arr(st.bmc, c.key)));
    ANSOFF_CELLS.forEach((c) => list("strategietypen", c.label, arr(st.ansoff, c.key)));
    list("szenario", "Einflussfaktoren", arr(st.szenario, "factors"));

    named("stakeholder", "Anspruchsgruppen", st.stakeholders,
      (x) => x.name, (x) => `Macht ${x.power}, Interesse ${x.interest}`);
    named("bcg", "Geschäftseinheiten", st.bcg,
      (x) => x.name, (x) => `${x.growth} % Wachstum · ${x.share}× Marktanteil · Umsatz ${x.revenue}`);
    named("ansaetze", "Ressourcen", st.vrio,
      (x) => x.name, (x) => vrioImplication(x).label);
    named("wettbewerb", "Wettbewerber", (st.wettbewerb || {}).competitors,
      (x) => x.name, (x) => `${x.x}/${x.y}${x.group ? " · " + x.group : ""}`);
    named("ziele", "Ziele", st.ziele,
      (x) => x.ziel, (x) => SMART.filter((c) => smartMet(x, c)).length + "/5 SMART");
    named("strategiewahl", "Optionen", (st.strategiewahl || {}).options,
      (x) => x.name, (x) => (x.scores || []).join(" · "));
    named("kontrolle", "Kennzahlen", (st.kontrolle || {}).indicators,
      (x) => x.name,
      (x) => `Ziel ${x.target || "–"} · Ist ${x.actual || "–"} · ${KPI_STATUS[x.status] || "–"}`);
    BSC_VIEWS.forEach((p) => arr(st.bsc, p.key).forEach((r) => {
      const n = String(r.ziel || "").trim() || "(ohne Ziel)";
      items.push({ view: "bsc", group: p.label, text: n });
      values.push({ view: "bsc", label: `${p.label}: ${n}`,
        value: `${r.kennzahl || "ohne Kennzahl"} · Ziel ${r.zielwert || "–"}` });
    }));

    const prem = (st.kontrolle || {}).premises || {};
    Object.keys(prem).forEach((k) => val("kontrolle", "Prämisse: " + k, PREM_STATUS[prem[k]]));
    FORCES.forEach((f) => {
      const v = ((st.forces || {})[f.key] || {}).v;
      val("forces", f.short, (typeof v === "number" ? v : 3).toFixed(1));
    });
    Object.keys(KZ_LABEL).forEach((k) => val("kennzahlen", KZ_LABEL[k], (st.kennzahlen || {})[k]));
    [["a", "Szenario A"], ["b", "Szenario B"]].forEach((pair) => {
      const t = String((st.szenario || {})[pair[0]] || "").trim();
      if (t) val("szenario", pair[1], t.length > 90 ? t.slice(0, 90) + " …" : t);
    });
    return { items, values };
  }

  function snapDiff(before, after) {
    const A = snapFacts(before), B = snapFacts(after);
    const ik = (x) => x.view + " | " + x.group + " | " + x.text;
    const vk = (x) => x.view + " | " + x.label;
    const aI = new Set(A.items.map(ik)), bI = new Set(B.items.map(ik));
    const aV = new Map(A.values.map((x) => [vk(x), x.value]));
    return {
      added: B.items.filter((x) => !aI.has(ik(x))),
      removed: A.items.filter((x) => !bI.has(ik(x))),
      changed: B.values.filter((x) => aV.has(vk(x)) && aV.get(vk(x)) !== x.value)
        .map((x) => ({ view: x.view, label: x.label, from: aV.get(vk(x)), to: x.value })),
    };
  }

  function renderSnapDiff(snap) {
    const box = $("#snap-diff");
    if (!box) return;
    if (!snap) { box.hidden = true; box.innerHTML = ""; return; }
    const d = snapDiff(snap.state, state);
    const head = `<div class="snap-diff-head"><h4>Vergleich mit „${escapeHtml(snapLabel(snap))}“`
      + `<span class="snap-when">${escapeHtml(snapWhen(snap.ts))}</span></h4>`
      + `<button type="button" class="snap-close" aria-label="Vergleich schließen">×</button></div>`;
    if (!d.added.length && !d.removed.length && !d.changed.length) {
      box.hidden = false;
      box.innerHTML = head + `<p class="snap-none">Seit diesem Zeitstand hat sich nichts geändert `
        + `– die Prämissen gelten unverändert.</p>`;
      return;
    }
    const line = (cls, mark, text) =>
      `<li class="${cls}"><span class="snap-mark">${mark}</span>${text}</li>`;
    const groups = PAGES.map((pg) => pg.v).map((v) => {
      const a = d.added.filter((x) => x.view === v);
      const r = d.removed.filter((x) => x.view === v);
      const c = d.changed.filter((x) => x.view === v);
      if (!a.length && !r.length && !c.length) return "";
      return `<div class="snap-group"><h5>${escapeHtml(VIEW_LABEL[v] || v)}</h5><ul class="snap-changes">`
        + a.map((x) => line("snap-add", "+", `${escapeHtml(x.group)}: ${escapeHtml(x.text)}`)).join("")
        + r.map((x) => line("snap-del", "−", `${escapeHtml(x.group)}: ${escapeHtml(x.text)}`)).join("")
        + c.map((x) => line("snap-chg", "≠",
            `${escapeHtml(x.label)}: ${escapeHtml(x.from)} → ${escapeHtml(x.to)}`)).join("")
        + `</ul></div>`;
    }).join("");
    box.hidden = false;
    box.innerHTML = head + `<p class="snap-summary">`
      + `<span class="snap-add">${plural(d.added.length, "Eintrag", "Einträge")} hinzugekommen</span> · `
      + `<span class="snap-del">${plural(d.removed.length, "Eintrag", "Einträge")} entfallen</span> · `
      + `<span class="snap-chg">${plural(d.changed.length, "Wert", "Werte")} geändert</span></p>`
      + groups;
  }

  function renderSnapshots() {
    const box = $("#snap-list");
    if (!box) return;
    const list = loadSnaps();
    if (!list.some((s) => s.id === snapCompareId)) snapCompareId = null;
    if (!list.length) {
      box.innerHTML = '<p class="snap-empty">Noch kein Zeitstand gesichert.</p>';
      renderSnapDiff(null);
      return;
    }
    box.innerHTML = `<ul class="snap-list">${list.slice().reverse().map((s) => {
      const aktiv = s.id === snapCompareId;
      return `<li${aktiv ? ' class="is-active"' : ""}>`
        + `<span class="snap-name">${escapeHtml(snapLabel(s))}</span>`
        + `<span class="snap-when">${escapeHtml(snapWhen(s.ts))}</span>`
        + `<span class="snap-actions">`
        + `<button type="button" data-act="diff" data-id="${escapeHtml(s.id)}" aria-pressed="${aktiv}">`
        + `${aktiv ? "Vergleich schließen" : "Vergleichen"}</button>`
        + `<button type="button" data-act="restore" data-id="${escapeHtml(s.id)}">Wiederherstellen</button>`
        + `<button type="button" data-act="del" data-id="${escapeHtml(s.id)}" `
        + `aria-label="Zeitstand „${escapeHtml(snapLabel(s))}“ löschen">×</button>`
        + `</span></li>`;
    }).join("")}</ul>`;
    renderSnapDiff(list.find((s) => s.id === snapCompareId) || null);
  }

  function wireSnapshots() {
    const form = $("#snap-form");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="label"]');
      const list = loadSnaps();
      list.push({
        id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        ts: new Date().toISOString(),
        label: input ? input.value.trim() : "",
        state: JSON.parse(JSON.stringify(state)),
      });
      const kept = storeSnaps(list);
      if (input) input.value = "";
      snapCompareId = kept.length ? kept[kept.length - 1].id : null;
      renderSnapshots();
    });
    const box = $("#snap-list");
    if (box) box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b) return;
      const list = loadSnaps();
      const snap = list.find((s) => s.id === b.dataset.id);
      if (!snap) return;
      if (b.dataset.act === "diff") {
        snapCompareId = snapCompareId === snap.id ? null : snap.id;
        renderSnapshots();
      } else if (b.dataset.act === "restore") {
        if (!confirm(`Den Zeitstand „${snapLabel(snap)}“ wiederherstellen? `
          + "Die aktuellen Eingaben werden dabei ersetzt.")) return;
        state = deepMerge(defaultState(), migrate(JSON.parse(JSON.stringify(snap.state))));
        snapCompareId = null;
        saveNow();
        fullRebuild();
        navTo("kontrolle");
      } else if (b.dataset.act === "del") {
        if (!confirm(`Den Zeitstand „${snapLabel(snap)}“ löschen?`)) return;
        storeSnaps(list.filter((s) => s.id !== snap.id));
        if (snapCompareId === snap.id) snapCompareId = null;
        renderSnapshots();
      }
    });
    const diff = $("#snap-diff");
    if (diff) diff.addEventListener("click", (e) => {
      if (e.target.closest(".snap-close")) { snapCompareId = null; renderSnapshots(); }
    });
  }

  /* ---------- Fortschritts-Dashboard & Beispiel-Datensatz ---------- */
  const listHas = (obj) => Object.keys(obj || {}).some((k) => Array.isArray(obj[k]) && obj[k].length);
  const DASH = [
    { v: "abell", label: "Abell-Marktabgrenzung", has: () => listHas(state.abell) },
    { v: "stakeholder", label: "Stakeholder-Matrix", has: () => state.stakeholders.length > 0 },
    { v: "ziele", label: "SMART-Ziele", has: () => state.ziele.length > 0 },
    { v: "kennzahlen", label: "Kennzahlen", has: () => Object.values(state.kennzahlen).some((x) => String(x).trim() !== "") },
    { v: "pestel", label: "PESTEL", has: () => listHas(state.pestel) },
    { v: "forces", label: "Five Forces", has: () => FORCES.some((f) => state.forces[f.key].v !== 3 || (state.forces[f.key].note || "").trim()) },
    { v: "wettbewerb", label: "Wettbewerbsumfeld", has: () => state.wettbewerb.competitors.length > 0 },
    { v: "wertkette", label: "Wertkette", has: () => listHas(state.valuechain) },
    { v: "ansaetze", label: "VRIO-Check", has: () => state.vrio.length > 0 },
    { v: "szenario", label: "Szenario-Analyse", has: () => !!(state.szenario.frage || (state.szenario.factors || []).length || state.szenario.a || state.szenario.b) },
    { v: "swot", label: "SWOT", has: () => listHas(state.swot) },
    { v: "bcg", label: "BCG-Portfolio", has: () => state.bcg.length > 0 },
    { v: "strategietypen", label: "Ansoff-Matrix", has: () => listHas(state.ansoff) },
    { v: "strategiewahl", label: "Strategiewahl", has: () => state.strategiewahl.options.length > 0 },
    { v: "bmc", label: "Business Model Canvas", has: () => listHas(state.bmc) },
    { v: "bsc", label: "Balanced Scorecard", has: () => listHas(state.bsc) },
    { v: "kontrolle", label: "Frühwarn-/KPI-Tracker", has: () => state.kontrolle.indicators.length > 0 },
    { v: "dossier", label: "Fallstudien-Report", has: () => { const f = state.fallstudie; return !!(f.company || f.titel || Object.values(f.sections).some((x) => String(x).trim() !== "")); } },
  ];
  function renderDashboard() {
    const grid = $("#dash-grid"); if (!grid) return;
    const done = DASH.filter((d) => { try { return d.has(); } catch (e) { return false; } });
    $("#dash-count").textContent = `${done.length} / ${DASH.length}`;
    $("#dash-bar-fill").style.width = (done.length / DASH.length * 100) + "%";
    grid.innerHTML = "";
    DASH.forEach((d) => {
      let ok = false; try { ok = !!d.has(); } catch (e) {}
      const b = document.createElement("button");
      b.type = "button"; b.className = "dash-chip" + (ok ? " done" : "");
      b.innerHTML = `<span class="dot">${ok ? "✓" : ""}</span><span>${d.label}</span>`;
      b.addEventListener("click", () => navTo(d.v));
      grid.appendChild(b);
    });
    const cons = $("#dash-consistency");
    if (cons) cons.innerHTML = `<h4 class="dash-cons-head">Konsistenz-Check</h4>${consistencyHtml("dashboard")}`;
  }
  function sampleState() {
    const s = defaultState();
    s.abell.groups = ["Geschäftskunden (B2B)", "Privatkunden (B2C)"];
    s.abell.functions = ["Prozesse automatisieren", "Kosten senken"];
    s.abell.technologies = ["Cloud-Software", "Künstliche Intelligenz"];
    s.stakeholders = [
      { name: "Investor:innen", power: 5, interest: 3 }, { name: "Mitarbeitende", power: 3, interest: 5 },
      { name: "Kund:innen", power: 4, interest: 5 }, { name: "Regulierung", power: 4, interest: 2 }];
    s.ziele = [{ ziel: "Marktanteil steigern", s: "Marktanteil DACH auf 15 %", m: "Marktanteil in %", a: "sichert nachhaltiges Wachstum", r: "durch Ausbau des Vertriebs", t: "bis Ende 2027" }];
    s.kennzahlen = { ebit: "120", da: "40", umsatz: "800", nopat: "90", kapital: "600", wacc: "8" };
    s.pestel.political = [{ text: "Förderprogramme für Digitalisierung", sign: 1 }];
    s.pestel.economic = [{ text: "Möglicher Konjunkturabschwung", sign: -1 }];
    s.pestel.technological = [{ text: "Schnelle KI-Entwicklung", sign: 1 }];
    s.pestel.legal = [{ text: "Strengere Datenschutzauflagen", sign: -1 }];
    // Treiber-Ausprägungen (sehr niedrig 1 … sehr hoch 5); daraus wird die Kraft berechnet
    s.forces.rivalry = { v: 4, note: "Viele Anbieter, geringes Marktwachstum", drivers: [2, 4, 2, 4, 3] };
    s.forces.newEntrants = { v: 3, note: "", drivers: [3, 3, 3, 3, 3, 3, 3, 3] };
    s.forces.suppliers = { v: 2, note: "Standardkomponenten, viele Bezugsquellen", drivers: [2, 4, 4, 2, 2, 2] };
    s.forces.buyers = { v: 4, note: "Preissensible Großkunden", drivers: [5, 2, 2, 4, 2, 2] };
    s.forces.substitutes = { v: 3, note: "", drivers: [3, 3] };
    s.wettbewerb = { xLabel: "Preisniveau", yLabel: "Qualität / Leistung", competitors: [
      { name: "Wir", x: 6, y: 8, group: "Premium" }, { name: "Anbieter A", x: 7, y: 8, group: "Premium" },
      { name: "Anbieter B", x: 3, y: 4, group: "Discount" }, { name: "Anbieter C", x: 4, y: 3, group: "Discount" },
      { name: "Nischenanbieter", x: 9, y: 9, group: "Spezialist" }] };
    s.vrio = [
      { name: "Marke & Reputation", v: 1, r: 1, i: 1, o: 1 },
      { name: "Eigene KI-Modelle", v: 1, r: 1, i: 0, o: 1 },
      { name: "Standard-ERP-System", v: 1, r: 0, i: 0, o: 1 },
      { name: "Veraltete Legacy-Infrastruktur", v: 0, r: 0, i: 0, o: 0 }];
    s.valuechain.operations = [{ text: "Skalierbare, effiziente Produktion", sign: 1 }];
    s.valuechain.marketing = [{ text: "Starke Marke", sign: 1 }];
    s.valuechain.service = [{ text: "Überlasteter Kundensupport", sign: -1 }];
    s.valuechain.technology = [{ text: "Hohe F&E-Kompetenz", sign: 1 }];
    s.swot.strengths = ["Innovationskraft"];
    s.swot.weaknesses = ["Abhängigkeit von Schlüsselkunden"];
    s.bcg = [
      { name: "Produkt A", growth: 15, share: 2, revenue: 30 },
      { name: "Produkt B", growth: 4, share: 0.5, revenue: 12 },
      { name: "Produkt C", growth: 12, share: 0.6, revenue: 8 }];
    s.szenario = {
      frage: "Entwicklung des Kernmarkts bis 2030",
      factors: ["Regulierung", "KI-Adoption", "Konjunktur"],
      a: "Schnelle KI-Adoption und förderliche Regulierung treiben das Wachstum – früh investieren.",
      b: "Rezession und strenge Regulierung bremsen den Markt – Kosten sichern und flexibel bleiben.",
    };
    s.ansoff.durchdringung = ["Bestandskunden mit Rabatten binden"];
    s.ansoff.marktentwicklung = ["Expansion in neue Länder"];
    s.ansoff.produktentwicklung = ["KI-Funktionen ergänzen"];
    s.ansoff.diversifikation = ["Angrenzenden Servicemarkt erschließen"];
    s.strategiewahl = {
      criteria: [{ name: "Eignung", weight: 2 }, { name: "Akzeptanz", weight: 1 }, { name: "Machbarkeit", weight: 1 }],
      options: [
        { name: "Differenzierung durch KI-Funktionen", scores: [5, 4, 3] },
        { name: "Kostenführerschaft", scores: [3, 4, 4] },
        { name: "Expansion in neue Märkte", scores: [4, 3, 2] }],
    };
    s.bmc.partners = ["Cloud-Anbieter"]; s.bmc.activities = ["Softwareentwicklung"];
    s.bmc.resources = ["Entwicklungsteam", "Plattform"]; s.bmc.value = ["Zeitersparnis durch Automatisierung"];
    s.bmc.relationships = ["Self-Service", "Persönlicher Support"]; s.bmc.channels = ["Direktvertrieb", "Website"];
    s.bmc.segments = ["KMU", "Großunternehmen"]; s.bmc.costs = ["Personal", "Cloud-Infrastruktur"]; s.bmc.revenue = ["Software-Abonnement"];
    s.bsc.financial = [{ ziel: "Umsatz steigern", kennzahl: "Umsatzwachstum", zielwert: "+10 %", massnahme: "Vertrieb ausbauen" }];
    s.bsc.customer = [{ ziel: "Zufriedenheit erhöhen", kennzahl: "NPS", zielwert: "> 40", massnahme: "Support verbessern" }];
    s.bsc.process = [{ ziel: "Time-to-Market senken", kennzahl: "Releasezyklus", zielwert: "−20 %", massnahme: "CI/CD einführen" }];
    s.bsc.learning = [{ ziel: "Kompetenzen aufbauen", kennzahl: "Schulungstage/Jahr", zielwert: "5", massnahme: "Weiterbildungsprogramm" }];
    // Eigene Indikatoren; die vier BSC-Kennzahlen kommen automatisch per Sync dazu.
    s.kontrolle = { indicators: [
      { name: "Marktanteil DACH", target: "15 %", actual: "12 %", dir: "hoch", status: "amber" },
      { name: "Fluktuationsrate", target: "< 8 %", actual: "11 %", dir: "niedrig", status: "red" }],
      premises: {}, dismissed: [] };
    s.fallstudie = { company: "SAP SE", titel: "Strategische Analyse eines Unternehmens", gruppe: "",
      sections: { einleitung: "Diese Fallstudie analysiert Lage, Umfeld und Strategie des gewählten Unternehmens.", ueberblick: "", extern: "", intern: "", swotopt: "", diskussion: "", fazit: "" } };
    return s;
  }

  /* Beispiel-Datensatz für ein konkretes Unternehmen aus der Firmenbibliothek:
     Profil, Geschäftsfelder und Strategie stammen aus dem Firmenprofil (real,
     gerundet); die Analyse-Einträge und Kennzahlen-Verhältnisse sind bewusst
     einfache Übungsannahmen auf Basis des generischen Beispiels. */
  function companyShortName(c) {
    const legal = new Set(["AG", "SE", "S.A.", "SA", "PLC", "Inc.", "N.V.", "A/S", "Corporation", "Holding"]);
    const words = c.name.replace(/,.*$/, "").split(/\s+/).filter((w) => !legal.has(w));
    if (/^[A-Z0-9]{2,}$/.test(words[0])) return words[0];
    return words.slice(0, 2).join(" ");
  }
  function parseRevenueMio(rev) {
    const m = String(rev).replace(/\./g, "").match(/([\d,]+)\s*(Mrd|Mio)/);
    if (!m) return null;
    const num = parseFloat(m[1].replace(",", "."));
    return Math.round(m[2] === "Mrd" ? num * 1000 : num);
  }
  // Feste Positionsmuster für die Geschäftsfelder im BCG-Portfolio
  // (Star, Cash Cow, Question Mark, Dog, Mitte) – fiktive Übungswerte.
  const BCG_PATTERNS = [
    { growth: 12, share: 1.6, revenue: 35 },
    { growth: 3, share: 2.2, revenue: 45 },
    { growth: 15, share: 0.6, revenue: 12 },
    { growth: 2, share: 0.6, revenue: 8 },
    { growth: 8, share: 1.1, revenue: 18 },
  ];
  // Branchen-Vorlage (assets/sectors.js) für ein Unternehmen nachschlagen.
  function sectorTemplate(c) {
    const key = (window.TOOLKIT_SECTOR_OF || {})[c.name];
    return (key && (window.TOOLKIT_SECTOR_TEMPLATES || {})[key]) || null;
  }
  function companyState(c) {
    const s = sampleState();
    const short = companyShortName(c);
    s.fallstudie = {
      company: c.name, titel: `Strategische Analyse der ${c.name}`, gruppe: "",
      sections: {
        einleitung: `Diese Fallstudie analysiert Lage, Umfeld und Strategie der ${c.name}.`,
        ueberblick: fsProfileText(c), extern: "", intern: "", swotopt: "", diskussion: "", fazit: "",
      },
    };
    s.abell = {
      groups: [`Märkte/Kunden: ${c.markets}`],
      functions: c.fields.slice(0, 4),
      technologies: [`Kerntechnologien der Branche ${c.sector}`],
    };
    s.bcg = c.fields.slice(0, 5).map((f, i) => {
      const name = f.length > 22 ? f.slice(0, 21) + "…" : f;
      return Object.assign({ name }, BCG_PATTERNS[i % BCG_PATTERNS.length]);
    });
    s.ziele = [{
      ziel: `Strategischen Fokus von ${short} umsetzen`,
      s: c.strategy,
      m: "Umsatzwachstum und Marktanteile der Geschäftsfelder",
      a: "sichert die Wettbewerbsposition nachhaltig",
      r: "aufbauend auf vorhandenen Kernkompetenzen",
      t: "bis Ende 2028",
    }];
    s.szenario.frage = `Entwicklung der Branche ${c.sector} bis 2030`;
    s.wettbewerb.competitors = s.wettbewerb.competitors.map((x) =>
      x.name === "Wir" ? Object.assign({}, x, { name: short }) : x);
    s.vrio = [
      { name: `Marke & Reputation (${short})`, v: 1, r: 1, i: 1, o: 1 },
      { name: `Kompetenzen im Feld „${c.fields[0]}“`, v: 1, r: 1, i: 0, o: 1 },
      { name: "Standardisierte IT-Systeme", v: 1, r: 0, i: 0, o: 1 },
    ];
    // Branchenneutrale Optionen statt der SaaS-lastigen generischen Beispiele
    s.strategiewahl.options = [
      { name: `[Ist-Strategie] ${c.strategy}`, scores: [5, 4, 4] },
      { name: "Differenzierung über Innovation & Qualität", scores: [4, 4, 3] },
      { name: "Kostenführerschaft durch Effizienzprogramm", scores: [3, 4, 4] },
      { name: "Expansion in neue Märkte/Segmente", scores: [4, 3, 2] },
    ];
    s.bsc.process = [{ ziel: "Effizienz der Kernprozesse steigern", kennzahl: "Kosten je Einheit", zielwert: "−10 %", massnahme: "Prozess- & Automatisierungsprogramm" }];
    s.kontrolle.indicators[0].name = `Marktanteil ${s.bcg[0] ? s.bcg[0].name : "Kernsegment"}`;
    const u = parseRevenueMio(c.revenue);
    if (u) {
      s.kennzahlen = {
        ebit: String(Math.round(u * 0.12)), da: String(Math.round(u * 0.05)), umsatz: String(u),
        nopat: String(Math.round(u * 0.085)), kapital: String(Math.round(u * 0.7)), wacc: "8",
      };
    }
    // Branchen-Vorlage: PESTEL, Five Forces, Wertkette, SWOT, Szenario, Ansoff,
    // Stakeholder und BMC mit branchentypischen Übungsinhalten überschreiben.
    const asItems = (arr) => (arr || []).map(([text, sign]) => ({ text, sign }));
    const tpl = sectorTemplate(c);
    if (tpl) {
      s.pestel = emptyLists(PESTEL_CATS.map((x) => x.key));
      Object.keys(tpl.pestel || {}).forEach((k) => { s.pestel[k] = asItems(tpl.pestel[k]); });
      FORCES.forEach((f) => {
        const t = (tpl.forces || {})[f.key];
        if (!t) return;
        // Treiber so setzen, dass sich exakt die Ziel-Stärke der Kraft ergibt
        s.forces[f.key] = { v: t[0], note: t[1] || "", drivers: f.drivers.map((d) => (d[1] === "hoch" ? t[0] : 6 - t[0])) };
      });
      s.valuechain = emptyLists(VC_ALL.map((x) => x.key));
      Object.keys(tpl.valuechain || {}).forEach((k) => { s.valuechain[k] = asItems(tpl.valuechain[k]); });
      if (tpl.swot) {
        s.swot.strengths = (tpl.swot.strengths || []).slice();
        s.swot.weaknesses = (tpl.swot.weaknesses || []).slice();
        s.swot.opportunities = []; s.swot.threats = [];
      }
      if (tpl.szenario) {
        s.szenario.factors = tpl.szenario.factors.slice();
        s.szenario.a = tpl.szenario.a; s.szenario.b = tpl.szenario.b;
      }
      if (tpl.ansoff) Object.keys(tpl.ansoff).forEach((k) => { s.ansoff[k] = tpl.ansoff[k].slice(); });
      if (tpl.stakeholders) s.stakeholders = tpl.stakeholders.map((x) => ({ name: x[0], power: x[1], interest: x[2] }));
      if (tpl.bmc) {
        s.bmc = emptyLists(BMC_BLOCKS.map((x) => x.key));
        Object.keys(tpl.bmc).forEach((k) => { s.bmc[k] = tpl.bmc[k].slice(); });
      }
    }
    // Unternehmensindividuelle Ebene (assets/company-data.js) über der
    // Branchen-Vorlage: firmenspezifische SWOT, VRIO-Ressourcen, reale
    // Wettbewerber, zusätzliche PESTEL-Faktoren und BCG-Positionen.
    const ov = (window.TOOLKIT_COMPANY_DATA || {})[c.name];
    if (ov) {
      if (ov.pestel) Object.keys(ov.pestel).forEach((k) => {
        s.pestel[k] = (s.pestel[k] || []).concat(asItems(ov.pestel[k]));
      });
      if (ov.swot) {
        s.swot.strengths = ov.swot.strengths.slice();
        s.swot.weaknesses = ov.swot.weaknesses.slice();
      }
      if (ov.vrio) s.vrio = ov.vrio.map((x) => ({ name: x[0], v: x[1], r: x[2], i: x[3], o: x[4] }));
      if (ov.wettbewerb) s.wettbewerb = {
        xLabel: ov.wettbewerb.x, yLabel: ov.wettbewerb.y,
        competitors: ov.wettbewerb.wer.map((x) => ({ name: x[0], x: x[1], y: x[2], group: x[3] })),
      };
      if (ov.bcg) s.bcg = s.bcg.map((u, i) =>
        ov.bcg[i] ? { name: u.name, growth: ov.bcg[i][0], share: ov.bcg[i][1], revenue: ov.bcg[i][2] } : u);
    }
    return s;
  }

  /* ---------- Footer-Aktionen ---------- */
  function exportPdf() { navTo("dossier"); window.print(); }
  $("#btn-export").addEventListener("click", exportPdf);
  $("#btn-dossier-pdf").addEventListener("click", exportPdf);

  // Nach Reset/Import: dynamische Container leeren und neu aufbauen.
  function fullRebuild() {
    ["#pestel-root", "#vc-support", "#vc-primary", "#bmc-root", "#abell-root", "#szenario-root", "#ansoff-root"]
      .forEach((sel) => { const el = $(sel); if (el) el.innerHTML = ""; });
    initAll();
  }
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich alle Eingaben löschen?")) { state = defaultState(); saveNow(); fullRebuild(); }
  });

  // Projekt als JSON exportieren / importieren
  $("#btn-export-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "strategy-toolkit-projekt-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
  $("#btn-example").addEventListener("click", () => {
    const filled = DASH.filter((d) => { try { return d.has(); } catch (e) { return false; } }).length;
    const sel = $("#example-company");
    const comp = COMPANIES.find((c) => c.name === (sel ? sel.value : ""));
    const label = comp ? `die Beispieldaten für „${comp.name}“` : "den Beispiel-Datensatz";
    if (filled > 0 && !confirm(`Aktuelle Eingaben durch ${label} ersetzen?`)) return;
    state = comp ? companyState(comp) : sampleState();
    saveNow(); fullRebuild(); navTo("prozess");
  });
  $("#btn-import-json").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object") throw new Error("invalid");
        if (!isProjectData(data)) throw new Error("invalid");
        state = deepMerge(defaultState(), migrate(data)); saveNow(); fullRebuild();
        navTo("prozess");
      } catch (err) {
        alert("Import fehlgeschlagen: Das ist keine gültige Projektdatei.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { drawBCG(); drawStakeholder(); drawForcesRadar(); drawWaterfall(); drawWettbewerb(); });
  }
  window.addEventListener("resize", () => {
    if ($("#view-bcg").classList.contains("is-active")) drawBCG();
    if ($("#view-stakeholder").classList.contains("is-active")) drawStakeholder();
    if ($("#view-forces").classList.contains("is-active")) drawForcesRadar();
    if ($("#view-kennzahlen").classList.contains("is-active")) drawWaterfall();
    if ($("#view-wettbewerb").classList.contains("is-active")) drawWettbewerb();
  });

  function initAll() {
    SWOT_FIELDS.forEach(renderSwotList);
    renderTows();
    buildForces(); updateForcesResult();
    renderStkTable(); drawStakeholder();
    renderBcgTable(); drawBCG();
    setWbValues(); renderWbTable(); drawWettbewerb(); renderWbLegend();
    initListTool("#pestel-root", state.pestel, PESTEL_CATS,
      { sentiment: true, pos: "Chance", neg: "Risiko", onChange: refreshSwotDerived });
    initListTool("#vc-support", state.valuechain, VC_SUPPORT,
      { sentiment: true, pos: "Stärke", neg: "Schwäche", onChange: refreshSwotDerived });
    initListTool("#vc-primary", state.valuechain, VC_PRIMARY,
      { sentiment: true, pos: "Stärke", neg: "Schwäche", onChange: refreshSwotDerived });
    buildBMCTool();
    initListTool("#ansoff-root", state.ansoff, ANSOFF_CELLS);
    $$("#ansoff-root .list-card").forEach((el, i) => el.classList.add("ansoff-cell-" + i));
    syncKpiFromBsc();
    renderKpi();
    renderPraemissen();
    renderSnapshots();
    renderVrio();
    buildBSC();
    initListTool("#abell-root", state.abell, ABELL_CATS, { onChange: renderAbellAnchors });
    renderAbellAnchors();
    renderZiele();
    initListTool("#szenario-root", state.szenario, SZENARIO_CATS);
    setSzenarioValues();
    setKennzahlenValues();
    populateCompanySelect();
    setFallstudieValues();
    renderStrategiewahl();
    renderKnowledge();
    renderFlashcard();
    buildQuizFilter();
    renderQuiz();
    renderGlossar("");
    renderDashboard();
    refreshSwotDerived();
  }
  wireSwotForms();
  wireWettbewerb();
  wireKpi();
  wireSnapshots();
  wireVrio();
  wireSzenario();
  wireKennzahlen();
  wireFallstudie();
  wireStrategiewahl();
  wireFlashcards();
  wireQuiz();
  wireGlossar();
  initAll();
  // Startansicht aus dem URL-Hash (showView pflegt den Pager selbst).
  applyRoute();
})();
