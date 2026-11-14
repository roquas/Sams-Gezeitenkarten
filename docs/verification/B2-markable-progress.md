# B2 – markierbare Zwischenfortschritte, Profilversion 2

[Lesbarer Vergleich](B2-deduction-profile-v2/report.md) ·
[Unveränderte Profilversion 1](B2-deduction-profile/report.md)

Die Erweiterung zeigt Ausschlüsse, verbleibende Alternativen und feste Positionen
als gleichwertige feldbezogene Befunde. Sie verwendet die vorhandene Profillogik
und die bereits implementierten Regeln. Der Bericht enthält Lösungsschlüsse und
gehört nicht in einen lösungsfreien Spieltestexport.

## Verwendung und Bestandsschutz

Node ≥22, offline, keine Zusatzpakete:

```sh
npm run report:b2:progress
npm run report:b2:progress -- --check
node --test tests/contracts/b2-markable-progress.test.mjs
```

Ohne Option ist die Auswertung rein lesend und zeigt den Bericht auf stdout.
`--check` prüft neun kompakte JSON-Dateien und den Vergleich bytegenau.
`--write` erneuert ausschließlich diese zehn Dateien unter
`docs/verification/B2-deduction-profile-v2/`. Es werden dabei keine
Diagnosezustände berechnet. Für den neuen Vergleich bleibt der bisherige
`npm run report:b2:profile` unverändert verfügbar.

Version 2 trägt `format: "b2-deduction-profile-2"` und
`baseFormat: "b2-deduction-profile-1"`. Alle bisherigen Felder und Aussagen werden
vom unveränderten `buildProfile()` übernommen. Die Ergänzung heißt
`intermediateProgress`, mit `format: "b2-markable-progress-1"`.
Die sechs versionierten Dateien aus PR #107 bleiben **byteidentisch**.
Ihre Hashes und die Gleichheit sämtlicher Basisfelder werden durch Regressionen
abgesichert; die bisherigen Diagnoseprogramme und Artefakte bleiben unverändert.

## Datenformat der Zwischenfortschrittsansicht

`intermediateProgress.states` enthält ausschließlich tatsächlich untersuchte
Zustände. Zustandsschlüssel, Quelldatei und 1-basierte JSONL-Zeile binden jeden
Befund. Die Reihenfolge nach Hinweisanzahl/ID dient dem Lesen, nicht der
Rekonstruktion einer menschlichen Reihenfolge.

| Feld je Zustand | Bedeutung |
| --- | --- |
| `state`, `source`, `clueIds` | Verweis auf den tatsächlich berechneten Zustand und seine Hinweise |
| `local.additionalFixedHours` | Zusätzliche feste Stunden gegenüber der lokalen Basis, ohne Start und Vorgaben |
| `local.fields[].hour` | Stunde des markierbaren Befundes |
| `local.fields[].marks.cross` | Sicher ausgeschlossene Felder relativ zum selben lokalen hinweisfreien Fixpunkt |
| `marks.question` | Verbleibende lokale Alternativen am Zustandsfixpunkt, falls mehr als ein Feld bleibt |
| `marks.check` | Einzelne feste Position oder `null` |
| `witnesses` | Tatsächliche lokale Schritte, die zusätzliche Ausschlüsse bzw. die Festlegung tragen |
| `exact.fields` | Getrennte exakte Ausschlüsse, Restmengen und Festlegungen gegenüber der exakten Basis; keine lokalen Regelzertifikate |

Die Basis enthält dieselben Start-/Vorgabebedingungen wie der betrachtete
Zustand. Start, Vorgaben und bereits hinweisfrei gewonnene Positionen werden
nicht als Hinweisleistung ausgegeben. Unveränderte Basismengen sind weiterhin
unter `evidence.localCoverage.baseline` vorhanden; im Bericht werden sie als
Kontext kenntlich gemacht. Feldfestlegung und benachbarte feste Kante bleiben
wie in Version 1 ein Feldmeilenstein mit angehängten Übergangsnachweisen.

