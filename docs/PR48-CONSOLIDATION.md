# Konsolidierung von PR #48

## Auftrag und geprüfte Ausgangspunkte

Remote-Abgleich am 16. Oktober 2026: zwölf Branches, PR48
`experiment/parchment-frame` bei `00dedd8`, PR38
`feature/puzzle-schema-loader-solver` bei `3ca2faa`, main bei `071c504`.
Gemeinsamer Vorfahr der Featurestände: `4d9913c`.
Die 24 ausschließlich auf PR38 vorhandenen Commits wurden nach Dateien und
Verhalten geprüft; kein vollständiger Featurebranch wurde gemergt.

## Integrationsplan und Herkunft

| Bereich | Übernahme / Konfliktentscheidung |
| --- | --- |
| Schema, Loader, Validator, Solver | Bestehende Implementierung aus `fee57fb`, `f924412`; JSON und Laufzeitsicht bleiben getrennt. |
| Auswahl und Speicherung | `41f3b7c`, `bfa841b`, `6cbd350`: Manifest, vier Rätsel, separate Schema-/Datenversionsschlüssel; bestehender Referenzstand wird lesend migriert. |
| Logbuch | `c1939d0`, `45dffc0`, `8e3629f`: volle angeschnittene linke Seite, Sepiakarte, ruhiger Blattwechsel, mobiler Textinnenabstand. |
| Kartenrendering | Statische Ebenen und WebKit-Textmessung aus PR38 übernehmen; Meer, Rahmen, Geometrie, Koordinaten-Tintenkleckse und Auswahl aus PR48 erhalten. Cache berücksichtigt Rätsel **und** Rahmenmodus. |
| Landfelder und Radar | PR48 ist verbindlich: keine Landnotizen/-routen/-Stundenkante, Land als Messursprung, 25 Abstandswerte, unabhängige Anzeige und Wiederherstellung. Ältere widersprechende PR38-Tests entsprechend aktualisiert. |
| ZIP / Uberspace | `3a52f7f`, `2d0751c`, `6479400` und Deployment-Skript bis `3ca2faa`: rekursive Laufzeitdateien, relative Pfade, `.mjs`→`.js`, strenge MIME-Tests und Archivtests. PR48-Grafiken und `.htaccess` ausdrücklich mitverpackt. |
| main / CI | Wartung aus PR50 (`d882283`): Push nur auf main, PR-Prüfung weiterhin aktiv, Fehlerberichte drei Tage, direkt verwendbares Deployment-ZIP separat. Asset-, WebKit- und Deployment-Jobs bleiben erhalten. Öffentliche Sichtbarkeit/Nutzungsrechte aus `071c504` erhalten. |

Keine Änderungen an freigegebenen Grafikbytes oder Alphamasken. Die
Logbuchgrafik ist rein dekorativ, weder rätselabhängig noch interaktiv.
Alle drei produktiven Rätsel und der bestehende technische Testfall bleiben
statisch verfügbar. Es gibt keinen Backenddienst und keinen Serverbuild.

## Bewusste Ausschlüsse

* `feature/asset-library-45`: vollständig ausgeschlossen; kein Katalog,
  Validator, Migrationsschritt oder neues Asset daraus.
* Issue #51 bleibt im Backlog; die Notizprüfungs-Strafpunkte bleiben unverändert.
* Keine Übernahme älterer Designbranches, keine neuen Spielmechaniken.
* Kein Merge nach main, keine geschlossenen PRs, keine gelöschten Branches.
* Das alte Diagnosewerkzeug bleibt verfügbar, wird aber nur ausdrücklich per
  `workflow_dispatch` gestartet; kein zusätzlicher automatischer Live-Aufruf.

## WebKit-Fehler aus Lauf 38912609153

Die öffentlichen Annotationen zeigen aufgebrauchte 30-Sekunden-Testbudgets
am Ende des Rahmenpersistenztests: Screenshot (Desktop), Einstellungs-Klick
nach Reload bzw. abschließendes localStorage-Aufräumen (Mobil).
Die Pixelanalyse beider großen WebPs lief bisher zusätzlich in jedem solchen
Test. Sie hat jetzt einen eigenen Test mit unveränderter Pixelprüfung.
Die Persistenztests behalten beide sichtbaren Umschaltungen, URL-/Speicher-,
Geometrie-, Notiz- und Screenshotprüfungen. Screenshots verwenden CSS-Pixel
und deaktivieren Animationen; keine Timeout-Erhöhung und kein deaktivierter Test.
Die Mobil-WebKit-Projekte verwenden wie PR38 CSS-Pixel (deviceScaleFactor 1).
Die tatsächliche WebKit-Verifikation wird im Prüfergebnis gesondert ausgewiesen.

