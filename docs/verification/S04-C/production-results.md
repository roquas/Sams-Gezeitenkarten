# S04-C Phase C – neuer privater Kandidatenbestand

**11 bevorzugte Fälle und 4 Kontrollen auf 15 unterschiedlichen Karten/Zielen.**
Die Zielgrößen sind erreicht, ohne Nachgenerierung oder Regeländerung.
Vollständige neue Daten bleiben lokal privat; dieses öffentliche Dokument nennt
keine Zuordnung neutraler Kennungen zu Gruppen, Lösungen oder Auswahlgründen.
[Vorregistrierter Vertrag](production-contract.md),
[feste Konfiguration](../../../scripts/config/s04-c-production-v1.json),
[unabhängig bestätigte Hashanker](production-receipt.json).

## Fixierung und Durchführung

Aktueller main beim Start: `63092cacd251229ec6adc2552e1a821c3a5b4545`, nach
#120 und #119. Keine zwischenzeitliche Änderung an Generator-/B1-/B2-/Solver-
Schnittstellen oder S04-B-Quellenverträgen. Programm und vollständiger Vertrag
wurden vor der ersten Generation in
`ed67180e800aedc8ea12709e2a824fb9198a726b` committed. Ergebnis-/Prüfbericht folgt
als separater Commit. Ausführung und Replay exakt mit Node **v22.23.3**.

Experimentidentität steht vollständig im Receipt. Ein neuer Lauf, keine
Ersatzkarten, Nachsuche, Budgeterhöhung oder Veränderung nach Ergebnissichtung.
Neue Karten-/Belegungsseeds beginnen 405000, Ziel-/Suchseed 405 mit neuer
Zielnamespace; vollständiger maximaler Seedrahmen steht im Vertrag.
Die Empfehlung für vier Neustarts bleibt eine Ressourcenentscheidung unter
begrenzter Diagnosekapazität, kein Beweis gegen zusätzliche Varianten.

## Tatsächlicher Bestand und Vollständigkeit

| Größe | Ergebnis |
| --- | ---: |
| Äußere Kartenversuche / Obergrenze | 29 / 48 |
| Akzeptierte neue Karten / Obergrenze | 24 / 24 |
| Abgelehnte Kartenversuche | 5 |
| Vollständig gezählte B1-Starts | 57 |
| Vorbereitete Karte/Start/Ziel-Fälle | 24 |
| Vollständige Hinweispools / Parameter insgesamt | 24 / 81.481 |
| Gültige Varianten / unabhängige Kandidatenprüfungen | 96 / 96 |
| Experimentell früh ausgeschlossen | 7 |
| Diagnosen / Diagnosezustände | 48 / 1.261 |
| Qualitativ unbekannte Varianten | 41 |
| Bevorzugt berechtigte Varianten / Karten | 13 / 12 |
| Kontrollrahmen vor Auswahl | 35 |
| Ausgewählt bevorzugt / Kontrolle | 11 / 4 |
| Diagnostiziert, technisch gültig, nicht ausgewählt | 33 |
| Unterschiedliche ausgewählte Karten / Zielrouten / Verlaufssignaturen | 15 / 15 / 15 |

Fünf Kartenversuche scheiterten am bestehenden inneren Geometrieversuch:
`GENERATION_EXHAUSTED` mit Ursache `OBJECT_SPACING_EXHAUSTED` (je fünf;
**dieselben** fünf Versuche, keine zehn Ablehnungen). Alle bleiben im Batchlog.
Alle 24 akzeptierten Karten lieferten einen geeigneten ersten Start und eine
zulässige Baseline; keine spätere Karte wurde wegen schlechter Ausbeute ersetzt.
Historische S02-/S03- und Pilotkarten/Varianten sind per gebundenem Inventar
verboten und wurden nicht übernommen.

Alle B1-Starts, Zielroutenräume und Hinweispools sind vollständig. Die 24
Kandidatensuchen endeten regulär nach vier Neustarts und heißen weiterhin
**unvollständige Suche**: Es gibt keinen Anspruch, alle möglichen Hinweissätze
gefunden zu haben. Die Gültigkeitsprüfungen aller gespeicherten Sätze sind
vollständig; keine budgetbedingt unbekannte Eindeutigkeit wurde akzeptiert.

Frühfilter: sechs Varianten mit `CLUE_COUNT`, eine mit
`SINGLE_CLUE_DOMINANCE`; mathematisch gültig, experimentell früh ausgeschlossen.
Unter 48 Diagnosen: P1 erfüllt bei 47, P2 bei 13, P3 bei 47; 34-mal
`LOCAL_REMAINDER`, einmal `NO_MARKABLE_ENTRY`. Alle 41 nicht diagnostizierten
Varianten liegen außerhalb der vorab begrenzten zwei Runden; keine dritte
Runde trotz verbleibender Zustandsreserve. Genau zwei Diagnosen auf jeder der
24 Karten. **Unbekannt ist kein negatives Qualitätsurteil.**

