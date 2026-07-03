/* Strategy Toolkit – Werkzeuge für das strategische Management
   Reiner Client, Persistenz über localStorage. */
(function () {
  "use strict";

  const STORE_KEY = "strategy-toolkit-v1";
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

  const defaultState = () => ({
    swot: emptyLists(["strengths", "weaknesses", "opportunities", "threats"]),
    forces: {
      rivalry: { v: 3, note: "" }, newEntrants: { v: 3, note: "" },
      suppliers: { v: 3, note: "" }, buyers: { v: 3, note: "" }, substitutes: { v: 3, note: "" },
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
      company: "", titel: "", gruppe: "", ki: "", sources: [],
      sections: { einleitung: "", ueberblick: "", extern: "", intern: "", swotopt: "", diskussion: "", fazit: "" },
    },
    strategiewahl: {
      criteria: [
        { name: "Eignung", weight: 1 },
        { name: "Akzeptanz", weight: 1 },
        { name: "Machbarkeit", weight: 1 },
      ],
      options: [],
    },
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return deepMerge(defaultState(), JSON.parse(raw));
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
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ---------- Wissensbasis (Theorie & Leitfragen je Werkzeug) ---------- */
  const KB = {
    abell: {
      def: "Die Marktabgrenzung nach <strong>Abell</strong> definiert den relevanten Markt nicht über Produkte, sondern über den gestifteten Nutzen – dreidimensional entlang von Kundengruppen (<em>wer</em>), Kundenfunktionen/Bedürfnissen (<em>was</em>) und Technologien (<em>wie</em>). So wird bewusst festgelegt, wie breit oder eng der Markt gefasst wird.",
      vorgehen: ["Kundengruppen bestimmen (Wer wird bedient?)", "Kundenfunktionen/Bedürfnisse bestimmen (Welches Problem wird gelöst?)", "Technologien bestimmen (Womit wird der Nutzen erbracht?)", "Kombinationen betrachten und Markt bewusst breit oder eng abgrenzen"],
      leitfragen: ["Wer sind die relevanten Kundengruppen?", "Welche Funktionen/Bedürfnisse erfüllen wir?", "Mit welchen (alternativen) Technologien?", "Wie verändert sich der Markt bei breiterer/engerer Abgrenzung?"],
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
      leitfragen: ["Wie stark ist jede der fünf Kräfte (siehe Checkliste)?", "Welche Kraft dominiert und warum?", "Wie könnte sich die Branchenstruktur künftig verändern?", "Welche strategischen Konsequenzen ergeben sich?"],
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
      leitfragen: ["Sind Fachbegriffe präzise definiert?", "Sind alle Quellen korrekt zitiert (wörtlich & sinngemäß)?", "Ist der Text klar strukturiert und aufs Wesentliche fokussiert?", "Ist die KI-Nutzung dokumentiert und sind Aussagen belegt?"],
    },
  };

  // Checkliste: Wann ist eine Wettbewerbskraft STARK? (Ausprägung der Treiber)
  const FORCES_CHECKLIST = [
    { force: "Bedrohung durch neue Anbieter", note: "stark, wenn die Markteintrittsbarrieren niedrig sind", drivers: [
      ["Skaleneffekte (Economies of Scale)", "niedrig"], ["Produktdifferenzierung", "niedrig"], ["Kapitalbedarf", "niedrig"],
      ["Wechselkosten", "niedrig"], ["Kontrolle der Vertriebskanäle durch Etablierte", "niedrig"],
      ["Geschütztes Wissen der Etablierten", "niedrig"], ["Zugang der Etablierten zu Rohstoffen", "niedrig"], ["Zugang zu staatlichen Subventionen", "niedrig"],
    ]},
    { force: "Verhandlungsmacht der Abnehmer", note: "stark, wenn Abnehmer Druck ausüben können", drivers: [
      ["Konzentration der Abnehmer (relativ zu Anbietern)", "hoch"], ["Wechselkosten der Abnehmer", "niedrig"],
      ["Produktdifferenzierung der Anbieter", "niedrig"], ["Drohung der Rückwärtsintegration durch Abnehmer", "hoch"],
      ["Gewinnsituation der Abnehmer", "niedrig"], ["Bedeutung des Inputs für die Qualität des Abnehmerprodukts", "niedrig"],
    ]},
    { force: "Verhandlungsmacht der Lieferanten", note: "stark, wenn Lieferanten Druck ausüben können", drivers: [
      ["Konzentration der Lieferanten (relativ zur Abnehmerbranche)", "hoch"], ["Verfügbarkeit von Substituten", "niedrig"],
      ["Bedeutung des Kunden für den Lieferanten", "niedrig"], ["Differenzierung der Lieferantenprodukte", "hoch"],
      ["Wechselkosten des Abnehmers", "hoch"], ["Drohung der Vorwärtsintegration durch Lieferanten", "hoch"],
    ]},
    { force: "Bedrohung durch Ersatzprodukte", note: "stark, wenn attraktive Substitute existieren", drivers: [
      ["Differenzierung/Attraktivität des Substituts", "hoch"], ["Verbesserungsrate des Preis-Leistungs-Verhältnisses des Substituts", "hoch"],
    ]},
    { force: "Rivalität unter Wettbewerbern", note: "stark, wenn der Verdrängungswettbewerb intensiv ist", drivers: [
      ["Anzahl der Wettbewerber", "hoch"], ["Branchenwachstum", "niedrig"], ["Fixkosten", "hoch"], ["Lagerkosten", "hoch"],
      ["Produktdifferenzierung", "niedrig"], ["Wechselkosten", "niedrig"], ["Austrittsbarrieren", "hoch"], ["Strategische Bedeutung des Geschäfts", "hoch"],
    ]},
  ];

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

  function renderForcesChecklist() {
    const box = $("#forces-checklist"); if (!box) return;
    box.innerHTML = `<details class="kb"><summary>Checkliste: Wann ist eine Wettbewerbskraft stark?</summary><div class="kb-body">${
      FORCES_CHECKLIST.map((f) => `<div class="cl-force"><h4>${f.force}</h4><p class="cl-note">${f.note}:</p><ul class="cl-list">${
        f.drivers.map((d) => `<li><span>${d[0]}</span><span class="cl-val cl-${d[1]}">${d[1]}</span></li>`).join("")
      }</ul></div>`).join("")
    }</div></details>`;
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
    { v: "fallstudie", t: "Fallstudien-Report" },
    { v: "quiz", t: "Selbsttest" },
    { v: "dossier", t: "Strategie-Dossier" },
  ];
  function setNavActive(el) {
    $$("#nav .nav-item").forEach((i) => i.classList.remove("is-active"));
    if (el) el.classList.add("is-active");
  }
  function navTo(view) {
    showView(view);
    setNavActive($(`#nav .nav-item[data-view="${view}"]`));
  }
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
    if (name === "strategiewahl") renderStrategiewahl();
    if (name === "dossier") buildDossier();
    updatePager(name);
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const sidebar = $("#sidebar");
  function closeSidebarOnMobile() {
    if (sidebar && window.matchMedia("(max-width: 900px)").matches) sidebar.classList.remove("open");
  }
  $("#nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    setNavActive(btn);
    showView(btn.dataset.view, btn.dataset.anchor);
    closeSidebarOnMobile();
  });
  const navToggle = $("#nav-toggle");
  if (navToggle) navToggle.addEventListener("click", () => sidebar && sidebar.classList.toggle("open"));
  ["#pager-prev", "#pager-next"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", () => { if (el.dataset.view) { navTo(el.dataset.view); closeSidebarOnMobile(); } });
  });
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) {
      e.preventDefault();
      showView(g.dataset.goto);
      setNavActive($(`#nav .nav-item[data-view="${g.dataset.goto}"]`));
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
      const form = document.createElement("form");
      form.className = "add-form";
      form.innerHTML = '<input type="text" placeholder="Hinzufügen …" /><button type="submit">+</button>';

      const render = () => {
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
      card.append(h, ul, form);
      root.appendChild(card);
      render();
    });
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
     Wertkette (+/–) → Stärken/Schwächen, PESTEL (+/–) → Chancen/Risiken,
     Five Forces stark (≥4) → Risiko, schwach (≤2) → Chance. */
  const VC_ALL = VC_SUPPORT.concat(VC_PRIMARY);
  function derivedSwot() {
    const S = [], W = [], O = [], T = [];
    VC_ALL.forEach((c) => (state.valuechain[c.key] || []).forEach((it) => {
      if (!it || typeof it !== "object") return;
      if (it.sign > 0) S.push(it.text); else if (it.sign < 0) W.push(it.text);
    }));
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

  /* ---------- Five Forces ---------- */
  const FORCES = [
    { key: "rivalry", label: "Rivalität unter Wettbewerbern", short: "Wettbewerbsrivalität" },
    { key: "newEntrants", label: "Bedrohung durch neue Anbieter", short: "Bedrohung durch neue Anbieter" },
    { key: "suppliers", label: "Verhandlungsmacht der Lieferanten", short: "Lieferantenmacht" },
    { key: "buyers", label: "Verhandlungsmacht der Abnehmer", short: "Abnehmermacht" },
    { key: "substitutes", label: "Bedrohung durch Ersatzprodukte", short: "Bedrohung durch Ersatzprodukte" },
  ];
  function buildForces() {
    const box = $("#forces-list"); box.innerHTML = "";
    FORCES.forEach((f) => {
      const cur = state.forces[f.key];
      const el = document.createElement("div");
      el.className = "force";
      el.innerHTML = `
        <div class="force-top"><h3>${f.label}</h3><span class="force-val" id="val-${f.key}">${cur.v}</span></div>
        <input type="range" min="1" max="5" step="1" value="${cur.v}" aria-label="${f.label}" />
        <div class="scale-hint"><span>1 – schwach</span><span>5 – stark</span></div>
        <textarea placeholder="Begründung / Notizen …">${escapeHtml(cur.note || "")}</textarea>`;
      const range = el.querySelector("input");
      const ta = el.querySelector("textarea");
      range.addEventListener("input", () => {
        state.forces[f.key].v = Number(range.value);
        $("#val-" + f.key).textContent = range.value; save(); updateForcesResult();
      });
      ta.addEventListener("input", () => { state.forces[f.key].note = ta.value; save(); });
      box.appendChild(el);
    });
  }
  function updateForcesResult() {
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
    refreshSwotDerived();
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
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
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
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
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
  function swNormalize() {
    const st = state.strategiewahl;
    const n = st.criteria.length;
    st.options.forEach((o) => {
      if (!Array.isArray(o.scores)) o.scores = [];
      while (o.scores.length < n) o.scores.push(3);
      if (o.scores.length > n) o.scores.length = n;
    });
  }
  function swTotals() {
    const st = state.strategiewahl;
    const wsum = st.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
    return st.options.map((o) => wsum ? o.scores.reduce((s, v, i) => s + (Number(v) || 0) * (Number(st.criteria[i].weight) || 0), 0) / wsum : 0);
  }
  function renderStrategiewahl() {
    const st = state.strategiewahl; swNormalize();
    const sug = $("#sw-suggest");
    const existing = new Set(st.options.map((o) => o.name));
    const avail = computeTowsOptions().map((o) => `[${o.g}] ${o.t}`).filter((n) => !existing.has(n)).slice(0, 8);
    sug.innerHTML = avail.length ? '<span class="sw-sug-label">Aus TOWS übernehmen:</span>'
      + avail.map((n, i) => `<button type="button" class="sw-chip" data-i="${i}">+ ${escapeHtml(n)}</button>`).join("") : "";
    $$(".sw-chip", sug).forEach((b) => b.addEventListener("click", () => {
      st.options.push({ name: avail[+b.dataset.i], scores: st.criteria.map(() => 3) }); save(); renderStrategiewahl();
    }));

    const tbl = $("#sw-matrix");
    if (!st.options.length) {
      tbl.innerHTML = '<tbody><tr><td class="sw-empty">Noch keine Optionen – oben aus TOWS übernehmen oder eigene hinzufügen.</td></tr></tbody>';
      return;
    }
    const totals = swTotals();
    const best = Math.max.apply(null, totals);
    const head = "<thead><tr><th>Option</th>" + st.criteria.map((c, ci) =>
      `<th class="sw-crit"><span class="sw-cname">${escapeHtml(c.name)}</span>`
      + `<span class="sw-w">Gew. <input type="number" min="0" step="1" value="${c.weight}" data-crit="${ci}" class="sw-weight" /></span>`
      + `<button type="button" class="sw-critdel" data-crit="${ci}" aria-label="Kriterium entfernen">×</button></th>`).join("")
      + "<th>Nutzwert</th><th></th></tr></thead>";
    const body = "<tbody>" + st.options.map((o, oi) => {
      const cells = st.criteria.map((c, ci) => `<td><select class="sw-score" data-opt="${oi}" data-crit="${ci}">`
        + [1, 2, 3, 4, 5].map((v) => `<option value="${v}"${Number(o.scores[ci]) === v ? " selected" : ""}>${v}</option>`).join("")
        + "</select></td>").join("");
      const isBest = totals[oi] === best && best > 0;
      return `<tr class="${isBest ? "sw-best" : ""}"><td class="sw-optname">${escapeHtml(o.name)}${isBest ? ' <span class="badge ok">Top</span>' : ""}</td>`
        + `${cells}<td class="sw-total">${totals[oi].toFixed(2)}</td>`
        + `<td><button type="button" class="sw-optdel" data-opt="${oi}" aria-label="Option entfernen">×</button></td></tr>`;
    }).join("") + "</tbody>";
    tbl.innerHTML = head + body;
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
  const WORDS_PER_PAGE = 450;

  function countWords(s) { return ((s || "").trim().match(/\S+/g) || []).length; }

  function populateCompanySelect() {
    const sel = $("#fs-company-select");
    if (!sel || sel.dataset.filled) return;
    COMPANIES.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.name; o.textContent = c.name; sel.appendChild(o);
    });
    sel.dataset.filled = "1";
  }

  function renderFsProfile() {
    const box = $("#fs-profile");
    const c = COMPANIES.find((x) => x.name === state.fallstudie.company);
    if (!c) { box.innerHTML = ""; return; }
    box.innerHTML = `
      <div class="fs-profile-head"><h3>${escapeHtml(c.name)}</h3>
        <button type="button" id="fs-apply" class="primary-btn">Als Unternehmensüberblick übernehmen</button></div>
      <dl class="fs-dl">
        <div><dt>Rechtsform</dt><dd>${escapeHtml(c.legal)}</dd></div>
        <div><dt>Sitz</dt><dd>${escapeHtml(c.hq)}</dd></div>
        <div><dt>Branche</dt><dd>${escapeHtml(c.sector)}</dd></div>
        <div><dt>Geschäftsfelder</dt><dd>${c.fields.map(escapeHtml).join(", ")}</dd></div>
        <div><dt>Märkte</dt><dd>${escapeHtml(c.markets)}</dd></div>
        <div><dt>Umsatz</dt><dd>${escapeHtml(c.revenue)} <span class="fs-fy">(${escapeHtml(c.fy)})</span></dd></div>
        <div><dt>Mitarbeitende</dt><dd>${escapeHtml(c.employees)}</dd></div>
        <div><dt>Strategie</dt><dd>${escapeHtml(c.strategy)}</dd></div>
      </dl>
      <p class="fs-note">Kennzahlen sind gerundete Näherungswerte – im Bericht mit aktuellem Geschäftsbericht belegen und zitieren.</p>`;
    $("#fs-apply").addEventListener("click", () => {
      const text = `${c.name} (${c.legal}, Sitz: ${c.hq}) ist in der Branche ${c.sector} tätig. `
        + `Geschäftsfelder: ${c.fields.join(", ")}. Märkte: ${c.markets}. `
        + `Größe: Umsatz ${c.revenue}, ${c.employees} Mitarbeitende (${c.fy}). `
        + `Strategischer Fokus: ${c.strategy}`;
      const ta = $("#fs-sec-ueberblick");
      if (ta.value.trim() && !confirm("Den vorhandenen Unternehmensüberblick überschreiben?")) return;
      ta.value = text; state.fallstudie.sections.ueberblick = text; save(); updateFsCounter();
    });
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
      ta.addEventListener("input", () => { state.fallstudie.sections[s.key] = ta.value; save(); updateFsCounter(); });
      lab.appendChild(ta); wrap.appendChild(lab); root.appendChild(wrap);
    });
    root.dataset.built = "1";
  }

  function updateFsCounter() {
    const words = FS_SECTIONS.reduce((sum, s) => sum + countWords(state.fallstudie.sections[s.key]), 0);
    const pages = words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_PAGE));
    $("#fs-counter").innerHTML = `≈ <strong>${pages}</strong> Seiten · ${words} Wörter`;
  }

  function wireFallstudie() {
    const sel = $("#fs-company-select");
    sel.addEventListener("change", () => { state.fallstudie.company = sel.value; save(); renderFsProfile(); });
    $("#fs-titel").addEventListener("input", (e) => { state.fallstudie.titel = e.target.value; save(); });
    $("#fs-gruppe").addEventListener("input", (e) => { state.fallstudie.gruppe = e.target.value; save(); });
    $("#fs-ki").addEventListener("input", (e) => { state.fallstudie.ki = e.target.value; save(); });
    buildFsSections();
  }

  function setFallstudieValues() {
    $("#fs-company-select").value = state.fallstudie.company || "";
    $("#fs-titel").value = state.fallstudie.titel || "";
    $("#fs-gruppe").value = state.fallstudie.gruppe || "";
    $("#fs-ki").value = state.fallstudie.ki || "";
    FS_SECTIONS.forEach((s) => { const ta = $("#fs-sec-" + s.key); if (ta) ta.value = state.fallstudie.sections[s.key] || ""; });
    renderFsProfile();
    updateFsCounter();
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
    { q: "Wodurch ist das strategische Management vor allem gekennzeichnet?", o: ["Fokus auf die langfristige Existenzsicherung des Unternehmens", "Steuerung der täglichen Liquidität", "Kurzfristige Umsatzmaximierung", "Ausschließlich interne Betrachtung"], c: 0, e: "Strategisches Management sichert langfristig Existenz und Erfolg; operatives Management ist kurz-/mittelfristig und intern orientiert." },
    { q: "Über welche drei Dimensionen grenzt das Abell-Schema einen Markt ab?", o: ["Preis, Menge, Qualität", "Kundengruppen, Kundenfunktionen, Technologien", "Stärken, Schwächen, Chancen", "Politik, Ökonomie, Technologie"], c: 1, e: "Abell definiert den Markt über Wer (Kundengruppen), Was (Kundenfunktionen) und Wie (Technologien)." },
    { q: "Die Bedrohung durch neue Anbieter ist tendenziell hoch, wenn …", o: ["die Skaleneffekte hoch sind", "der Kapitalbedarf hoch ist", "die Skaleneffekte niedrig sind", "die Wechselkosten hoch sind"], c: 2, e: "Niedrige Markteintrittsbarrieren (z. B. geringe Skaleneffekte, geringer Kapitalbedarf, niedrige Wechselkosten) erhöhen die Bedrohung durch neue Anbieter." },
    { q: "Ein Geschäft mit hohem Marktwachstum und niedrigem relativem Marktanteil ist im BCG-Portfolio ein …", o: ["Star", "Cash Cow", "Dog", "Question Mark"], c: 3, e: "Hohes Wachstum + niedriger Anteil = Question Mark (Fragezeichen); Investition oder Rückzug ist zu prüfen." },
    { q: "Was besagt die TOWS-Strategie „SO“?", o: ["Stärken nutzen, um Chancen zu ergreifen", "Schwächen abbauen, um Chancen zu nutzen", "Stärken nutzen, um Risiken abzuwehren", "Schwächen und Risiken begrenzen"], c: 0, e: "SO = Strengths × Opportunities: eigene Stärken einsetzen, um externe Chancen zu nutzen (Ausbaustrategie)." },
    { q: "Wann ist der Economic Value Added (EVA) positiv?", o: ["Wenn der Umsatz steigt", "Wenn der NOPAT die Kapitalkosten übersteigt", "Wenn das EBIT positiv ist", "Wenn die Abschreibungen sinken"], c: 1, e: "EVA = NOPAT − (Kapital × WACC). Positiv, wenn der operative Gewinn nach Steuern über den Kapitalkosten liegt." },
    { q: "Wie berechnet sich das EBITDA?", o: ["Umsatz − alle Kosten", "EBIT − Steuern", "EBIT + Abschreibungen und Amortisation", "NOPAT + Zinsen"], c: 2, e: "EBITDA = EBIT zzgl. Abschreibungen und Amortisation – zeigt die operative Ertragskraft unabhängig von der Abschreibungspolitik." },
    { q: "Wofür steht das „A“ in SMART?", o: ["Absolut", "Attraktiv/akzeptiert", "Analytisch", "Aktuell"], c: 1, e: "SMART = Spezifisch, Messbar, Attraktiv/akzeptiert, Realistisch, Terminiert." },
    { q: "Der Resource-based View erklärt Wettbewerbsvorteile primär durch …", o: ["die Attraktivität der Branche", "die Marktpositionierung", "interne Ressourcen und Kernkompetenzen", "staatliche Subventionen"], c: 2, e: "Der RBV ist inside-out: einzigartige, wertvolle Ressourcen und Kernkompetenzen begründen dauerhafte Vorteile." },
    { q: "Welche ist KEINE Perspektive der Balanced Scorecard?", o: ["Finanzperspektive", "Kundenperspektive", "Lieferantenperspektive", "Lern- und Entwicklungsperspektive"], c: 2, e: "Die vier BSC-Perspektiven sind Finanzen, Kunden, interne Prozesse sowie Lernen & Entwicklung." },
    { q: "Ein Stakeholder mit hoher Macht, aber geringem Interesse sollte …", o: ["eng gemanagt werden", "zufrieden gehalten werden", "nur beobachtet werden", "ignoriert werden"], c: 1, e: "Hohe Macht / geringes Interesse → „Zufrieden halten“, um Widerstand zu vermeiden." },
    { q: "Was ist das zentrale Ziel der Szenario-Analyse?", o: ["Eine einzige exakte Prognose zu erstellen", "Mehrere plausible, konsistente Zukunftsbilder zu entwickeln", "Den Marktanteil zu berechnen", "Kennzahlen zu vergleichen"], c: 1, e: "Die Szenario-Analyse spannt mit mehreren konsistenten Zukunftsbildern (z. B. Best/Worst Case) den Möglichkeitsraum auf." },
  ];

  // Lernkarten
  let fcIndex = 0;
  function renderFlashcard() {
    const card = FLASHCARDS[fcIndex];
    $("#fc-front-text").textContent = card[0];
    $("#fc-back-text").textContent = card[1];
    $("#flashcard").classList.remove("flipped");
    $("#fc-count").textContent = `${fcIndex + 1} / ${FLASHCARDS.length}`;
  }
  function wireFlashcards() {
    const fc = $("#flashcard");
    fc.addEventListener("click", () => fc.classList.toggle("flipped"));
    fc.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fc.classList.toggle("flipped"); } });
    $("#fc-prev").addEventListener("click", () => { fcIndex = (fcIndex - 1 + FLASHCARDS.length) % FLASHCARDS.length; renderFlashcard(); });
    $("#fc-next").addEventListener("click", () => { fcIndex = (fcIndex + 1) % FLASHCARDS.length; renderFlashcard(); });
  }

  // Quiz
  function renderQuiz() {
    const list = $("#quiz-list");
    list.innerHTML = "";
    $("#quiz-total").textContent = QUIZ.length;
    $("#quiz-score").textContent = "0";
    let score = 0;
    const answered = new Array(QUIZ.length).fill(false);
    QUIZ.forEach((item, qi) => {
      const card = document.createElement("div");
      card.className = "quiz-card";
      const h = document.createElement("h3");
      h.textContent = `${qi + 1}. ${item.q}`;
      const opts = document.createElement("div");
      opts.className = "quiz-opts";
      item.o.forEach((opt, oi) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "quiz-opt"; b.textContent = opt;
        b.addEventListener("click", () => {
          if (answered[qi]) return;
          answered[qi] = true;
          const buttons = $$(".quiz-opt", opts);
          buttons.forEach((btn, bi) => {
            btn.disabled = true;
            if (bi === item.c) btn.classList.add("correct");
          });
          if (oi === item.c) { b.classList.add("correct"); score++; $("#quiz-score").textContent = String(score); }
          else b.classList.add("wrong");
          const ex = document.createElement("p");
          ex.className = "quiz-explain";
          ex.textContent = (oi === item.c ? "Richtig. " : "Nicht ganz. ") + item.e;
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
    $("#quiz-mode").addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn"); if (!btn) return;
      $$(".mode-btn").forEach((m) => m.classList.toggle("is-active", m === btn));
      const mode = btn.dataset.mode;
      $("#mode-cards").classList.toggle("is-active", mode === "cards");
      $("#mode-quiz").classList.toggle("is-active", mode === "quiz");
    });
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

  function buildDossier() {
    const root = $("#dossier-root");
    const esc = escapeHtml;
    const parts = [];
    const now = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
    parts.push(`<header class="dossier-head"><h1>Strategie-Dossier</h1><p class="dossier-date">Erstellt am ${now}</p></header>`);

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
    const fsWords = FS_SECTIONS.reduce((sum, s) => sum + countWords(fs.sections[s.key]), 0);
    const fsHasContent = fs.company || fs.titel || fsWords > 0;
    if (fsHasContent) {
      const meta = `${fs.titel ? `<p class="dossier-kpi">Titel: <strong>${esc(fs.titel)}</strong></p>` : ""}`
        + `${fs.company ? `<p class="dossier-kpi">Unternehmen: <strong>${esc(fs.company)}</strong></p>` : ""}`
        + `${fs.gruppe ? `<p class="dossier-kpi">Gruppe: ${esc(fs.gruppe)}</p>` : ""}`;
      const body = FS_SECTIONS.map((s) => fs.sections[s.key]
        ? `<h3 class="dossier-sub">${s.label}</h3><p class="fs-report-text">${esc(fs.sections[s.key]).replace(/\n/g, "<br>")}</p>` : "").join("");
      const src = (fs.sources && fs.sources.length) ? `<h3 class="dossier-sub">Quellenverzeichnis</h3>${ulOf(fs.sources)}` : "";
      const ki = fs.ki ? `<h3 class="dossier-sub">Dokumentation der KI-Nutzung</h3><p class="fs-report-text">${esc(fs.ki).replace(/\n/g, "<br>")}</p>` : "";
      const cnt = `<p class="dossier-kpi">Umfang: ≈ ${fsWords === 0 ? 0 : Math.max(1, Math.round(fsWords / WORDS_PER_PAGE))} Seiten · ${fsWords} Wörter</p>`;
      parts.push(section("Fallstudien-Report", meta + cnt + body + src + ki));
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
    parts.push(section("Porters Five Forces", forcesTbl));

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
    const kInner = anyK ? `<table class="dossier-table"><tbody>
        <tr><td>EBITDA</td><td>${fmtNum(kEbitda)} Mio. €</td></tr>
        <tr><td>EBITDA-Marge</td><td>${kMarge == null ? "–" : fmtNum(kMarge) + " %"}</td></tr>
        <tr><td>Kapitalkosten</td><td>${fmtNum(kKk)} Mio. €</td></tr>
        <tr><td>EVA</td><td>${fmtNum(kEva)} Mio. €${kEva == null ? "" : (kEva >= 0 ? " (Wert geschaffen)" : " (Wert vernichtet)")}</td></tr>
      </tbody></table>` : empty;
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

    // Strategiewahl (Nutzwertanalyse)
    const sw = state.strategiewahl;
    if (sw.options.length) {
      swNormalize();
      const totals = swTotals();
      const order = sw.options.map((o, i) => ({ name: o.name, t: totals[i] })).sort((a, b) => b.t - a.t);
      const critLabel = sw.criteria.map((c) => `${esc(c.name)} (×${c.weight})`).join(", ");
      const rows = order.map((r, idx) => `<tr><td>${idx + 1}</td><td>${esc(r.name)}</td><td>${r.t.toFixed(2)}</td></tr>`).join("");
      parts.push(section("Strategiewahl (Nutzwertanalyse)",
        `<p class="dossier-kpi">Kriterien: ${critLabel}</p><table class="dossier-table"><thead><tr><th>Rang</th><th>Option</th><th>Nutzwert</th></tr></thead><tbody>${rows}</tbody></table>`));
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

    root.innerHTML = parts.join("");
  }

  // Zeichnet ein Canvas und bindet es als statisches Bild in das Dossier ein.
  function chartImg(sel, drawFn) {
    const canvas = $(sel); if (!canvas) return "";
    try { drawFn(); return `<img class="dossier-chart" alt="Diagramm" src="${canvas.toDataURL("image/png")}" />`; }
    catch (e) { return ""; }
  }

  /* ---------- Footer-Aktionen ---------- */
  function exportPdf() { showView("dossier"); window.print(); }
  $("#btn-export").addEventListener("click", exportPdf);
  $("#btn-dossier-pdf").addEventListener("click", exportPdf);

  // Nach Reset/Import: dynamische Container leeren und neu aufbauen.
  function fullRebuild() {
    ["#pestel-root", "#vc-support", "#vc-primary", "#bmc-root", "#abell-root", "#szenario-root", "#fs-sources"]
      .forEach((sel) => { const el = $(sel); if (el) el.innerHTML = ""; });
    initAll();
  }
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Wirklich alle Eingaben löschen?")) { state = defaultState(); save(); fullRebuild(); }
  });

  // Projekt als JSON exportieren / importieren
  $("#btn-export-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "strategy-toolkit-projekt.json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
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
        state = deepMerge(defaultState(), data); save(); fullRebuild();
        showView("prozess"); setNavActive($('#nav .nav-item[data-view="prozess"]'));
      } catch (err) {
        alert("Import fehlgeschlagen: Das ist keine gültige Projektdatei.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  });

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { drawBCG(); drawStakeholder(); });
  }
  window.addEventListener("resize", () => {
    if ($("#view-bcg").classList.contains("is-active")) drawBCG();
    if ($("#view-stakeholder").classList.contains("is-active")) drawStakeholder();
  });

  function initAll() {
    SWOT_FIELDS.forEach(renderSwotList);
    renderTows();
    buildForces(); updateForcesResult();
    renderStkTable(); drawStakeholder();
    renderBcgTable(); drawBCG();
    initListTool("#pestel-root", state.pestel, PESTEL_CATS,
      { sentiment: true, pos: "Chance", neg: "Risiko", onChange: refreshSwotDerived });
    initListTool("#vc-support", state.valuechain, VC_SUPPORT,
      { sentiment: true, pos: "Stärke", neg: "Schwäche", onChange: refreshSwotDerived });
    initListTool("#vc-primary", state.valuechain, VC_PRIMARY,
      { sentiment: true, pos: "Stärke", neg: "Schwäche", onChange: refreshSwotDerived });
    initListTool("#bmc-root", state.bmc, BMC_BLOCKS);
    buildBSC();
    initListTool("#abell-root", state.abell, ABELL_CATS);
    renderZiele();
    initListTool("#szenario-root", state.szenario, SZENARIO_CATS);
    setSzenarioValues();
    setKennzahlenValues();
    populateCompanySelect();
    initListTool("#fs-sources", state.fallstudie, [{ key: "sources", label: "Quellenverzeichnis" }]);
    setFallstudieValues();
    renderStrategiewahl();
    renderKnowledge();
    renderForcesChecklist();
    renderFlashcard();
    renderQuiz();
    refreshSwotDerived();
  }
  wireSwotForms();
  wireSzenario();
  wireKennzahlen();
  wireFallstudie();
  wireStrategiewahl();
  wireFlashcards();
  wireQuiz();
  initAll();
  updatePager("prozess");
})();
