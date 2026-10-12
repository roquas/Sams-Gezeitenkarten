# Sams-Gezeitenkarten – Spielversion 0.1

Spielbare modulare Fortsetzung von Prototyp 3.6. Der vorhandene Referenzfall
bleibt derselbe: sechs Etappen auf einer 5×5-Hexkarte mit sieben Hinweisen.

## Starten

Im Repository-Verzeichnis:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000/` öffnen. Native ES-Module benötigen einen HTTP-Server;
ein Doppelklick auf die HTML-Datei reicht nicht. Auf Uberspace werden `index.html`,
`src/`, `puzzles/`, `content/` und `assets/` (Seekarte und UI-Materialien) im selben Verhältnis
hochgeladen. Für das Spielen sind weder Node noch ein Buildschritt erforderlich.

## Spielen

Stunde 1–6 auswählen und Felder mit möglich, sicher oder ausgeschlossen markieren.
Die sechs Eckmarkierungen zeigen alle Stunden gleichzeitig. Mit dem Routenwerkzeug
vom Start aus sechs benachbarte Wasserfelder verbinden und „Route prüfen“ wählen.
Ein einzelner Hinweis steht im blätterbaren Bordbuch direkt unter der Seekarte.
Pfeile, Wischgesten oder die Links-/Rechts-Tasten wechseln den Hinweis; Antippen,
Enter oder Leertaste haken ihn ab. Zusätzliche Hinweise und Einstellungen stehen
in der separaten Hilfe; auf kleinen Displays öffnet „Hilfe“ die seitliche Ansicht. Notizen und Route werden lokal im Browser gespeichert.

Undo nimmt Bearbeitungen und Notizprüfungen zurück. Anzeigeoptionen, Navigation und
bezahlte Denkanstöße bleiben bestehen. Undo-Historie wird nicht gespeichert.
Spielstände von 3.6 werden nicht übernommen oder verändert.

## Tests

```sh
npm ci
npx playwright install chromium
npm run test:all
```

Node-Tests prüfen Regeln, Eindeutigkeit des Referenzfalls, Speicherung und Undo.
Playwright prüft Original 3.6 und Version 0.1 in Desktop- und Mobilansicht.
GitHub Actions führt beide Testgruppen nach Push und Pull Request aus.

## Aufbau und Entscheidungen

- `src/engine/`: vorhandene DOM-unabhängige Geometrie und Rätselregeln
- `puzzles/reference-3.6.mjs`: vorhandene versionierte Falldaten
- `src/ui/`: Bedienung, Kartendarstellung, Koordinaten und CSS
- `src/state/`, `src/persistence/`: Spielzustand, Undo und Speicherung
- `content/reference-3.6.mjs`: fallbezogene Hilfe und Kartenbeschriftung
- `prototypes/3.6/`: unverändertes Original mit Grafiken
- [Grafische Ausbaustufe und Prüfumfang #15–#17](docs/SEEKARTE-15-17.md)
- [Materialgestaltung, Browserbilder und Grenzen](docs/MATERIAL-DESIGN.md)
- [Umsetzung und Prüfstand 0.1](docs/IMPLEMENTATION-0.1.md)
- [Anforderungen](docs/REQUIREMENTS.md), [Entscheidungen](docs/DECISIONS.md)

Diese Version enthält einen festen Referenzfall. Generator, Tagesrätsel, Highscores
und Backend gehören zu späteren Schritten. Die Darstellung ist auf die bestehende
5×5-Karte und sechs Stunden ausgelegt; die Engine liest Sperrfelder und Orte aus
Falldaten. Das Repository bleibt privat; eine öffentliche Veröffentlichung erfolgt
hier nicht.
