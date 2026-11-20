# S04-B — semantisch sichere Zählhinweise

Basis: `974931e95d434a35ce34094f4d5244e289d6fd76`, aktueller `main` nach
PR #112. [Reproduzierbarer Nachweis](evidence.json), [Reviewfragen](review.md).
[Gezielte R1/R2-Korrektur und Vertrauensgrenzen](provenance-contract.md),
[gezielte Nachreview](review-r1-r2.md).
Enthält Lösungen. Die vorhandenen [menschlichen Beobachtungen](../../observations/README.md),
die [S03-Auszüge vom 19.11.2026](../../observations/sources/s03-analysis-excerpts.md)
und [S04-A](../S04-A/README.md) begründen den engen Umfang. Der optionale externe
Pfad `/workspace/analysis/s03-2026-11-19/bericht.md` war nicht verfügbar.

## Integrationsentscheidung

`searchPuzzleCandidates` normalisiert den strukturierten, von der Suchstrategie
vorläufig reduzierten Hinweissatz **vor** `logicalFingerprints`, Effektidentität,
endgültigen Auslassungsprüfungen, Einzelhinweismerkmalen und `evaluateCandidate`.
Die Reduktion der Suchstrategie ist ein Vorlauf, kein endgültiger Nachweis des
ausgegebenen Kandidaten. UI-Zusammenfassungen würden die tatsächliche Hinweiszahl
und Diagnoseteilmengen nicht korrigieren; ein Eingriff beim historischen Import
würde gespeicherte Identitäten und Quellenbindungen verletzen.

Die neue Standardpolitik heißt `count-distance-extremes-1`. Neue B2-Läufe
schreiben sie in ihre Manifest-Einstellungen; damit bindet die Laufidentität die
Politik zusätzlich zum Programmcommit. Die Suchstrategie und ihr Zufallsstrom
bleiben gleich. Die eingefrorenen Einstiegspunkte S03-v1 und B2-Suchvergleich
übergeben ausdrücklich `normalization: 'none'`. S03-v2 importiert weiterhin seine
unveränderten materialisierten Quellen. Historische Leser, Exporte, Profile und
das öffentliche Rätselschema erhalten keine Migration oder Normalisierung.

Es gibt genau einen wirksamen Satz: `candidate.definition.logic.clues`. Solver,
Irredundanz, Merkmale, Diagnose und Export beziehen sich auf ihn. Rohhinweise
stehen ausschließlich in der privaten Provenienz. Ein öffentlicher Export
übernimmt weder diese Rohhinweise noch private Beweise.

## Erlaubte Transformation

Gruppierung ausschließlich nach `countDistanceToPlace`, Objektinstanz-ID,
exakter Distanz und Modus (`zero` oder `all`). Intervalle sind einschließlich
beider Grenzen zu lesen. Gruppen werden nach Beginn und Ende sortiert und in
maximale zusammenhängende Komponenten zerlegt. Eine echte Stundenlücke trennt
Komponenten. Innerhalb einer Komponente wird vereinigt:

| Modus | Eingang | Ausgang |
| --- | --- | --- |
| Null | S3–S5: 0, S4–S6: 0 | S3–S6: 0 |
| Null, anschließend | S1–S2: 0, S3–S5: 0 | S1–S5: 0 |
| Alle, überlappend | S2–S4: 3, S3–S5: 3 | S2–S5: **4**, nicht 6 |
| Alle, anschließend | S2–S3: 2, S4–S5: 2 | S2–S5: 4 |

Für Stundenwahrheiten `P(h)` bedeutet Nullzählung `∀h ∈ I: ¬P(h)`, Allzählung
`∀h ∈ I: P(h)`. Die Konjunktion derselben Aussage über mehrere Intervalle ist
genau dieselbe Aussage über deren Vereinigung. Wegen der lückenlosen Komponenten
ist die Vereinigung wieder ein Intervall. Überlappende Stunden werden einmal
gezählt. Dieser Beweis gilt unabhängig von Karte und Zielroute. Er deckt auch
eingeschlossene Intervalle, Einzelstunden, S0 und mehr als zwei Quellen ab.
Der Aufrufer muss weiterhin seine eigenen Erzeugungsverträge einhalten; die
eingefrorene S03-Politik wird nicht umgangen. Ungültige oder unbekannt erweiterte
Hinweisstrukturen werden zurückgewiesen.

