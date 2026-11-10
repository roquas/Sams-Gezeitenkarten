# B2 – Offline-Profilbericht, Format 1

Der [Vergleichsbericht](B2-deduction-profile/report.md) beschreibt vorhandene
Deduktionszustände von POSITIVE V1, POSITIVE V2, BC-T02, BC-T07 und BC-T07 mit
Stunde 3 = C1. Grundlage ist `main` nach PR #106 und #105 (`d9cc027`).
Die Auswertung enthält Lösungsschlüsse und gehört nicht zum Spieltestexport.
Sie ist kein Schwierigkeitsmodell, keine Qualitätsbewertung und keine Auswahl.

## Reproduktion

Node ≥22, offline, keine Zusatzpakete:

```sh
npm run report:b2:profile
npm run report:b2:profile -- --check
node --test tests/contracts/b2-deduction-profile.test.mjs
```

Ohne Option erscheint der Vergleich auf stdout. `--check` vergleicht fünf
JSON-Profile und den Vergleich bytegenau. Nur das explizite `--write` erneuert
diese sechs Dateien unter `docs/verification/B2-deduction-profile/`. Es gibt keine
Zeitstempel, Laufzeiten, absoluten Pfade oder Abhängigkeit von Git im Datenformat.
Der CLI und die Bibliothek schreiben bei der normalen Auswertung keine Dateien.
Der neue Vertragstest wird vom bestehenden `npm run test:unit` erfasst.

Die bisherigen Nachweise werden weiterhin unabhängig geprüft:

```sh
npm run report:b2:deduction -- --check
npm run report:b2:positive -- --check
npm run report:b2:positive-v2 -- --check
```

Der Profilbericht importiert weder Solver noch lokale Propagation oder Generator.
Er liest V1s `diagnosis.jsonl` plus `ablations.jsonl`, V2s `states.jsonl` und die
drei BC-JSONL-Dateien. Hinweismetadaten stammen aus den positiven Definitionen
bzw. `B2-deduction/sources.json`; die gespeicherte Zielroute wird nicht ausgewertet.
Jede Eingangsdatei ist mit SHA-256 gebunden. Die bestehenden Diagnose-Checks
bleiben für die inhaltliche Richtigkeit der ursprünglichen Nachweise zuständig;
der Profilbericht ist kein zweiter Beweisprüfer.

## Gemeinsames JSON-Format

Alle fünf Dateien tragen `format: "b2-deduction-profile-1"`, eine kurze `id`,
`label`, die ursprüngliche `puzzleId` sowie `inputs` mit Pfad und SHA-256.
`evidence`, `possibleInterpretations` und `unknowns` trennen belegte Daten,
mögliche spielerische Bedeutung und nicht gemessene Aspekte.

| Feld unter `evidence` | Inhalt |
| --- | --- |
| `initialConditions` | Start und zusätzliche Vorgaben, jeweils mit Herkunft |
| `coverage` | Hinweis-IDs, vorhandene und insgesamt mögliche Teilzustandszahl, vollständige Liste unbekannter Zustände |
| `states` | Zustands-ID → Hinweis-IDs und Quelldatei mit 1-basierter JSONL-Zeile |
| `localCoverage` | Jeweils `baseline` und `full`, getrennte lokale/exakte Feld- und Übergangsmengen und ihre Differenz |
| `entryOffer` | Konkrete Feldfestlegungen, Ausschlüsse und Alternativen durch Einzelhinweise/Paare relativ zum selben hinweisfreien Zustand |
| `clueWitnesses` | Getrennte lokale/exakte Festlegungszeugen pro Stunde und wirksame Mechanismen |
| `representation` | Verbleibende gekoppelte Übergänge im vollen Zustand sowie Beispiele kleiner Feldmengen in Einstiegszuständen, getrennt lokal/exakt |
| `milestones` | Lokale Feldfestlegungen aus Hinweisen im vollen Zustand mit Zertifikaten und belegten Folgebeziehungen |

Zustands-IDs sind alphabetisch verbundene Hinweis-IDs wie `H2+H3`; `none`
bezeichnet den hinweisfreien Zustand **einschließlich** eventueller Vorgaben.
Alle Zustandsverweise beziehen sich auf `states`. Trace-IDs wie `D21` sind nur
innerhalb des genannten Zustands gültig. Die Reihenfolge der JSON-Listen
beschreibt keine menschliche Bearbeitungsreihenfolge.

