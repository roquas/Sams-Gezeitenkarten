# Sams-Gezeitenkarten – Spielversion 0.1

Spielbare modulare Fortsetzung von Prototyp 3.6. Der vorhandene Referenzfall
bleibt erhalten: sechs Etappen auf einer 5×5-Hexkarte mit sieben Hinweisen.
Unter „Einstellungen“ sind außerdem „Die Quittung von Nombreo“, „Das doppelte
Ankerbuch“ und ein ausdrücklich gekennzeichneter technischer Testfall auswählbar.
Spielstände werden pro Rätsel und Datenversion getrennt gespeichert.

## Starten

Im Repository-Verzeichnis:

```sh
python3 scripts/dev-server.py
```

Dann `http://localhost:8000/` öffnen. Der Entwicklungsserver deaktiviert den
HTTP-Cache für **HTML, ES-Module, CSS, JSON und Grafiken** und antwortet selbst
auf eine ältere `If-Modified-Since`-Anfrage mit der aktuellen Datei statt mit
einem irreführenden `304 Not Modified`. Wenn schon der alte Server läuft,
diesen zuerst mit `Ctrl+C` beenden. Funktionstest: `python3 scripts/dev-server.py
--self-test`.

Der private Browsermodus setzt außerdem gespeicherten **Rätselstand** und
**Rahmenwahl** zurück. Wer Unterschiede nur im Privatfenster sieht, sollte
darum auch die URL (`?frame=quiet` oder `?frame=final`) und gespeicherte
Einstellungen prüfen. Bei zuvor bereits gecachten Dateien kann einmalig
`Entwickler → Caches leeren` nötig sein; danach verhindert der neue
lokale Server erneute veraltete HTTP-Antworten. Zum Test auf einem anderen
Gerät im vertrauenswürdigen Heimnetz kann man `--host 0.0.0.0` angeben.

Das beiliegende `.htaccess` sorgt beim Uberspace-/Apache-Deployment während
der iterativen Entwicklung für **bedingte Neuvalidierung** statt
unkontrolliertem Cache; unveränderte große Grafiken können weiter als
`304 Not Modified` bestätigt werden. Bei späterer Versionierung mit
gehashten Dateinamen können die Grafiken langfristig gecacht werden.
Für andere Webserver müssen entsprechende HTTP-Header konfiguriert werden.

Native ES-Module benötigen einen HTTP-Server;
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
in der separaten Hilfe; auf kleinen Displays wechselt „Seekarte | Logbuch“ am unteren Rand zwischen Karte und vollständiger Hinweisübersicht. Notizen und Route werden lokal im Browser gespeichert.

Undo nimmt Bearbeitungen und Notizprüfungen zurück. Anzeigeoptionen, Navigation und
bezahlte Denkanstöße bleiben bestehen. Undo-Historie wird nicht gespeichert.
Spielstände von 3.6 werden nicht übernommen oder verändert.

## Tests

```sh
npm ci
npx playwright install chromium
npm run test:all
npx playwright install webkit
npx playwright test --config playwright.webkit.config.mjs
```

Node-Tests prüfen Regeln, Eindeutigkeit des Referenzfalls, Speicherung und Undo.
Playwright prüft Original 3.6 und Version 0.1 in Desktop- und Mobilansicht.
GitHub Actions prüft Unit-Tests, Rätselvalidierung, Assets, Chromium, WebKit
und das entpackte Deployment-ZIP bei Pull Requests und Pushes auf main.

Ein direkt verwendbares statisches Paket erzeugt `sh scripts/package.sh` unter
`dist/Sams-Gezeitenkarten.zip`; dabei werden ES-Module für MIME-kritische
Webserver nach `.js` umbenannt. Details: [Deployment](docs/DEPLOYMENT.md),
[Konsolidierung und Sichtprüfung von PR #48](docs/PR48-CONSOLIDATION.md).

## Aufbau und Entscheidungen

- `src/engine/`: vorhandene DOM-unabhängige Geometrie und Rätselregeln
- `puzzles/reference-3.6.mjs`: vorhandene versionierte Falldaten
- `src/ui/`: Bedienung, Kartendarstellung, Koordinaten und CSS
- `src/state/`, `src/persistence/`: Spielzustand, Undo und Speicherung
- `content/reference-3.6.mjs`: fallbezogene Hilfe und Kartenbeschriftung
- `prototypes/3.6/`: unverändertes Original mit Grafiken
- [Grafische Ausbaustufe und Prüfumfang #15–#17](docs/SEEKARTE-15-17.md)
- [Aktuelle sechs Layout-Feinabstimmungen und Prüfbilder](docs/LAYOUT-POLISH.md)
- [Spielregeln und letzter Instrumenten-Feinschliff (#31, #32)](docs/RULES-FINAL-POLISH.md)
- [Aktuelle abschließende GUI-Abnahme: unabhängiges Radar, responsive Leiste und Lektorat](docs/GUI-FINAL-REVIEW.md)
- [Koordinaten, Kartenlabels und mobile Ansichten #26/#27/#29](docs/CHART-UX-26-27-29.md)
- [Materialgestaltung, Browserbilder und Grenzen](docs/MATERIAL-DESIGN.md)
- [Umsetzung und Prüfstand 0.1](docs/IMPLEMENTATION-0.1.md)
- [Anforderungen](docs/REQUIREMENTS.md), [Entscheidungen](docs/DECISIONS.md)

Diese Version lädt vier feste Rätsel aus einem statischen JSON-Manifest. Generator, Tagesrätsel, Highscores
und Backend gehören zu späteren Schritten. Die Darstellung ist auf die bestehende
5×5-Karte und sechs Stunden ausgelegt; die Engine liest Sperrfelder und Orte aus
Falldaten. Der Quellcode ist öffentlich einsehbar. Ohne ausdrückliche Lizenz wird keine allgemeine Erlaubnis zur Weiterverwendung oder kommerziellen Verwertung erteilt.
