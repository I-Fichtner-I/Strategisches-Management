# Strategy Toolkit – Strategisches Management

Ein interaktives Web-Werkzeug, das zentrale Methoden des strategischen Managements
anwendbar macht. Läuft vollständig im Browser – ohne Installation und ohne Server –
und lässt sich direkt über **GitHub Pages** veröffentlichen.

## Werkzeuge

| Werkzeug | Was es tut |
|----------|-----------|
| **SWOT-Analyse** | Stärken, Schwächen, Chancen und Risiken erfassen; leitet automatisch die vier **TOWS-Normstrategien** (SO / ST / WO / WT) ab. |
| **Porters Five Forces** | Die fünf Wettbewerbskräfte bewerten und daraus die **Branchenattraktivität** berechnen. |
| **BCG-Portfolio** | Geschäftseinheiten nach Marktwachstum und relativem Marktanteil positionieren (Blasengröße = Umsatz), inkl. Stars / Question Marks / Cash Cows / Dogs. |

Alle Eingaben werden automatisch im Browser gespeichert (localStorage) und lassen
sich als PDF exportieren.

## Nutzung

Lokal: `index.html` im Browser öffnen.

Online (GitHub Pages): In den Repository-Einstellungen unter **Settings → Pages**
als Quelle den Branch mit diesem Stand und den Ordner `/root` wählen. Die Seite ist
danach unter `https://<user>.github.io/Strategisches-Management/` erreichbar.

## Projektstruktur

```
├── index.html          Oberfläche & Navigation
├── assets/
│   ├── style.css       Gestaltung (inkl. Dark Mode)
│   └── app.js          Logik: SWOT, Five Forces, BCG-Portfolio
└── README.md
```

---

## Fachlicher Hintergrund – Inhalte des Moduls

Die Werkzeuge orientieren sich an den Inhalten des Moduls *Strategisches Management*.

### 1 Einführung in das Strategische Management

### 2 Ansätze des Strategischen Managements
- 2.1 Marktorientierter Ansatz (*Market-based View*)
- 2.2 Ressourcenbasierter Ansatz (*Resource-based View*)
- 2.3 Wissensbasierter Ansatz (*Knowledge-based View*)
- 2.4 Wertorientierter Ansatz (*Value-based View*)

### 3 Strategische Zielplanung
- 3.1 Stakeholder des Unternehmens
- 3.2 Zielhierarchie, Zielfunktionen und Zielbeziehungen
- 3.3 Finanzielle Ziele im Strategischen Management
- 3.4 Strategische Geschäftseinheiten und Geschäftsfelder

### 4 Strategische Analyse und Prognose
- 4.1 Analyse der Umwelt
  - 4.1.1 Globale Umwelt
  - 4.1.2 Branchenstruktur
  - 4.1.3 Wettbewerbsumfeld
- 4.2 Analyse des Unternehmens
- 4.3 Simultane Analyse des Unternehmens und der Umwelt

### 5 Strategieformulierung und -bewertung
- 5.1 Typen von Strategien
- 5.2 Bewertung und Auswahl von Strategien

### 6 Strategieentwicklung, -implementierung und Strategische Kontrolle
- 6.1 Strategieentwicklung – Das Business Model Canvas
- 6.2 Umsetzung und Durchsetzung von Strategien
- 6.3 Strategische Kontrolle und Frühaufklärung