Keine harte Kandidatenablehnung und keine Solver-/Match-/Filter-/Parameter-
Grenze wurden erreicht. Alle finalen Sätze sind in S04-B-Normalform; in diesem
Sample war keine tatsächliche Intervallvereinigung erforderlich. Kein
behaupteter gemessener Normalisierungsvorteil.

## Auswahl und Grenzen

Bestehende Hash-/Salt-Auswahl unverändert, Kontrollrahmen vor bevorzugter
Auswahl, eine Karte insgesamt und höchstens zwei je Signatur. Die vier
Kontrollen verletzen alle P2; eine davon zusätzlich P1 und P3. Sie bleiben
mathematisch gültig und erfüllen dieselben frühen Ausschlüsse. Keine absichtlich
defekten Fälle oder nachträglich umbenannten Favoriten.

Eine der vier Kontrollreservierungen belegt eine Karte, die auch eine
bevorzugt berechtigte Variante hat. Dieser vorab festgelegte Vorrang reduziert
zwölf grundsätzlich geeignete Karten auf elf ausgewählte bevorzugte Karten.
Die konkrete Reservierung und sämtliche Geschwister sind im **privaten**
`C/control-reservations.json` dokumentiert; keine doppelte Kartennutzung.

Die 15 ausgewählten Fälle haben 15 Verlaufssignaturen, zehn Typkombinationen
und 15 Hinweisformkombinationen. Im gesamten bevorzugten Teilpool gibt es
13 Signaturen, acht Typkombinationen und 13 Formkombinationen. Technische
Signaturvielfalt garantiert keine andere menschliche Erfahrung.

P1–P4 sind experimentelle Präferenzen mit bekannten Gegenbeispielen. Es gibt
keine Schwierigkeitszuweisung, keinen Gesamtscore und keinen kausalen Beweis
für ihren Nutzen aus diesem kleinen gezielt zusammengestellten Bestand.
Die neun bis zwölf bevorzugten und drei bis vier Kontrollfälle sind erreicht;
keine Unterausbeute, keine versteckte Auffüllung. Redaktionelle oder menschliche
Qualität ist noch nicht gemessen.

## Operationen und gemessene Ressourcen

| Operation | Verbrauch | Festgelegte Grenze |
| --- | ---: | ---: |
| Neustarts | 96 | 4 je Ziel, höchstens 96 |
| Solverchecks | 6.117 | 2.000 je Ziel, höchstens 48.000 |
| Cachetreffer | 339 | Beobachtung, keine Auswahlregel |
| Matches | 4.324.504 | 5 Mio. je Ziel, höchstens 120 Mio. |
| Routenfilter | 11.506.231 | 20 Mio. je Ziel, höchstens 480 Mio. |
| Diagnosen | 48 | 48 und zwei je Karte |
| Zustände | 1.261 | 3.120 insgesamt, 65 je Diagnose |

Gemeinsame Vorbereitung: 92.434 B1-Knoten plus einmal derselbe B1-Prüfreplay,
35.787 Workspace-Knoten, 24 Baseline-Orakel mit je 100.000 Knotenobergrenze
(Istverbrauch nicht instrumentiert), 15.140 Zielauswahlknoten und 81.481
Hinweisparameter. Keine Vermischung dieser Operationen mit Solverchecks.

Gemessener Produktionsworker: **18,358 s** insgesamt, davon gemeinsame
Vorbereitung 11,628 s. Worker-CPU 9,930 s user + 0,619 s system, Spitzen-RSS
278.288 KiB. Heaplimit 768 MiB, Watchdog 900 s; kein behauptetes RSS-Hardlimit.
Die Vorabschätzung aus dem Pilot war rund 260 s mit Reserve bis 900 s;
diese Schätzung wird nicht rückwirkend als Messung ausgegeben. Cache- und
Hostzustand begrenzen Vergleiche mit früheren Laufzeiten.

Getrennter Replay: Worker 51,087 s, Harness 53,886 s, Worker-CPU 18,992 s user
+ 1,115 s system, Spitzen-RSS 192.336 KiB. Währenddessen liefen lokale
Regressionen; daher kein Geschwindigkeitsvergleich zwischen Läufen.
Git-Unterprozess-CPU ist in beiden Worker-CPU-Zahlen nicht enthalten.
Geeignete Karten vor Kontrollreservierung je 1.000 Solverchecks: 1,962;
je Mio. Matches: 2,775; je Mio. Filter: 1,043. Keine menschliche Qualitätsmetrik.

## Unabhängige Verifikation und Byte-Replay

Der vorhandene unabhängige Kandidatenprüfer bestätigte sämtliche **96** Sätze,
auch die sieben frühen Ablehnungen und alle nicht ausgewählten Varianten:
vollständige legale Räume, eindeutige Zielgleichheit, Irredundanz,
Fingerprints/Effektidentitäten und getrennt gepinnte S04-B-Herkunftsbelege.
Zusätzlicher Offline-Prüfer bestätigte B1-Karte/Start/Zielordinal und
Release-Belegung, alle 48 Diagnosen/1.261 Zustände, Gzip-/Definitions-/Profil-
Hashes, unveränderte Signale, Plan, Kohorten und private Übergabe.

