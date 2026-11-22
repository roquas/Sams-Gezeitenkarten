# S04-C – begrenzter Neugenerierungsvergleich

**Privat: enthält Lösungen, Diagnosen und Gruppenzuordnungen.** Phase A/B ist
abgeschlossen; Phase C und der externe Spieltestbestand sind nicht erzeugt.
[Vorabvertrag](contract.md), [Konfiguration](../../../scripts/config/s04-c-v1.json),
[maschinenlesbares Ergebnis](pilot/summary.json), [Ressourcenbeobachtungen](pilot/observations.json).

**Empfehlung: A, vier Neustarts mit aktiver S04-B-Normalisierung.** Acht Neustarts
lieferten im festen Diagnosebudget keine zusätzliche bevorzugte Karte. Das ist
eine Ressourcenentscheidung für diesen Vertrag, kein Beweis gegen die Qualität
der zusätzlichen, noch unbewerteten Varianten und kein nachgewiesener Gewinn
menschlicher Rätselqualität.

## Vorregistrierung und tatsächliche Durchführung

Basis `928dd1a5e5d043c962612b07be998686a025ba7b`, einschließlich S04-A, S04-B und
integriertem Betatest-B1. [PR #116](https://github.com/roquas/Sams-Gezeitenkarten/pull/116)
ist laut tatsächlichen Metadaten gemergt; sein veralteter Beschreibungstext war
kein Schnittstellenbeleg. Diff und Implementierung bestätigen den unveränderten
B1-Routenformat-1/B2-Format-2-Vertrag. [Issue #21](https://github.com/roquas/Sams-Gezeitenkarten/issues/21)
bleibt für Redaktion und externe Freigabe verbindlich.

Programm/Auswahlvertrag zuerst in `06e3829b7508c49774176f53e8fb7016270fa276`
committed; vor Erzeugung ergänzte `6eb06b489ee7a543b29fcf1855a3e7d4576d569a`
keine Kriterien, sondern konkrete historische Budgetmaxima und eine Aussagegrenze.
Der verbindliche vollständige Programmcommit steht in [manifest.json](pilot/manifest.json).
Node exakt **v22.23.3**. Ein abgeschlossener Pilot, keine Ersatzgenerierung und
keine nach Ergebnissen veränderte Präferenz, Quote oder Suchgrenze.

Sechs neue Karten aus sechs Versuchen mit Seeds 404000–404005, freigegebene
Belegungen. M004 hat keinen zulässigen Start und wurde nicht ersetzt.
14 B1-Starts vollständig gezählt (29.206 Knoten); fünf neue Karte/Start/Ziel-Fälle
vorbereitet. Keine historischen Karten oder Varianten wiederverwendet. Alle fünf
Hinweispools vollständig (insgesamt 18.058 Parameter); keine unvollständige
Enumeration oder Parameterprüfung als negatives Qualitätsurteil behandelt.

## Vergleich bei gleicher Diagnosekapazität

| Größe | A: 4 Neustarts | B: 8 Neustarts |
| --- | ---: | ---: |
| Technisch gültige Varianten / unabhängige Prüfungen | 20 / 20 | 40 / 40 |
| Tatsächliche Neustarts | 20 | 40 |
| Solverchecks | 994 | 1.968 |
| Cachetreffer | 66 | 132 |
| Matchauswertungen | 881.664 | 1.516.435 |
| Routenfilterauswertungen | 1.984.908 | 4.235.128 |
| Diagnosen / Zustände | 12 / 188 | 12 / 188 |
| Früh ausgeschlossen: finale Hinweiszahl | 1 | 2 |
| Früh ausgeschlossen: Einzelhinweisdominanz | 0 | 0 |
| Lokal unbewertet wegen Diagnosekapazität | 7 | 26 |
| P1 erfüllt / P2 erfüllt / P3 erfüllt | 11 / 5 / 11 | 11 / 5 / 11 |
| Alle drei Präferenzen erfüllt: Varianten / Karten | 5 / 3 | 5 / 3 |
| Bevorzugte Verlaufssignaturen / Typkombinationen / Formkombinationen | 5 / 5 / 5 | 5 / 5 / 5 |
| Pilotkohorte: bevorzugt / Kontrolle / Karten gesamt | 3 / 1 / 4 | 3 / 1 / 4 |
| Bevorzugte Karten je 1.000 Solverchecks | 3,018 | 1,524 |
| Bevorzugte Karten je Mio. Matches | 3,403 | 1,978 |
| Bevorzugte Karten je Mio. Filter | 1,511 | 0,708 |

Alle 20 A-Varianten sind identische logische Präfixvarianten in B. Insgesamt gibt
es **40 verschiedene neue Varianten**, keine 60 unabhängigen Fälle. Der feste
Rundenplan diagnostiziert in beiden Armen dieselben zwölf Varianten; damit ist
auch die gleiche Auswahl zu erwarten. Für die 19 zusätzlichen früh zulässigen
B-Varianten gibt es **keinen** lokalen Qualitätsbefund. Die Werkzeuge ermöglichen
hier keine belastbare Aussage über ihren potenziellen Qualitätsvorteil ohne
zusätzliche Diagnosekapazität. Diese wird nicht nachträglich ausgegeben.

Pro Arm: ein diagnostizierter Fall ohne P1-Einstieg, sechs mit LOCAL_REMAINDER;
sieben Fälle im vorab definierten Kontrollrahmen, fünf bevorzugte Varianten.
Diese Dispositionen sind experimentelle Präferenzen, keine mathematischen Defekte.
Acht weitere diagnostizierte, technisch gültige Fälle sind nach der Kohortenwahl
nicht ausgewählt. Technische Fehler, Frühablehnung, Kontrollberechtigung,
fehlende Diagnose und gültig-nicht-ausgewählt sind in `raw.jsonl` getrennt.

Alle fünf Suchen je Arm enden regulär am Neustartbudget und bleiben als Suche
unvollständig. **Keine** gespeicherte Gültigkeitsprüfung ist unvollständig.
Keine Solver-/Match-/Filtergrenze wurde erreicht, keine NORMALIZED_REDUNDANT-
Ablehnung trat auf. Das beantwortet nicht, ob andere Karten solche Grenzen erreichen.

Die gemeinsame Vorbereitung kostete beobachtet 54,65 s, A einschließlich
Verifikation/Diagnosen 9,72 s, B 15,22 s; Gesamt 79,61 s unter dem 120-s-Watchdog.
CPU des Workerprozesses: 12,66 s user + 1,39 s system; Spitzen-RSS 182.448 KiB.
CPU der Git-Unterprozesse ist darin nicht enthalten. Parallel laufende andere
Aufgaben, Cachezustand und feste Armreihenfolge begrenzen Zeitvergleiche;
Entscheidung und Kostenquotienten beruhen auf tatsächlichen Operationszählern.
Gemeinsame Enumeration, B1-Replay, zusätzliche Baseline-Orakel und Routenauswahl
sind separat in `commonPreparation` erfasst. Für Baseline-Orakel wird nur die
Aufrufzahl und Knotenobergrenze behauptet, kein nicht gemessener Istverbrauch.

## Normalisierung und unabhängige Quellenprüfung

Jeder Suchaufruf übergibt `count-distance-extremes-1`; jede Ausgabe trägt den
verpflichtenden S04-B-Aufbereitungsbeleg. Finaler Satz, Identität,
Auslassungsnachweise, Einzelhinweise und Diagnosen benutzen dieselben Hinweise.
In diesem neuen Sample war **keine** Intervallvereinigung nötig (`normalized: 0`);
daraus wird kein gemessener Normalisierungsgewinn behauptet. Alle finalen Sätze
sind bereits in Normalform, ohne zusammenfassbare Extremzählungsfragmente.
Die tatsächliche Vereinigung und erneute Budget-/Qualitätsprüfung sichern die
bestehenden S04-B-Regressionen mit festen Gegenfällen ab.

Alle 60 Arm-Datensätze (40 verschiedene Varianten), auch Frühablehnungen, wurden
unabhängig mit `verifyCandidates` auf Zielgleichheit, Eindeutigkeit, Irredundanz,
Fingerprints, Einzelhinweis-Wirkungsschlüssel und Herkunft geprüft. Separate
Erzeugerbelege authentifizieren ursprüngliche IDs/Parameter. Erwartete kanonische
Vertragsdigests aus dem bei Erzeugung vertrauenswürdigen In-Memory-Vertrag:

- A: `326a58d321741d04a58ea476668d69d2d76b2cb61708886c27f8362fa2aefd67`
- B: `f0d76e42adf863c6c447fa2cd5666c32d83787d8b2b874383ccf235d61e6709f`

Bei externer Prüfung diese Digests aus dem geprüften Commit übernehmen, nicht aus
einer möglicherweise gemeinsam manipulierten Kandidaten-/Belegdatei neu ableiten.
Beispiel (B analog):

```sh
node scripts/verify-puzzle-experiment.mjs docs/verification/S04-C/pilot/A/generated.jsonl \
  --origin-contract docs/verification/S04-C/pilot/A/candidate-origins.json \
  --expect-origin-contract-sha256 326a58d321741d04a58ea476668d69d2d76b2cb61708886c27f8362fa2aefd67
```

Der bestehende B2-Leser prüft den vollständigen neuen B1-Bestand gegen die vier
Originalbatchdateien einschließlich nicht ausgewählter Karten/Starts, Release,
Seeds und Motivbelegungen. Die neuen Vertragstests kontrollieren zusätzlich jede
Kandidatenbindung an B1-Karte, Start und Belegung. Definitionen und komprimierte
Diagnosezustände haben getrennte Bytehashes; der Profilhash bindet die daraus
berechneten Signale. Komprimierte Quellzeilen beziehen sich auf den entpackten
JSONL-Strom. Engine, Solver, lokale Regeln, Qualitätsimplementierung, historische
Bestände und Produktionsoberfläche sind unverändert.

## Private Pilotkohorten und nächste Entscheidung

Beide Arme wählen dieselben vier logischen Fälle: Kontrolle M001, bevorzugt
M000, M005 und M003; vollständige Identitäten/Regeln in `A/summary.json` bzw.
`B/summary.json`. Die Kontrolle M001 verletzt P2; sie stammt aus dem gesamten
technisch gültigen, früh zulässigen, diagnostizierten Gegenrahmen **vor** Auswahl
der bevorzugten Fälle. Keine nachträgliche Kontrollzuweisung aus dem Top-Pool.
Die übrigen bevorzugten Varianten derselben Karten sind keine unabhängigen Fälle.

Das vorhandene v2-Logik-/Präsentationsmodell und die öffentliche Allowlist werden
an diesen neuen Daten ausschließlich im Speicher auf Kompilierung, gleiche
Lösung und Ausschluss privater Felder geprüft. **Kein** neuer Stock, öffentlicher
Export, Flavor-Automatismus oder Betatestkatalog wird registriert. Technische
Kontrollformulierungen aus dieser Formatprüfung sind keine redaktionelle Freigabe.

**Separater Folgeschritt empfohlen:** eigener vorab versionierter Phase-C-Vertrag
auf erneut geprüftem main, Sucharm A, weiterhin kartenweise Diagnoseverteilung.
Für das Ziel 9–12 bevorzugte Karten plus 3–4 Kontrollen zunächst höchstens 24 neue
Karten/48 äußere Versuche und zwei Diagnoserunden (max. 48 Diagnosen/3.120 Zustände)
zur fachlichen Entscheidung vorlegen. Diese Größen sind ein Planungsvorschlag,
keine hier geprüfte oder automatisch ausführbare Produktionskonfiguration; fünf
Ziele tragen keine belastbare Hochrechnung der Ausbeute. Frische Seeds und
Kontrollregel vor dem Lauf festlegen; keine Auffüllpflicht und keine nachträgliche
Budgetverlängerung. Danach Redaktion und unabhängige Einzeltextprüfung nach #21.
Weder größere Diagnosevergleiche noch der endgültige 12–16er-Pool wurden gestartet.

## Reproduktion und Prüfung

```sh
# macOS: kanonischer Temp-Pfad für die bestehenden älteren Fixture-CLIs
TMPDIR=/private/tmp node --test tests/contracts/s04-c.test.mjs tests/contracts/s04-c-evidence.test.mjs
# Exakt Node v22.23.3; läuft im separaten Checkout am aufgezeichneten Programmcommit
TMPDIR=/private/tmp node --test tests/reproduction/s04-c.test.mjs
```

Reproduktion wiederholt nur denselben festen kleinen Pilot, keine neuen Seeds,
keine zusätzlichen Kandidaten. Sämtliche deterministischen Dateien einschließlich
Gzipbytes, B1-Quelle, Ursprungsverträgen, Plänen und Auswahl werden verglichen;
`observations.json` ist als einzige Datei von der Bytegleichheit ausgenommen.
Die bestehende Unit-CI erfasst die neuen Vertrags-/Nachweisprüfungen. Der kleine
Byte-Replay ist separat mit exakt dieser Node-Version und vollständiger Git-Historie
auszuführen; der verfügbare GitHub-OAuth-Zugang gestattet keine Workflowänderung.
Der initiale lokale Regressionsanlauf mit macOS-Symlink-Temp-Pfad scheiterte an
einem bestehenden CLI-Einstieg, nicht an einer abgeschwächten Assertion. Die
Wiederholung verwendet `/private/tmp`; Tests/Produktcode wurden dafür nicht geändert.
