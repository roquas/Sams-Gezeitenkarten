# S04-A — Etappendiagnose

**Enthält Lösungen.** [Beispielbericht für 18 Fälle](examples/report.md) und
[menschliche Beobachtungen](../../observations/README.md).
Basis ist `602c597a4fc434d018afceb21c8029cfd5eefbae` nach PR #111.

## Architekturprüfung vor der Implementierung

| Bestehende Quelle | Wiederverwendung in S04-A |
| --- | --- |
| `b2-deduction-profile.mjs`, Format 1 | Teilmengenabdeckung, getrennte lokale/exakte Zeugen, Status kleinster bekannter bzw. bewiesener minimaler Zeugen |
| `b2-markable-progress.mjs`, Format 2 | Wiedergabe gespeicherter Ausschlüsse, ×/?/✓, direkte Trace-Prämissen und zertifizierte Nachfolger |
| Gespeicherte S03-v2-Definitionen und Zustände | dieselben 274 Zustände der neun ausgewählten Fälle; Register-/Kandidaten-/Definitions-/Zustandsbindung wird geprüft |
| Historische Profilquellen | dieselben 343 Zustände aus A/B/C/D, V1/V2, T02/T07 und T07 mit S3-Vorgabe |
| `src/engine/puzzle.mjs`, `createRules().routes/matches` | einmalige budgetierte Enumeration für fest benannte Routenfragen, getrennt von lokalen Aussagen |
| Menschlicher Bericht und Nachlieferungen | eigenständige versionierte Sammlung, kein Eingang von Regeln, Scores oder Serienauswahl |

Die vorhandenen Profile erklären bereits viele mögliche Teilfortschritte, aber
ihre Vollzustände zeigen keinen menschlichen Etappenrhythmus. Feldmengen und
Nachbarkanten verlieren mehrstündige Beziehungen. Der konkrete S03-02-Befund
75→107 rechtfertigt eine eng begrenzte zusätzliche Sicht. Die vorhandene Engine
reicht; weder ein neuer Solver noch neue lokale Regeln sind erforderlich.

Die Implementierung ist additiv: `b2-stage-diagnostics.mjs` baut eine eigene Sicht
auf gespeicherte Profile. Es ruft keinen Solver oder Propagator auf. Der getrennte
Adapter `b2-stage-routes.mjs` verwendet ausschließlich die bestehende Engine.
Produktiver Code, Generator, Hinweisproduktion, Altprofile und UI bleiben unberührt.
Die gespeicherte `solution` einer Definition gelangt nicht in die Berechnung;
die Adapter übernehmen nur `logic`, explizite Vorgaben und gespeicherte Zustände.

## Reproduktion

```sh
npm run report:b2:stages
npm run report:b2:stages -- --check
node --test tests/contracts/b2-stage-diagnostics.test.mjs tests/contracts/b2-play-observations.test.mjs
```

Der erste Befehl zeigt den Bericht. `--check` reproduziert 37 Dateien bytegleich;
`--write` erneuert bewusst nur `examples/`. Kein Befehl erzeugt Rätsel, ergänzt
fehlende Teilmengen oder ändert Spieltestexporte. Normale Profilprojektion ist
rein lesend; die getrennte Routenansicht führt die dokumentierte Enumeration aus.

## Formate und Quellenbindung

`b2-stage-diagnosis-1` enthält für jeden bekannten Zustand:

- ursprüngliche Hinweis-IDs und Zustandsschlüssel sowie JSONL-Pfad/Originalzeile;
- lokale Ausschlüsse, kleine Feldmengen, feste Stunden mit Herkunft,
  direkte Prämissen, Regel- und Wiederverwendungszeugen;
- getrennte exakte Positionen, Hinweiszeugen und Projektionslücken;
- offene zusammenhängende Stundenabschnitte mit bekannten linken/rechten Ankern
  sowie lokale und exakte benachbarte Kopplungen;
- alternative ausreichende Fixierungszeugen einschließlich fehlender kleinerer
  Teilmengen. Ein „kleinster bekannter“ Zeuge wird nicht als Minimum ausgegeben.

`inputs` bindet Quellenbytes mit SHA-256. `evidenceBinding` bindet zusätzlich die
effektive Rätselkennung, Logik und Vorgaben sowie die Quellenliste durch kanonisches
JSON. Ein Trace-Schlüssel ist nur innerhalb seiner Zustand-/Quellzeilenbindung
eindeutig. S03-01–09 folgen der Kennungstabelle im bereitgestellten Bericht und
der nach Kennung sortierten Anzeige, nicht der Auswahlregisterreihenfolge.

`b2-stage-routes-1` ist eine getrennte exakte Diagnosedatei mit derselben Bindung.
Der feste Plan nennt höchstens drei bekannte Zustände je Fall und 17 von 18 Fällen;
für B wird keine Zusatzberechnung behauptet. Jede dieser 17 Definitionen wird
einmal mit maximal 250.000 Knoten enumeriert, also insgesamt höchstens 4.250.000
Knoten. Vorgaben filtern den legalen Grundraum vor jeder Betrachtung. Der Adapter
vergleicht die neu berechneten exakten Feld-/Kantenmengen und Routenzahlen mit
dem gespeicherten Zustand. Er erzeugt keine fehlenden lokalen Profile.

