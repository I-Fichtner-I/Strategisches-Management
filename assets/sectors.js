/* Branchen-Vorlagen für die Beispieldaten je Unternehmen.
   Beim Laden eines Firmen-Beispieldatensatzes werden PESTEL, Five Forces,
   Wertkette, SWOT, Szenario, Ansoff, Stakeholder und Business Model Canvas
   mit branchentypischen Übungsinhalten befüllt (fachlich plausible
   Lehrbeispiele, keine geprüften Unternehmensanalysen).
   Format: pestel/valuechain-Einträge als [Text, Vorzeichen] (+1 Chance/Stärke,
   -1 Risiko/Schwäche); forces als [Stärke 1-5, Begründung];
   stakeholders als [Name, Macht 1-5, Interesse 1-5]. */
window.TOOLKIT_SECTOR_OF = {
  "Infineon Technologies AG": "halbleiter",
  "NVIDIA Corporation": "halbleiter",
  "ASML Holding N.V.": "halbleiter",
  "Novartis AG": "pharma",
  "Novo Nordisk A/S": "pharma",
  "Sanofi": "pharma",
  "Bayer AG": "pharma",
  "SAP SE": "software",
  "Allianz SE": "finanz",
  "BNP Paribas S.A.": "finanz",
  "TotalEnergies SE": "energie",
  "Siemens Energy AG": "energie",
  "Schneider Electric SE": "energie",
  "Deutsche Telekom AG": "telekom",
  "Unilever PLC": "konsum",
  "LVMH Moët Hennessy-Louis Vuitton SE": "luxus",
  "Airbus SE": "aerodefense",
  "MTU Aero Engines AG": "aerodefense",
  "Rheinmetall AG": "aerodefense",
  "Tesla, Inc.": "mobilitaet",
};

