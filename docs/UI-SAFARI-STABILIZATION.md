# UI- und Safari-Nacharbeiten vor #45

Basis: `ebcef40`, aktueller main nach Merge von PR #53. Main-Lauf
[39106051293](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/39106051293)
erfolgreich. Branch: `fix/ui-safari-stabilization`. Kein Merge nach main.

Gelesen: #54, #55, #57, #58, #60, #61, #62 einschließlich aller Kommentare;
außerdem die Querverweise #29, #31, #40 und #47. Die spätere Orts-/Insel-
Distanzsemantik aus #47 wird nicht implementiert. Land bleibt entsprechend
aktuellem main ein einzelner Radarursprung, aber weder Notiz- noch Routenfeld.
#45, #56, #59, Rätseldaten, Solver und Assetbytes bleiben unverändert.

## Ergebnisse je Issue

| Issue | Technischer Stand | Ursache / Änderung | Regression und Restrisiko |
| --- | --- | --- | --- |
| #55 Radar | Behoben | Die alte #29-Zustandsmaschine schaltete `showing` wieder auf `waiting` und behielt den Ursprung. Jetzt schaltet ein Druck sowohl `waiting` als auch `showing` vollständig aus; Wiederaktivierung verlangt einen frischen Ursprung. Bearbeitungswerkzeuge behalten ein fertiges Overlay. | Unit-Zustandsübergänge, Maus, native Taps, Tastatur, Land-/Quellwechsel, Undo und Reload in Quelle und ZIP. Bestehende Prüfungen der alten Zweiklick-Semantik wurden durch ausdrückliche Ein-Klick-Prüfungen ersetzt. |
| #54 Routenlesbarkeit | Behoben | Spätere Segmente hatten nur 0,36 Deckkraft und eine dünne, kontrastarme Linie. Aktuelle Stunde: kräftiger, durchgezogener warmer Strich. Alle anderen Stunden: identische, gut sichtbare konturierte Strichlinie. | Stilgleichheit vor/nach der gewählten Stunde, Strichmuster statt bloßer Farbdifferenz, Konturkontrast, Papier-/Kartenscreenshots bei 390/820/1440px. Keine Vergangenheits-/Zukunftssemantik aus #56. Persönliche visuelle Abnahme bleibt sinnvoll. |
| #57 Stundenkante | Behoben | Bisher 1,9/0,8 SVG-Einheiten bei 0,64/0,5 Deckkraft. Jetzt helle Kontur 4,6 und dunkle Tinte 2,2 bei 0,98; Geometrie und Zuordnung bleiben gleich. | 22 Wasserkantenpaare, keine Landkante, Stundenwechsel, bestehende DPR-2-Matrix, Klick-/Markierungsregressionen. Notizzeichen werden weiterhin über der Kante gezeichnet. |
| #58 Statuszeile | Behoben | Nur der Radarhinweis verwendet `distanceStatus`; sein bisheriges Ein-/Ausblenden oberhalb der Karte änderte deren Position. Jetzt fester Zweizeilenbereich nach der unteren Werkzeugleiste, ohne leeres Zusatzpanel. | Bounding-Box-Gleichheit von Karte, Leiste, Status und Bordbuch in allen Radarphasen bei 390/820/1440px, Inhalt passt in den reservierten Raum. `role=status`, `aria-live=polite`, `aria-atomic=true`; identische Meldungen werden nicht neu geschrieben. |
| #60 Scrollen | Im Code behoben; native iOS-Geräteabnahme offen | `svg { touch-action:none }`, `preventDefault()` und sofortiges Schreiben auf `pointerdown` verhinderten Scrollbeginn bzw. hätten beim Scrollen schon Notizen erzeugt. SVG erlaubt nun `pan-y pinch-zoom`; Touch bearbeitet erst nach erkannter Absicht. | Native Chromium-Touchstreams auf Wasser und Land, Radar beim Scrollen, native WebKit-Taps und Ereignis-/Scrollgrenzen, Zeichnen/Radieren/Undo, Abbruch, Capture-Verlust, zweiter Finger und Diagonalen bei 390/820/1024px. Playwright kann keine native WebKit-Fingerwischgeste senden; diese Geräteprüfung wird nicht als automatisiert bestanden ausgegeben. |
| #61 Wiederaufnahme | Untersucht, weiterhin offen | Kein reproduzierbarer Nachweis für die beobachtete 1–3 Sekunden leere Safari-Ansicht. Die App initialisiert einmal; kein Resume-Handler baut gesunde Karten erneut auf. Kein spekulativer Wiederaufbau eingebaut. | Vertrauenswürdige `pageshow`-Ereignisse, Navigationstyp, Dokumentidentität, DOM-Erhalt, Spiel-/Radar-/Werkzeugzustand, Scrollposition sowie verzögerte Bilddekodierung werden getrennt erfasst. Echter iOS-Appwechsel, lange Hintergrundphase und OS-Tab-Discard sind mit dieser Umgebung nicht nachgewiesen. |
| #62 Regeln | Behoben | Nur die drei vereinbarten Regelabsätze geändert: direkter Radar-Toggle, neutraler Schluss ohne feste Hinweiszahl, Hexseiten-Erklärung ab Nordost/Stunde 1. Dazu die falsche Radarbedienung in der Werkzeuglegende berichtigt. | Erzählerischer Text, Struktur und Preise bleiben erhalten. Tests für Richtungsreihenfolge, hervorgehobene Seite, keine Kursvorgabe durch die Notizposition, neutraler Abschluss und echtes Vier-Hinweise-Rätsel. |