Ein Fragezeichen bedeutet **lokal noch nicht ausgeschlossen**. Es beweist keine
Erweiterbarkeit zu einer legalen Route. Auch ein großer verbleibender Feldbereich
kann durch konkrete Ausschlüsse nützlichen Fortschritt enthalten; es gibt keine
Zwei-/Dreiergrenze für das Erscheinen in der neuen JSON-Ansicht.

### Regelzeugen und Wiederverwendung

Jeder lokale Feldzeuge nennt `step`, `rule`, direkte `clueIds`, tatsächlich
zitierte `premises` sowie die `reachableClueIds` seiner transitiven Vorfahren
inklusive des Schritts selbst. Diese Hinweise reichen für das gespeicherte
Zertifikat, müssen aber nicht alle notwendig sein.

`removed` zählt nur zusätzliche Ausschlüsse gegenüber der lokalen Basis.
`fixed` bezieht sich auf diesen einzelnen Trace-Schritt. `marks` dagegen zeigt
den endgültigen Zustand nach dessen gesamter Propagation. Das wird im Bericht
beim hervorgehobenen C-Beispiel getrennt erläutert.

`reusedBy` enthält direkte Verbraucher einer zitierten Prämisse, auch wenn diese
zunächst nur eine Kante weiter einschränken. `fixedFollowUps` nennt bekannte
transitive Folgefestlegungen mit Trace-ID, Stunde und der Kennzeichnung
`certificate-descendant`. Das sind belegte Zertifikatspfade, kein optimaler oder
minimaler menschlicher Lösungsweg. Es werden keine Verbindungen zwischen
Trace-IDs unterschiedlicher Zustände erfunden.

Der Projektor spielt nur die gespeicherten Feldlöschungen nach, prüft den
entstehenden Fixpunkt und bindet die Zeugen. Er führt keine neue Propagation
und keinen neuen Beweisprüfer ein. Fachliche Regelkorrektheit bleibt Aufgabe
der vorhandenen Diagnose und des vorhandenen Prämissenprüfers.

### Feldmarkierungen und relationale Alternativen

`intermediateProgress.relationalEvidence` verweist auf die vorhandenen lokalen/
exakten Kopplungen unter `evidence.representation`. `markability: "endpoints-only"`
und `associationMarksAvailable: false` kennzeichnen die Darstellungsgrenze.
Die heutige GUI kann die möglichen Endpunkte pro Stunde markieren, ihre
Zuordnungen aber nicht vollständig speichern. Der Bericht nennt beispielsweise
D: Stunde 3→4 = A1→A2 oder A2→A1. Es wird weder eine neue GUI vorgeschlagen noch
jede Kopplung als schwer oder schlecht bewertet.

`singleClueCompleteWitnesses` nennt bekannte Einzelhinweiszustände, in denen alle
sechs Stunden lokal feststehen. Eine leere Liste ist bei fehlenden Einzelzuständen
kein Negativbeweis; `singleClueCoverageComplete` hält diese Abdeckung ausdrücklich
fest. Auch dieses Merkmal ist keine Qualitätsnote.

## Bekannte Fälle und Quellenreproduktion

Die fünf bisherigen Referenzfälle werden unverändert aus ihren gespeicherten
Zuständen gelesen. A–D sind genau vier zusätzliche, bereits existierende
registrierte Spieltestvarianten:

| Fall | Originalname | Gespeicherte Zustände |
| --- | --- | ---: |
| A | B2-S02-M010-E4-R00-V01 | 2 |
| B | B2-S02-M000-A1-R00-V01 | 8 |
| C | B2-BC-T06-M005-E3-R00 | 32 |
| D | B2-S02-M017-C3-R00-V02 | 32 |

Die Quellen unter `B2-deduction-progress/private/` enthalten `logic`, Quellhashes,
Variantenbindung und kompakte Diagnosetraces. Eine gespeicherte Zielroute wird
nicht an die Diagnose übergeben. Der Quellenadapter validiert die vorhandenen
S02-/BC-Registries, verwendet `diagnosePuzzle()` und ergänzt ausschließlich die
zehn fehlenden Viererzustände von C/D mit unveränderten lokalen Regeln und Solver.
Damit können die bekannten Minimalitäten dieser beiden Fälle jetzt vollständig
belegt werden, ohne historische Profile umzuschreiben. Andere fehlende
Teilmengen (insbesondere bei T02/T07) bleiben unbekannt.

