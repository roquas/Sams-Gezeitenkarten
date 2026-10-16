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

Wird nach den vollständigen lokalen und GitHub-Actions-Läufen ergänzt.

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
