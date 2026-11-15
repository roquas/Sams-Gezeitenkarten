# Architekturprüfung – Befunde vor dem S03-Lauf

Basis `6445021`; Entscheidung und Auswahlkriterien sind separat im bereits
vorab committed [Vertrag v1](contract.md) festgelegt. Diese Auswertung liest
bestehende Profile; sie generiert keine S03-Kandidaten und verändert den Vertrag
nicht. Historische Bezeichnungen unten sind keine S03-Spieltippfolge.

## Konkrete Grenzen der bisherigen Auswahl

Die B2-Suche minimiert Hinweissätze nach mathematischer Eindeutigkeit. Das
verhindert überflüssige Hinweise, aber keine extrem starken Einzelanker und keine
Wiederholung eines Lösungsmusters. Der Suchstrategievertrag ist bereits klein
und austauschbar. Ein optionaler Bewertungs-Hook am bestehenden Kandidatenabschluss
reicht für die frühe Ablehnung vor dem nächsten Neustart; ein neuer Solver oder
komplett neuer Generator wäre dafür nicht begründet.

Folgende Messwerte stammen aus `buildProgressProfiles()` und dessen unveränderten
Quellen (`docs/verification/B2-deduction-progress/private/sources.json` sowie den
im V1-Profil gebundenen Referenzzuständen):

| Bestehender Fall | Ohne Hinweise festgelegte Folgestunden (exakt) | Durch einen Hinweis lokal vollständig gelöst | Lokal offene Folgestunden mit allen Hinweisen | Gekoppelte lokale Nachbarpaare im Vollzustand |
| --- | ---: | --- | ---: | ---: |
| A | 0 | ja | 0 | 0 |
| B | 0 | nein | 0 | 0 |
| C | 0 | nein | 0 | 0 |
| D | 0 | nein | 4 | 3 |
| POSITIVE V1 | 0 | nein | 0 | 0 |
| POSITIVE V2 | 0 | nein | 0 | 0 |
| BC-T02 | 0 | nein | 6 | 5 |
| BC-T07 | 0 | nein | 4 | 3 |
| BC-T07 mit experimenteller Vorgabe | 3 | nein | 3 | 2 |

**Befund:** Die Karte allein legt in diesen Originalfällen keine vollständige
Folgestunde fest. Dennoch kann ein einzelner Hinweis zusammen mit der Geometrie
sehr stark sein (Fall A). Ein reiner Karten-Baselinefilter würde dieses Problem
übersehen. Deshalb kombiniert v1 den frühen Baselinefilter mit der vorhandenen
Einzelhinweis-Exaktheit. Das ist kein Beweis, dass Geometrie der einzige Grund für
menschlich schnell erkannte Teilrouten ist.

Die experimentelle Vorgabe bei T07 schränkt schon ohne weitere Hinweise mehrere
Stunden ein. Das belegt konkret die starke Wechselwirkung eines Positionsankers
mit Nachbarschaft, sechs Schritten und Wiederbesuchsverbot. Vorhandene exakte
Projektionen erfassen diese globalen Effekte; lokale Mengen müssen schwächer
bleiben, wenn keine passende lokale Regel den Effekt erklärt.

Die positiven Referenzen V1/V2 besitzen denselben belegten Minimalvektor
`3/4/4/2/1/5`, gemeinsame Anker- und Abschlussmuster, aber unterschiedliche zentrale
Hinweiszeugen. Der menschliche Spieltest zu V2 beschreibt den Verlauf ebenfalls
als sehr ähnlich. Quellen: [Profilvergleich](../B2-deduction-profile/report.md),
[qualitative Beobachtung](../B2-positive-v2-playtest-observation.md). Der neue
Zählmechanismus allein hat dort keine neue Gesamtstruktur geschaffen. Deshalb
bezieht sich die S03-Seriensignatur auch auf Stundenzeugen und Abschlussregeln,
nicht nur auf die Liste der Hinweisfamilien.

BC-T02/T07 und D zeigen eine andere Grenze: mathematische Eindeutigkeit kann mit
zahlreichen lokalen Restalternativen zusammenfallen. Die UI speichert pro Stunde
Feldmarkierungen, aber keine Zuordnungen zwischen Stunden. Der beschränkte
Restfilter von S03 v1 adressiert einen Teil dieser Belastung. Kleine Mengen und
zwei verbleibende Kopplungen garantieren noch keine menschliche Handhabbarkeit.

## Was tatsächlich schon vorhanden ist

- Geografische Topologie: `analyzeMap` liefert Zusammenhangskomponenten,
  Sackgassen, isolierte Zellen und Artikulationszellen. S03 übernimmt die im
  freigegebenen Batch gespeicherten Befunde; es führt keine neue Spezialmetrik ein.
- Ganze legale Routen: bestehende Engine und Workspace liefern begrenzte,
  vollständige Mengen einschließlich Schrittzahl und Wiederbesuchsverbot.
- Exakte Projektionen: Stundenmengen, gerichtete Übergänge, Einzel-/Mehrhinweis-
  wirkungen und Kombinationsschlüsse. Sie bleiben Solverergebnisse.
- Lokale Belege: direkte Bedingungen, Distanzpaare, Zählgrenzen, Nachbarunterstützung
  und Wiederbesuch; nachvollziehbare Prämissengraphen. Sie konsumieren nur Logik,
  niemals die gespeicherte Antwort.
- Profile V1/V2: konkrete Einstiege und Ausschlüsse, minimale bekannte
  Hinweiszeugen, Mehrhinweis-Kombinationen, belegte Weiterverwendung und
  Zertifikatsvorfahren/-nachfolger, gekoppelte Endpunkte, Teilmengenabdeckung.

## Verbleibende technische und epistemische Lücken

Es fehlt keine Fähigkeit, die für den kleinen Pilot einen Solverumbau verlangt.
Es fehlt eine selektierende Orchestrierung vor weiteren Suchneustarts und ein
expliziter Vertrag für experimentelle Qualitäts-/Vielfaltsindikatoren. Diese
Ergänzung liegt im Offline-Adapter.

Die bestehenden Profile modellieren keine vollständigen höherstufigen
Routenkorrelationen, alle alternativen menschlichen Argumente oder menschliche
Entdeckbarkeit. Auch geometrische Weglängenschlüsse können im exakten Ergebnis
enthalten sein, ohne lokal erklärt zu sein. Neue Geometriemetriken würden diese
Unbekannten nicht ohne zusätzliche Validierung in Spielspaß übersetzen. Der Pilot
beschränkt sich deshalb auf belegte Projektionen und markiert ihre Grenzen.

Die parallel offene [Formatter-PR #110](https://github.com/roquas/Sams-Gezeitenkarten/pull/110)
wurde geprüft und wird nicht übernommen. S03 enthält keine Änderung an
`scripts/lib/clue-text.mjs`; die Entwicklungsanmeldung ergänzt nur die vorhandene
Bestands-Positivliste. Vor späterer Bereitstellung aus freigegebenem main erneut
exportieren und die Exporte gegen den dann freigegebenen Formatter prüfen.