| Routenansicht | Tatsächlich geprüfte Bedingungen |
| --- | --- |
| `localFieldsOnly` | legal und kompatibel zu den lokalen Feldern |
| `localFieldsAndEdges` | zusätzlich lokale Nachbarkanten |
| `exactSupported` | legal, Vorgaben und alle genannten Hinweisprädikate erfüllt |
| `recombinedExactFieldsAndEdges` | legal und kompatibel zu exakten Feld-/Kantenprojektionen; Hinweise werden für diese Rekombination nicht erneut verlangt |
| `singleIntersection` | Schnitt vorhandener Einzelhinweis-Fixpunkte, ohne weitere Propagation und ohne erneutes Anwenden aller Hinweise |

Je Ansicht werden die drei festen Fenster S0–S3, S3–S6 und S1–S5 betrachtet:
Anzahl verschiedener Teilrouten, gemeinsame Anfangs-/Endstücke, bis zu zwölf
konkrete Alternativen. Diese Teilrouten sind Projektionen global legaler Wege
unter der jeweiligen Ansicht, keine unabhängig kombinierbaren Optionen.
`allSha256` bindet die vollständige sortierte Alternativenmenge; `complete: false`
bezeichnet eine gekürzte Anzeigeliste, nicht unvollständige Enumeration.

Zusätzlich werden nicht benachbarte Stundenpaare auf verlorene Zuordnungen
zwischen exakten Projektionen und exakter Routenmenge geprüft. Kein Paarverlust
beweist keine vollständige höherstufige Korrelation: auch Dreier-/Mehrfachbindungen
können fehlen. Die Rekombinationslücke zählt ganze legale Wege und enthält
prüfbare Beispiele mit konkret verletzten Hinweis-IDs.

Bei Budgetüberschreitung heißt der Status `incomplete-budget`; Zählungen bleiben
`null` bzw. fehlen. Unbekannte Zustände heißen `unknown-state`, unbeauftragte
Berechnungen `not-requested`. Kein leerer Datensatz wird als bewiesene Null gelesen.

## Aussagegrenzen und Gegenproben

- Technische Zertifikate zeigen ausreichende Beweiswege, keine intuitive oder
  optimale menschliche Reihenfolge. Andere Hinweise sind für einen Teilzeugen
  nicht nötig; unabhängige menschliche Ideen sind dadurch nicht bewiesen.
- „Früh“ bedeutet höchstens einen kleinen Hinweiszeugen, keine gemessene Zeit.
  Feste späte Stunden, Ausschlüsse und kurze gekoppelte Prüfungen sind Angebote,
  keine vorgeschriebenen Etappen oder Qualitätsklassen.
- Routen und exakte Korrelationen sind Diagnoseinformationen. Sie fließen nie
  als Prämissen in lokale Regeln. Kleine lokale Mengen garantieren keine
  Erweiterbarkeit zu legalen Gesamtwegen.
- S03-05: 509/301 markierungskompatible Wege aus Einzelhinweisen und dennoch
  positive leichte Erfahrung; H2/H3 hat exakt acht Wege, lokal keine zusätzlichen
  Feldausschlüsse. Ein Restmengenscore wäre hier irreführend.
- S03-08: keine lokale Einzel-/Paarfixierung und trotzdem sehr positive Erfahrung;
  lokale und alternative exakte S2-Zeugen sowie H4-Kontext getrennt lesen.
- S03-01: drei lokal kompatible Abschlussrouten, eine exakt unterstützte;
  angenehmer Abschluss ohne vollständige lokale Auflösung.
- S03-02: 75 exakt unterstützte gegenüber 107 rekombinierten Wegen; auch exakte
  Nachbarkanten speichern nicht sämtliche mehrstündigen Bindungen.
- S03-03 und 07 bewahren unterschiedliche menschliche Urteile zu geometrischen
  Abschlüssen. S03-09 zeigt einen früh verfügbaren späten Ankerblock S4–S6.
  A/B/C/D und V1/V2, T02/T07 schützen vor Verengung auf die neun S03-Urteile.

Kein Score, Filter, Gewicht, Schwierigkeitsgrad oder automatischer Serienselektor
wird eingeführt. Die H2/H3-Normalisierung aus S04-B bleibt außerhalb dieses PR.
Die Grenzen der menschlichen Quellen stehen in der Beobachtungssammlung.

## Unabhängige Prüfung vorbereiten

Der [Reviewauftrag](review.md) benennt Quellen und Gegenprüfungen. Dies ist eine
Vorbereitung, keine bereits erfolgte unabhängige Abnahme. Neue menschliche Tests
sind gesondert zu planen; dieses PR gewinnt keine neue Erfahrungsevidenz.
