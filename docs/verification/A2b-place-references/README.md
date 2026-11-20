# A2b: Temporäre Ortsbeschriftungen (#68)

Basis: `545d7f3591c0572204b7d24f662d72118161c6fe` (main mit A2a und A3).
Branch: `codex/a2b-temporary-place-labels`. Der exakte Review-Head steht im PR.

## Umsetzung und Dateien

| Dateien | Zweck |
| --- | --- |
| `src/ui/place-references.mjs` | Flüchtiger Overlay-Controller, Namensfilter, ID-basierte Hinweisreferenzen, gemeinsame Animation |
| `src/ui/place-labels.mjs`, `src/ui/map.mjs` | Größere Bänder am vollständigen Flächenschwerpunkt; eigenständige letzte SVG-Ebene; dauerhafte Ortslabels entfernt |
| `src/ui/bordbook.mjs`, `src/ui/game.mjs` | Explizites Ereignis beim Hinweiswechsel und Initialaufruf nach Laden; manuelle Aktion; Abhaken bleibt unabhängig |
| `src/ui/toolbar.mjs`, `src/ui/layout-polish.css` | Sichtbare Schaltfläche „Orte zeigen“, auch in der schmalen Kartenleiste |
| `src/ui/game.css` | Dieselbe Hexkontur für Wasser und Land auf Geräten mit Maus-Hover |
| `src/puzzles/schema.mjs`, `src/puzzles/public.mjs`, `src/puzzles/validate.mjs`, beide Rätselschemas | Kleinstmögliche optionale Präsentationsreferenzen: validieren, öffentlich projizieren, an UI weitergeben |
| `tests/browser/place-references.spec.mjs`, `tests/integration/place-references.test.mjs`, `tests/integration/place-labels.test.mjs` | Neues Verhalten, Lebenszyklus, Datenvertrag und Geometrie |
| Bestehende Modell-, Karten-, Layout-, Mehrhex- und historische Vertragstests | Permanente Labelerwartungen ersetzt; bisherige Interaktions- und Inhaltsprüfungen erhalten |
| `docs/PUZZLE-FORMAT.md`, dieser Bericht und Screenshots | Präsentationsvertrag und Abnahmenachweis |

Engine, Generator, Solver, Deduktionslogik, Route-Ink-Modul und Persistenzcode
bleiben unverändert. Das Overlay erzeugt keine Undo-Aktion und keinen neuen
Spielstandsschlüssel. Startplakette und Startellipse bleiben erhalten.

## Datenquelle der Hinweisreferenzen

Für Distanz- und Zählhinweise genügt das vorhandene strukturierte `placeId`.
Andere Hinweisarten besitzen keine geeigneten Informationen für zusätzliche
redaktionelle Ortsnennungen. Eine Positionszelle allein belegt insbesondere
keine ausdrücklich formulierte Ortsreferenz.

Deshalb gibt es ausschließlich die optionale Präsentationszuordnung
`presentation.cluePlaceRefs: { [hinweisId]: [objektId, ...] }`. Ein Eintrag
beschreibt alle ausdrücklich referenzierten Orte des angezeigten Texts und
ersetzt dessen `placeId`-Fallback; `[]` bezeichnet keine Referenz. Ohne Eintrag
bleibt der vorhandene `placeId`-Fallback erhalten. IDs und Eindeutigkeit werden
validiert. Es gibt keine Textsuche, Motivinterpretation oder Lösungsableitung.
Bestehende Inhalte brauchen keine Migration; Regel- und Schemaversion sowie
bestehende Spielstände bleiben gültig. Die fachliche Logik wird nicht ergänzt.

Historische Evidenzdateien bleiben bytegleich. Die zugehörigen Tests verifizieren
historische und aktuelle Quellhashes separat für die ausdrücklich erweiterten
Präsentationsmodule. Beweise, Traces und öffentliche Rätselbytes müssen weiterhin
vollständig übereinstimmen. Bei den zwei JSON-Schemas wird ausdrücklich geprüft,
dass allein die optionale Eigenschaft hinzugekommen ist.

## Gestaltung, Positionierung und Lebenszyklus

Pergamentfarbe `#f3e5c5`, Rahmen `#9e7b45`, Papiertextur und Georgia-Typografie
verwenden die vorhandene Gestaltung. Ortsbänder sind 34 SVG-Einheiten hoch,
mit Schriftgröße 22 statt bisher 18/13. Ihre Breite richtet sich nach dem Namen;
ungewöhnlich lange Namen passen sich anhand tatsächlicher Browser-Schriftmaße an.

Ein logisches Objekt erhält genau ein Band. Der Schwerpunkt ist das Mittel der
Zentren **aller** gleich großen Hexflächen, einschließlich befahrbarer Hexes.
Die Bandfläche bleibt mit 8 Einheiten Abstand innerhalb der sichtbaren
Kartenbegrenzung. Keine Inselland-Clips, Kollisionssuche oder Verbindungslinien.
Route und Motive dürfen vorübergehend verdeckt werden.

