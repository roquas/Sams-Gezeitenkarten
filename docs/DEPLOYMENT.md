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
Rätseldaten und Assets bleiben unverändert; der Export passt nur Moduldateinamen und -referenzen an; Dateireihenfolge, ZIP-Zeitstempel
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

## Hosting-Korrektur für PR #38 (13. Oktober 2026)

Auf `https://roquas.de/gk/pr38/` antwortete `src/ui/game.mjs` mit HTTP 200,
aber **ohne Content-Type** und mit `X-Content-Type-Options: nosniff`.
`puzzles/manifest.json` hatte hingegen korrekt `application/json`.
ES-Module benötigen einen JavaScript-MIME-Typ: Ein erreichbarer Modultext allein
reicht nicht. Wird das Einstiegsmodul abgewiesen, werden weder Karte noch mobile
Navigation initialisiert. Cache-Löschen behebt diese Servereigenschaft nicht.

Der Export benennt nun ausschließlich Laufzeitmodule von `.mjs` in `.js` um
und passt die lokalen Modulreferenzen in HTML und JavaScript entsprechend an.
`type="module"`, die Engine, Rätseldaten, Assets und Speicherung bleiben erhalten.
Die Quell- und Testdateien im Repository behalten `.mjs`; es gibt weder Bundler
noch eine zweite Engine. Der Webserver muss `.js` als JavaScript ausliefern
(übliche Standardkonfiguration), CSS als `text/css` und JSON als `application/json`.

**Das neue ZIP vollständig entpacken und seinen Inhalt einschließlich index.html
und src/ hochladen.** Ein Austausch nur der JSON-Dateien oder nur des JavaScript-
Einstiegs reicht nicht. Alte `.mjs`-Dateien werden vom neuen index.html nicht mehr
referenziert und dürfen entfernt werden. Nicht nur einen GitHub-Quellcode-ZIP deployen.

Die vorherige CI verwendete Pythons Standardserver, der `.mjs` korrekt typisiert,
und konnte diese Hostingabweichung daher nicht erkennen. Der Deploymenttest nutzt
jetzt gezielt einen Server ohne `.mjs`-MIME-Zuordnung mit `nosniff`, im echten
Unterverzeichnis `/gk/pr38/`. Ein negativer Kontrolltest reproduziert den abgewiesenen
alten Moduleinstieg. Der positive Test verlangt 25 Hexfelder, sechs Stundentasten,
vier Auswahloptionen und einen erfolgreichen Rätselwechsel über die sichtbar
geöffneten Einstellungen – ohne programmgesteuertes Öffnen des Details-Elements.
Zusätzlich zu Smartphone-Chromium und iPad-WebKit wird iPhone-WebKit geprüft.

Die Action `Diagnose explicit live deployment` protokolliert
Konsole, Startausnahmen, Antwortheader, gescheiterte Requests und Screenshots einer
explizit angegebenen HTTPS-URL. Sie läuft bei Änderungen an den Diagnose-Dateien gegen die konkret gemeldete URL
oder manuell mit einer angegebenen URL. Sie verändert keine Serverdateien und ist bewusst
keine externe Netzwerkabhängigkeit der regulären Regressionstests.
