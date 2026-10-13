# Statisches Deployment

Im Repository-Hauptverzeichnis auf macOS oder Linux:

```sh
sh scripts/package.sh
```

Voraussetzung: Python **3.9 oder neuer**, keine npm-/npx-Installation. Ergebnis:
`dist/Sams-Gezeitenkarten.zip`. Das ZIP enthält `index.html` direkt an der Wurzel.
Die Dateien in ein leeres Webverzeichnis entpacken und auf Uberspace statisch
über HTTP(S) ausliefern. Es gibt weder Backend noch Datenbank oder Buildframework.
Zum lokalen Test im entpackten Verzeichnis: `python3 -m http.server 8000`,
dann `http://localhost:8000/` in Safari öffnen (nicht `file://`).

Der Export verfolgt HTML-, CSS- und ES-Modulreferenzen ab `index.html`, ergänzt
das Manifest, alle darin aufgeführten Rätsel und die vorhandene Assetregistrierung.
Fehlende Module, Rätsel, Bilder und unbekannte Asset-IDs brechen mit einer konkreten
Fehlermeldung ab. Das letzte erfolgreiche ZIP wird bei einem Fehler nicht ersetzt.
Quelltexte und Laufzeitdaten bleiben unverändert; Dateireihenfolge, ZIP-Zeitstempel
und Rechte sind festgelegt. Bei gleichem Stand und gleicher Python/zlib-Version
entsteht dasselbe Archiv. Tests, historische Prototypen, Dokumentation, Git-Metadaten
und Entwicklungsabhängigkeiten werden nicht ausgeliefert. `dist/` ist Git-ignoriert.

## Prüfung des echten Auslieferungsartefakts

Die GitHub-Actions-Aufgabe `deployment` erzeugt das ZIP, entpackt es in ein frisches
Verzeichnis **außerhalb des Checkouts** und startet dort den HTTP-Server für
`playwright.deployment.config.mjs`. Alle vier Rätsel werden auf Desktop-Chromium,
360px-Smartphone-Chromium und iPad-WebKit geprüft: Inhalte, Grafiken, Hinweise,
Abstandsoverlay beim Markieren, vollständige Routenprüfung, Wechsel, Neuladen,
getrennte Spielstände und Zurücksetzen. HTTP-Fehler und fehlende Bildressourcen
lassen den Test scheitern. Screenshots und ZIP liegen im Actions-Artefakt
`static-deployment`. Die vollständige bestehende Browsersuite läuft zusätzlich
gegen den Entwicklungsstand, einschließlich historischer Regressionstests.

Die Python-Packagingtests prüfen fehlende Rätsel/Bilder/Module, unbekannte Asset-IDs,
Pfadausbrüche, reproduzierbaren Inhalt und den Ausschluss von Entwicklungsdateien:

```sh
python3 tests/test_package.py
```

Der Export selbst ersetzt keine inhaltliche Solverprüfung. Vor Veröffentlichung
laufen zusätzlich `npm run test:unit` und `npm run test:puzzles` in CI.
Die Regeln und Schnittstellen stehen in [PUZZLE-FORMAT.md](PUZZLE-FORMAT.md).
Siehe [PR #38](https://github.com/roquas/Sams-Gezeitenkarten/pull/38),
[Rätselauswahl #33](https://github.com/roquas/Sams-Gezeitenkarten/issues/33)
und [Rätselbestand #34](https://github.com/roquas/Sams-Gezeitenkarten/issues/34).
