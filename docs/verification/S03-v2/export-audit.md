# S03-v2 – Prüfung des tatsächlichen Spieltestexports

**Technische Diagnoseinformationen; nicht Teil der lösungsfreien Übersicht.**

Nach dem einzigen v2-Pilotlauf wurde mit dem unverändert aus main `70e563d`
integrierten Formatter exportiert:

```sh
npm run export:b2 -- --stock S03-V2
npm run test:s03:v2:evidence
```

Der reale Export liegt in `.dev/b2-s03-v2/`: neun öffentliche Rätseldateien und
Manifest. Alle zehn Dateihashes entsprechen `run/public-export.json`, das bereits
im Pilot aus den kompilierten öffentlichen Bytes entstand. Die
[Evidenzprüfung](../../../tests/reproduction/s03-v2-evidence.test.mjs) vergleicht
reale Dateien, Quelllogik, Loader, Zielroute und Hinweiswahrheit auf allen legalen
Routen erneut. Private Beweise, Diagnosen und Quellidentitäten werden nicht in
die öffentlichen DTOs übernommen.

## Tatsächliche Textabdeckung

Unter den 45 Hinweisen der Auswahl sind 33 CD-Hinweise. Die folgenden Kategorien
überlappen und sind keine additiven Teilmengen:

| Fall | Vorkommen im tatsächlichen Export |
| --- | ---: |
| Mehrstunden-Nulltreffer: „nie“ | 12 |
| Vollständiges Intervall: „in jeder Stunde“ (Bedeutung „immer“) | 1 |
| Abstand 0: „auf“ | 3 |
| Abstand 1: „neben“ | 4 |
| Einzelstunden | 8 |
| Davon negative Einzelstunden: „nicht“ | 5 |
| CD-Bezug auf ein Mehrhexobjekt | 15 |
| Mehrstunden-CD mit Stunde 0 | **0** |

Der freigegebene Formatter verwendet für vollständige Intervalle „in jeder
Stunde“, nicht das Wort „immer“. Es wurde kein neuer Textformatter implementiert
und kein Hinweis umgeschrieben. Einzelstunden erhalten „In Stunde …“; negative
Einzelstunden „nicht“ statt „nie“. Jede Ausgabe nennt alle Zellen ihres
Mehrhex-Bezugsobjekts. Die tatsächlichen Beispielsätze und ihre Kennungen stehen
in [export-audit.json](export-audit.json); sie enthalten Hinweise und gehören
nicht in die unbeeinflusste Spieltestübersicht.

Alle genannten Sonderfälle kommen bereits in der fest ausgewählten Serie vor.
Es wurden dafür keine zusätzlichen Rätsel, Hinweise oder Generatorläufe erzeugt.
Die grundsätzliche Single-Hour-S0-Zulässigkeit und historische S0-Semantik werden
weiter durch bestehende Generator-/H1-Regressionen geprüft.

## Oberfläche und Radar

Sechs v2-Browserprüfungen bestehen auf Chromium Desktop und Pixel 7:
Bestandsauswahl, getrennte Spielstände, öffentliche DTOs, Lösungskontrolle,
Hinweistexte jedes ausgewählten Rätsels im Bordbuch und in der Gesamtliste sowie
Radar an einem tatsächlichen exportierten Mehrhexobjekt. Jeder Teil seiner
Grundfläche liefert dieselben Mindestabstände zu allen 25 Zellen; Radarbedienung
verändert weder Notizen noch Route.

Zusätzlich bestanden vor dem Pilot 30 vorhandene B2-/H1-/Mehrhex-Radar-Prüfungen.
Die freigegebenen Radar- und Formatterimplementierungen sind bytegleich zu main.
Keine neue GUI, keine Veröffentlichung und keine Freigabe menschlicher Qualität.
