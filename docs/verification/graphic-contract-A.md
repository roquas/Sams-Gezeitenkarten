> **Historischer Nachweis vor der Generatorkonsolidierung.** Aufrufe und Versionsverträge gelten am damaligen Gitcommit. Aktuell: [Generatorvertrag](../CATALOG-COMPLIANT-GENERATION.md).

# PR A: positionsunabhängiger geografischer Grafikvertrag

Prüfbasis: `main` nach PR #77, `4fbd6f6d9b246fa55ad6db9189c6f13e685b264d`, am 24.10.2026 mit `git fetch origin main` und `git ls-remote origin refs/heads/main` bestätigt. Die Ausgangskopie war unverändert. Historische Tests und Stichproben wurden zusätzlich aus einem isolierten `git archive origin/main` unter `/tmp/graphic-contract-baseline` ausgeführt. Der beigefügte Architekturbericht war Prüfgrundlage; seine Aussagen wurden gegen den Code und die folgenden Gegenproben geprüft.

## Fachlicher Vertrag und Implementierung

> Jede geografische Illustration ist an jeder Position verwendbar, an der ihre vollständige relative Hexform ohne Rotation oder Spiegelung auf die Karte passt. Die zulässige lokale Grafikfläche bleibt dabei unverändert.

`boardGraphicCell` liefert die vollständige lokale Voronoi-Zelle; der zusätzliche Schnitt mit `PROTECTION[0]` entfällt. `placementContract` prüft weiterhin die vollständige Kartenpassung und liefert danach exakt `imageContract`. Die 25 Zellen haben jeweils 5.576 SVG-Flächeneinheiten, insgesamt 139.400. Kartenrand, Zeilenparität, Pergament und Spielschutz verändern diese Fläche nicht.

`even-row-offset-pointy-v1`, axiale Translation, relative Footprints, Bildmaße, Zentrierung, Orientierung und abstrakter v2-Kartenvertrag bleiben erhalten. Es gibt keine Rotation, Spiegelung, Bildkorrektur oder zusätzliche Illustration. Keine Katalog-, Bild- oder Kunstfreigabedatei wurde geändert.

| Dateien | Änderung und Grund |
| --- | --- |
| `src/assets/geometry.mjs` | Vollständige Zellen statt Schutzflächenschnitt; identischer lokaler Vertrag an allen passenden Positionen. Das ungenutzte geografische Schutzflächenalias `GRAPHIC_SAFETY` entfällt. |
| `src/assets/assignment.mjs` | Nur Prüferkennung `asset-placement-pixels-1` → `asset-placement-pixels-2`; alte potenziell eingeschränkte Ankerlisten müssen erneut vorbereitet werden. |
| `src/ui/chart-asset-contract.mjs` | Kommentar trennt geografische Fläche, Spielschutz und universelle Rahmenprüfung. Zonen, Rahmenvertrag v4 und generierte Schablonen bleiben unverändert. |
| `scripts/check-chart-assets.py`, `scripts/lib/frame_footprint.py` | Bestehende Rahmenprüfung zusätzlich gegen alle 25 vollständigen Zellen. Prüfung positiver Flächenüberschneidung vollständiger Quellpixelquadrate durch Separating-Axis-Test; keine bloße Mittelpunktprobe. |
| `tests/contracts/graphic-geometry.test.mjs`, `tests/contracts/asset-catalog-adapter.test.mjs`, `tests/test_library_images.py`, `tests/test_frame_footprint.py` | Geometrie-, echte Bildadapter-, Pixel- und Rahmenregressionen. |
| `package.json`, `.github/workflows/tests.yml` | Neue Rahmenregression im bestehenden Assetgate; Node-Setup vor Rahmenprüfung, weil diese die gemeinsame JS-Geometrie liest. Kein Gate entfällt. |
| `docs/ASSET-LIBRARY-45.md`, `docs/asset-templates/README.md`, `docs/MAP-GENERATION-F04B.md`, `docs/TESTPLAN.md`, `dev/asset-library.html` | Geltende Regel und Prüfhinweise berichtigt; historische Reviewberichte bleiben erhalten. |
| Dieser Bericht und `graphic-contract-A-catalog-sample.json` | Neuer Prüfstand getrennt von den historischen Belegen. |

