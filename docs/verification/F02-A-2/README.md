# F02-A/2: Produktionsnachweise

Ausgangsbasis: aktueller `main` bei Arbeitsbeginn, `4078f86` / PR #129.
Der abschließende CI-Lauf von PR #129 war erfolgreich:
[45403480154](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45403480154).
Das Übergabearchiv wurde vor Implementierung gegen die beauftragte SHA-256 geprüft.
Bestehende lokale UI-Arbeiten wurden in einer separaten Arbeitskopie erhalten.

## Pilot und Integrität

Der versionierte öffentliche Auftrag liegt unter
`content/flavor/pilot-v1/public/`; die getrennte lokale Herkunft unter
`content/flavor/pilot-v1/local/orders/<orderId>/binding.json`.
Auftragskennung:
`flavor-order-85bb07ece126d1b5a2af6d98ea55ad5943f6f41f43a6245f835a16e71ba6b4df`.

Inventar-SHA-256:
`7c601e008606349f13b5dec1d0f2568124a13e1dcb8c5bcc768b0e6923be52e7`.
Weltmanifest-SHA-256:
`f90443c20c0dcb3b7616c9b88312684bf083d20f23fd44205fb1b8a8fa191625`.

Vier Positionen C-06/C-02/C-03/C-11; vier Karten, Startnamen
Tangruh/Gelbpunkt/Treibkahn/Nebellicht, 13 Namen und 23 Hinweise.
Der Regressionstest baut denselben Auftrag erneut und vergleicht die exakten
Dateiinventare der gespeicherten öffentlichen und lokalen Fassungen.
Es wurde keine echte Geschichte erzeugt oder importiert.

## Visuelle Prüfung

`P01.png` bis `P04.png` sind beobachtete Chromium-Screenshots der exportierten
SVGs auf macOS, 1200 × 1050, DPR 1. Sie sind Prüfbeobachtungen außerhalb des
deterministischen Produktionsauftrags. Die Screenshots wurden einzeln angesehen
und gegen die gespeicherten Karten-/Objektbindungen verglichen:

- P01 / C-06: Gefängnisfläche B1/B2, Tangruh D1, Flaschenruh D3.
- P02 / C-02: Gelbpunkt B1, Tangruh B4, Tesoro D1/E1/D2/E2.
- P03 / C-03: Treibkahn B4, Blickwinkel D4/E4.
- P04 / C-11: Plankendorf E2/E3, Wackelkahn E5, Schattenhain C4/C5,
  Nebellicht A3, Hinterbucht B2/C1/D1.

Jede Ansicht hat 25 lesbare technische Zellbezeichnungen. Alle Bildreferenzen
wurden im Browser geladen (5/5/4/7 Bilder einschließlich Meer und Rahmen), ohne
externe Ressourcen oder Fehlrequests. Motive, Anker, Ausdehnungen und Rahmen sind
unverändert; keine Route oder Lösungsmarkierung erscheint. Namen und Befahrbarkeit
stehen vollständig in den zusätzlichen öffentlichen Tabellen.

## Ausgeführte Kommandos und Ergebnisgrenzen

Neue Tests:
`tests/contracts/flavor-production.test.mjs` und
`tests/integration/flavor-production.test.mjs`.
Vor der letzten Integritäts-/Pilotnachweiserweiterung: **45/45 bestanden**.
Die abschließenden Ergebnisse des vollständigen Laufs und der CI stehen in der
PR-Beschreibung; es werden keine noch laufenden Prüfungen als bestanden angegeben.

```sh
node --test tests/contracts/flavor-production.test.mjs tests/integration/flavor-production.test.mjs
node --test tests/contracts/flavor.test.mjs tests/contracts/card-library.test.mjs tests/contracts/community-beta.test.mjs tests/contracts/map-contact-sheet.test.mjs tests/integration/card-import.test.mjs
npm run test:unit
npm run test:content
npm run test:puzzles
npm run check:community
npm run check:community:release
npm run test:assets
node scripts/catalog-release.mjs check-archive --previous 4078f86f526d0c72b367cb832ff1dafd8a8590c3
node scripts/flavor-production.mjs pilot --store content/flavor/pilot-v1/local --out content/flavor/pilot-v1/public
git diff --check
```

Umgebung: Node 22.23.3, Python 3.9 mit Pillow 11.3.0 / NumPy 2.0.2 in isoliertem
venv. Der Kontaktblatt-Fixturelauf traf zunächst auf das macOS-Symlinkproblem
`/var` gegenüber `/private/var` bei CLI-URL-Vergleichen. Der volle lokale Lauf
verwendet deshalb `TMPDIR=/private/tmp`, wie bei der vorangegangenen Umsetzung.
Keine Produktänderung oder Testabschwächung wurde dafür vorgenommen.
Der Browser benötigte die normale lokale Prozessberechtigung außerhalb der
Shellsandbox; die eingeschränkte Mach-Port-Registrierung war kein Kartenfehler.

Bereits bestätigt: Content **21/21**, beide bestehenden Rätsel eindeutig,
`check:community` erfolgreich, Archivprüfung gegen main erfolgreich,
Syntaxchecks der neuen Module und `git diff --check` erfolgreich.
`check:community:release` scheitert **erwartet** mit
`Flavor not approved: C-06`; alle Freigaben bleiben ausstehend.

Die unveränderte CI führt das vollständige Profil einschließlich Browser/WebKit,
Asset-, Paket-, Archiv- und historischen Reproduktionsgates aus. Lauf und Status
werden in PR #130 verlinkt. Modell-/Produktionsparameter, freie Bedeutung und
redaktionelle Qualität sind durch technische Importtests nicht nachgewiesen.
