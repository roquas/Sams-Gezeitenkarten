# Sams Gezeitenkarten

Ein schlankes Hexrouten-Logikspiel mit einem einheitlichen Kartenmodell,
öffentlichen Rätseldateien und austauschbaren Inhaltspaketen. Der reguläre
Einstieg enthält die kontrollierte **Probefahrt**; die vier früheren Rätsel
waren Entwicklungsprototypen und sind aus dem Katalog entfernt.

Starten:

```sh
python3 scripts/dev-server.py
```

Dann [localhost:8000](http://localhost:8000/) öffnen. Native Module brauchen einen
HTTP-Server. Der Entwicklungsserver liefert Dateien ohne veralteten HTTP-Cache.

**Generierte B2-Rätsel testen:** `npm run dev:b2` starten und
[localhost:8000/?dev=b2](http://localhost:8000/?dev=b2) öffnen. Die Auswahl über
der Karte bietet alle 95 Kandidaten mit stabilen Testnamen. Varianten derselben
Zielroute unterscheiden sich im `V…`-Suffix. [Bedienung und Architektur](docs/B2-PLAYTEST.md).
Im Browser werden Notizen, Route und Rahmenwahl lokal gespeichert, getrennt nach
Rätsel-ID und Schema-/Datenversion. Alte Spielstände werden nicht migriert.

Zum Spielen eine Stunde und ein Werkzeug wählen, Hinweise im Bordbuch lesen
und eine Route ab Start rekonstruieren. Pro Etappe geht es zu einem befahrbaren
Seitennachbarn; kein Feld wird zweimal besucht. Das Radar misst geometrische
Hexabstände einschließlich Land. Undo erhält Anzeigeoptionen und bezahlte Hilfen.

## Verträge und Aufbau

- [Regeln gezeitenkarten-2](docs/RULESET-GEZEITENKARTEN-2.md)
- [Rätsel-, Asset- und Paketformat v2](docs/PUZZLE-FORMAT.md)
- [F02-Identitäten/Archiv v2](docs/PUBLICATION-ARCHIVE-V2.md)
- [F03-Dienste](docs/PUZZLE-SERVICES-F03.md)
- [Einziger Generatorweg, Zielzahlbatches und Replay](docs/CATALOG-COMPLIANT-GENERATION.md)
- [Lokale grafische Kontaktübersicht aus Kartenbatches](docs/MAP-CONTACT-SHEET.md)
- [Privater Sechsschritt-Routenlauf B1](docs/ROUTE-EXPERIMENT-B1.md)
- [Experimentelle Rätselkandidaten B2](docs/PUZZLE-EXPERIMENT-B2.md)
- [Architektur](docs/ARCHITECTURE.md)
- [Konsolidierung, entfernte Schnittstellen und Testtransfer](docs/CONSOLIDATION-F01-F03.md)

`src/engine/` enthält reine Regeln; `src/puzzles/` Validierung, Analyse, öffentliche
Projektion und Loader; `src/assets/` Metadaten-/Grafikverträge; `src/ui/` die
Oberfläche. Inhalte stehen unter `puzzles/` und `assets/`. Das historische Original
unter `prototypes/3.6/` ist kein regulärer Laufzeitpfad.

## Prüfen und statisch verpacken

Node 22+, Python mit Pillow und NumPy für Bildtests:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run test:unit
npm run test:content
npm run test:puzzles
npm run test:assets
npm run test:browser
npx playwright test --config playwright.webkit.config.mjs
python3 tests/test_package.py
sh scripts/package.sh
```

Das ZIP liegt unter `dist/Sams-Gezeitenkarten.zip`. Es enthält ausschließlich
Laufzeitdateien und öffentliche Rätsel, benennt `.mjs` in `.js` um und funktioniert
auch unter einem URL-Unterverzeichnis. Keine Node-Laufzeit ist zum Spielen nötig.
Das Paket wird erst nach Logik-, Solver-, Datei-, Hash- und Bildprüfung atomar
ersetzt. Für ZIP-Browsertests das ZIP entpacken und `DEPLOY_ROOT` auf dieses
Verzeichnis setzen:

```sh
npx playwright test --config playwright.deployment.config.mjs
```

Ein Paketbau veröffentlicht nichts. Externe Deployments und Merges benötigen
einen gesonderten Auftrag.