Eine Web Animation auf der gemeinsamen SVG-Gruppe steuert 400 ms Einblenden,
3000 ms Halten und 2000 ms Ausblenden. Neue Auslöser brechen die vorherige
Animation ab und entfernen deren Gruppe. Auch Hinweise ohne Referenzen löschen
sie unmittelbar. Es gibt keine Timer oder einzelnen Animationen pro Objekt;
veraltete Abschluss-Callbacks können eine neuere Anzeige nicht entfernen.
Normale Karten-Neuzeichnungen erhalten die laufende Gruppe samt Zeitverlauf.
Ein Rätselwechsel löscht sie und wählt die Referenzen des neuen ersten Hinweises.
Reduzierte Bewegung zeigt die Gruppe 3000 ms ohne Übergänge; auch eine Änderung
der Systemeinstellung wird berücksichtigt. Die Ebene hat `pointer-events:none`
und keinerlei fokussierbare Elemente.

## Visuelle Prüfung

Die Screenshots zeigen gleichzeitig „Roberts Boot“ (befahrbares Mehrhex-Objekt),
„Zwilling“ (gesperrtes Mehrhex-Objekt) und „Kiste“ (befahrbares Einzelhex-Objekt).
Ein unbenanntes Landobjekt und die Möwen-Flavor-Grafik bleiben ohne Namen.
Die Namen der transportierten Testfixture dienen ausschließlich der UI-Prüfung;
es werden keine produktiven Illustrationsfreigaben behauptet.

Desktop und Mobil visuell geprüft: Namen lesbar, vollständige Bänder innerhalb
der Karte, richtige Flächenschwerpunkte; nach Ablauf normale Kartenansicht.
Bewusst keine Kollisionsvermeidung bei sich überdeckenden Bändern.

## Tests

- 153 gezielte Tests vollständig grün: sämtliche Engine- und Integrationstests
  sowie Modell-, Loader-, BC- und Positive/Positive-v2-Verträge.
- `npm run test:content`: 20/20 grün; `npm run test:puzzles`: grün.
- A2b und Layout in Chromium Desktop/Pixel 7: 30 bestanden, 2 gezielt
  ausgelassen (Maus-Hover auf Touch, Touch-Swipe auf Desktop).
- A2b in Safari/WebKit Desktop/iPhone: 18 bestanden, dieselben 2 gezielt
  ausgelassen. Der WebKit-Lauf erfolgte vor der rein dekorativen Korrektur der
  Schaltflächen-Textebene; die endgültige Kartenleiste ist in Chromium geprüft.
- Bestehende Karten-/Modell-/Radar-/A3-/Pointer-Regressionsmatrix: 95/96 im
  ersten Lauf grün. Die responsive Zeilenprüfung wurde auf abgeschlossene
  Container-Neuberechnung umgestellt; beide Projekte sind im endgültigen
  Layoutlauf grün. A3-Pfade, Pigment, Stundenanzeigen und Radarprüfungen bestehen.
- Kartenleisten-Abnahme über 14 feste Breiten von 320 bis 1440 px: alle
  Breiten in Desktop- und Mobilkonfiguration geprüft. Zwei Kaltstart-Timeouts
  unter paralleler Last wurden ohne parallele Browser-Worker wiederholt.
- `git diff --check`: grün.

Reproduzierbare Kernbefehle:

```sh
node --test tests/engine/*.test.mjs tests/integration/*.test.mjs tests/contracts/model.test.mjs tests/contracts/loader.test.mjs tests/contracts/b2-bc.test.mjs tests/contracts/b2-positive.test.mjs tests/contracts/b2-positive-v2.test.mjs
npm run test:content
npm run test:puzzles
npx playwright test tests/browser/place-references.spec.mjs tests/browser/layout-polish.spec.mjs --workers=1
npx playwright test --config=playwright.webkit.config.mjs tests/browser/place-references.spec.mjs
npx playwright test tests/browser/model.spec.mjs tests/browser/chart-ux.spec.mjs tests/browser/layout-polish.spec.mjs tests/browser/multihex-radar.spec.mjs tests/browser/k-final-route.spec.mjs tests/browser/pointer-gesture.spec.mjs
npx playwright test tests/browser/gui-final-review.spec.mjs --grep 'lower rail|editorial corrections'
```

Die Python-Prüfabhängigkeiten Pillow und NumPy wurden ausschließlich in einer
temporären Umgebung installiert; keine neuen Projektabhängigkeiten.
Ein zusätzlicher vollständiger Unit-Gesamtlauf wurde nach über zehn Minuten
bei den unveränderten Bildpixel-/Katalogdiagnostiken beendet. Er ist **kein**
Nachweis für eine vollständig bestandene Gesamtsuite. Die drei zuvor erkannten
historischen Hash-Erwartungen wurden gezielt angepasst und ihre 11 Tests
vollständig grün wiederholt; die relevanten 153 Tests enthalten diese Prüfungen.
Die vollständige CI bleibt der ergänzende Gesamtnachweis.

Visuelle Belege: [Desktop](screenshots/desktop.png), [Mobil](screenshots/mobile.png),
[Kartenaktionen Desktop](screenshots/actions-desktop.png),
[Kartenaktionen Mobil](screenshots/actions-mobile.png).

Verbleibende bewusste Begrenzung: gleichzeitige Bänder dürfen einander überdecken.
Die Vollständigkeit zusätzlicher redaktioneller Referenzen liegt bei deren
expliziten Präsentationsmetadaten; bestehende `placeId`-Hinweise funktionieren
weiterhin ohne solche Ergänzungen.
