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
Die Rahmenregressionen behalten beide sichtbaren Umschaltungen, URL-/Speicher-,
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


## Touch-Gesten in der vollständigen WebKit-Suite

Die bisherige Chromium-Suite nutzte `newCDPSession` für native Touch-Drags.
WebKit unterstützt CDP nicht. Der gemeinsame Testhelfer behält den nativen
Chromium-Pfad bei und prüft WebKit-Gestenhandler mit DOM-Touch-/Pointerevents.
Er ändert keine Anwendung und entfernt keine Assertions. Echte WebKit-Taps
bleiben Bestandteil der Rätselauswahl-/Startup-/Landfeldtests; die physische
Touch-Scroll-/Drag-Interaktion auf Apple-Geräten gehört zusätzlich zur manuellen
Abnahme. Diese Unterschiede sind kein Nachweis nativer WebKit-Drag-Automation.

Die vollständige WebKit-Suite führt die isolierten Testfälle mit einem Worker
aus, damit die softwaregerenderten DPR-2-Masken nicht um Renderingressourcen
konkurrieren. Testtimeouts und Assertions bleiben unverändert. Der Chromium-CDP-Pfad ist nach der Extraktion erneut bestanden;
der DOM-Pfad wurde zusätzlich an der gerenderten Anwendung geprüft.

Die WebKit-CI stoppt nach dem ersten endgültigen Fehler mit rotem Status, damit
Diagnosen ohne lange Folgefehlerläufe verfügbar werden. Ein grüner Lauf muss
weiterhin sämtliche Fälle der vollständigen Testliste abarbeiten (drei plangemäße Desktop-Auslassungen).
Diese Einstellung überspringt keine Tests in einem erfolgreichen Lauf.

Ein kurzer WebKit-Vorlauf prüft Rahmen-Reload und beide Gestenprotokolle zuerst,
damit Fehler dieser bekannten Integrationsstellen sofort sichtbar werden. Danach
läuft weiterhin die vollständige Suite. Erfolg des Vorlaufs allein ist keine
Freigabe; beide Schritte müssen grün sein. WebKit-TouchEvents werden durch
Playwrights unterstützten Dispatcher erzeugt, der die WebKit-TouchLists korrekt
aufbaut. Chromium verwendet weiterhin native CDP-Touchereignisse.


## Befund aus dem schnellen WebKit-Diagnoselauf

[Lauf 38970018467](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38970018467)
meldete auf dem Desktop bei 320/390 Pixeln aufgebrauchte 30-Sekunden-Budgets
innerhalb der technischen Maskenprüfung. Der kumulative Test decodierte die
DPR-2-Maske, prüfte Pixel/Geometrie, erzeugte Aufnahmen und bediente anschließend
alle 22 Wasserfelder mit Maus und Tastatur. Die jeweils erreichte Zelle variierte.
Die Geometrie-/Maskenprüfung und die vollständige Eingabematrix sind jetzt als
unabhängige Fälle organisiert: jede der fünf Breiten und jede Kartenzeile wird
weiter bei DPR 2 geprüft. Sämtliche ursprünglichen Assertions bleiben erhalten;
die erwarteten Wasserfeld-IDs werden zusätzlich pro Zeile geprüft. Der eingehende
Fokus des ursprünglichen Zeilendurchlaufs wird reproduziert. Reduzierte Bewegung
vermeidet irrelevante Übergänge; Animationsprüfungen bleiben separat erhalten.
Kein Timeout wurde erhöht. Die vollständige Suite enthält nach der zusätzlichen Rahmenaufteilung 222 Fälle pro
Browserfamilie (Desktop + Mobil); ein grüner Vorlauf allein reicht weiterhin nicht.


Im WebKit-Vorlauf von [Lauf 38970347240](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38970347240)
war der lange Rahmenpersistenztest einmal flaky: Die Pixel-/Sichtbarkeitsprüfungen
waren bereits durchlaufen, das Budget endete bei der abschließenden Notizprüfung.
Sichtbarer Wechsel mit Screenshotvergleich und Persistenz nach Reload haben jetzt
getrennte Fälle mit unveränderten 30-Sekunden-Grenzen. Alle ursprünglichen
Prüfungen bleiben erhalten; zusätzlich wird die gespeicherte Präferenz bei einer
frischen Root-URL ohne `?frame` geprüft. Die Vollsuite hat 222 Fälle pro
Browserfamilie, der kurze WebKit-Vorlauf zwölf (inklusive Desktop-Auslassung für
reine Touch-Gesten). Flaky, fehlgeschlagene oder ungestartete Fälle gelten nicht
als vollständige Freigabe.

