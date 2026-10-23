# Statische Auslieferung

`sh scripts/package.sh [--root <vollständiges lokales Paket>]` erzeugt atomar
`dist/Sams-Gezeitenkarten.zip`. Voraussetzung: Node 22+ und Python mit Pillow.

Der Export verfolgt `index.html`, lokale ES-Modul-/CSS-/Bildreferenzen sowie den
expliziten Katalog `puzzles/manifest.json` und dessen Quellen. Namen und Anzahl
der optionalen Rätsel/Assets sind nicht festgelegt. Quellen außerhalb der
Paketwurzel, Symlinks und fehlende Dateien werden abgewiesen. Alle geladenen
öffentlichen Rätsel müssen dem neuen Schema entsprechen und eindeutig sein;
Bildbytes, Approval-Hashes, Dekodierung, Alpha-Footprints und Kartenrand werden
vor dem Ersetzen eines früheren ZIPs geprüft.

Das Archiv enthält weder Tests, interne Definitionen/Zielrouten noch Archive,
Generatorinformationen oder historische Prototypen. `.mjs`-Dateien und alle
lokalen Modulreferenzen werden für Hosts ohne `.mjs`-MIME-Zuordnung in `.js`
umbenannt. Rasterdateien bleiben bytegleich. `.htaccess` setzt die vorhandene
Cache-/MIME-Politik für Apache; andere Server brauchen entsprechende Header.

Für die Abnahme wird das tatsächliche ZIP außerhalb des Checkouts entpackt.
`DEPLOY_ROOT=<Verzeichnis> npx playwright test --config playwright.deployment.config.mjs`
prüft es unter `/gk/pr38/` mit `nosniff` und ohne `.mjs`-MIME-Zuordnung. Der
Prefix ist eine Test-URL, keine Abhängigkeit der Engine. Chromium Desktop/Mobil
und WebKit iPhone/iPad prüfen dasselbe kontrollierte Demopaket.

`tests/test_package.py` arbeitet mit einer isolierten kleinen Paketkopie und
negativen Vertragsfällen. Es benötigt keine historische Git-Veröffentlichung
und keine vollständige produktive Sammlung.

`./scripts/deploy` ist ein separat aufzurufender Betreiberadapter für den
bestehenden Host und veröffentlicht versionierte Verzeichnisse. Dieser Auftrag
führt ihn ausdrücklich nicht aus.
