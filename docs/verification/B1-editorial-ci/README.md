# PR #123 – finale CI-Befunde

Ausgangshead: `cdbd30e31555d49e5da4f23e659a086fc404bdff`. Original-CI: [45031811492](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45031811492). Kein Merge.

## Nachgewiesene Ursachen

### Veralteter Regelvertrag

`gui-final-review.spec.mjs` verlangte die ausdrücklich entfernten Orts- und Hilfeformulierungen. Die Assertions prüfen jetzt den kurzen Mehrhex-/Befahrbarkeitssatz, die weiterhin geltende Land-/Küsten-Einschränkung und beide Hilfebezeichnungen „unter Hilfe“. Negative Assertions verhindern die Rückkehr der entfernten Texte. Sämtliche anderen bisherigen redaktionellen Prüfungen bleiben bestehen. Der vorhandene Vergleich der gemeinsamen Regelquelle wird zusätzlich unverändert ausgeführt.

### Radieren aller Stunden: kumulierte native Actionability-Kosten

Originaljob: [WebKit (1)](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45031811492/job/137236831688). Das Originalartefakt `webkit-chart-report-1`, ID **14758863572**, wurde heruntergeladen und gegen SHA-256 **1f2c48d80e992e80606cf5a228fdca79f2c3fdb8613d01304d69f7b6a27aa940** geprüft.

Beide ursprünglichen Versuche sind im Artefakt enthalten. Im ersten benötigen die neun nativen Klicks zusammen **30.466 ms**, im Retry **27.683 ms** zuzüglich Setup und Zustandsabfrage. Die Stabilitätsprüfungen einzelner Klicks brauchen etwa 1,8–3,9 s; sie enden jeweils erfolgreich. Der Trace meldet weder „element is not stable“ noch einen Pointer-Interceptor. Es scheitert keine fachliche Assertion: Der Gleichheitsvergleich der verbliebenen A1-Notizen mit `[]`, Radarursprung C1, 25 Radarwerte und Zustand „showing“ bestehen in beiden Zeitachsen, teilweise erst nach Ablauf der Testfrist. Der Retry enthält außerdem das tatsächliche Speicherergebnis mit leeren Notizen, Ursprung C1 und der Meldung „in allen Stunden gelöscht (2)“.

Damit ist für diesen Fehler ein aufgebrauchtes Gesamtbudget durch langsame native Darstellung/Actionability belegt, kein fehlgeschlagenes Radieren oder verlorenes Radar. Welcher konkrete CPU-/GPU-/Hostzustand die langsame Zustellung verursachte, wird mangels Telemetrie nicht behauptet.

Korrektur: Nur die Vorbereitung der beiden sicheren Notizen und die Stundenwahl verwenden jetzt native Tastatureingaben. Die redundante erneute Wahl des bereits aktiven Sicher-Werkzeugs entfällt; dessen aktiver Zustand wird ausdrücklich geprüft. Neue Vorbedingungen belegen beide tatsächlich gespeicherten Notizen. **Radaraktivierung, Auswahl von „In allen Stunden radieren“ und der eigentliche Radierklick bleiben native Pointeraktionen.** Alle bisherigen Nachbedingungen bleiben erhalten. DPR, Viewport, Fristen und Produktcode sind unverändert.

### Werkzeugbild: das Budget war schon vor dem Scrollen verbraucht

Der erste ursprüngliche Bildtest benötigt **17.497 ms allein für fünf Screenshots**; die zweite Navigation beginnt bei ungefähr **29.634 ms**. Zum Scrollen im Spiel kommt er erst bei ungefähr **33.789 ms**. Im Retry ist derselbe Ablauf bereits bei der vorgeschalteten `#gameRules`-Auswertung über dem Budget. Alle vorherigen Bildbreiten-, Seitenrand- und Seitenverhältnisprüfungen bestehen. Ein dauerhaft instabiles Werkzeugbild oder ein fehlendes Regelelement ist damit nicht belegt; der letzte Stackframe allein wäre dafür kein Nachweis.

Korrektur: Pro Breite gibt es unabhängige Fälle für Landingpage, jede ihrer vier Abbildungen und das Werkzeugbild im Spiel. Alle bisherigen Bilder, Aufnahmen und fachlichen Assertions bleiben erhalten. Der Spielbildfall prüft zusätzlich Sichtbarkeit im Viewport und erfolgreiches Dekodieren. Die eigentlichen `scrollIntoViewIfNeeded`-Aufrufe bleiben bestehen. Jede unabhängige Prüfung behält das unveränderte 30-s-Budget; kein Test erhält eine verlängerte Frist. Beide WebKit-Desktop-Bildprüfungen bleiben bei DPR 2.

## Reproduktion und Prüfung

- **Unveränderte** beiden Timeoutfälle vom Ausgangshead, WebKit Desktop, je dreimal ohne Retries: **6/6 bestanden**. Die Verlangsamung des Linux-CI-Renderers wurde lokal auf macOS nicht reproduziert; die dokumentierten ursprünglichen CI-Fehlversuche bleiben als Nachweis bestehen.
- Korrigierte betroffene Fälle, sämtliche ausgelagerten Bildprüfungen bei 320/390/1440 px, unveränderter Regelquellenvergleich und die drei neuen Startobjekt-Regressionen auf **Chromium Desktop/Mobil und WebKit Desktop/Mobil**: **96/96 bestanden**, **keine Retries, Skips oder erhöhten Fristen**. Darin **12/12 Startfeldfälle**, einschließlich Mehrhexflächen, Schildabstand, Hinweis-/Rätselwechsel und Neuladen.
- `git diff --check` und Syntaxprüfung beider geänderter Testdateien bestanden. Produktdateien einschließlich Bilder, Rätsel und gemeinsamer Regelquelle bytegleich zum Ausgangshead. Keine Workflow-/Konfigurationsänderung.

[Extrahierte originale CI-Zeitachsen und Zustandsnachweise](original-ci-evidence.json) · [Lokale Ergebnisse je Fall](test-results.json). Der Bericht behauptet keinen lokal reproduzierten Linux-Timeout und keinen bestimmten Hostengpass.

Lokale Reproduktion (dieselben vier Profile der regulären Konfigurationen, isolierter Server auf Port 4197, ein Worker):

```sh
npx playwright test gui-final-review.spec.mjs illustrated-rules.spec.mjs place-references.spec.mjs --grep 'erasing all hours|rules incorporate|illustrated viewport|selection and game use identical|named .*start has|surrounding the start' --retries=0
npx playwright test --config=playwright.webkit.config.mjs gui-final-review.spec.mjs illustrated-rules.spec.mjs place-references.spec.mjs --grep 'erasing all hours|rules incorporate|illustrated viewport|selection and game use identical|named .*start has|surrounding the start' --retries=0
```

Der vollständige neue GitHub-CI-Lauf und sein endgültiges Ergebnis werden in der aktuellen PR-Beschreibung verlinkt. Die Änderungen dieser Nachprüfung beschränken sich auf zwei Browser-Testdateien und diesen Nachweisordner. Kein Eingriff in Engine, Solver, Generator, Feedback, Zeitmessung oder Produktverhalten.