Ausgeschlossen bleiben innere Trefferzahlen, gemischte Null-/Allforderungen,
andere Objektinstanzen oder Distanzen, Stundenlücken und andere Prädikate.
Insbesondere wird keine algebraische Differenz aus überlappenden Teilzählungen
gebildet. S03-05/H2+H3 und BC-T06/H1+H2 bleiben kombinierbare Einzelaussagen.
Keine neue Hinweisart, Deduktionsregel, Qualitätswertung oder Serienauswahl.

## Prüfung, Budgets und Ablehnung

Ein einmaliger `createRouteWorkspace` liefert den vollständigen legalen
Routenraum. Dessen vorhandener Solver prüft zuerst den Rohsatz und nach einer
tatsächlichen Vereinigung erneut den neuen Gesamtsatz: exakt eine Lösung und
dieselbe Zielroute. Zusammen mit den äquivalenten Teiltransformationen bleibt
damit auch die gesamte Lösungsmenge gleich. Danach werden sämtliche Auslassungen
und Einzelhinweismerkmale am neuen Satz berechnet. Eine unerwartete Redundanz
führt zu `NORMALIZED_REDUNDANT`, nicht zu einer gültigen Ausgabe.

Der vorhandene Solver benötigt einen festen Indexpool. Eine rein strukturelle
Hilfsmenge schließt deshalb die extremen Poolintervalle unter derselben sicheren
Vereinigung ab. Jede Gruppe hat wegen S0–S6 höchstens 28 unterschiedliche
Intervalle. Die Hilfsmenge ist **kein auswählbarer Erzeugungspool**: Die Strategie
sieht weiterhin ausschließlich die ursprünglichen Poolhinweise. Neue Masken
werden erst bei tatsächlicher Verwendung berechnet. Roh- und Hilfsbedingungen
benutzen denselben Solver samt Cache und denselben Prüf-, Match- und Filterbudgets.
Es gibt keinen separaten unbegrenzten Nachprüfungssolver und keine Änderung an
`puzzle-route-solver.mjs` oder `src/engine/`.

Die üblichen Kandidatenbedingungen werden anschließend über den bestehenden
`evaluateCandidate`-Pfad geprüft. Wird beispielsweise aus sechs Hinweisen ein
Fünfersatz bei `minClues: 6`, lautet die Ablehnung `CLUE_COUNT`; auch eine neue
Einzelhinweisdominanz wird mit `SINGLE_CLUE_DOMINANCE` abgewiesen. Weitere
Suchversuche laufen innerhalb des bereits festgelegten Budgets weiter. Keine
Füllhinweise, Rückkehr zum fragmentierten Rohsatz oder heimliche Lockerung.
Budgetüberschreitungen erzeugen weiterhin einen unvollständigen Suchstatus.

## Identität und Provenienz

Die Ausgabe wird mit dem bestehenden kanonischen `clueKey` sortiert und erhält
`H1…Hn`. Der bestehende Variantenfingerprint bindet die neuen Parameter; Karten-
und Instanzfingerprint bleiben identisch. Effektidentität und Einzelhinweisformen
werden neu berechnet. Rohsatz und normalisierter Satz kollidieren nicht.

Nur bei tatsächlicher Vereinigung enthält `candidate.normalization`:

- die versionierte Politik und die vollständigen Rohhinweise mit ursprünglichen IDs;
- die unveränderten logischen Rohfingerprints;
- den separaten `rawOriginFingerprint`, der IDs und Parameter gemeinsam bindet;
- für jede neue Aussage ihre Ausgabe-ID, `zero-union`/`all-union` oder `unchanged`
  sowie Quell-IDs und kanonische Parameterschlüssel.

`rawFingerprints` beschreibt die logische Identität des Rohsatzes;
die Ausgabe-IDs gehören zur neuen Definition. Die **logischen** Rohfingerprints
authentifizieren keine Quell-ID. Dafür bindet der gesonderte Herkunftsvertrag
den ID-inklusive gehashten Rohsatz an eine unabhängige Quelle bzw. einen separat
bestätigten Erzeugerbeleg. Jeder neue Kandidat trägt `preparation` mit Politik,
Status (`unchanged`/`normalized`) und Herkunftsfingerprint; der Prüfer erwartet
diese Angaben aus dem extern bestätigten Vertrag. Historische Datensätze erhalten
keine neuen Felder. Weder Rohdefinitionen noch Poolobjekte werden
mutiert. Eingabereihenfolge und Paarung ändern die kanonische Normalform nicht;
erneute Normalisierung ändert deren Hinweise nicht. Die Provenienz beschreibt
den ursprünglichen Transformationsschritt und wird beim Einlesen nicht ersetzt.
JSON-Rundlauf, Reihenfolge und Identitäten sind vertraglich geprüft.