`localCoverage.*.*.domains` enthält Stunde 1–6; `transitions` enthält die
Übergänge mit Ankunftsstunde 1–6. `fixedHours` beschreibt den Zustand,
`clueDerivedFixedHours` enthält nur neue Festlegungen gegenüber der jeweiligen
lokalen/exakten hinweisfreien Basis. Start, Vorgaben und bereits hinweisfrei
gewonnene Stunden sind keine Erfolge aus Hinweisen. Lücken zählen zusätzliche
lokale Möglichkeiten gegenüber der exakten Projektion, keine fehlenden Klicks
oder menschlichen Denkschritte. Die hinweisfreie Grundlücke steht separat da;
sie wird nicht pauschal von der vollen Lücke subtrahiert.

## Zeugen, Minimalität und unabhängige Teilerkenntnisse

Für jede exakt bestimmte Stunde werden bekannte Zustände ausgewertet, in denen
dasselbe Feld lokal bzw. exakt feststeht. `witnesses` enthält alle unter den
bekannten Zuständen einschlussminimalen Zeugen, auch alternative und gegebenenfalls
größere Zeugen. Es handelt sich nicht um alle möglichen menschlichen Argumente.

- `minimumKnownClueCount`: kleinste beobachtete Größe eines Zeugen.
- `minimumClueCount`: dieselbe Größe nur dann, wenn **alle** Kombinationen mit
  weniger Hinweisen vorhanden sind; andernfalls `null`.
- `cardinalityStatus`: `proven-minimum`, `smallest-known` oder `unknown`.
  Fehlende kleinere Kombinationen stehen in `missingSmallerStates`.
- `inclusionStatus`: `proven-inclusion-minimal` nur dann, wenn alle echten
  Teilmengen dieses Zeugen vorliegen und keine das Feld festlegt. Andernfalls
  `smallest-known`, mit `missingProperSubsets`. Kardinalitätsminimum und
  Einschlussminimalität sind unterschiedliche Aussagen.
- Ein lokal offenes Feld hat `status: "not-locally-fixed"`, leere Zeugen und
  keine behauptete Mindestgröße. Das bedeutet keine menschliche Unlösbarkeit.
- `origin` unterscheidet Ergebnisse aus Hinweisen von Vorgaben und Basisfolgen.
  Ein Zeuge der Größe null ist keine aus Hinweisen gewonnene Leistung.

Ein Einzel-/Paarzustand belegt seine Erkenntnisse ohne die in
`doesNotRequireClueIds` genannten Hinweise, unter denselben Karten- und
Vorgabebedingungen. So sind etwa der frühe H1-Strang und der direkte H3-Anker
in V1/V2 separat nachgewiesen. Das ist eine begrenzte Unabhängigkeitsaussage,
keine Behauptung räumlich getrennter Teilrätsel oder unabhängiger Gedanken.

Lokale Zeugen nennen den festlegenden `certificate.step`, seine transitive
Prämissenmenge, Regelarten und tatsächlich beteiligte Hinweismechanismen.
`necessaryWithinWitness` ist nur bei vorhandenem Weglassungszustand ein Boolean,
sonst `null`. Es bezieht sich auf diesen Hinweiszeugen, nicht auf jeden denkbaren
Lösungsweg. Exakte Zeugen erhalten kein aus einem globalen Solverresultat
abgeleitetes lokales Regelzertifikat.

Die Zählsemantik unterscheidet Einzelstunden-Hit/-Ausschluss,
Mehrstunden-Null-/Allzählung und `multi-hour-interior-count` (mehr als eine Stunde,
Zählziel strikt zwischen null und Intervalllänge). Das letzte Merkmal allein
beweist weder anfängliche Mehrdeutigkeit noch spielerische Wirkung.
`effectiveFullTraceSteps` bzw. die Schritte eines konkreten Zertifikats zeigen,
ob ein Hinweis lokal tatsächlich Ausschlüsse bewirkt. V2s H6 ist darüber hinaus
innerhalb des minimalen Stunde-3-Zeugen notwendig.

## Darstellbarkeit und Meilensteine

Die aktuelle UI kann Felder pro Stunde mit „?“, „×“ und „✓“ markieren. Alle
angegebenen Feldmengen sind in diesem Sinn darstellbar; Zahl und Aufwand der
nötigen Markierungen sind nicht gemessen. `smallAlternativesMax: 3` ist nur eine
Darstellungsgruppe, kein Qualitätsgrenzwert. Das Einstiegsangebot untersucht
höchstens zwei Hinweise; „früh“ bedeutet hier ohne andere Hinweise ableitbar,
nicht früher Zeitpunkt einer beobachteten Spielsitzung.

