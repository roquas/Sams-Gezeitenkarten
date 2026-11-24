# S04-C: podcastnaher offener Community-Betatest

Stand: 24.11.2026. Geprüfte Basis: `main` am Commit
`a18a0af855b70199139edfc503732e8a761f1769` (nach #122).
**Vorschlag: alle 15 vorhandenen ausgewählten Fälle C-01 bis C-15.**
Vorbereitung und redaktionelle Vorschau, noch kein gestarteter Community-Test.

## Tatsächlicher Bestand und Quellen

Der reguläre Katalog enthält zwei Demonsträtsel (`model-demo`, `drei-peilungen`).
Historische B2-/S03-Entwicklungsbestände sind andere Testserien und werden nicht
beigemischt. Der S04-C-Produktionslauf hat 96 technisch geprüfte Varianten auf
24 Karten geliefert; daraus wurden bereits 15 Fälle auf 15 verschiedenen Karten
gewählt. Es werden keine neuen Fälle gesucht oder Varianten erzeugt.

Die Originalübergabe wurde bytegleich nach
[`cases.json`](../content/community-beta/s04-c-v1/cases.json) übernommen. Beim
Import wurden der Inventaranker aus dem versionierten
[Receipt](verification/S04-C/production-receipt.json), alle 67 inventarisierten
Dateien sowie Definitionen, Belegungen und Identitäten der 15 Fälle gegen die
ursprünglichen Rohzeilen geprüft.
[`migration.json`](../content/community-beta/s04-c-v1/migration.json) nennt Anker
und Umfang. Kein erneuter vollständiger Produktionsreplay wird behauptet.
Der neue Katalogprüfer bestätigt bei jedem Aufbau Originalbytes, logische
Fingerprints und eindeutige ursprüngliche Zielrouten.

Der neueste Export `gezeitenkarten-betatest-2026-11-23-3.json` enthält genau zwölf
bewertete Fälle. Die Erstspiel-Beobachtungen sind in
[`first-plays.json`](../content/community-beta/s04-c-v1/first-plays.json) versioniert:
Originalkommentare, Schwierigkeit, Fairness, Erstphasenwerte, Identitäten und
Quellhash. Bei C-05/C-14 gilt `phases[0].feedbackAtEnd`; versehentliche Wiederholungen
zählen nicht zusätzlich. Alle zwölf Identitäten stimmen mit den Originalfällen
überein. Unnötige Browser-/Phasenkennungen werden für diese qualitative Quelle
nicht übernommen.

Alle zwölf wurden gelöst, als fair bewertet und ohne Tipps gespielt. Das sind
**zwölf Fälle eines erfahrenen Testers, nicht zwölf Personen**. Spaß, Lösungsstil
und Erfahrung wurden noch nicht als eigene Werte erhoben. Kommentare bleiben
subjektive Rückblicke, keine validierten Lösungsprotokolle: C-03/H6 betrifft
S0/S2, und bei C-05 ist der zuerst genannte Endanker tatsächlich S6. C-04 war
nach der abschließenden Klärung ein übersehener Abstand in H5, kein bestätigter
Solver- oder UI-Fehler.

## Pool: Vielfalt erhalten

Rollen sind Arbeitshypothesen für die Auswertung, keine Schwierigkeitsstufen
oder sichtbaren Qualitätslabels für die Spielenden.

| Fall | Bisherige Erfahrung / offene Frage | Rolle im Pool |
| --- | --- | --- |
| C-01 | Noch ungespielt | Globale Kombination und Drehungen |
| C-02 | Klare Teilerfolge und sichtbare Ausschlüsse | Schrittweise Deduktion |
| C-03 | Nachvollziehbare Teillösungen; Startbezug sprachlich prüfen | Schrittweise Deduktion |
| C-04 | Spannend, aber Schluss nahe an der Frustrationsgrenze | Anspruchsvoller Vergleich |
| C-05 | Leicht und fair, trotzdem wenig befriedigend | Endanker ohne frühe Anfangsroute |
| C-06 | Besonders gelungener Verlauf mit früher Teilroute | Referenz / Flavor-Pilot |
| C-07 | Hohe mentale Gleichzeitigkeit; mobil schwierig erlebt | Globale Kombination |
| C-08 | Sehr anspruchsvoll, trotzdem reizvoll | Zählbedingungen und Radarwechsel |
| C-09 | Komplex, aber interessant und nachvollziehbar | Deduktion ohne frühe Anfangsroute |
| C-10 | Noch ungespielt; technisch kaum lokale Fortschritte | Explorative globale Kombination |
| C-11 | Spaß nach Markierungen, Endanker und Restvergleich | Begrenzter Routenvergleich |
| C-12 | Interessante Geometrie, viel mentale Routenprüfung | Geometrie und Kombination |
| C-13 | Lösung gefunden, Herleitung als unsicher erlebt | Kontrast technische / erlebte Lösbarkeit |
| C-14 | Drehbeziehungen wenig befriedigend, Karte gefällt | Drehkombination und Kartenwirkung |
| C-15 | Noch ungespielt | Markierungen und relationale Kombination |

Es gibt keinen technischen Ausschlussgrund innerhalb dieser 15 Fälle. Auch die
fünf weniger überzeugend erlebten Fälle bleiben deshalb enthalten. C-01/C-10/C-15
bleiben explorativ; technische Beschreibungen ersetzen keine menschliche
Bewertung. Eine Vorauswahl allein nach dem bisherigen Geschmack würde die
gesuchte Vielfalt einschränken. Falls die Redaktion einen konkreten Fehler
aufdeckt, wird eine Auswahländerung begründet versioniert; keine stille
Ersetzung durch neue Rätsel. Ziel weiterhin 10–20 Fälle.

Die gemischte Reihenfolge in
[`selection.json`](../content/community-beta/s04-c-v1/selection.json) lautet:
C-06, C-11, C-07, C-02, C-08, C-14, C-03, C-05, C-09, C-12, C-01, C-04,
C-13, C-15, C-10. Jede Person kann jeden Fall sofort öffnen. Es gibt keine
Zuteilung, Quote oder Pflichtreihenfolge und keine sichtbaren Favoritenlabels.

## Normale Git-Dateien statt privater Archive

| Datei | Zweck |
| --- | --- |
| `content/community-beta/s04-c-v1/cases.json` | Originale 15 Definitionen samt Lösungen, Belegungen und Herkunft; unveränderter Quellenanker. |
| `content/community-beta/s04-c-v1/migration.json` | Einmaliger Importnachweis. |
| `content/community-beta/s04-c-v1/selection.json` | Auswahl, Reihenfolge und begründete Rollen. |
| `content/community-beta/s04-c-v1/editorial.json` | Parallele Flavor-Arbeit, Datenversion und Bedeutungsprüfung je Fall. |
| `puzzles/community-s04-c-v1/manifest.json` | Vorhandenes Manifestformat v2 mit 15 öffentlichen Rätseln. |
| `puzzles/community-s04-c-v1/C-01.json` … `C-15.json` | Abgeleitete öffentliche Projektionen ohne Lösungsrouten oder Diagnosen. |
| `puzzles/community-s04-c-v1/inventory.json` | Bytehashes und redaktioneller Freigabestand. |
| `content/community-beta/s04-c-v1/first-plays.json` | Zwölf historische Erstspiel-Rückmeldungen. |

Alle für Prüfung, Redaktion und Aufbau benötigten Inhalte stehen jetzt in Git.
Kein `PRIVATE_RUN`, nachgereichtes TAR oder `.dev`-Bestand ist nötig. Lösungen
sind im öffentlichen Quellenrepository bewusst einsehbar; der Spielkatalog
verwendet weiter die bestehende öffentliche Projektion. Diese Trennung dient
Laufzeit und Lesbarkeit, nicht einer behaupteten Geheimhaltung.

Für diesen Pool keine neuen privaten S04-C-Archive und keine Duplizierung aller
Produktions-/Diagnosedaten. Historische Verträge und Reproduktionsprogramme
bleiben als damaliger Nachweis bestehen; ihr privater Übergabeweg ist für die
weitere Community-Arbeit durch diese Entscheidung abgelöst. Alte lokale
Archivkopien müssen nicht weitergereicht oder manuell gepflegt werden.

## Flavor parallel integrieren

Unveränderte Logikquelle, redaktionelle Präsentation und abgeleiteter Katalog
sind getrennt versioniert. Die laufende Flavor-Architektur kann die Präsentation
liefern, ohne Rätsel nachzubauen. Kein konkurrierendes narratives Generatorsystem.

1. C-06 als Referenz bearbeiten; C-02/C-03, C-09/C-11 und anspruchsvolle sowie
   globale Fälle parallel anschließen. Vor dem externen Start erhält der ganze
   ausgewählte Pool podcastnahe Texte und passende Namen nach Issue #21.
2. Je Fall in `editorial.json` die `presentation` mit `title`, `intro` (Array),
   `objectNames` (alle geo-IDs) und `clueTexts` (alle Hinweis-IDs) füllen;
   `status: "draft"`, `dataVersion` mindestens 2. IDs bleiben C-01 … C-15.
   Hinweise, Hilfen, Objektzellen, Ziele und Regelbedingungen bleiben unverändert.
3. Eine andere Person übersetzt **jeden Hinweis** gegen die strukturierte Aussage
   zurück. Zeitfenster, Negation, Zählzahl, Drehsinn, Startbezug und kleinster
   geometrischer Abstand zu mehrteiligen Orten müssen erhalten bleiben.
   Einleitung und Namen ebenfalls auf zusätzliche Lösungsaussagen prüfen.
4. Nach der Prüfung `status: "approved"` und `semanticReview` mit `reviewer`,
   `presentationSha256` (SHA-256 von `canonicalJson(presentation)` aus dem
   bestehenden Hashmodul), allen `clueIds` und `introAndNamesChecked: true`
   setzen. Fehlende Hinweise und nachträgliche Textänderungen werden erkannt.
   Der Hash ersetzt die tatsächliche unabhängige Bedeutungsprüfung nicht.
5. Weitere fachliche oder textliche Revisionen erhöhen `dataVersion` erneut und
   erhalten eine neue Prüfung. Logische IDs bleiben erhalten. Vorschau und
   spätere Textfassung werden nicht gemeinsam als dieselbe Erfahrung bewertet.

Die vorhandenen technischen Prüfformulierungen sind nur eine deutlich markierte
redaktionelle Vorschau. **Sie sind nicht die Fassung für die Podcast-Community.**
`check:community:release` scheitert absichtlich, solange Texte oder Prüfungen fehlen.
Keine redaktionelle Freigabe wird aus bestandenen Solverchecks abgeleitet.

## Freiwilliger Test und minimaler Feedbackzusatz

Rahmen laut Projektverfasser: Rätselchat mit ungefähr 200 Mitgliedern, typischerweise
10–15 täglich aktiv; vielleicht 20–30 Teilnehmende. Das ist eine Planungshypothese,
keine Zusage oder statistische Stichprobe. Keine künstliche Begrenzung auf 8–12.
Jede Person spielt so viel oder wenig sie möchte und wählt frei. Die Bitte,
auch in der Mitte anzufangen, ist unverbindlich. Unfertige und aufgegebene Versuche
sind willkommen. Vorhandene Statusangaben und Phasen reichen zur Unterscheidung;
kein zusätzliches Klicktracking.

Genau drei freiwillige Ergänzungen:

- **Spaß je Rätsel:** 1 (gar keinen) bis 5 (sehr viel), getrennt von Schwierigkeit
  und Fairness. Leer bleibt unbekannt.
- **Überwiegender Lösungsstil je Rätsel:** schrittweise ausschließen/markieren,
  Routenkandidaten vergleichen, Mischung oder anders/schwer einzuordnen.
- **Rätselerfahrung einmal pro lokalem Tester:** kaum/keine, gelegentlich oder
  viel Erfahrung. Änderbar und exportierbar; keine geräteübergreifende Zuordnung.

Bindung: `community:S04-C-v1`, Rätsel-/Datenversion und vorhandene logische IDs.
Historische Exporte aus `b2:S04-C-LOCAL` werden nicht zu Community-Erfahrungen
umetikettiert. Freitext, ungefähre aktive Zeit, Hilfen, Status, lokale Speicherung
und JSON-Export bleiben erhalten. Die Ergänzungen gelten auch für die vorhandene
Feedbackoberfläche. Alte Daten bleiben lesbar; keine rückwirkend erfundenen Werte.
Kein Konto, Server oder automatischer Upload.

## Auswertung vorab festlegen

Vorschlag: gemeinsame Testrunde von etwa zwei Wochen ankündigen. Das ist ein
Ablaufvorschlag, kein jetzt eingerichteter Termin. Anschließend zunächst Abdeckung
je Fall ausweisen: unterschiedliche Tester, begonnene, gelöste, aufgegebene und
noch offene Erstphasen; unbekannte Werte gesondert nennen. Feedback vor dem
Öffnen ist noch kein begonnener Versuch.

Exporte nach `(testerId, recordId)` mit jüngster Revision/`updatedAt` zusammenführen;
Phasen über `phaseId` erkennen. Wiederholte Exporte und Zeitstände nie addieren.
Erstspiele von Wiederholungen trennen. Spaß und Freitext je Lösungsstil und
Erfahrung betrachten, auch interessante Minderheitenvorlieben. Zeiten und
Prüfzahlen sind Kontext, kein Qualitätsscore. Wenig gespielte Rätsel als unklar
kennzeichnen, nicht als unbeliebt.

Freie Selbstwahl erzeugt ungleiche Abdeckung und Auswahlverzerrung. Der Test
liefert explorative Erfahrungen bestimmter Spielender, keine kausale Rangliste
oder belastbaren Schwierigkeitsklassen. Bei dünner Abdeckung freundlich auf selten
getestete Fälle hinweisen, weiterhin ohne Zuweisung. Erst wiederkehrende Befunde
über mehrere Personen tragen spätere Auswahl-/Darstellungsentscheidungen.
Keine automatische Generatorregel aus dem ersten Test ableiten.

## Konkrete nächste Schritte und Startkriterien

1. Vorbereitenden PR prüfen: Pool und Git-Ablage sind konkret vorhanden.
2. Parallel Flavor-Präsentationen zuliefern und unabhängig prüfen lassen;
   anschließend Quellen und Projektionen gemeinsam versionieren.
3. Katalogprüfung und Browserkontrolle mit fertigen Texten bestehen lassen.
   Mobil insbesondere Lesbarkeit, Radarwechsel und Verständnis ohne Einweisung
   ansehen. Keine festen Aufgaben oder Pflichtrückmeldungen einführen.
4. Statische Bereitstellung mit dem vorhandenen Paketverfahren vorbereiten:
   Community-Manifest, 15 Projektionen und Inventar ausdrücklich aufnehmen,
   Pfade im Unterverzeichnis und entpackten Export prüfen. Der normale
   Standardexport nimmt diesen Zusatzkatalog **noch nicht** auf. Das gehört zum
   Bereitstellungsschritt nach der Flavor-Abnahme, nicht zu einem neuen Datenweg.
5. Danach konkreten Einladungstext und Testlink zur Veröffentlichung vorlegen.
   Dieser PR startet keine Einladung, keinen Hosting-Upload und keinen Merge.

Lokale redaktionelle Vorschau aus einem frischen Checkout:

```sh
npm run check:community
npm run dev:community
# http://localhost:8000/?catalog=s04-c-community-v1
```

Nach redaktionellen Änderungen `npm run export:community` ausführen und Quellen
**und** Projektionen committen. Danach `npm run check:community`; vor externem
Start zusätzlich `npm run check:community:release`. Kein neuer Rätselgeneratorlauf.

Automatische Nachweise: `tests/contracts/community-beta.test.mjs` prüft alle
15 Fälle über den vorhandenen Loader, unveränderte Logik/Belegung, Eindeutigkeit,
Zielrouten, Byteinventar, zwölf Erstspielbindungen und ausstehende Flavor-Freigabe.
Beta-Tests prüfen Altbestände, Speichern, Wiederholungen, Export und Ergänzungen.
Tatsächlich ausgeführte Prüfungen und Grenzen stehen in der PR-Beschreibung.