window.TOOLKIT_SECTOR_TEMPLATES = {
  halbleiter: {
    pestel: {
      political: [["Exportkontrollen im Chip-Sektor (USA–China)", -1], ["Staatliche Chip-Subventionen (EU/US Chips Acts)", 1]],
      economic: [["Zyklische Halbleiternachfrage", -1], ["KI-Boom treibt Investitionen in Rechenzentren", 1]],
      social: [["Fachkräftemangel bei Ingenieur:innen", -1]],
      technological: [["Technologiesprünge bei KI-Chips und Fertigungsknoten", 1]],
      environmental: [["Hoher Energie- und Wasserbedarf der Fertigung", -1]],
      legal: [["IP-Schutz und Patentstreitigkeiten", -1]],
    },
    forces: {
      rivalry: [4, "Wenige globale Anbieter, hoher Innovations- und Preisdruck"],
      newEntrants: [1, "Extreme Kapital- und Know-how-Barrieren"],
      suppliers: [4, "Konzentrierte Zulieferer (Foundries, Spezialausrüstung)"],
      buyers: [3, "Großabnehmer mit Verhandlungsmacht, aber hohem Wechselaufwand (Design-Wins)"],
      substitutes: [2, "Kaum Substitute für Hochleistungshalbleiter"],
    },
    valuechain: {
      technology: [["Führende F&E- und Chipdesign-Kompetenz", 1]],
      operations: [["Kapitalintensive Fertigung mit Auslastungsrisiko", -1]],
      inbound: [["Abhängigkeit von wenigen Foundry-/Rohstoffpartnern", -1]],
      marketing: [["Langfristige Design-Win-Kundenbeziehungen", 1]],
    },
    swot: { strengths: ["Technologieführerschaft in Kernsegmenten"], weaknesses: ["Hohe Fixkosten und Zyklusabhängigkeit"] },
    szenario: {
      factors: ["Geopolitik & Exportkontrollen", "KI-/Elektrifizierungsnachfrage", "Kapazitätsauslastung"],
      a: "KI- und Elektrifizierungsnachfrage halten an, Kapazitäten bleiben ausgelastet, Subventionen senken Investitionsrisiken – Technologieführer bauen Marge und Marktanteil aus.",
      b: "Der Nachfragezyklus dreht, Exportkontrollen verschärfen sich, Überkapazitäten drücken die Preise – Investitionen müssen streng priorisiert werden.",
    },
    ansoff: {
      durchdringung: ["Design-Wins bei Bestandskunden ausbauen"],
      marktentwicklung: ["Neue Anwendungsfelder (Automotive, Industrie, Edge) erschließen"],
      produktentwicklung: ["Nächste Chip-Generation und Spezialprozesse"],
      diversifikation: ["Software- und Plattformgeschäft rund um die Hardware"],
    },
    stakeholders: [["Investor:innen", 5, 4], ["Großkunden (OEMs/Hyperscaler)", 5, 4], ["Regierungen (Exportkontrolle/Subventionen)", 5, 3], ["Ingenieur-Fachkräfte", 3, 5]],
    bmc: {
      partners: ["Foundries & Ausrüstungspartner"], value: ["Führende Chips für energieeffiziente und KI-Anwendungen"],
      segments: ["Automobil- & Industriekunden", "Rechenzentren/Hyperscaler"], channels: ["Direktvertrieb & Distributoren"],
      revenue: ["Produktverkauf & langlaufende Design-Wins"], costs: ["F&E", "Fertigungs-/Foundry-Kapazität"],
    },
  },

  pharma: {
    pestel: {
      political: [["Preisregulierung & Gesundheitsreformen (z. B. IRA in den USA)", -1]],
      economic: [["Alternde Bevölkerung erhöht die Nachfrage", 1]],
      social: [["Steigende Prävalenz chronischer Erkrankungen", 1]],
      technological: [["Biotech-Innovationen (mRNA, Zell-/Gentherapie, KI in der Forschung)", 1]],
      environmental: [["Strengere Umweltauflagen in der Wirkstoffproduktion", -1]],
      legal: [["Patentabläufe (Patentklippe) & Generika-Wettbewerb", -1], ["Strenge Zulassungsverfahren (EMA/FDA)", -1]],
    },
    forces: {
      rivalry: [4, "Wettbewerb um Indikationen und Pipeline-Erfolge"],
      newEntrants: [2, "Hohe F&E- und Zulassungsbarrieren; Biotech-Startups als Nische"],
      suppliers: [2, "Breite Zuliefererbasis, spezialisierte Auftragsfertiger teils knapp"],
      buyers: [4, "Kostenträger und Einkaufsgemeinschaften mit Preismacht"],
      substitutes: [3, "Generika und Biosimilars nach Patentablauf"],
    },
    valuechain: {
      technology: [["Starke F&E-Pipeline", 1]],
      operations: [["Komplexe, streng regulierte Produktion", -1]],
      marketing: [["Etablierter Marktzugang zu Ärzt:innen und Kostenträgern", 1]],
      outbound: [["Globale Distributions- und Kühlkettenlogistik", 1]],
    },
    swot: { strengths: ["Patentgeschützte umsatzstarke Produkte"], weaknesses: ["Abhängigkeit von wenigen Wirkstoffen"] },
    szenario: {
      factors: ["Preisregulierung", "Pipeline-Erfolge", "Patentabläufe"],
      a: "Die Pipeline liefert Zulassungen, neue Therapien kompensieren Patentabläufe, der Preisdruck bleibt moderat – Wachstum aus Innovation.",
      b: "Wichtige Studien scheitern, die Preisregulierung verschärft sich und Generika erodieren Umsätze – Kostenprogramme und Portfolio-Fokus nötig.",
    },
    ansoff: {
      durchdringung: ["Marktanteile in Kernindikationen ausbauen"],
      marktentwicklung: ["Zulassungen in weiteren Ländern und Indikationen"],
      produktentwicklung: ["Neue Wirkstoffe und Darreichungsformen"],
      diversifikation: ["Digital Health & Diagnostik"],
    },
    stakeholders: [["Zulassungsbehörden (EMA/FDA)", 5, 3], ["Kostenträger & Krankenkassen", 5, 4], ["Ärzt:innen & Patient:innen", 3, 5], ["Investor:innen", 5, 4]],
    bmc: {
      partners: ["Forschungskooperationen & Auftragsfertiger (CDMOs)"], value: ["Wirksame, zugelassene Therapien"],
      segments: ["Patient:innen (verschreibungspflichtig)", "Kostenträger & Kliniken"], channels: ["Außendienst, Kliniken & Apotheken"],
      revenue: ["Umsätze patentgeschützter Medikamente"], costs: ["F&E & klinische Studien", "Produktion & Vertrieb"],
    },
  },

  software: {
    pestel: {
      political: [["Digitalisierungsprogramme der öffentlichen Hand", 1]],
      economic: [["IT-Budgets folgen der Konjunktur", -1], ["Wachstum wiederkehrender Cloud-Umsätze", 1]],
      social: [["Fachkräftemangel in der IT", -1]],
      technological: [["Generative KI verändert Produkte und Entwicklung", 1]],
      environmental: [["Nachhaltigkeitsberichterstattung schafft Nachfrage nach Lösungen", 1]],
      legal: [["Datenschutz (DSGVO) & KI-Regulierung", -1]],
    },
    forces: {
      rivalry: [4, "Hyperscaler und Spezialanbieter drängen in den Markt"],
      newEntrants: [3, "SaaS senkt Eintrittsbarrieren, Skalierung bleibt schwer"],
      suppliers: [3, "Abhängigkeit von Hyperscaler-Infrastruktur"],
      buyers: [3, "Hohe Wechselkosten binden Bestandskunden"],
      substitutes: [3, "Eigenentwicklungen und Best-of-Breed-Lösungen"],
    },
    valuechain: {
      technology: [["Große Entwicklungsorganisation und Plattform", 1]],
      service: [["Migrationsprojekte binden Beratungskapazität", -1]],
      marketing: [["Installierte Basis und Partnernetz", 1]],
    },
    swot: { strengths: ["Hohe Wechselkosten und installierte Basis"], weaknesses: ["Komplexe Legacy-Produktlandschaft"] },
    szenario: {
      factors: ["Cloud-Adoption", "KI-Regulierung", "IT-Budgets"],
      a: "Die Cloud-Migration beschleunigt sich und KI-Funktionen monetarisieren die installierte Basis – wiederkehrende Umsätze wachsen zweistellig.",
      b: "IT-Budgets stagnieren, Kunden verschieben Migrationen und Hyperscaler erhöhen den Preisdruck – Wachstum verlangsamt sich.",
    },
    ansoff: {
      durchdringung: ["Cloud-Migration der Bestandskunden vorantreiben"],
      marktentwicklung: ["Mittelstand und neue Regionen erschließen"],
      produktentwicklung: ["KI-Assistenten und neue Module"],
      diversifikation: ["Angrenzende Plattform- und Datengeschäfte"],
    },
    stakeholders: [["Bestandskunden", 5, 5], ["Partner-Ökosystem", 3, 4], ["Investor:innen", 5, 4], ["Mitarbeitende (Entwicklung)", 3, 5]],
    bmc: {
      partners: ["Hyperscaler & Implementierungspartner"], value: ["Integrierte Geschäftsprozesse aus der Cloud"],
      segments: ["Großunternehmen", "Mittelstand"], channels: ["Direktvertrieb & Partnernetz"],
      revenue: ["Cloud-Abonnements (wiederkehrend)", "Support & Services"], costs: ["Entwicklung", "Cloud-Betrieb"],
    },
  },

  finanz: {
    pestel: {
      political: [["Geldpolitik bestimmt das Zinsumfeld", -1]],
      economic: [["Zinsniveau treibt Erträge", 1], ["Kapitalmarktvolatilität", -1]],
      social: [["Alternde Gesellschaft: wachsender Vorsorge- und Rentenbedarf", 1]],
      technological: [["Digitalisierung und KI in Vertrieb und Schaden-/Kreditprozessen", 1], ["Cyberrisiken", -1]],
      environmental: [["Klimarisiken erhöhen Schäden und Kreditausfälle", -1]],
      legal: [["Strenge Regulatorik (Solvency II, Basel)", -1]],
    },
    forces: {
      rivalry: [4, "Reifer Markt mit Preis- und Konditionenwettbewerb"],
      newEntrants: [3, "Fintechs und Insurtechs greifen einzelne Segmente an"],
      suppliers: [2, "Geringe Lieferantenmacht (Kapital, IT-Dienstleister)"],
      buyers: [4, "Hohe Preistransparenz durch Vergleichsportale"],
      substitutes: [3, "Kapitalmarktprodukte und Selbstversicherung"],
    },
    valuechain: {
      marketing: [["Starke Vertriebsnetze und Marke", 1]],
      operations: [["Altsysteme erhöhen die Prozesskosten", -1]],
      technology: [["Datenbasis für Risikomodelle und Pricing", 1]],
    },
    swot: { strengths: ["Kapitalstärke und Diversifikation"], weaknesses: ["Komplexe Konzern- und Systemlandschaft"] },
    szenario: {
      factors: ["Zinsniveau", "Regulatorik", "Klima-/Schadenrisiken"],
      a: "Auskömmliche Zinsen, stabile Kapitalmärkte und beherrschbare Schadenjahre – Erträge und Solvenzquoten steigen.",
      b: "Zinsen fallen, Großschäden und strengere Kapitalanforderungen treffen zusammen – Ergebnis und Ausschüttungsspielraum sinken.",
    },
    ansoff: {
      durchdringung: ["Cross-Selling im Bestand erhöhen"],
      marktentwicklung: ["Wachstumsmärkte und neue Kundengruppen"],
      produktentwicklung: ["Digitale, modulare Produkte"],
      diversifikation: ["Asset Management und Vorsorgeplattformen ausbauen"],
    },
    stakeholders: [["Aufsicht (BaFin/EZB/EIOPA)", 5, 3], ["Kund:innen", 4, 4], ["Investor:innen", 5, 4], ["Ratingagenturen", 4, 3]],
    bmc: {
      partners: ["Rückversicherer & Vertriebspartner"], value: ["Absicherung von Risiken und Vermögensaufbau"],
      segments: ["Privatkunden", "Firmenkunden & Institutionelle"], channels: ["Agenturen, Makler & digitale Kanäle"],
      revenue: ["Prämien & Provisionen", "Kapitalerträge & Management-Fees"], costs: ["Schäden & Leistungen", "Vertrieb & Verwaltung"],
    },
  },

  energie: {
    pestel: {
      political: [["Energiewende-Politik und Förderprogramme", 1], ["Geopolitische Versorgungsrisiken", -1]],
      economic: [["Volatile Energie- und Rohstoffpreise", -1], ["Investitionswelle in Netze, Speicher und Rechenzentren", 1]],
      social: [["Gesellschaftlicher Druck zur Dekarbonisierung", 1]],
      technological: [["Erneuerbare, Speicher und Elektrifizierung", 1]],
      environmental: [["CO₂-Bepreisung verteuert fossile Geschäftsmodelle", -1]],
      legal: [["Langwierige Genehmigungsverfahren", -1]],
    },
    forces: {
      rivalry: [3, "Wenige Systemanbieter, Wettbewerb über Technologie und Preis"],
      newEntrants: [2, "Hohe Kapitalintensität und Referenzanforderungen"],
      suppliers: [4, "Engpässe bei Komponenten und Fachkräften in der Lieferkette"],
      buyers: [3, "Großprojekte über Ausschreibungen mit Preisdruck"],
      substitutes: [3, "Technologiewechsel von fossil zu erneuerbar"],
    },
    valuechain: {
      operations: [["Große Projekt- und Fertigungskapazitäten", 1], ["Projektrisiken bei Großaufträgen", -1]],
      technology: [["Technologieportfolio für die Energiewende", 1]],
      service: [["Langfristiges Service- und Wartungsgeschäft", 1]],
    },
    swot: { strengths: ["Volle Auftragsbücher im Energiewende-Geschäft"], weaknesses: ["Margendruck in der Projektabwicklung"] },
    szenario: {
      factors: ["Energiepreise", "Ausbau- und Genehmigungstempo", "Lieferketten"],
      a: "Netz- und Erneuerbaren-Ausbau beschleunigen sich, Lieferketten stabilisieren sich – Auftragsbestände werden profitabel abgearbeitet.",
      b: "Genehmigungen stocken, Kosteninflation und Lieferengpässe belasten Projekte – Margen und Cashflow geraten unter Druck.",
    },
    ansoff: {
      durchdringung: ["Service- und Modernisierungsgeschäft im Bestand"],
      marktentwicklung: ["Wachstumsregionen und neue Kundensegmente (z. B. Rechenzentren)"],
      produktentwicklung: ["Speicher, Elektrolyse und Netztechnologien"],
      diversifikation: ["Energie-Dienstleistungen und Software"],
    },
    stakeholders: [["Regulierungsbehörden", 5, 3], ["Versorger & Großkunden", 4, 4], ["Investor:innen", 5, 4], ["Anwohner & NGOs", 2, 5]],
    bmc: {
      partners: ["EPC-Partner & Zulieferer"], value: ["Zuverlässige, zunehmend CO₂-arme Energieversorgung"],
      segments: ["Versorger & Netzbetreiber", "Industrie & Rechenzentren"], channels: ["Projektgeschäft & Ausschreibungen"],
      revenue: ["Anlagenverkauf & Langfristverträge", "Service"], costs: ["Material & Fertigung", "Projektabwicklung"],
    },
  },

  telekom: {
    pestel: {
      political: [["Frequenzvergaben und Ausbau-Auflagen", -1]],
      economic: [["Stetig wachsender Datenverkehr", 1], ["Preiswettbewerb in gesättigten Kernmärkten", -1]],
      social: [["Homeoffice und Streaming erhöhen den Konnektivitätsbedarf", 1]],
      technological: [["5G, Glasfaser und Edge-Dienste", 1]],
      environmental: [["Energieverbrauch der Netze", -1]],
      legal: [["Regulierung von Entgelten und Netzzugängen", -1]],
    },
    forces: {
      rivalry: [4, "Intensiver Preiskampf um Bestandskunden"],
      newEntrants: [2, "Netzinfrastruktur als hohe Eintrittsbarriere"],
      suppliers: [3, "Wenige globale Netzausrüster"],
      buyers: [4, "Geringe Wechselkosten und hohe Vergleichbarkeit"],
      substitutes: [2, "Kaum Alternativen zu Konnektivität"],
    },
    valuechain: {
      infrastructure: [["Netzqualität und Infrastruktur als Kernasset", 1]],
      service: [["Servicekosten im Massengeschäft", -1]],
      marketing: [["Starke Marke und Kundenbasis", 1]],
    },
    swot: { strengths: ["Führende Netzinfrastruktur"], weaknesses: ["Hoher Investitionsbedarf (Capex)"] },
    szenario: {
      factors: ["Regulierung", "Ausbautempo Glasfaser/5G", "Preiswettbewerb"],
      a: "Netzausbau monetarisiert sich über Premium-Tarife und B2B-Dienste, Konsolidierung entspannt den Preiswettbewerb.",
      b: "Regulierung drückt Entgelte, Discounter erhöhen den Preisdruck, hohe Ausbaukosten treffen auf stagnierende Umsätze.",
    },
    ansoff: {
      durchdringung: ["Konvergenzbündel (Mobilfunk + Festnetz + TV)"],
      marktentwicklung: ["B2B-Segmente und neue Regionen"],
      produktentwicklung: ["Edge-, IoT- und Sicherheitsdienste"],
      diversifikation: ["Digitale Plattform- und Infrastrukturdienste"],
    },
    stakeholders: [["Bundesnetzagentur", 5, 3], ["Privat- & Geschäftskunden", 4, 4], ["Investor:innen", 5, 4], ["Kommunen (Ausbau)", 3, 4]],
    bmc: {
      partners: ["Netzausrüster & Content-Partner"], value: ["Zuverlässige Konnektivität (Mobilfunk, Glasfaser)"],
      segments: ["Privatkunden", "Geschäftskunden"], channels: ["Shops, Online & Hotline"],
      revenue: ["Monatliche Tarife (wiederkehrend)"], costs: ["Netzausbau & -betrieb", "Frequenzlizenzen"],
    },
  },

  konsum: {
    pestel: {
      political: [["Handelspolitik und Zölle", -1]],
      economic: [["Kaufkraftdruck stärkt Handelsmarken", -1], ["Wachstum in Schwellenländern", 1]],
      social: [["Trend zu Gesundheit und Nachhaltigkeit", 1]],
      technological: [["E-Commerce und Direct-to-Consumer", 1]],
      environmental: [["Verpackungs- und Lieferkettenauflagen", -1]],
      legal: [["Kennzeichnungs- und Werberegulierung", -1]],
    },
    forces: {
      rivalry: [4, "Markenwettbewerb und Handelsmarken drücken Preise"],
      newEntrants: [3, "D2C-Marken über Online-Kanäle"],
      suppliers: [3, "Schwankende Agrar-Rohstoffpreise"],
      buyers: [4, "Konzentrierter Einzelhandel mit Listungsmacht"],
      substitutes: [3, "Private Labels als günstige Alternative"],
    },
    valuechain: {
      marketing: [["Starkes Markenportfolio", 1]],
      procurement: [["Abhängigkeit von Agrar-Rohstoffen", -1]],
      outbound: [["Globale Distribution", 1]],
    },
    swot: { strengths: ["Markenstärke und globale Präsenz"], weaknesses: ["Margendruck durch Handelsmacht"] },
    szenario: {
      factors: ["Kaufkraft", "Rohstoffkosten", "Nachhaltigkeitsregulierung"],
      a: "Kaufkraft erholt sich, Preiserhöhungen halten, Premium- und Nachhaltigkeitsmarken wachsen überdurchschnittlich.",
      b: "Konsumenten wechseln zu Handelsmarken, Rohstoffkosten steigen, der Handel setzt Konditionen durch – Margen schrumpfen.",
    },
    ansoff: {
      durchdringung: ["Kernmarken mit Innovation und Werbung stärken"],
      marktentwicklung: ["Expansion in Schwellenländern"],
      produktentwicklung: ["Gesündere und nachhaltigere Varianten"],
      diversifikation: ["Angrenzende Kategorien über Zukäufe"],
    },
    stakeholders: [["Handelsketten", 5, 4], ["Konsument:innen", 3, 5], ["Investor:innen", 5, 4], ["Lieferanten (Agrar)", 3, 3]],
    bmc: {
      partners: ["Handelsketten & Lieferanten"], value: ["Vertraute Marken für den täglichen Bedarf"],
      segments: ["Konsument:innen weltweit", "Einzelhandel als Absatzmittler"], channels: ["Einzelhandel & E-Commerce"],
      revenue: ["Produktverkäufe über den Handel"], costs: ["Rohstoffe & Produktion", "Marketing"],
    },
  },

  luxus: {
    pestel: {
      political: [["Zölle und Reiserestriktionen treffen Touristenkäufe", -1]],
      economic: [["Abhängigkeit vom Konsum in China und den USA", -1], ["Wachsende globale Wohlstandsschicht", 1]],
      social: [["Statuskonsum und Erlebnisorientierung", 1]],
      technological: [["Digitale Kanäle und Personalisierung", 1]],
      environmental: [["Nachhaltigkeitserwartungen an Materialien und Lieferkette", -1]],
      legal: [["Produktpiraterie und Markenschutz", -1]],
    },
    forces: {
      rivalry: [3, "Wenige Luxuskonzerne, Wettbewerb über Begehrlichkeit statt Preis"],
      newEntrants: [2, "Markenaufbau dauert Jahrzehnte"],
      suppliers: [2, "Vertikale Integration sichert Handwerks- und Materialzugang"],
      buyers: [2, "Hohe Zahlungsbereitschaft, geringe Preismacht Einzelner"],
      substitutes: [3, "Premium-Marken und Second-Hand-Markt"],
    },
    valuechain: {
      marketing: [["Ikonische Marken und Storytelling", 1]],
      procurement: [["Kontrolle über Manufakturen und Materialien", 1]],
      outbound: [["Selektiver Vertrieb über eigene Boutiquen", 1]],
      hr: [["Abhängigkeit von Kreativtalenten", -1]],
    },
    swot: { strengths: ["Preissetzungsmacht durch Exklusivität"], weaknesses: ["Abhängigkeit von wenigen Flaggschiff-Marken"] },
    szenario: {
      factors: ["Konsumklima China/USA", "Markenbegehrlichkeit", "Nachhaltigkeitsdruck"],
      a: "Der Luxuskonsum wächst weltweit weiter, Preiserhöhungen werden akzeptiert, neue Kundengruppen kommen über Einstiegsprodukte.",
      b: "Luxusnachfrage in Kernmärkten kühlt ab, aspirative Käufer fallen weg – Exklusivität muss gegen Umsatzdruck verteidigt werden.",
    },
    ansoff: {
      durchdringung: ["Bestandskund:innen über Clienteling binden"],
      marktentwicklung: ["Neue Regionen und Reise-Einzelhandel"],
      produktentwicklung: ["Neue Kollektionen und Einstiegskategorien"],
      diversifikation: ["Hospitality und Erlebniswelten"],
    },
    stakeholders: [["Kund:innen (vermögend)", 4, 5], ["Kreativdirektor:innen & Talente", 4, 4], ["Investor:innen", 5, 3], ["Handelspartner (Travel Retail)", 3, 3]],
    bmc: {
      partners: ["Ateliers, Manufakturen & Kreative"], value: ["Exklusivität, Handwerkskunst und Markenerlebnis"],
      segments: ["Wohlhabende Kund:innen", "Aspirative Käufer (Einstiegsprodukte)"], channels: ["Eigene Boutiquen & selektiver Vertrieb"],
      revenue: ["Hochmargige Produktverkäufe"], costs: ["Handwerk & Material", "Markeninszenierung & Retail"],
    },
  },

  aerodefense: {
    pestel: {
      political: [["Steigende Verteidigungsbudgets (NATO-Ziele)", 1], ["Exportgenehmigungen für Rüstungsgüter", -1]],
      economic: [["Volle Auftragsbücher mit langen Zyklen", 1]],
      social: [["Fachkräftebedarf in der Fertigung", -1]],
      technological: [["Neue Antriebe und Dekarbonisierung des Fliegens", 1]],
      environmental: [["Emissionsdruck auf die Luftfahrt", -1]],
      legal: [["Strenge Zertifizierung (EASA/FAA)", -1]],
    },
    forces: {
      rivalry: [2, "Duopol- bzw. Oligopolstrukturen mit langen Programmen"],
      newEntrants: [1, "Extreme Zertifizierungs- und Kapitalbarrieren"],
      suppliers: [4, "Engpässe bei Triebwerken und Strukturkomponenten"],
      buyers: [4, "Wenige Großkunden (Airlines, Staaten) mit Verhandlungsmacht"],
      substitutes: [2, "Kaum Alternativen; Bahn nur auf Kurzstrecken"],
    },
    valuechain: {
      operations: [["Produktionshochlauf als Engpass", -1]],
      technology: [["Zertifizierte Systemkompetenz", 1]],
      service: [["Lukratives Wartungs- und Servicegeschäft (MRO)", 1]],
    },
    swot: { strengths: ["Jahrzehntelange Auftragsreichweite"], weaknesses: ["Lieferketten- und Hochlaufrisiken"] },
    szenario: {
      factors: ["Verteidigungsbudgets", "Lieferketten", "Flugverkehrswachstum"],
      a: "Budgets und Flugverkehr wachsen, Lieferketten stabilisieren sich – Auslieferungen und Service skalieren planmäßig.",
      b: "Lieferengpässe verzögern Programme, Kosteninflation drückt Margen, politische Exporthürden bremsen Aufträge.",
    },
    ansoff: {
      durchdringung: ["Auslieferungsraten bestehender Programme erhöhen"],
      marktentwicklung: ["Neue Exportmärkte und Partnernationen"],
      produktentwicklung: ["Effizientere Antriebe und neue Varianten"],
      diversifikation: ["Raumfahrt-, Digital- und Servicegeschäfte"],
    },
    stakeholders: [["Staaten & Streitkräfte", 5, 4], ["Airlines & Leasinggeber", 5, 4], ["Zulassungsbehörden (EASA/FAA)", 5, 3], ["Zulieferer", 3, 4]],
    bmc: {
      partners: ["Triebwerks- & Systemzulieferer"], value: ["Zertifizierte Flugzeuge/Systeme mit langfristiger Wartung"],
      segments: ["Airlines & Leasinggesellschaften", "Staaten & Streitkräfte"], channels: ["Direktvertrieb & Regierungsaufträge"],
      revenue: ["Auslieferungen & Langfristaufträge", "Wartung & Service (MRO)"], costs: ["Entwicklung & Zertifizierung", "Fertigung & Lieferkette"],
    },
  },

  mobilitaet: {
    pestel: {
      political: [["Auslaufende E-Auto-Förderungen", -1], ["Emissionsvorgaben treiben die Elektrifizierung", 1]],
      economic: [["Preiswettbewerb im E-Auto-Markt", -1]],
      social: [["Wachsende Akzeptanz der E-Mobilität", 1]],
      technological: [["Sinkende Batteriekosten und autonomes Fahren", 1]],
      environmental: [["Rohstoffabhängigkeit (Lithium) und Batterierecycling", -1]],
      legal: [["Zulassung autonomer Fahrfunktionen", -1]],
    },
    forces: {
      rivalry: [5, "Etablierte OEMs und chinesische Hersteller drängen massiv in den Markt"],
      newEntrants: [3, "Hoher Kapitalbedarf, aber staatlich geförderte Newcomer"],
      suppliers: [3, "Batteriezellen und Rohstoffe als Engpass"],
      buyers: [4, "Hohe Preistransparenz, sinkende Markenloyalität"],
      substitutes: [3, "ÖPNV, Sharing und andere Antriebe"],
    },
    valuechain: {
      technology: [["Software- und Batteriekompetenz", 1]],
      operations: [["Skalierte, hochautomatisierte Werke", 1], ["Qualitäts- und Servicekapazität", -1]],
      outbound: [["Direktvertrieb ohne Händlernetz", 1]],
    },
    swot: { strengths: ["Integriertes Ökosystem aus Fahrzeug, Software und Laden"], weaknesses: ["Abhängigkeit vom Kerngeschäft Fahrzeugverkauf"] },
    szenario: {
      factors: ["E-Auto-Nachfrage", "Preiswettbewerb", "Autonomes Fahren (Regulierung)"],
      a: "E-Mobilität wächst weiter, Software- und Energiegeschäft monetarisieren die Flotte, autonome Funktionen werden zugelassen.",
      b: "Preiskrieg und Förderstopp drücken Margen, autonome Funktionen verzögern sich – Kostenführerschaft entscheidet.",
    },
    ansoff: {
      durchdringung: ["Preis-/Leasingoffensiven für Volumenmodelle"],
      marktentwicklung: ["Neue Länder und Flottenkunden"],
      produktentwicklung: ["Neue Modelle, Robotaxi und Energieprodukte"],
      diversifikation: ["Energie-Speicher und KI-Dienstleistungen"],
    },
    stakeholders: [["Kund:innen & Community", 4, 5], ["Regulierer (autonomes Fahren)", 5, 3], ["Investor:innen", 5, 4], ["Batterie- & Rohstofflieferanten", 4, 3]],
    bmc: {
      partners: ["Batterie- & Rohstoffpartner"], value: ["Elektrische Fahrzeuge mit Software-Ökosystem"],
      segments: ["Privat- & Flottenkunden"], channels: ["Direktvertrieb online & eigene Stores"],
      revenue: ["Fahrzeugverkäufe", "Software, Dienste & Energieprodukte"], costs: ["Batterien & Fertigung", "Ladeinfrastruktur"],
    },
  },
};