Eine Kopplung wird ausgewiesen, wenn beide Stunden mehrere Felder erlauben,
aber nicht jedes Paar als Übergang verbleibt. Die Felder, tatsächlichen Kanten
und `absentCrossPairCount` machen die verlorene Zuordnung nachvollziehbar.
Bereits Nachbarschaft kann solche Kopplungen erzeugen. Lokale Kanten sind keine
vollständigen legalen Restwege; höhere Korrelationen fehlen. Auch V1/V2 enthalten
frühe Kopplungen. Daraus wird kein Belastungswert abgeleitet.

Nur Feldfestlegungen bilden Meilensteine. Feste benachbarte Übergänge werden als
`attachedFixedTransitions` angehängt, nicht zusätzlich gezählt. Start, Vorgaben
und lokale Basisfolgen sind keine Meilensteine aus Hinweisen. `dependencies`
nennt transitive Zertifikats-Vorfahren einschließlich der konkreten Trace-IDs.
Diese Kanten sind ausreichend begründet, aber nicht zwingend logisch notwendig:
die ursprüngliche Propagation zitiert zuletzt eingeschränkte ganze Mengen.
Es gibt keine Rekonstruktion einer optimalen menschlichen Reihenfolge, keine
Graphentiefennote und keine neue Suche nach günstigeren Beweisen.

## Tatsächliche Ergebnisse

| Fall | Zustände | Minimale lokale Hinweisanzahlen S1–S6 | Volle lokale Lücke Felder / Übergänge |
| --- | --- | --- | --- |
| V1 | 32/32 | 3/4/4/2/1/5 | 0 / 0 |
| V2 | 64/64 | 3/4/4/2/1/5 | 0 / 0 |
| T02 | 43/64 | lokal keine weitere feste Stunde | 55 / 150 |
| T07 | 65/128 | 2/2, danach lokal offen | 16 / 25 |
| T07 + Stunde 3 | 65/128 | Stunden 1–3 schon hinweisfrei, danach lokal offen | 5 / 6 |

V1 nutzt für Stunde 3 H1/H2/H3/H4, V2 H1/H2/H3/H6. Beide besitzen dieselben
Einstiegsanker und schließen Stunde 6 im vollen lokalen Zertifikat über das
Wiederbesuchsverbot nach Belegung von Stunde 3. V1s Stunde 6 besitzt exakt einen
Viererzeugen, lokal erst einen Fünferzeugen: die Ebenen werden nicht vermischt.
Bei T02 sind für exakte Festlegungen nur Sechserzeugen bekannt; ihre Minimalität
ist wegen fehlender Vierer-/Fünferzustände unbekannt. Bei T07 ist der lokale
Zweierzeuge H4/H5 trotz fehlender größerer Zustände minimal belegt. Bei der
Kontrolle bleiben B1→A2 oder B2→C3 zwischen Stunde 4 und 5 gekoppelt; die exakten
Zeugen H6/H7 (Stunden 4/5) und H3/H6/H7 (Stunde 6) haben keine entsprechenden
lokalen Erklärungen.

Die Tests sichern diese Befunde, das Herabstufen von Minimalitätsaussagen bei
fehlenden Daten, Herkunft und Trace-Verweise, Nichtzählung von Vorgaben,
Determinismus, Schreibfreiheit der Auswertung und Reproduktion. Keine
Änderung an Engine, Solver, Regeln, Generatoren, Rätseln oder UI; keine neue
Kandidatensuche, Qualitätszahl oder automatische Tagesauswahl. Menschliche
Entdeckbarkeit, Gedächtnislast, Freude und erlebte Serienvielfalt bleiben durch
spätere Spieltests zu untersuchen.

## Validierungsstand dieser Lieferung

Am 10.11.2026 unter Node v24.19.0 geprüft:

- 27/27 gezielte Tests: bestehende B2-Engine-/Diagnose-/V1-/V2-Verträge und
  sechs neue Profiltests.
- Neue sechs Profildateien mit `--check` bytegleich reproduziert.
- Alle bisherigen acht allgemeinen Diagnose-, drei V1- und zwei V2-Dateien mit
  ihren unveränderten `--check`-Befehlen bytegleich reproduziert.
- `git diff --check` und die lokalen Dokumentationsverweise geprüft.

Kein neuer Generator- oder Kandidatenlauf. Browserprüfungen sind für diesen
rein lesenden Offline-Bericht nicht erforderlich; die Spieloberfläche bleibt
unverändert. Die vorhandene CI entdeckt den neuen Vertragstest über
`tests/contracts/*.test.mjs`.