## Prüfergebnis

| Prüfung | Ergebnis / Nachweis |
| --- | --- |
| Reguläres `npm run test:unit` | 65 Tests bestanden. |
| `npm run test:puzzles` | Alle vier Manifest-Rätsel unabhängig als eindeutig lösbar bestätigt. |
| `python3 tests/test_package.py` | Sieben Tests bestanden; ZIP reproduzierbar, alle Laufzeitreferenzen enthalten. |
| Alpha-Normalisierer / Assetvertrag | Selbsttest und `check-chart-assets.py` bestanden; freigegebene WebP-Bytes unverändert. |
| Entwicklungsserver | No-cache-Selbsttest bestanden. |
| Chromium Desktop + Mobil | Vollständiger lokaler Durchlauf: 161 bestanden, drei nur mobil sinnvolle Tests im Desktop-Projekt übersprungen. |
| Letzte Loader-Bereitschaftskorrekturen | 20 Land-/Rahmentests und sechs ZIP-Landfeldtests gezielt erneut bestanden. |
| Entpacktes ZIP im Unterverzeichnis | 30 Prüfungen im ersten Lauf bestanden; mit historischen Vergleichsexporten 31 bestanden und eine Initialisierungsrace erkannt. Diese durch explizites Warten auf 25 Hexfelder korrigiert und alle sechs betroffenen Prüfungen erneut bestanden. CI prüft die vollständige Kombination einschließlich WebKit. |
| GitHub Actions | [Konsolidierungslauf 38965750559](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38965750559), [jeweils letzte PR48-Prüfungen](https://github.com/roquas/Sams-Gezeitenkarten/pull/48/checks). Erforderlich: unit, assets, browser, webkit, deployment. |

Lokales Chromium verwendet den vorhandenen Systembrowser über eine außerhalb des
Repositories gespeicherte Konfiguration. Die zu Playwright gehörenden Browser
werden in GitHub Actions installiert. Lokale WebKit-Downloads und die GitHub-API
waren in der Cloud durch die Netzwerkpolitik gesperrt; die öffentlichen
Actions-Seiten erlauben die Kontrolle der CI-Ergebnisse. Die vorbereiteten
Netzwerkergänzungen sind in den Umgebungseinstellungen separat zu übernehmen.
Das ersetzt keinen grünen CI-Lauf: Merge erst nach Erfolg aller fünf Jobs am
letzten Branchstand und anschließender manueller Nutzerfreigabe.

Die Sichtprüfung aktueller Chromium-Aufnahmen bei 1440, 768 und 390 Pixeln
bestätigt Sepiakarte, volle angeschnittene linke Buchseite und Text innerhalb
des sichtbaren Papiers. Die Benutzerabnahme auf echten Apple-Geräten bleibt
Teil der unten beschriebenen abschließenden Sichtprüfung.

## Abschließende lokale Sichtprüfung

1. `git switch experiment/parchment-frame` und `git pull --ff-only`.
2. `python3 scripts/dev-server.py` im Repository starten; einen alten
   `python3 -m http.server` vorher beenden. Normalen Browsermodus verwenden.
3. Einstellungen öffnen: Referenzfall, „Die Quittung von Nombreo“ und
   „Das doppelte Ankerbuch“ nacheinander wählen. Land, Start, Orte und
   Logbuchtexte vergleichen; unterschiedliche Notizen setzen, wechseln,
   neu laden und jeweils nur das aktuelle Rätsel zurücksetzen.
4. Rahmen 01/02 wechseln, neu laden, weiter markieren. Rahmen 02 ist ohne
   gespeicherte Präferenz Standard. Rasterachsen und Koordinaten bleiben gleich.
5. Land normal anklicken: keine Notiz. Radar aktivieren, Land wählen:
   25 Abstände, Ursprung 0. Werkzeug wechseln, radieren, Undo und neu laden.
6. Logbuch am Desktop, iPhone und iPad prüfen: volle links angeschnittene
   Seite, Sepiakarte statt Steuerrad, Text innerhalb des Papiers, Navigation
   und Abhaken; reduzierte Bewegung respektiert die Systemeinstellung.
7. `sh scripts/package.sh`, ZIP in ein frisches Verzeichnis entpacken und
   auch unter einem Unterverzeichnis bereitstellen. Das Archiv benötigt
   keinen Build auf Uberspace. `scripts/deploy` bleibt ein ausdrücklich
   manuell zu startender Upload, der einen erfolgreichen Actions-Build verlangt.

Freigabe und Merge verbleiben beim Nutzer.