`verify-puzzle-experiment.mjs` prüft gespeicherte Kandidaten weiterhin mit dem
unabhängigen bestehenden Solver. Für neue Kandidaten ist außerdem ein separat
gehashter Herkunftsvertrag samt unabhängig erwartetem Digest erforderlich;
ohne diesen werden ausschließlich unveränderte Datensätze aus dem festen
historischen Git-Inventar erkannt. Für neue Provenienz prüft es zusätzlich ohne
Aufruf des Normalisierers: Rohfingerprints, vollständige eindeutige Quellenabdeckung,
Prädikat/Objekt/Distanz/Modus, lückenlose Vereinigungsgrenzen und pro Ausgabe die
Äquivalenz auf **jeder** legalen Route. Manipulierte Provenienz fällt durch.

## Konkrete Nachweise

S03-06 (`B2-S03-V2-M014-A5-R160-V01`) hat 242 legale Grundrouten.
H2∧H3 und die S3–S6-Nullzählung erlauben dieselben 124 Routen, gebunden durch
denselben SHA-256. Der Fünfersatz behält exakt die Route
`A5 → A4 → B3 → C3 → C2 → D2 → E3`. Alle fünf Auslassungen lassen mindestens
zwei Lösungen zu. H2 und H3 waren vorher einzeln notwendig; dies war keine
Redundanzentfernung. Der historische Sechsersatz und seine Exporttexte bleiben
unverändert. Die vollständigen neuen IDs, Beweise, Quellbindungen und Texte
stehen in `evidence.json`.

S03-05 bleibt ein Vierersatz, BC-T06 ein Fünfersatz. Ihre inneren Zählbedingungen
werden nicht verändert. Die unabhängigen Paarlösungszahlen sind 8 bzw. 264;
beide Gesamtsätze bleiben eindeutig und irredundant.

Der bestehende sachliche Bordbuchformatter formuliert die neue Nullzählung als
„Von Stunde 3 bis Stunde 6 war das Schiff nie genau 2 Hexfelder von dem Ort
geo-01 (A5) entfernt.“ Allzählungen verwenden bereits „in jeder Stunde“.
Es ist keine Textänderung nötig. Export und Spiellader verarbeiten fünf Hinweise
und fünf Texte; eine neue historische Präsentationsvariante entsteht nicht.

## Reproduktion und Tests

```sh
node --test tests/contracts/count-clue-normalization.test.mjs tests/integration/count-clue-normalization.test.mjs
node scripts/report-count-clue-normalization.mjs --check
npm run report:b2:stages -- --check
npm run test:unit
npm run test:content
npm run test:puzzles
```

Der Bericht prüft ausschließlich die drei fest benannten Bestandsfälle. Er
verwendet höchstens sieben Enumerationen/Orakel mit je 100.000 Knoten, also
höchstens 700.000 Knoten; keine Rätselsuche und keine neue Zielroutenauswahl.
Nur der Referenzrohhinweissatz durchläuft einmal die Kandidatenaufbereitung mit
dem im Bericht gespeicherten Suchbudget. `--write` schreibt ausschließlich den
neuen S04-B-Nachweis; standardmäßig wird er angezeigt.

Die Vertragstests decken alle 1.568 gleichartigen Extremzählungs-Intervallpaare
über sämtliche 128 Belegungen der sieben Stunden ab (200.704 Vergleiche), außerdem
Gruppen, Permutationen, Idempotenz, Provenienz und die negativen Grenzen.
Die Integration nutzt die drei festen Fälle mit 100.000-Knoten-Grenzen; die
einzige zusätzliche bestehende Teilsatzdiagnose hat ihre vorhandene
250.000-Knoten-Grenze und höchstens 27 Zustände für fünf Hinweise. Die neu
berechneten Diagnose-/Auswahlsignale referenzieren ausschließlich den Fünfersatz.

Ein Baseline-Test vergleicht sämtliche versionierten S03-/S03-v2-/S04-A-Artefakte,
Beobachtungen, gespeicherten Altprofile sowie Engine, Solver, Deduktion, Formatter
und Qualitätsimplementierung mit den Git-Blobhashes der obigen festen Basis.
Die vorhandenen historischen Reproduktionsjobs bleiben unverändert und laufen
in CI an ihren gepinnten Programmcommits. Es wurde lokal kein großer Pilotlauf
oder vollständiger S03-Generatorlauf gestartet. Lokale Prüfergebnisse und der
CI-Status des fixierten Heads werden im PR festgehalten.
