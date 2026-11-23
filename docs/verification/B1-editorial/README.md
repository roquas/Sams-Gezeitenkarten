# B1 – Redaktion und eindeutige Startbeschriftung

Basis: `63092cacd251229ec6adc2552e1a821c3a5b4545`, aktueller `main` nach Merge von #119. Eigener Branch `codex/b1-editorial-start-label`. Kein Merge.

## Ergebnis

- Beide ergänzenden Standardrätsel-Hinweise entfernt. Die Regeln bleiben ein gemeinsamer Artikel in `index.html`, den Landingpage und Spielansicht mit derselben Stunden-/Koordinatenaufbereitung verwenden.
- Den langen Orts-Listenpunkt entfernt; unter „Orte zeigen“ steht stattdessen der gewünschte kurze Satz. Hilfe-Bezeichnungen gekürzt, Funktionen und Kosten unverändert. Die Route beschreibt ausschließlich die vorhandenen Etappenzahlen, Segmente und Richtungspfeile; keine behauptete S-Markierung.
- `place-references.mjs` reserviert das Starthex für genau ein Schild „Start“. Ein benanntes einzelliges Startobjekt erhält kein zusätzliches Namensschild. Ein mehrzelliges Startobjekt behält seinen Namen auf der verbleibenden Fläche. Liegt deren Schwerpunkt wieder im Starthex, wird ein anderes Ortshex als Anker gewählt. Ein Mindestabstand verhindert überlappende Start-/Namensschilder. Andere Ortsinstanzen behalten ihre vollständige Fläche und bisherige Platzierung.
- Initiale Anzeige, Neuladen, manuelle Anzeige, Hinweiswechsel und Rätselwechsel laufen durch dieselbe Behandlung. Thematische Namen in Geschichte, Hinweisen und Rätseldaten bleiben erhalten.

## Tatsächliche Bilder geprüft

`assets/rules/hours.png` wurde visuell geprüft: großer Haken und kleiner rechter Haken für Stunde 2, kleines linkes Fragezeichen für Stunde 5. Bildunterschrift und Alt-Text erklären jetzt diese Zeichen. Dieses Bild bleibt bytegleich zur Basis.

`marks.png` zeigte daneben noch ein weiteres mögliches Feld für Stunde 2. Nur diese Illustration wurde aus dem tatsächlichen GUI neu aufgenommen: `2:A2` wechselt von „möglich“ zu „ausgeschlossen“, sodass Stunde 2 jetzt × / ✓ / × zeigt. Andere Stunden bleiben erhalten. Alt-Text und Bildunterschrift passen zum neuen Bild. Alle anderen Regelbilder und das Titelmotiv bleiben bytegleich. Der ergänzte abbildungsspezifische Zustand und der aktuelle PNG-Hash stehen in [figure-provenance.json](../B1-rules/figure-provenance.json).

Gezielte Reproduktion bei lokal laufendem Entwicklungsserver:

```sh
RULES_BASE_URL=http://127.0.0.1:4197 node scripts/capture-rule-figures.mjs --only=marks
```

Das bestehende Aufnahmeskript unterstützt nun diese Teilaufnahme. `fileURLToPath` verhindert dabei ein irrtümliches Ausgabeziel mit wörtlichem `%20` bei Arbeitsverzeichnissen mit Leerzeichen. Die Startschilder wurden anhand der Browser-Testaufnahmen für ein- und mehrzellige Startobjekte visuell kontrolliert; sie sind getrennt und lesbar.

## Prüfung am 22. November 2026

| Prüfung | Ergebnis |
| --- | --- |
| Relevante Node-Integrationen und neuer Bildzustands-/Hashvertrag | **46/46 bestanden** |
| Öffentliche Rätselvalidierung | **2/2 eindeutig**, Rätseldaten unverändert |
| Neue Startobjektfälle, je Chromium/WebKit Desktop/Mobil | **12/12 bestanden** einschließlich symmetrischem Mehrhexfall und Schildabstand |
| Gemeinsamer Regelartikel, Navigation und Rückwechsel, vier Profile | **4/4 bestanden**, HTML identisch für dasselbe Rätsel |
| Breite Browsermatrix: `place-references`, `illustrated-rules`, `rules-final-polish`, `k-final-route` | **166 bestanden, 4 bestehende Geräteskips, 10 fehlgeschlagen** |
| Exakter Nachlauf dieser zehn Fälle, ein Worker, keine Retries | **10/10 bestanden**; damit alle **176** ausführbaren Matrixfälle mindestens einmal bestanden |
| Zusätzlicher isolierter Lebensdauertest, vier Profile | **4/4 bestanden** |
| Vollständige Unit-/Vertrags-/Integrationssuite, Änderung und unveränderte Basis | jeweils **374 bestanden / 94 fehlgeschlagen**, exakt dieselben fehlgeschlagenen Testnamen |

Die breite Matrix hatte sechs 30-s-Timeouts in ansonsten unveränderten Routen-/Layoutfällen und vier exakte SVG-Fließkomma-Vergleiche (`178.74000549316406` statt `178.74`). Der Positionsvergleich rundet nun auf 0,01 SVG-Einheiten; die übrigen Positionen bleiben geprüft. **Kein sauberer Gesamtlauf behauptet.** Alle zehn Fälle bestehen im unveränderten Zeitbudget des gezielten Nachlaufs. Die vollständige Unit-Suite bleibt lokal rot: fehlendes Pillow sowie bestehende CLI-/Pfad-/Folgefehler reproduzieren sich auf der unveränderten Basis. Der Namenvergleich der 94 Ausfälle ist identisch, kein neuer Unit-Ausfall. Diese große Suite wurde vor der abschließenden Schild-Abstandsverbesserung ausgeführt; danach wurden die 46 relevanten Nodeprüfungen erneut erfolgreich ausgeführt.

Eine bestehende Lebensdauererwartung wurde fachlich angepasst: Beim erneuten Hinweis auf das benannte Mehrhex-Startobjekt gibt es nun drei statt zwei Schilder, also sechs statt vier Spuren und insgesamt 48 statt 46 Spuren. Dauer (4900 ms), Abbruch-, Bereinigungs-, Fehler- und Fristprüfungen bleiben erhalten. Ein anfänglich ungültiger Abstand in der neuen symmetrischen Testfixture wurde auf die tatsächlichen zwei Schritte korrigiert.

Reproduktion der Browsermatrix mit den regulären Konfigurationen:

```sh
npx playwright test place-references.spec.mjs illustrated-rules.spec.mjs rules-final-polish.spec.mjs k-final-route.spec.mjs --retries=0
npx playwright test --config=playwright.webkit.config.mjs place-references.spec.mjs illustrated-rules.spec.mjs rules-final-polish.spec.mjs k-final-route.spec.mjs --retries=0
```

Lokal wurden dieselben vier Geräteprofile mit isoliertem Server auf Port 4197 und eigenen Ergebnisverzeichnissen verwendet; keine erhöhten Timeouts, neuen Skips oder Retries. [Kompakte maschinenlesbare Ergebnisse](test-results.json).

Engine, Solver, Generator, Rätsel, Feedback und B1-Zeitmessung sind unverändert. Die einzige Änderung unter `src/beta` entfernt den eingefügten Regelhinweis in `landing.mjs`.
