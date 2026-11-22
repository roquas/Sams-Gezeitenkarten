# B1-Folgearbeiten: Landingpage und bebilderte Regeln

Basis ist `928dd1a5e5d043c962612b07be998686a025ba7b`, der tatsächliche Merge
von PR #116 auf main am 22.11.2026 um 07:42:58 UTC. Darin enthalten sind
#118 (`4d7c3ac`) und #115 (`8dafebf`). Eigenständiger Branch
`codex/b1-illustrated-rules`; keine Bearbeitung anderer Featurebranches.
Bezug: [Issue #31](https://github.com/roquas/Sams-Gezeitenkarten/issues/31).

## Gestaltung und Regeln

Die Landingpage übernimmt die abgesetzte Logbuch-Kopfzeile, Petrol, Georgia,
Papier und die vorhandene Messingleiste. Dahinter liegt ein ausgeblendeter
Ausschnitt des echten Renderers. Auf Mobil entfällt das Hintergrundbild.
Die Auswahl bleibt direkt hinter dem Titel; das Standardrätsel steht zuerst.
Keine neue Bibliothek oder Animation.

Die ausführliche Einführung und ihr Ton bleiben erhalten. Korrigiert sind
insbesondere Start/Stunde 0 plus sechs folgende Etappen, die unabhängigen
Stundenkarten, große und kleine Notizen, beide Radierer, tatsächliche
Werkzeugpositionen, „Route zurück“, gerichtete Segmente, Nummern und
Ortsreferenzen aus A2b. Radar (auch auf Land und bei mehrzelligen Orten),
Notizprüfung, kostenlose Routenprüfung und wiederholte Tippkosten entsprechen
der Implementierung. Die Abbildungen sind Bedienbeispiele, keine Lösung.

Eine HTML-Quelle bleibt in `index.html`. `src/ui/rules.mjs` bereitet sie in beiden
Ansichten auf. `prepareCoordinates` aus `src/ui/coordinates.mjs` bearbeitet
Textknoten und überspringt vorhandene Badges: keine Transformation von Attributen,
kein Neuaufbau von Überschriften/Links, keine verschachtelten Koordinatensymbole.
`role="img"` und der ausgeschriebene zugängliche Name bleiben gemeinsam mit
Farben und Buchstabenkürzeln erhalten. Der Rätselwechsel aktualisiert nur die
jeweils passenden Etappenzahlen; die Sechsstunden-Abbildungen sind ausdrücklich
als solche gekennzeichnet.

## Herkunft der Abbildungen

Erzeugung ausschließlich mit Playwright/Chromium aus dem echten Spiel. Keine
Bildgenerierung, keine nachgezeichneten Bedienelemente, keine Konzeptkarte.

```sh
python3 scripts/dev-server.py --port 4175
node scripts/capture-rule-figures.mjs
```

[Zustände, Viewports, Pixeldichte, Browser und Bildhashes](figure-provenance.json)
liegen neben diesem Bericht. Die vier PNGs enthalten echte Bildschirmaufnahmen
von HTML-Bedienelementen und SVG-Kartenausschnitten. Ein zweites Browserdokument
ordnet diese unveränderten Aufnahmen auf Papier an; das ist die einzige Montage.
Die Werkzeugleisten stammen aus der echten 390-px-Anordnung; die Kartenausschnitte
aus 1440 px. Zwei Gerätepixel pro CSS-Pixel halten Symbole beim Skalieren lesbar.
Die kurze Beispielroute umfasst zwei legale Etappen und ist keine Lösung des
Standardrätsels. Das Titel-JPEG stammt aus demselben Renderer nach dem echten
Löschen der Notizen und Zurücknehmen der Route. Es zeigt keine vorgegebene Fahrt.

Alle benötigten Kartenmotive stammen unverändert aus dem freigegebenen lokalen
Assetkatalog. Die Regelbilder liegen unter `assets/rules/` und werden vom normalen
statischen Paketierer als Laufzeitressourcen aufgenommen. Regelbilder haben
Alt-Texte, knappe Bildunterschriften, intrinsische Maße und Lazy Loading.

## Wahl des Standardrätsels

Auf main ist der reguläre Katalog bisher nur die dreistündige technische
Probefahrt. Daneben gibt es eingefrorene S01-/S02-/BC-/S03-Entwicklungsbestände
und die positive redaktionelle Sechsstundenreferenz V2. Die vorhandene Pipeline
kann Quellenbindungen, öffentliche Projektion, Eindeutigkeit, Irredundanz und
lokale Nachweise prüfen. Ein neuer Suchlauf ist für diesen Auftrag nicht nötig.

Gewählt ist **Die drei Peilungen**, Quelle `B2-POSITIVE-V2-01`. Gründe:

- Sechs Etappen und sechs einzeln notwendige Hinweise; genau eine Lösung.
- Zwei Richtungsangaben, Entfernungen zwischen Stunden/zu Orten und eine echte
  Zählbedingung. Keine triviale Abfolge von sechs expliziten Kursen.
- Alle 64 Teilhinweiszustände sind mit den bestehenden lokalen Prämissen und
  dem unabhängigen Solver geprüft; der Zählschluss führt zu weiterer Festlegung.
- Ein auf main dokumentierter menschlicher Spieltest war erfolgreich und
  beschrieb den Weg als nachvollziehbar und angenehm. Das ist keine belastbare
  Schwierigkeitsbewertung. Der Katalog vergibt deshalb keinen Schwierigkeitsgrad.
- Ausschließlich befahrbare Felder und vier vorhandene, freigegebene Ortsmotive
  begrenzen die visuelle Komplexität für den Einstieg. Küsten-/Landmechanik bleibt
  in den allgemeinen Regeln beschrieben, ist hier aber nicht nötig.

[Technischer Prüfstand der Quelle](../B2-positive-v2-validation.md) und
[qualitative Beobachtung](../B2-positive-v2-playtest-observation.md).
[Neuer lösungsfreier Prüfbeleg](standard-puzzle-validation.json).

`puzzles/drei-peilungen.json` ist die öffentliche Projektion dieser unveränderten
Logik. Eine eigene öffentliche Rätsel-ID, eine angepasste Einführung und vier
kontextbezogene Tipps sind die einzigen redaktionellen Ergänzungen.
Karten-, Instanz- und Variantenidentitäten werden über die vorhandenen
`logicalFingerprints`/Projektionsfunktionen übernommen. Eine archivierte
`sourcePublicationId` wird nicht erfunden; das vorhandene öffentliche Format
unterstützt diese redaktionelle Projektion ohne Archivveröffentlichung.
Alle Motiv-/Hintergrundfreigaben und die normalen Veröffentlichungsprüfungen
gelten weiter. Es wurden keine Qualitätsbedingungen abgeschwächt.
`model-demo` und die historischen Quellen bleiben bytegleich.

Die bestehenden Entwicklungsadapter übernehmen automatisch den regulären
Katalog. Deshalb prüfen ihre Tests die neue vollständige Auswahl. Historische
Exporthashes bleiben erhalten: Ein Testhelfer prüft zuerst exakt die autorisierte
zusätzliche Katalogzeile samt Standard-ID und dann den historischen Export mit
seinem ursprünglichen Katalog. Kein Kandidat, Beweis oder historischer Hash wird
neu geschrieben oder pauschal von der Prüfung ausgenommen.

## Visuelle Abnahme

Vorherbilder stammen vom unveränderten main vor Bearbeitung, aufgenommen mit
1440 × 1000 und 390 × 844 CSS-Pixeln, DPR 1. Nachherbilder zeigen dieselben
Viewportgrößen; zusätzlich ist 320 px geprüft. In den Tests werden CSS-Pixel
exportiert, damit auch Mobilbilder direkt im Repository lesbar sind.

| Ansicht | Vorher | Nachher |
| --- | --- | --- |
| Desktop, Einstieg | ![Vorher Desktop](before-desktop.png) | ![Nachher Desktop](after-1440.jpg) |
| Mobil, Einstieg | ![Vorher Mobil](before-mobile.png) | ![Nachher Mobil](after-390.jpg) |
| Regeln Desktop | [Vollständige vorherige Regeln](before-rules-desktop.png) | [Stunden](rules-hours-1440.jpg) · [Notizen](rules-marks-1440.jpg) · [Werkzeuge](rules-tools-1440.jpg) · [Route](rules-route-1440.jpg) |
| Regeln Mobil | [Vollständige vorherige Regeln](before-rules-mobile.png) | [Stunden](rules-hours-390.jpg) · [Notizen](rules-marks-390.jpg) · [Werkzeuge](rules-tools-390.jpg) · [Route](rules-route-390.jpg) |
| 320 px Hochformat | — | [Einstieg](after-320.jpg) · [Stunden](rules-hours-320.jpg) · [Notizen](rules-marks-320.jpg) · [Werkzeuge](rules-tools-320.jpg) · [Route](rules-route-320.jpg) |

Die lange Einführung bleibt absichtlich vollständig und direkt zugänglich.
Sprunglinks führen zur Auswahl bzw. zu den Regeln. Bei 320 px kein horizontaler
Überlauf; Symbole werden proportional skaliert. Bilder stehen neben ihren
jeweiligen Erklärungen. Die Spielansicht behält ihre schmale Regelspalte: [Desktop](game-rules-tools-1440.jpg), [Mobil](game-rules-tools-390.jpg).

## Prüfungen

Zwischenstand: neue gezielte Chromium-Regressionsmatrix **16/16 bestanden**, Inhaltstests **20/20**, beide regulären Rätsel eindeutig, HTTP-Selbsttest und Archivprüfung bestanden. Breite Chromium-/WebKit- und vollständige Vertragsprüfungen laufen; deren Ergebnis wird ergänzt. Bisherige breite Läufe enthalten Timeouts beim Aufbau bestehender Katalog-Fixtures sowie einen inzwischen korrigierten Test mit veralteter Ein-Rätsel-Annahme. Es wird kein grüner Gesamtlauf behauptet.
Keine Assertions, Budgets oder Geräteskips wurden gelockert.

Reproduktion der neuen gezielten Prüfungen:

```sh
node scripts/prepare-landing-puzzle.mjs
node --test tests/contracts/landing-puzzle.test.mjs
npx playwright test tests/browser/illustrated-rules.spec.mjs
npx playwright test --config=playwright.webkit.config.mjs tests/browser/illustrated-rules.spec.mjs
```

macOS-Testumgebung: Pillow aus vorhandener isolierter Testumgebung; für
Git-/CLI-Verträge `TMPDIR=/private/tmp` (kanonischer Pfad statt `/var`-Alias).
Eingefrorene Reproduktionen verwenden den vorhandenen Node v24.19.0;
die reguläre Suite läuft mit Node 22.

## Offene Abnahmefragen

Die gestalterische und redaktionelle Freigabe steht aus. Insbesondere bitte
Titelmotiv/Messingleiste, Dichte der vier Bilder und Eignung des unbewerteten
Standardrätsels für den ersten Einstieg beurteilen. Die frühere Rückmeldung zu V2
bestätigt keinen neuen Deduktionsaufbau gegenüber der ersten positiven Referenz;
dieser Auftrag behauptet das auch nicht. Echte Mobilgeräte und VoiceOver bleiben
sinnvolle manuelle Abnahme. Kein Merge durch den Agenten.