Erwarteter Herkunftsdigest wurde im vertrauenswürdigen Erzeuger aus dessen
Speicher festgehalten und vom **getrennten vollständigen Replay** am gepinnten
Programm unabhängig bestätigt. Der öffentliche Receipt übernimmt diesen
bestätigten Anker; der Prüfer leitet ihn nicht aus zu prüfenden Kandidaten-
oder Ursprungsdateien ab. Unbekannter oder falscher Prüfanker blockiert Prüfung.

**68 deterministische Dateien, 3.463.206 Bytes bytegleich.** Einschließlich
Gzipbytes, aller Batchversuche, B1, Kandidaten, Ursprungsbelege, Diagnoseplan,
Auswahl, Kontrollreservierungen, Übergabe, Manifeste und Dateiinventar.
Ausschließlich `observations.json` mit tatsächlichen Ressourcenmessungen ist
vom Vergleich ausgenommen. Vollständige Dateiliste und Bytehashes stehen im
privaten `replay.json`; keine bloße Prüfung geparsten JSONs.

## Private Redaktion und Reproduktion

Weil das Repository öffentlich ist, werden die neuen lösungshaltigen Daten
**nicht** auf GitHub oder in einen öffentlichen Spieltestexport übertragen.
Der Projektverfasser erhält lokal das vollständige Archiv samt Original-
Generatorstdout, unabhängig bestätigtem Receipt, Prüfprotokollen und Replay.
Die neue PR enthält die ausführbare Produktion/Prüfung und Hashanker; eine
Review der konkreten Falldaten braucht zusätzlichen privaten Zugriff durch
den Projektverfasser. Die Byteanker allein ersetzen diese Inhaltsreview nicht.

`handoff/overview.md` nennt nur neutrale Kennungen C-01..C-15 und den
Redaktionsstatus. `handoff/private-cases.json` enthält unveränderte strukturierte
v2-Definitionen/Belegungen, keine Präsentationstexte oder Gruppenlabels.
Gruppenzuordnungen, Lösungen und Diagnosen bleiben im privaten Audit.
Die v2-Präsentation/öffentliche Allowlist wurde für alle 15 Fälle ausschließlich
im Speicher geprüft; kein neuer Stock, Manifest-Eintrag oder Export.

```sh
# Vollständige Git-Historie und exakt Node v22.23.3 erforderlich.
# PRIVATE_RUN und REPORT müssen auf lokale private Pfade zeigen.
node scripts/verify-s04-c-production.mjs "$PRIVATE_RUN" \
  docs/verification/S04-C/production-receipt.json
GK_S04_C_PRIVATE="$PRIVATE_RUN" TMPDIR=/private/tmp \
  node --test tests/reproduction/s04-c-production.test.mjs
TMPDIR=/private/tmp node scripts/replay-s04-c-production.mjs "$PRIVATE_RUN" \
  docs/verification/S04-C/production-receipt.json "$REPORT"
```

Vor externem Test: kleine zusammenhängende Geschichte und passende Namen nach
Issue #21, Qualitätsreferenz „Der verschwundene Kompass“, eigenständige
semantische Rückübersetzung jedes Textes gegen Logik; Einleitung/Namen auf
Zusatzinformationen prüfen. Logik und Herkunft unverändert binden.
Schwierigkeit erst mit menschlichen Beobachtungen kalibrieren. Noch keine
Flavor-Produktion, Veröffentlichung, externe Testserie oder Mergefreigabe.

## Regressionsnachweise

- Zehn gezielte Vorabtests (neuer Produktionsvertrag plus unveränderte
  Pilot-/Präferenz-/Kontroll-/Planregeln) bestanden.
- Drei neue private Nachweistests bestanden: vollständige Verifikation,
  falscher unabhängiger Herkunftsanker, manipulierte Gzipbytes.
- Neun historische Nachweis-/Byte-Reproduktionstests für S02, Suchvergleich,
  S03-v1/v2 bestanden, exakt Node v24.19.0.
- Der unveränderte kleine A/B-Pilot wurde separat mit Node v22.23.3 erneut
  bytegleich reproduziert (ein Test bestanden).
- 20 Inhaltstests bestanden; beide regulären Rätsel eindeutig validiert.
- Der erste vollständige lokale Unit-Anlauf verwendete Python ohne Pillow
  und wurde wegen dieser Umgebungsfehler abgebrochen. Der vollständige
  Wiederholungslauf verwendet die vorhandene Pillow-Umgebung; keine Assertion
  oder Implementierung wurde zur Umgehung geändert. Endbefund und tatsächliche
  reguläre CI-Jobs werden im PR festgehalten; dieser Bericht erklärt die CI
  nicht vorzeitig für grün.

Die reguläre Unit-CI erfasst die vier neuen ressourcen-/plan-/privatheitsbezogenen
Vertragstests. Die expliziten privaten Nachweistests und der vollständige neue
Replay bleiben lokale Schritte mit privatem Bestand; CI lädt keine Lösungen
herunter. Keine Workflow- oder öffentliche Spieloberflächenänderung.