Lokale Prüfung der aufgeteilten Fälle: alle 60 technischen Masken-/Zeilenfälle
und alle 18 Rahmenfälle mit Chromium Desktop/Mobil bestanden. Die vollständige
WebKit-Testliste enthält 222 Fälle; die CI-Verifikation der aufgeteilten Fälle
bleibt erforderlich. Die frühe rote Diagnose hat keine Anwendung verändert.

Beim Zusammenführen des statischen PR38-Caches mit den hochauflösenden PR48-
Ebenen werden unveränderte `viewBox`-, Rahmenmodus- und Sichtbarkeitsattribute
jetzt nicht erneut geschrieben. Insbesondere eine erneute `viewBox`-Zuweisung
kann in WebKit die gesamte SVG-Szene trotz beibehaltener Rasterknoten invalidieren.
Die Werte, Geometrie, Bilddateien und Umschaltfunktionen bleiben identisch.
Dieser Hotpath-Abgleich ergänzt die getrennten, unverändert strengen Prüfungen.

Die vollständige lokale Rendering-Prüfung erreichte unter paralleler Last auch
im 15-Aufnahmen-Sammeltest das 30-Sekunden-Budget (47 andere Hotpath-Fälle
bestanden). Die identische Renderingmatrix ist nun pro Breite parametrisiert:
alle fünf Modi bei 1440, 390 und 320 Pixeln, dieselben Geometrie-/Koordinaten-
und Screenshot-Assertions, unveränderte native Pixelauflösung und Zeitgrenzen.
Damit umfasst die Vollsuite 222 Fälle pro Browserfamilie.

Nach dem SVG-Hotpath-Abgleich erneut bestätigt: 65 Unit-Tests, sieben
Verpackungstests, 32 Fälle am frisch entpackten ZIP, die betroffenen
Funktionsregressionen (mit separat grüner Renderingmatrix: sechs Fälle) sowie
fünf Gesten-/Abstandsprüfungen; die Desktop-Touch-Auslassung bleibt planmäßig.
Die freigegebenen Assetbytes sind weiterhin unverändert.

[Lauf 38972364262](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38972364262):
Unit, Assets, Deployment und 219 Chromiumfälle grün; WebKit-Vorlauf elf
bestanden/eine planmäßige Auslassung ohne Flaky-Ergebnis. In der Vollsuite
erreichten zwei gleichzeitig laufende native Masken-Zeilenfälle bei 768 Pixeln
das Budget. WebKit läuft deshalb mit einem Worker, bei unverändertem DPR 2,
allen Fällen und denselben 30-Sekunden-Grenzen. Das Ergebnis dieser gezielten
Ressourcenkorrektur ist in den letzten PR-Checks zu verifizieren.

Einzelworker-Diagnose [38973189208](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38973189208):
Die komplette Desktop-DPR-2-Matrix bestand, anschließend scheiterte eine
bestehende Label-Lesbarkeitsassertion. Die Diagnose erfasst nun Text,
Pointer-Einstellung, gesetzte/berechnete Schriftgröße, Textmetriken, verfügbare
Breite und SVG-Skalierung. Die Mindestgröße elf und `pointer-events:none`
bleiben unverändert; dieser Fall läuft früh im WebKit-Vorlauf.

Die konkrete Labeldiagnose [38974486450](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38974486450)
zeigte `pointer-events:none`, aber 10,6916 Einheiten für Tesoro und 10,4056 für
Klippen bei jeweils nahezu exakt ausgeschöpfter Plakettenbreite. Es handelt
sich um die Metriken des generischen Serif-Ersatzes bei fehlender Georgia,
keine fehlerhafte Trefferfläche. Die Labelschrift hat jetzt die explizite
Fallbackfolge `Georgia, 'Times New Roman', serif`. Georgia bleibt auf
entsprechend ausgestatteten Geräten unverändert bevorzugt; die Plaketten- und
Hexgeometrie sowie Assetbytes bleiben gleich. Die Grenze elf und die
Plaketten-Fit-Prüfungen werden nicht abgesenkt.