Die Python-Bildprüfung, `verify-asset-positions.py`, `prepareAssetCatalog`, `assignAssets`, `createCatalogProfile`, Galerie und Export erhalten die korrigierten Masken über den gemeinsamen Vertrag. Ihre Schnittstellen und die bestehenden Ankerlisten bleiben erhalten. Lokale Bildformat-/Maß-/Alpha-/Leerbild-/EXIF-Prüfungen, vollständige Pixelquadrate, Konkavitäten, Löcher und Datei-/Reviewhashprüfungen werden nicht gelockert. Der Zuordnungsalgorithmus und seine Zufallsstromversion bleiben unverändert.

## Nachweis der Positionsunabhängigkeit

- Der Ausgangscode beschränkt genau die 16 äußeren Zellen: A1–E1, A2/E2, A3/E3, A4/E4 und A5–E5; die neun inneren Zellen behalten bereits vorher die volle Fläche.
- Alle **847** geometrisch passenden Asset-/Ankerpaare des gesamten 40-Asset-Katalogs wurden auf identischen lokalen Vertrag und unveränderte projizierte Translation geprüft. Vergleich mit `main`: **0** geänderte lokale Bildverträge und **0** geänderte Bildrechtecke/Anker/Zentrierungen. Nicht passende Formen werden weiterhin abgewiesen.
- Der echte Node/Pillow-Adapter prüft ein synthetisches Alpha-1-Pixel bei **(180,24)** nahe der oberen Einfeldspitze. A1 und C3 ergeben beide `complete`, alle 25 Anker werden verifiziert, das Profil enthält 25 Positionen. Der frühere A1-Erwartungswert `PIXEL_POSITION_REJECTED` entfällt ausdrücklich wegen des neuen vollständigen Grafikvertrags.
- Horizontale Zweier-, diagonale Zweier- und asymmetrische Dreierform werden mit echten PNG-Bytes und entsprechendem oberen Spitzenpixel an **allen** geometrisch passenden Ankern akzeptiert und zugeordnet. Beide Zeilenparitäten und Randberührungen sind enthalten.
- Die bisherige Python-Randregression erwartet aus demselben fachlichen Grund Annahme statt Ablehnung. Die bestehenden Negativtests für lokale Überstände, Konkavitäten/Löcher, Kartenüberstand, Rotation/Spiegelung, Befahrbarkeit, Format/Maße und Freigaben bleiben bestehen.
- `PIXEL_POSITION_REJECTED` bleibt vorerst für manuell unvollständige Verifikationsdaten diagnostizierbar; diese bestehenden synthetischen Diensttests wurden nicht in Freigaben umgedeutet. Alte Prüfversionen werden ausdrücklich abgewiesen.

## Rahmen und Spielschutz

`PROTECTION`, `TRANSPARENT`, `EDGE_LIMIT`, Koordinatenschutz, opake Außenpixel und bisherige Transparenzprüfung bleiben bestehen. Zusätzlich werden je Rahmen **2.234.040** Quellpixelquadrate geprüft, die eine positive Flächenschnittmenge mit der vollständigen geografischen Fläche haben. Beide produktiven Rahmen besitzen dort **0** Alphapixel.

Die neue Regression setzt in einer temporären Rahmenkopie genau einen Alpha-1-Pixel bei **(388,216)**. Sein Quadrat `[60,60.25] × [9.5,9.75]` schneidet die vollständige A1-Spitze nur dünn, während sein Mittelpunkt außerhalb liegt. Die bisherige Pflichttransparenzprüfung würde ihn nicht erkennen; die ergänzte Prüfung weist ihn ab. Weitere Tests unterscheiden reine Randberührung von positiver Überschneidung und bewahren Lücken in Polygonvereinigungen. Produktive Bildbytes werden dabei nicht verändert.

## Ausgeführte Validierung

Lokal: Node 24.19.0, Python 3, Pillow 12.3.0, NumPy 2.3.5, Playwright 1.64.0. CI verwendet weiterhin Node 22.