### Beleg zur Radar-Regression

`8e3629f:src/state/distance-overlay.mjs` enthält bereits den richtigen Test
`phase !== 'inactive'` und setzt beim Einschalten den Ursprung auf `null`.
Dieser Referenzcommit aus PR #38 ist **kein Vorfahr** des aktuellen main.
Dort stammt die Funktion laut `git blame` weiterhin aus `6658cbb` (#29):
`showing → waiting` mit erhaltenem Ursprung. Die Konsolidierung `e7778aa`
übernahm Paket-/Deploymentteile, änderte diese Zustandsdatei aber nicht;
übernommene Tests erwarteten weiterhin die alte Neuauswahl. Hier wird die
verbindliche #40-Semantik wiederhergestellt, nicht die Werkzeugunabhängigkeit
zurückgenommen. Auch UI-Titel, Live-Text und Legende entsprechen dem Toggle.

### Tatsächliche Statusausgaben

`distanceStatus` gehört nur der Radarauswahl. Notizprüfung, Denkanstoß und
Gesamtradierer schreiben nach `helpStatus`; Routenprüfung nach `verifyStatus`;
Rätselwechsel nach `puzzleStatus`; Ladefehler nach `puzzleLoadError`.
Diese anderen Ausgaben werden nicht fälschlich zu Radarmeldungen umgebaut.
Der reservierte Bereich ist 3,5rem hoch und reicht auch für Koordinatenbadges
auf schmalen Geräten; ein leerer Live-Bereich erzeugt keine Meldung.

## Gestenvertrag

- Maus und Stift: primäre Taste startet sofort; Ziehen in jede Richtung bleibt
  erhalten. Rechte/mittlere Maustaste verändern weder Notizen noch Undo.
- Ein Finger: unter 10 CSS-Pixel Bewegung bleibt die Geste ein Tap; erst beim
  Loslassen wird genau ein Feld bearbeitet bzw. der Radarursprung gewählt.
- Ab 10 Pixeln: `abs(dy) >= abs(dx)` gehört zum vertikalen Scrollen, auch bei
  diagonaler Bewegung. Kein Notiz-/Undo-Eintrag und keine Quellwahl.
- Seitlich dominantes Ziehen beginnt eine zusammenhängende Markierungs- oder
  Radiergeste. Ein Undo nimmt sie vollständig zurück. Route und Gesamtradierer
  behalten ihre bestehende Einzelaktivierung, statt im Vorbeiziehen zu ändern.
- `pointercancel`, Verlust der eigenen SVG-Capture, zweiter Finger, Blur,
  Hintergrundwechsel und Seitenwechsel beenden die Geste. Der Transfer der
  impliziten Touch-Capture vom Hex zum SVG wird nicht mit einem Abbruch
  verwechselt. Nach Abbruch gibt es ohne neues Aufsetzen keine weiteren Notizen.
- Stunden-/Werkzeug-/Rätselwechsel, Radar, Undo und Reset beenden ebenfalls
  laufende Gesten. Land bleibt für Notizen und Route gesperrt; vertikal darf
  dort trotzdem gescrollt werden. Beim Radar darf Land Quelle sein.

Die Tests verwenden für echte Chromium-Wischgesten CDP. WebKit hat in Playwright
weder einen nativen Touch-Drag- noch im Mobilkontext einen Wheel-Treiber.
Dort prüfen DOM-Pointerfolgen die Anwendungsgrenze (kein `preventDefault` bei
Scrollabsicht, kein Schreiben); tatsächliches Scrollen des fokussierten
Kartenbereichs wird mit nativem PageDown und echte Taps mit `touchscreen`
geprüft. Das beweist **keinen physischen Safari-Fingerswipe**. Dieser Unterschied
steht zusätzlich als Annotation im jeweiligen Testergebnis.

## Darstellung und Screenshots

Die Kontur-/Tintenpaare haben rechnerisch 5,69:1 (andere Routenstunden), 6,20:1
(aktuelle Route) und 6,57:1 (Stundenkante) sRGB-Kontrast. Das sind Kontraste der
gewählten Vollfarben zueinander, keine behauptete Pixelmessung der gesamten
Aquarellfläche. Kontur und Tinte werden mit mindestens 0,94 Deckkraft gezeichnet.
Die Screenshots prüfen die tatsächliche Komposition auf Seekarte und heller
Papierfläche; Strichmuster/Breite unterscheiden die Route auch ohne Farbe.

Vorher/Nachher lokal unter `/workspace/artifacts/ui-safari/` bei identischer
Route, Stunde und Notizen aufgenommen; Desktop- und Mobilbilder visuell
verglichen. Die CI behält die neuen PNGs und Lifecycle-JSONs auch bei Erfolg:
`ui-safari-review-chromium`, `ui-safari-review-deployment` und die bestehenden
sechs `webkit-timings-*`-Artefakte. Die ZIP-Prüfungen verwenden dieselben
Regressionen auf einem frisch außerhalb des Checkouts entpackten Release.

## Safari-Wiederaufnahme: Nachweisgrenzen und weitere Diagnose

Ein künstlich ausgelöstes `PageTransitionEvent` prüft nur den Ereignisvertrag:
Es darf weder DOM, Zustand noch Scrollposition zurücksetzen. Es wird anhand
`isTrusted=false` ausdrücklich von einem Browserereignis unterschieden.
Beim echten Wegnavigieren und Zurückgehen werden Dokumenttoken,
`pageshow.persisted`, Navigation Timing, Paint-/Ressourcenzeiten und Spielstand
aufgezeichnet. `persisted=true` ist ein tatsächlicher BFCache-Nachweis; schnelle
Navigation allein ist keiner. Ein echter Reload muss ein neues Dokument und
Navigationstyp `reload` liefern. In den ersten lokalen Chromium-Läufen war
History-Rückkehr `back_forward` mit `persisted=false`; ein BFCache-Treffer wurde
also nicht behauptet.

Beim Zurückhalten der Karten-WebPs bleiben die opake Papierfläche, alle 25
Trefferflächen und die Bearbeitung nutzbar. Nach Freigabe der Bilder bleiben
Notizen erhalten. Das prüft kalte Bilddekodierung separat von Initialisierung
und Reload; keine künstliche Performance-Schwelle oder geänderte Testtimeouts.

Für den sporadischen iOS-Befund fehlen insbesondere eine genaue Safari-/iOS-
Version und eine aufgezeichnete echte Rückkehr nach OS-Speicherdruck. Zur
Geräteabnahme Web Inspector mit erhaltenem Netzwerk-/Konsolenprotokoll nutzen:
kurz und mehrere Minuten in eine andere App wechseln, zusätzlich Tabwechsel,
Zurücknavigation und bewussten Reload getrennt prüfen. `pageshow.persisted`,
Document/JS-Neuanforderungen, Bildzeiten, Stunden-/Werkzeugwahl, Notizen,
Radar und Scrollposition festhalten. Nur ein nachgewiesener Auslöser rechtfertigt
einen speziellen Recovery-Eingriff. #61 bleibt offen und blockiert die übrigen
sechs Korrekturen nicht.

## Verifikation

Gezielte lokale Prüfungen: 65 Unit-Tests, Puzzlevalidierung, sieben Pakettests,
Radar-/Tastaturregressionen, native Chromium-Taps/-Drags/-Scrollen, Darstellung
und Lifecycle-Fälle. Die Aufteilung langer neuer Eingabeszenarien in einzelne
Tests erhält sämtliche Assertions; Timeouts und Retries bleiben unverändert.
Die vollständigen Listen umfassen 448 Fälle je Browserfamilie sowie 271
Deploymentfälle, einschließlich Desktop, Smartphone, iPhone-WebKit und
ipad-WebKit. Drei bestehende bedingte Auslassungen pro Browserfamilie bleiben
unverändert. Quell- und ZIP-Prüfungen sind absichtlich beide vorhanden.

Vollständige GitHub-Läufe, letzter geprüfter Commit und endgültige lokale
Ergebnisse werden mit Links im begleitenden PR dokumentiert. Das durch #53
optimierte Muster mit einem Worker je WebKit-Runner bleibt erhalten;
die erweiterte Suite wird jetzt auf sechs statt vier Runner verteilt;
zusätzlich werden nur die gezielten Review-Artefakte aufbewahrt. Keine höheren
Retries, keine abgeschwächten Assertions oder neuen kostenpflichtigen Dienste.

### Zusätzlich gefundene Flake im bestehenden Rahmen-Bildvergleich

Im ersten PR-Lauf `39107850478` hatte Chromium einen Flaky-Fall bei
`visible frame choice works at 390px`: Die beiden PNGs waren im Erstversuch
identisch, der unveränderte Retry bestand. Das ist kein Beleg für den
Safari-Appwechsel aus #61. Nachgewiesen ist die fehlende explizite Bildbereitschaft
im Test: SVG-Knoten entstehen nach asynchronem Puzzleladen, und HTML-Attribute
sowie der Wechsel einer zuvor versteckten Ansicht garantieren noch keine
abgeschlossene Rasterdekodierung.

Der Vergleich wartet jetzt auf `Image.decode()` beider gelieferten Rahmen und
zwei Paint-Takte, prüft zusätzlich deren volle 2252×1892-Dimensionen und vergleicht
dann weiterhin die vollständigen PNGs mit derselben strengen Ungleichheits-
Assertion. Beide Bilder werden zur Diagnose aufbewahrt. Kein Sleep, kein
geänderter Timeout, keine weichere Pixelprüfung. Die genaue Ursache des einen
stalen Captures lässt sich ohne dessen vollständige Bildartefakte nicht
rückwirkend beweisen; daraus wird keine spekulative Produkt-Recovery abgeleitet.

Alle drei Playwright-Konfigurationen setzen im CI nun `failOnFlakyTests: true`:
Der bestehende einzelne Diagnose-Retry bleibt erhalten, ein erst durch Retry
geretteter Fall macht den Job trotzdem rot. Damit wird keine Flake mehr durch
den grünen Gesamtstatus verborgen. Die CI prüft weiterhin alle Fälle und Shards.


### WebKit-DPR-2-Budget des neuen Bildszenarios

Der erste Lauf hatte außerdem im neuen kombinierten 820px-Fall zwei PNGs
bereits korrekt erfasst, erreichte aber beim anschließenden Stundenwechsel
30 Sekunden (auch im ursprünglichen Retry). Die Interaktions-/Kontrast-
Assertions und der Stundenwechsel sind nun ein eigener Test; Seekarten- und
Papieraufnahme je ein separater Test. Die Bildfälle laden eine legale
persistierte Route, statt sämtliche bereits separat geprüften Eingaben zu
wiederholen, warten auf echte Dekodierung und behalten native DPR-Auflösung.
Keine Assertion entfällt, beide Bilder bleiben erhalten und die bestehenden
Timeouts gelten unverändert. Die ausführlichen Listen umfassen deshalb jetzt
448 statt ursprünglich 370 Fälle je Browserfamilie und 271 statt 163 ZIP-Fälle.

Auch der kombinierte lokale DPR-2-Radarzyklus lag am Budget. Die komplette
Maus-/Tastatur-/Touch-Matrix bleibt bestehen, jetzt getrennt in Auswahl/Ein-Klick-
Aus, Wiederaktivierung/Frischquelle sowie Ein-Klick-Aus/Undo/Reload. Die Frischquellenprüfung beginnt
mit der gültigen C1-Auswahl; die Persistenzprüfung mit dem daraus entstandenen
A1-Spielstand als gespeicherter Fixture;
ein Sessionmarker verhindert ein erneutes Seeden beim getesteten Reload.
Alle Layout-, Overlay-, Notiz- und Persistenzassertions bleiben erhalten.

Die Status-PNG-Aufnahme ist ebenfalls ein eigener Renderingfall: Im lokalen
DPR-2-Lauf verbrauchte sie das Budget des danach noch folgenden Undo. Die
vollständige Radar-Eingabematrix behält alle Zustands-/Undo-/Reloadassertions.
Der Kontrastfall lädt die von den bestehenden Routen-/Undo-Suiten geprüfte
Route als Fixture und bedient weiterhin die echten Stundenkontrollen;
sämtliche Stil-, Kanten- und Stundenwechselassertions bleiben erhalten.

Auch Frischquelle und anschließende Persistenzprüfung sind getrennte Szenarien,
da der vollständige Zyklus auf dem lokalen Software-Renderer bei DPR 2
weiterhin 30s erreichte. Beide Folgeszenarien beginnen mit exakt dem gültigen
Spielstand des vorherigen Endzustands; kein Timebudget wurde angehoben.

### Durch den Flaky-Guard gefundene bestehende Rahmenmatrix

Lauf `39110301957` bestand alle neuen UI-Fälle, schlug aber wegen eines
bestehenden Flaky-Tests fehl: Die 1440px-Rahmenmatrix lud fünf Modi in einem
einzigen 30s-Fall. Beim fünften `page.goto(...quiet)` war das gemeinsame Budget
aufgebraucht; erst der Retry bestand. Die Matrix läuft jetzt als 15 unabhängige
Fälle (drei Breiten × fünf Modi), statt als drei Fälle mit je fünf Navigationen.
Alle Modi, HTTP-/JS-Fehlerprüfungen, Geometrie-/Clippingassertions und PNGs
bleiben erhalten. Kein Timeout und keine Retryzahl wurde angehoben.

### Laufzeit der erweiterten Matrix

Die Quellmatrix wächst von 318 auf 448 Fälle je Browserfamilie, die
ZIP-Matrix von 59 auf 271. Der vollständig grüne Vier-Shard-Lauf `39111607421` brauchte
21min 47s einschließlich Setup/Artefakten; der langsamste WebKit-Runner
brauchte 20,9 Minuten reine Testzeit, während Shard 4 nach 3,9 Minuten
reiner Testzeit fertig war. Daher werden dieselben 448 Fälle jetzt auf sechs
parallele Jobs aufgeteilt. Ein Worker pro Runner bleibt wegen der bekannten
Software-Rendering-/DPR-2-Konkurrenz bestehen. Sämtliche Fälle laufen genau
einmal pro Browserprofil; keine Wiederholungs-/Timeout-/Assertionseinstellung
wird geändert. Die abschließenden Messwerte beider Läufe stehen im PR.