[Lauf 38975300744](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38975300744)
bestätigt den Schriftfallback: 13 WebKit-Vorlauffälle bestanden, eine planmäßige
Desktop-Auslassung; die Labelprüfung ist grün. Unit, Assets, Deployment und
219 Chromiumfälle bestanden. In der vollständigen WebKit-Suite bestanden
54 Fälle, bevor der kombinierte Radar-/Radierer-/Route-/Undo-Test sein
30-Sekunden-Budget beim zweiten Radierer erreichte (166 Fälle ungestartet).
Die aufeinanderfolgenden fachlichen Abläufe werden jetzt unabhängig geprüft:
Distanz-zwei-Notizen, Überschreiben/Stundenradierer, Mehrstundenradierer,
Route/Undo/Reload sowie Tastatur und Auswahlabbruch. Alle Bedienungen erfolgen
weiter über die UI; alle ursprünglichen Assertions bleiben erhalten. Auch die
14 Leistenbreiten und sieben Leistenaufnahmen bleiben als einzelne Fälle
mit denselben Maßen/Pixeln erhalten. Der Vorlauf prüft beide Radierer früh.
Die Vollsuite enthält nun 272 Fälle je Browserfamilie (269 plus drei
planmäßige Desktop-Auslassungen); 18 Fälle im Vorlauf. Keine Timeoutänderung.


[Lauf 38977408555](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38977408555):
Unit, Assets, Deployment und 269 Chromiumfälle grün. Der erweiterte WebKit-
Vorlauf bestand 17 Fälle bei einer planmäßigen Auslassung. In der Vollsuite
bestanden 117 Fälle einschließlich der Radar-/Radiererszenarien; ein kombinierter
Rätselwechseltest war einmal flaky bei der zweiten Aufnahme, und die Prüfung
zweier kompletter Lösungsrouten samt drei Wechseln erschöpfte das Gesamtbudget
am Verifizieren-Knopf. 152 Fälle wurden danach nicht gestartet.

Die bestehenden Speicher-/Undo-/Reload-Prüfungen und Reset-Prüfung haben nun
eigene Fälle; beide bisherigen Aufnahmen bleiben separat. Jede der zwei
Lösungen wird weiterhin vollständig durch UI-Klicks gezeichnet, überprüft,
weg- und wieder angewählt und erneut überprüft. Zusätzlich wird die exakt
gespeicherte Route vor/nach dem Wechsel geprüft. Derselbe kumulative Aufbau
der Radar-Regelprüfung wird pro vorhandener Breite parametrisiert; alle drei
Radarphasen, sechs Breiten und alle neun Regelaufnahmen bleiben erhalten.
Die Vollsuite umfasst 294 Fälle je Browserfamilie (291 plus drei planmäßige
Desktop-Auslassungen). Der gezielte frühe Vorlauf enthält 50 Fälle.
Zeitgrenzen und Assertions bleiben erhalten; keine Anwendungsänderung.

Die WebKit-CI zeichnet Traces mit `on-first-retry` auf: normale Erstläufe
erzeugen nicht für jede Eingabe einen DOM-/Rendering-Trace, ein erneut
fehlgeschlagener Fall behält seinen Retry-Trace. Lokal bleibt
`retain-on-failure` aktiv. Dies reduziert Diagnoseaufwand im normalen
Ausführungspfad; alle fachlichen Assertions, Aufnahmen, Browser und Zeitgrenzen
bleiben unverändert. Der Einfluss auf Laufzeit/Stabilität ist durch den
nächsten CI-Lauf zu verifizieren, nicht bereits als Ursache bewiesen.


[Lauf 38980648240](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38980648240):
Unit, Assets, Deployment und 291 Chromiumfälle grün. Im erweiterten WebKit-
Vorlauf bestanden 46 Fälle einschließlich der Rätsel-/Speicherkorrekturen;
eine planmäßige Auslassung und zwei ungestartete Fälle. Bei 390 Pixeln meldete
der native Klick auf die feste mobile Navigation nach einer Viewporthöhenänderung
`html`/`body` als fremde Trefferfläche. Dies ist keine reine Budgetdiagnose.
Der Test erhebt jetzt DOM-/Visual-Viewport, Bildschirmmaße, Scrollposition,
Buttonrechteck und `elementFromPoint` vor demselben unveränderten nativen Klick.
Der gezielte Fall läuft zuerst, damit die Ursache ohne langen Vorlauf sichtbar
wird. Keine neue Produktänderung und keine gelockerte Klickprüfung.