| Befehl | Ergebnis |
| --- | --- |
| `node --test tests/contracts/graphic-geometry.test.mjs tests/contracts/asset-catalog-adapter.test.mjs` am unveränderten `main` | 10/10; bestätigt den alten C3/A1-Gegensatz |
| `npm run test:unit` | 120/120 Node-Unit-/Vertrags-/Integrationstests |
| `npm run test:assets` | 40 Assets / 3 Hintergründe und Reviewhashes gültig; 40 Bilder lokal und an veröffentlichten Positionen gültig; 14 Bild-, 4 Rahmen-, 5 Mehrhexexport- und 2 Wasserfinale-Regressionen bestanden |
| `node --test tests/contracts/asset-catalog-adapter.test.mjs` nach Präzisierung des ursprünglichen Testpixels | 5/5 |
| `npm run test:content` | 20/20 |
| `npm run test:puzzles` | `model-demo`: genau eine Lösung, unveränderte Route A5–D5 |
| `python3 scripts/check-chart-assets.py` | Meer und beide Rahmen bestanden; 0 geografische Überlappungen |
| `python3 tests/test_frame_footprint.py` | 4/4, einschließlich echter temporärer Rahmenmutation |
| `python3 tests/test_package.py` | 18/18, einschließlich Hash-/Freigabe-/Geometrie-/Exportnegativfällen |
| `npx playwright test tests/browser/model.spec.mjs --output /tmp/graphic-contract-validation/browser-results` | 20/20 Chromium Desktop/Mobil |
| `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npx playwright test tests/browser/model.spec.mjs --config playwright.webkit.config.mjs --output /tmp/graphic-contract-validation/webkit-results` | 20/20 WebKit Desktop/Mobil; lokale Bibliotheken, siehe unten |

Alle oben aufgeführten lokalen Prüfungen sind abgeschlossen. Es wurde kein vollständiger Browser-/Deployment-/CI-Gesamtlauf behauptet. Ein zusätzlich gestarteter isolierter Lauf von `test_library_images.py` wurde beendet, weil dieselbe Suite bereits vollständig im npm-Assetgate läuft; aus diesem abgebrochenen Zusatzlauf wird kein Bestehen abgeleitet.

WebKit benötigte zusätzliche Systembibliotheken. Die Standardinstallation scheiterte an fehlenden Root-Rechten. Debian-Bibliotheken wurden stattdessen unter `/tmp/graphic-contract-webkit` entpackt und im heruntergeladenen Browsercache verlinkt, weil WebKits Startskript `LD_LIBRARY_PATH` ersetzt. Alle sechs ursprünglich fehlenden Bibliotheken wurden mit `ctypes.CDLL` tatsächlich geladen; ein echter WebKit-Start mit gerenderter Testseite bestand. Für den anschließenden Testlauf gilt lokal `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`: Playwrights reine `ldconfig -p`-Vorprüfung erkennt diese lokalen Dateien nicht. Browserassertionen, Projektkonfiguration, Timeouts und CI bleiben vollständig aktiv und unverändert. Vorherige WebKit-Versuche scheiterten vor Testausführung an fehlenden Bibliotheken; dies sind Umgebungsfehler und kein Befund zu sporadischen WebKit-CI-Problemen.

Erste Starts scheiterten an `spawnSync python3 EPERM` in der Prozesssandbox; die tatsächlichen Node-/Adapterläufe erfolgten mit zugelassenen lokalen Unterprozessen. Der erste Chromium-Versuch scheiterte vor Testausführung an fehlenden Browserdateien; nach Installation bestanden alle 20 Fälle. Keine Tests, Timeouts oder Seeds wurden zur Umgehung dieser Umgebungsprobleme verändert.

## Stichprobenvergleich

Ausgeführt: `node scripts/sample-catalog-maps.mjs` und `node scripts/sample-maps.mjs` auf dem korrigierten Branch. Die historischen Dateien `F04b-map-sample.json` und `F04b-catalog-sample.json` bleiben unverändert; der neue Katalogbericht liegt separat in [graphic-contract-A-catalog-sample.json](graphic-contract-A-catalog-sample.json).

18 produktive Bilder, **368/368** zugelassene Anker, **0** abgelehnte Bilder, **0** abgelehnte Anker und weiterhin **154** deduplizierte Profilplatzierungen.

