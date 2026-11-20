# S04-B — unabhängige Reviewfragen

Bitte den **im PR genannten vollständigen Head-SHA** gegen Basis
`974931e95d434a35ce34094f4d5244e289d6fd76` prüfen. Diese Liste bereitet eine
unabhängige Review vor; sie behauptet keine bereits erfolgte Abnahme. Kein Merge.

1. Liegt die Transformation in `searchPuzzleCandidates` vor finalen Fingerprints,
   Auslassungsbeweisen, Merkmalen und Evaluation? Nutzen Solver, Export, Spiellader
   und Diagnose denselben normalisierten Satz?
2. Beweist `∀I P ∧ ∀J P = ∀(I∪J) P` beziehungsweise die Negation von `P` genau
   die implementierten Fälle? Wird bei überlappenden Allzählungen die Länge der
   Vereinigung verwendet, ohne die Überlappung doppelt zu zählen?
3. Können innere Zählungen, gemischte Modi, abweichende Objektinstanzen/Distanzen,
   andere Prädikate oder echte Stundenlücken versehentlich vereinigt werden?
   Prüfen Sie besonders S03-05/H2+H3 und BC-T06/H1+H2.
4. Ist der nur strukturelle Hilfspool für beliebige ausgewählte Teilmengen
   vollständig, auf S0–S6 begrenzt und für die Suchstrategie nicht auswählbar?
   Verbrauchen zusätzliche Masken und Beweise dieselben vorhandenen Budgets?
5. `node scripts/report-count-clue-normalization.mjs --check`: Sind beim Fall 06
   die 124 Paarlösungen exakt dieselben, bleibt die einzige Zielroute erhalten
   und lassen alle fünf Auslassungen mindestens zwei Routen zu? Gegen den
   unabhängigen `checkIrredundancy` prüfen, nicht nur das gespeicherte `true` lesen.
6. Werden Kandidaten mit `minClues: 6`, neuer Dominanz, Redundanz oder erschöpftem
   Budget abgewiesen? Gibt es einen Weg, Füllhinweise, einen alten Beweis oder
   alte Einzelhinweismerkmale als gültig zu übernehmen?
7. Binden Raw-Fingerprints, ursprüngliche IDs und Parameterschlüssel alle Quellen
   genau einmal? Prüft der unabhängige Verifizierer beschädigte Provenienz auch
   dann, wenn die wirksame Definition noch dieselbe Lösung besitzt?
8. Prüfen Sie Permutationen, dreiteilige Brücken, überdeckte Intervalle,
   Idempotenz und JSON-Rundlauf. Sind neue Varianten- und Effektidentität
   deterministisch, während Karten-/Zielinstanzidentität gleich bleibt?
9. Bestätigen die Baseline-Blobtests sowie die 37 S04-A-Reproduktionen unveränderte
   historische Definitionen, Diagnosen, Engine-/Deduktionssemantik und Texte?
   Bleiben die eingefrorenen S03-/Vergleichseinstiege ausdrücklich unnormalisiert?
10. Lesen Export und Spiellader fünf Hinweise und fünf Texte, ohne Rohbedingungen
    oder private Provenienz auszuliefern? Ist die vorhandene Null-/Allsprache
    auch für überlappende und anschließende Vereinigungen eindeutig?

Gezielte Tests und Grenzen stehen in [README.md](README.md). Kein Generatorlauf,
keine neue menschliche Spielerfahrung und keine automatische Qualitätsabnahme
sind für diesen Review erforderlich oder behauptet.
