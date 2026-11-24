# Öffentliche Regeln · gezeitenkarten-2 · Erklärung 1

Diese versionierte Erklärung beschreibt src/engine/puzzle.mjs und hex.mjs.
Die verbindlichen konkreten Daten stehen je Position in request.source.logic.

Die Karte hat 5 × 5 Hexfelder. A–E sind Spalten, 1–5 Zeilen von oben nach unten.
Jede Zelle ist in der statischen Ansicht mit ihrer technischen Bezeichnung
beschriftet. Gerade und ungerade Zeilen sind gegeneinander versetzt. Die sechs
Richtungen in Uhrzeigerrichtung sind E (Ost), SE (Südost), SW (Südwest), W (West),
NW (Nordwest), NE (Nordost). Benachbarte Felder teilen eine Kante.

Stunde 0 ist das bekannte Startfeld logic.start auf einem befahrbaren Objekt.
Der Name und die vollständige Fläche dieses Startobjekts sind öffentlich.
Das Startfeld ist genau eine Zelle, auch bei einem Objekt aus mehreren Zellen.
Es gibt genau logic.steps Etappen. Jede Etappe führt zu einem benachbarten Feld;
Warten und Sprünge sind unzulässig. Unbelegte Wasserfelder und Objekte mit
passable:true sind befahrbar. Kein Feld eines Objekts mit passable:false darf
betreten werden. Jedes Feld, einschließlich Startfeld, darf nur einmal vorkommen.
Andere Zellen desselben befahrbaren Objekts sind eigenständige Felder.

Hexabstand ist der geometrisch kürzeste Abstand im Hexraster; blockierte Felder
verlängern ihn nicht. Abstand 0 bedeutet dieselbe Zelle, Abstand 1 Nachbarschaft.
Für eine technische Zelle mit Spaltenindex c (A=0) und Zeilenindex r (1=0) gilt
axial (q,r)=(c-floor(r/2),r). Für (q,r) und (s,t) ist der Abstand
max(|q-s|,|r-t|,|q+r-s-t|). Die Ansicht verwendet dieselbe even-row-offset-Geometrie.

Alle sechs Hinweistypen sind Gleichheitsbedingungen:

- position: In hour steht das Schiff auf cell.
- direction: Die Fahrt von hour-1 nach hour geht in direction.
- turn: Vergleiche die Fahrt hour-2 → hour-1 mit hour-1 → hour. Ein positives
  degrees dreht nach rechts im Uhrzeigersinn, ein negatives nach links; 0° heißt
  geradeaus. Schritte sind 60°. +180° und -180° bezeichnen dieselbe Gegenrichtung.
- distanceToPlace: In hour ist der Mindestabstand zu irgendeiner Zelle des
  gesamten Objekts placeId genau distance. Gemessen wird weder nur zum Anker
  noch nur zum Startfeld eines Startobjekts. Unbefahrbare Objekte sind ebenfalls
  gültige Distanzbezüge.
- distanceBetweenHours: Der Hexabstand der beiden Positionen in hours ist genau
  distance. Das ist keine Angabe über die Anzahl der gefahrenen Etappen.
- countDistanceToPlace: Für jede Stunde von fromHour bis toHour einschließlich
  beider Grenzen wird der Mindestabstand zur gesamten Objektfläche gemessen.
  In genau count dieser Stunden ist er gleich distance. count:0 schließt ihn in
  allen Stunden des Intervalls aus. count gleich Intervalllänge verlangt ihn
  in jeder Stunde. Stunde 0 wird mitgezählt, falls sie im Intervall liegt.

Alle öffentlichen Hinweise gelten gemeinsam. Die Aufgabe ist die Rekonstruktion
der vollständigen Fahrt, ohne neue Gewinnbedingungen oder zusätzliche Hinweise.
Weltmotive und Geschichten ändern diese Regeln nicht.