Die separate Quellenreproduktion ist ausdrücklich auf **vier Fälle und 74
Zustände** begrenzt, ohne neue Kandidatensuche. Sie benötigt in dieser Umgebung nur wenige
Sekunden. Sie wird beim normalen Profilaufruf nicht ausgeführt:

```sh
node scripts/report-b2-progress-evidence.mjs --check
```

Nur `--write` erneuert diese fünf Quelldateien ausdrücklich. Codehashes des
Quellenadapters und seiner maßgeblichen unveränderten Diagnose-/Engine-Module
stehen in `sources.json`. Registries, Kandidatenströme und Zustandsdateien sind
per SHA-256 gebunden. Fehlende oder veränderte Quellen brechen die Auswertung ab.
Es gibt keine Zeitstempel, Laufzeiten oder absoluten Pfade in den Profildateien.

## Tatsächliche Ergebnisse und Regressionen

- **A:** H1 trägt die vollständige lokale Route. Kein notwendiger
  Mehrhinweis-Kombinationsschluss; daraus folgt keine menschliche Qualitätsnote.
- **C:** H1/H2 liefert bereits ohne weitere feste Stunde fünf konkrete
  Ausschlüsse für Stunde 4. D19 ist `count-bounds`, mit tatsächlichen Prämissen
  D11/D18/D15. Der vorhandene Prüfer bestätigt den Schluss und lehnt ihn nach
  Kappung der notwendigen D18-Kante ab. Weitere bekannte Zustände machen den
  Anfangsblock, eine Zweiermenge in Stunde 4 und nachfolgende Festlegungen sichtbar.
- **D:** H1 liefert frühe Ausschlüsse, H2 allein eine Zweiermenge und beide
  gemeinsam die feste erste Stunde. Stunde 6 besitzt früh fünf Möglichkeiten,
  erst im Vollsatz eine feste Position. Der Rest enthält gekoppelte Alternativen.
  Exakte Festlegungen werden nicht als lokale Erklärungen ausgegeben.
- **V1/V2:** Gleicher Vektor 3/4/4/2/1/5 und bekannte Einstiegs-/Abschlussmerkmale;
  unterschiedliche Zeugen und Mechanismen für Stunde 3 bleiben erhalten.
- **B:** Getrennte bekannte Zeugen und Verbindungsschluss, keine ergänzte
  menschliche Qualitätsbewertung.

Die feste Auswahl von Lesebeispielen im Markdown dient der Übersicht. Alle
bekannten Zustände und Zeugen stehen im JSON. Die Beispiele sind weder eine
Rangfolge noch eine berechnete menschliche Route. Ein fehlender Lesebeispielzustand
wird als unbekannt ausgegeben, niemals durch einen anderen Zustand ersetzt.

Tests prüfen die markierbaren Befunde, tatsächliche Provenienz, bekannte
Weiterverwendungen, C-Prämissenkontrolle, unbekannte Zustände, Unabhängigkeit
von der Eingabereihenfolge, Bestandsschutz und deterministische Reproduktion.
Es gibt keine Änderung an Engine, Solver, Deduktionsregeln, Generator, Rätseln
oder Spieloberfläche, keine umfangreichen neuen Kandidatenläufe und keinen
menschlichen Beweisplaner oder automatischen Selektor.

## Validierung dieser Lieferung

Am 14.11.2026 unter Node v24.19.0: **34/34 gezielte Tests** bestanden
(bestehende Engine-/Diagnose-/V1-/V2-/Profilverträge und sieben neue Regressionen).
Die neuen fünf Quelldateien und zehn Version-2-Ausgaben reproduzieren bytegleich.
Alle bisherigen acht allgemeinen, drei V1-, zwei V2- und sechs Version-1-Dateien
wurden mit ihren unveränderten `--check`-Befehlen bytegleich geprüft.
Dokumentationsverweise, repository-relative Profilpfade und `git diff --check`
wurden geprüft. Die vorhandene CI findet den neuen Vertragstest automatisch.
Ein Browserlauf ist für diese reine Offline-Auswertung nicht erforderlich.
