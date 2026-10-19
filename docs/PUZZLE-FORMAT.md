# Rätseldaten und Schnittstellen – Schema 1

Implementierung für [#18](https://github.com/roquas/Sams-Gezeitenkarten/issues/18), [#19](https://github.com/roquas/Sams-Gezeitenkarten/issues/19), [#23](https://github.com/roquas/Sams-Gezeitenkarten/issues/23) und [#33](https://github.com/roquas/Sams-Gezeitenkarten/issues/33). Die allgemeine UI-/Projektdokumentation wird separat aktualisiert; historische 3.6-Dokumente und Originaldateien bleiben unverändert.

## Transport und Grenzen

Ein JSON-Dokument enthält `schemaVersion: 1`, eine stabile `id`, `dataVersion` (positive ganze Zahl), `logic` und `presentation`. [JSON Schema](../puzzles/schema/puzzle-v1.schema.json), [verlustfreies Referenzbeispiel](../puzzles/reference-3.6.json), [explizit technischer Testfall](../puzzles/test-navigation.json).

Schema 1 unterstützt bewusst die bestehende **5×5-Karte**, die dokumentierte Even-row-Hexgeometrie und **1–6 Stunden**. Andere Abmessungen oder mehr als sechs Stunden werden abgewiesen, nicht stillschweigend falsch gezeichnet. Größere Geometrien erfordern einen neuen geprüften Darstellungs-/Schemaausbau. Die Hinweisanzahl ist variabel und hat keine Obergrenze; mindestens ein Hinweis wird verlangt.

- `logic.grid`: `{columns:5, rows:5}`; Koordinaten `A1` bis `E5`.
- `logic.blocked`: eindeutige gesperrte Zellen. **Nur diese Liste legt Befahrbarkeit fest.**
- `logic.start`, `logic.steps`: befahrbarer Start, Zahl der Etappen; alle Routen ohne Wiederbesuch und nur über gemeinsame Hexseiten.
- `logic.places`: stabile Orts-ID → `{kind,cells}`. `island` muss vollständig auf Land liegen; `lighthouse`, `reef`, `wreck`, `landmark` auf befahrbaren Feldern. Mehrteilige Orte sind möglich. Name/Illustration legen niemals Regeln fest.
- `logic.clues`: eindeutige IDs, Typ und typabhängige Parameter. Keine Texte im Logikkern.
- `presentation`: `title`, Absatzliste `intro`, Namenswörterbuch `places`, Hinweistextwörterbuch `clues`, vorbereitete `hints` (darf leer sein), `background` und `overlays`. Textreferenzen müssen exakt zu den Logik-IDs passen. Texte werden als Text behandelt/HTML-escaped, gemeinsame Koordinatensymbole danach eingefügt.
- `solution`: optionaler redaktioneller Sollwert (Start plus alle Etappen). Wenn vorhanden, wird er auf Legalität und Hinweise geprüft und mit der **unabhängig berechneten** eindeutigen Lösung abgeglichen. Er steuert die Suche nicht.
- `metadata`: optional, bei Angabe `kind` und `source`, optional `difficulty`. Herkunft und Schwierigkeit sind keine Eindeutigkeitsbeweise.
- `resultTexts`: optionales Objekt mit unabhängig optionalen Strings `correct` und `incorrect`. `{}`, nur eines der Felder oder beide sind gültig. Vorbereitung für [#35](https://github.com/roquas/Sams-Gezeitenkarten/issues/35): **noch keine Verwendung für neue Ergebnisdarstellungen**. Spätere Oberfläche verwendet bei fehlendem Feld neutrale Defaults.

Unbekannte Felder, Schema-Versionen, Hinweistypen, IDs/Assets und ungültige Referenzen führen zu benannten Fehlerpfaden. Es gibt keine automatische Interpretation unbekannter Versionen. Der veröffentlichte JSON-Schema-Vertrag wird aus `src/puzzles/schema.mjs` erzeugt; ein Test prüft die Gleichheit. Der kleine eigene Validator implementiert genau die verwendete JSON-Schema-Teilmenge, ohne Bibliotheks-/Frameworkabhängigkeit.

## Hinweistypen

| Typ | Parameter | Semantik |
|---|---|---|
| `direction` | `hour` ≥ 1, `direction` | Bewegung dieser Etappe; E, SE, SW, W, NW, NE |
| `turn` | `hour` ≥ 2, `degrees` | Drehung gegenüber vorheriger Etappe in 60°-Schritten; positiv rechts |
| `position` | `hour`, `cell` | Exakte Position; Stunde 0 ist der Start |
| `adjacentToPlace` | `hour`, `place` | Befahrbares Feld, gemeinsame Seite mit mindestens einer Ortszelle |
| `distanceToPlace` | `hour`, `place`, `distance` | Mindestens eine Ortszelle hat exakt diesen geometrischen Abstand; **nicht** Mindestabstand über alle Ortszellen |
| `distanceBetweenHours` | `hours:[a,b]`, `distance` | Geometrischer Hexabstand zwischen beiden Positionen |
| `countAdjacentToPlace` | `hours:[a,b]`, `place`, `count` | Küstenaufenthalte im inklusiven Stundenbereich; jede Stunde höchstens einmal |

Stunden müssen innerhalb der Routenlänge liegen; Bereiche sind aufsteigend. Hindernisse verlängern die Hexdistanz nicht. Die vorhandenen Regeln in `src/engine/puzzle.mjs` werden gemeinsam vom Spiel und Solver verwendet; keine zweite Engine.

## Loader und Solver

- `validatePuzzle(document)` prüft Schema und semantische Referenzen; wirft `PuzzleError` mit `errors` und lesbarer Nachricht. Validität bedeutet noch keine Eindeutigkeit.
- `solvePuzzle(logic, {maxNodes=250000, metrics=true})` arbeitet ohne DOM, Fetch, Speicherung oder Sollroute. Es enumeriert legale Routen über die bestehende Engine und liefert `status` (`unique`, `ambiguous`, `unsolvable`), exakte `count`, `solutions`, `legalRouteCount` und optional `metrics`. Beim überschrittenen Suchbudget wird abgebrochen/geworfen; niemals „eindeutig“ behauptet.
- Metriken: Kandidaten nach jedem Hinweis, Kandidaten beim Weglassen jedes Hinweises (Redundanz), erzwungene Positionen und frühe Schritte, Hinweisvielfalt und erklärende Zählungen. Schwierigkeit ist ausdrücklich nur eine **vorläufige Enumerationsheuristik**, kein menschlicher Lösungs- oder Schwierigkeitsbeweis.
- `compilePuzzle(document)` akzeptiert nur eindeutige Fälle, prüft eine vorhandene Sollroute und erzeugt die kompatible Laufzeitansicht für bestehende UI/Zustandsmodule. Die JSON-Schichten bleiben auf Dateiebene getrennt.
- `createPuzzleLoader({manifestUrl?,fetcher?})`: `manifest()` und `load(id)` liefern Promises. Dateipfade sind relative JSON-Dateinamen innerhalb des Manifestverzeichnisses, keine fremden URLs/Traversalpfade. HTTP-/JSON-/Validierungsfehler bleiben verständlich. Ein fehlgeschlagener Wechsel lässt die bisherige Spielansicht und ihren Zustand intakt.

Das statische Manifest führt nur existierende, eindeutig validierte Fälle. Der Browser lädt ausgewählte Dateien bei Bedarf; Wechsel erfolgt ohne Seitenreload. Ein neuer Spielzustand und geleerte Undo-Historie werden erst nach erfolgreichem Laden aktiviert. Karte, Start, Sperren, benannte Orte, Illustrationen, Texte, Hinweise und Stundenanzahl kommen aus den Daten. Native Auswahl in Einstellungen, Meldung über erfolgreichen Wechsel, mobile Seekarte/Logbuch-Navigation unverändert.

Asset-IDs werden ausschließlich über `src/puzzles/assets.mjs` auf die vorhandenen Aquarellgrafiken aufgelöst. Bewusste Motivwiederverwendung aus dem abgenommenen GUI-Stand bleibt erhalten. Unbekannte IDs werden abgewiesen; physische Assetdateien werden im Test geprüft. Ein fehlendes Deployment-Asset ist zusätzlich durch Browserprüfung erkennbar.

## Spielstände und Migration

Neue Kennung: `gezeitenkarten-<id>-schema<schemaVersion>-data<dataVersion>`; Auswahl: `gezeitenkarten-selected-puzzle`. Reset betrifft nur das aktive Rätsel. Der bestehende Zustandssanitizer wird wiederverwendet. Undo ist pro geladener Sitzung transient, ebenso eine ausstehende Radar-Ursprungsauswahl. Bereits gespeicherte gültige Overlays gehören zum jeweiligen Spielstand.

Einmalige kompatible Übernahme: Nur `reference-3.6`, Schema 1, Datenversion 1 darf beim Fehlen des neuen Schlüssels `gezeitenkarten-reference-3.6-v0.1` lesen. Anschließend wird unter neuem Schlüssel gespeichert. Der alte Eintrag bleibt als Sicherung stehen; ein Reset im neuen Schlüssel importiert ihn nicht erneut. Eine neue Datenversion verwendet einen frischen Spielstand, ohne ältere Versionen oder andere Rätsel zu löschen. Redaktionell reine Textkorrekturen können die Datenversion behalten; Änderungen an Logik/Start/Hinweis-IDs müssen sie erhöhen. Unbekannte Schemaversionen brauchen eine explizite Migration, keine stille Konvertierung.

## Sicherheitsgrenze / späterer Dienst

Dieses statische Offline-Spiel kann Lösungswissen nicht geheim halten. Die Sollroute im JSON ist optional; der Solver liest sie nicht. Das Rohdokument wird nicht separat gecacht, die UI hält nur die berechnete eindeutige Route für die bestehende Notizprüfung. Ein späteres Spieler-Payload kann `solution` weglassen; für echten Spoilerschutz müssen Solver und Prüfservice serverseitig laufen und die Antwort-/Hilfeschnittstelle ersetzen. Keine Behauptung, clientseitige Daten seien privat. Kein Backend in dieser Ausbaustufe.

## Lokale Nutzung und Prüfung

Wie bisher vom Repository aus `python3 -m http.server 8000` starten und `http://localhost:8000` öffnen. `file://` funktioniert wegen JSON-Fetch nicht. Einstellungen → „Rätsel auswählen“. Das Manifest enthält Referenz 3.6 und den ausdrücklich synthetischen technischen Testfall; zusätzliche redaktionelle Fälle kommen separat mit #34.

Mit Node/npm: `npm ci`, `npx playwright install --with-deps chromium webkit`, `npm run test:all`. Einzelne Teile: `npm run test:unit`, `npm run test:puzzles`, `npm run test:browser`. Die Katalogprüfung läuft auch in CI. Playwright prüft Chromium Desktop/Smartphone und zusätzlich die Auswahl auf WebKit mit iPad-Viewport und Touch, bei Pixeldichte 1 für den Software-Renderer in CI (kein Retina-/Hardwaretest; dieselben CSS-Abmessungen und Interaktionen). Vollständige Tastatursteuerung [#36](https://github.com/roquas/Sams-Gezeitenkarten/issues/36) bleibt außerhalb dieses Schritts; native Auswahl und bestehende Tastaturbedienung bleiben nutzbar.

Die statische Aquarell-/Koordinatenebene bleibt bei Markierungen im DOM erhalten und wird erst beim Rätselwechsel neu aufgebaut. Das vermeidet unnötiges Bilddekodieren und erhält die Gestaltung. Der WebKit-Ablauftest hat wegen Software-Rendering ein eigenes Zeitbudget; Assertions, Touch-/Tastaturaktionen und Prüfumfang werden nicht übersprungen.