| Kennzahl, jeweils vorher = nachher | Frei | Kataloginformiert |
| --- | ---: | ---: |
| Gültige / unterschiedliche Karten | 128 / 128 | 128 / 128 |
| Vollständig / teilweise / ohne Illustration | 4 / 113 / 11 | 27 / 101 / 0 |
| Zuordnungen / Objekte | 302 / 679 | 483 / 670 |
| Orientierte Formsignaturen | 56 | 44 |

Die vollständige neue Katalogstichprobe ist nach Ersetzen **ausschließlich der Katalogdigest-Vorkommen** bytegleich zur historischen Datei. Damit bleiben auch sämtliche Kartenbeispiele, Bildauswahlen, Formhistogramme, Lückengründe und Arbeitsdiagnosen unverändert. Die freie/gefilterte PR-1-Stichprobe ist ohne jede Normalisierung bytegleich.

| Identität | SHA-256 |
| --- | --- |
| Alter Katalogdigest, Prüfversion 1 | `656e70d5fd714dbd3aa02341848dfa5543ccbc21a245454f3941e6bf4fce3dc9` |
| Neuer Katalogdigest, Prüfversion 2 | `267bc43dd30c7d6d87beedb298e7045281f073d977065dcea3ce843c39f42112` |
| Historische Katalogstichprobendatei | `b5e587ee97496b878dd0ee94118d16328eabe69e30272dfc5050875dc6fc818f` |
| Neue Katalogstichprobendatei | `c4b8e032c483d682b17481d52035e11f4323763f3d1bf41a57266b738858efe0` |
| Freie/gefilterte Generatorstichprobe, unverändert | `d220dc942ca286bdf7128a5cb8d39e84702435fe4f4ff2c4e8f2dbf131cc5af3` |

Einordnung:

1. **Geografische Ergebnisse:** beim vorhandenen Produktionsbestand unverändert, weil seine Bilder bereits vorher an allen geometrisch passenden Positionen zulässig waren.
2. **Fachliche Vertragskorrektur:** die gezielten oberen Spitzenpixel werden jetzt auch am Rand angenommen; künftig lokal gültige Bilder verlieren dort keine Positionen mehr. Die bisherige aktuelle Abdeckung steigt dadurch nicht automatisch.
3. **Notwendige Versionierung:** nur `checkerVersion` wird in der unveränderten Digestdefinition angehoben. Generatorversion `abstract-maps-1`, Profilmodus `catalog-informed-maps-1`, Zuordnung `asset-assignment-1`, Kandidatenreihenfolge, Seeds und Zufallsströme bleiben unverändert.

Der zusätzliche vollständige Vorher-Lauf aus der isolierten main-Kopie ist ebenfalls abgeschlossen: beide Skripte reproduzieren ihre historischen Dateien vollständig bytegleich, einschließlich der oben aufgeführten Datei-SHA-256. Damit sind die Voraussetzungen des Architekturberichts auch mit dem unveränderten echten Bildadapter erneut bestätigt.

## Grenzen und Übergabe an PR B

- Es gibt weiterhin keinen persistenten Freigabenachweis und keine garantierte Bindung eines serialisierten Kontexts an archivierte Ressourcen. Die vorhandene Vertrauensgrenze zum Adapter bleibt bestehen.
- PR B muss Ressourceninventar, unveränderliche Aufbewahrung und gebundenen Freigabenachweis festlegen sowie bereits freigegebene Stände ohne erneute Bilddekodierung laden. PR B/C kann danach die ankerspezifischen Bildzulassungslisten ablösen; geometrisch passende Translationen bleiben die fachliche Grundlage.
- Die Vorbereitung prüft weiterhin einzelne Platzierungen. Dieser PR ändert weder ihren Lebenszyklus noch ihren Umfang; ein Performanceversprechen wird nicht abgegeben.
- Fehlende befahrbare Mehrfeldillustrationen und andere Kataloglücken bleiben bestehen. Der korrigierte Vertrag allein erhöht die Abdeckung des heutigen Katalogs nicht.
- Rahmenverträglichkeit ist ein universeller Darstellungsnachweis, kein Ankerfilter. Künstlerische Freigabe und tatsächliche Lesbarkeit von Spielmarkierungen bleiben eigene Prüfaufgaben.
- Kein automatischer Merge, keine Batchpipeline, kein Solver-/Viewerumbau und keine Änderung der geografischen Vielfalt.
