# B2-BC: Validierungsnachweis

Abnahme am 08.11.2026 unter Linux, Node v24.19.0, Python 3 und Playwright 1.64.0.
Ausgangspunkt: `f29bb77933b1ab8777d942769e162cec0be73d64`, aktueller `main`
nach Merge von PR #101. [Auswahlbericht](B2-BC.md) ·
[Export und manuelles Deployment](../B2-PLAYTEST.md#bc-acht-varianten-aus-dem-suchvergleich).

## Import und Diagnosen

```sh
node --test tests/contracts/b2-bc.test.mjs tests/contracts/b2-s02.test.mjs tests/contracts/b2-playtest.test.mjs tests/engine/b2-diagnostics.test.mjs
node scripts/report-b2-bc-playtest.mjs --check
```

**18 Tests bestanden**, keine Fehler oder übersprungenen Tests. Die vier neuen
BC-Vertragstests prüfen insbesondere:

- Acht unveränderte Originaldatensätze; vier B/C-Paare auf vier verschiedenen
  Karten-/Start-/Zielinstanzen. Zwei Fünfer-, vier Sechser-, zwei Siebener-Sätze.
- Eindeutigkeit, Zielübereinstimmung, Irredundanz und alle Auslassungszahlen mit
  dem bestehenden unabhängigen `verifyCandidates()`/`checkIrredundancy()`.
- Alle Einzel- und Paarschnittmengen sowie Einzelstundenexaktheit durch erneute
  Enumeration mit den bestehenden Engine-Prädikaten. Keine Position in Stunden
  1–6 ist durch einen Einzelhinweis exakt festgelegt; Stunde 0 ist vorgegeben.
- Unveränderte Logik, Geometrie und Motivbelegung nach öffentlicher Projektion und
  Laden durch `createPuzzleLoader()`/`compilePuzzle()`. Die geladene Lösung stimmt
  intern mit dem Original überein; die Webdatei enthält keine Lösung oder Diagnose.
- Inhalts-, Datensatz- und Identitätsänderungen, fehlende/doppelte Bindungen sowie
  umgebundene Namen werden abgewiesen. Umordnung verändert Export/Bericht nicht.
- Export bei restriktiver Umask und Reparatur vorhandener 700-/600-Rechte:
  Verzeichnisse 755, öffentliche Dateien 644, bytegleicher wiederholter Export.

Der gespeicherte S02-Bericht bleibt unverändert. Seine ursprünglichen
Implementierungshashes werden gegen den PR101-Stand geprüft; heutige
Auswertungsergebnisse müssen bis auf die Hashes der inzwischen erweiterten
Exportimplementierung vollständig mit dem historischen Bericht übereinstimmen.
Eine erste Testausführung machte genau diesen Provenienzunterschied sichtbar;
die Regression prüft jetzt historische und aktuelle Provenienz getrennt.

## Browser

```sh
npx playwright test tests/browser/b2-bc.spec.mjs tests/browser/b2-s02.spec.mjs tests/browser/b2-playtest.spec.mjs
```

**30 Tests bestanden**, Chromium Desktop und Pixel-7-Emulation. Nach einer kleinen
BC-Präsentationskorrektur (keine automatische Koordinatenformatierung der im Titel
bereits lesbaren Testkennung im Einleitungssatz) die sechs BC-Fälle erneut bestanden.
Alle acht BC-Varianten wurden auf beiden Geräten geladen: ursprüngliche Hinweistexte,
keine eingezeichnete Zielroute, Auswahl, URL und Neuladen, keine privaten Requests,
Markierungen/Undo und getrennte Spielstände, bestehende Routenprüfung, verständliche
Fehler bei falschen Namen oder fehlendem Export. S01/S02-Auswahl und regulärer
Einstieg bleiben durch die bestehenden Tests abgedeckt.

## Paket und Deploymentweg

```sh
npm run test:content
npm run test:puzzles
python3 tests/test_package.py
sh scripts/package.sh
```

Content: **20 Tests bestanden**. Reguläre Rätselvalidierung erfolgreich.
Paketierung: **19 Tests bestanden**; reguläres ZIP erfolgreich erstellt
(109 Laufzeitdateien). Das ZIP enthält weder BC noch S01/S02, Experimentartefakte
oder Registry. Die Paket-Negativkontrolle berücksichtigt jetzt auch BC-Artefakte.

Den in der Anleitung beschriebenen Webordner tatsächlich aus dem ZIP aufgebaut,
die neun öffentlichen BC-Dateien ergänzt und unter dem bestehenden
`tests/deployment/static_host.py` auf `/gk/pr38/` geprüft. Der Host setzt `nosniff`
und bietet keine `.mjs`-MIME-Zuordnung. Ein lokaler Playwright-Smoke-Test mit
Chromium Desktop und Pixel 7 bestätigte jeweils:

- Alle acht BC-Rätsel mit 25 Kartenfeldern, ursprünglichen Hinweisen und ohne
  angezeigte Zielroute; korrekte relative URLs unter dem Unterpfad.
- Auswahlwechsel, Direktlink sowie eine Markierung auf einem passierbaren Feld
  mit Neuladen und Wiederherstellung.
- Reguläre Probefahrt weiterhin erreichbar, keine JavaScript-Fehler, privaten
  Requests oder `.mjs`-Requests; `game.js` mit JavaScript-MIME und `nosniff`.
- Neun öffentliche BC-Dateien mit 644, `.dev/` und `.dev/b2-bc/` mit 755.

Der lokale Smoke-Test ist eine Deploymentprüfung, kein menschlicher
Qualitätsnachweis. Keine native Safari-Abnahme und kein Upload auf Uberspace.

## Erhalt und Grenzen

Originaladapter aus PR101 separat ausgeführt und sämtliche S01-/S02-Exportdateien
mit dem aktuellen Adapter byteweise über Dateihashes verglichen. Die auch im
BC-Vertragstest fixierten SHA-256-Sammelhashes (kanonische Liste aus Dateiname und
Datei-SHA, nach Dateinamen sortiert) sind:

| Bestand | SHA-256 |
| --- | --- |
| S01 | `eca7d23853d8d24294d7263aae297e8f72d867cb9fef824aa2efd50ecb96a927` |
| S02 | `63a3a1735db51ff543607f12584a88cc4ea9e79bea13f10f4a8faef2e4a2c347` |

Zusätzlich gegen PR101 geprüft: alle 167 Originalkandidaten, zugehörige
Vergleichsartefakte, S01/S02-Quellbestände und Registrys, produktive Rätsel und
Assets sind bytegleich. `git diff --check` erfolgreich. Keine Änderungen an
Solvern, Suchstrategien, Generierungs-/Hinweislogik, Geometrie oder Motivbibliothek.
Keine Generierungs-CLI oder historischen Generierungs-Reproduktionstests für
diesen Auftrag ausgeführt; die Validierung löst ausschließlich gespeicherte Rätsel.
Keine neue Qualitätsmetrik, Veröffentlichung oder Merge.
