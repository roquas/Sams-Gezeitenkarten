# Redaktionelle Gestaltung der Seekarten

Aktuelle Ergänzung zu [#40](https://github.com/roquas/Sams-Gezeitenkarten/issues/40)
und [PR #38](https://github.com/roquas/Sams-Gezeitenkarten/pull/38).
Historische 3.6-Dokumente bleiben unverändert.

## Geografische Zugehörigkeit statt erzwungener Landbrücken

Ein benannter Ort darf mehrere gesperrte Hexfelder umfassen. Dafür ist **keine
durchgehend zusammenhängende Landmasse** vorgeschrieben. Zulässig sind etwa ein
Archipel aus zehn kleinen Inseln über drei Felder, eine Hauptinsel mit Nebeninseln
oder eine dreieckige Inselgruppe.

Entscheidend sind zwei sichtbar überprüfbare Eigenschaften:

- Alle zum Ort gehörenden Hexfelder sind als Teil desselben geografischen Objekts
  erkennbar, etwa durch gemeinsame Kontur, Anordnung, Küstenzeichnung und Label.
- Die Darstellung vermittelt die vollständige logische Ausdehnung. Eine kleine
  Nebeninsel darf nicht wie ein fremdes Objekt wirken, während die Hauptinsel das
  betreffende Hex scheinbar gar nicht erreicht. Eine andere eindeutige Gruppierung
  als physische Verbindung ist ausdrücklich möglich.

Benachbarte unterschiedliche Hindernisse sind erlaubt, wenn ihre Grenzen und
Zugehörigkeit klar erkennbar bleiben. Es gibt kein pauschales Verbot angrenzender
Landobjekte. Mehrere Felder desselben Ortes sind nicht automatisch mehrere Orte.

Beschriftungen beziehen sich auf die gesamte zusammengehörige Fläche und bleiben
innerhalb einer sicheren Landfläche, ohne Wasserfelder oder Pergamentrand zu
verdecken. Die vorhandene Aquarellgrafik, kleinen transparenten Labels und
perspektivische Kartenansicht bilden den gestalterischen Rahmen.

## Befahrbare Landmarken in Hinweisen

Fehlt eine eindeutige Namensbeschriftung auf der Karte, nennt der Hinweis die
Koordinate zusätzlich zum Namen, beispielsweise **Tintenriff (D4)**. Die UI stellt
diese Koordinate mit ihrer gemeinsamen Kurznotation dar. Eindeutig beschriftete
Orte brauchen keine zusätzliche Koordinate. Das gilt auch bei späteren Rätseln;
Illustrationen allein sind keine verlässliche Namenszuordnung.

## Redaktionelle Abnahme

Die Karte muss im Browser mit aktiver Stunde, kleiner Smartphone-Ansicht und
Desktop-Ansicht geprüft werden. Hinweise wie „direkt an der Insel“ müssen auf das
gesamte benannte Objekt anwendbar sein. Bei Unsicherheit ist die Grafik zu
verbessern oder die ausstehende visuelle Abnahme zu dokumentieren.

Diese Regeln verändern weder das Rätselschema noch Befahrbarkeit, Nachbarschaft,
Hexdistanz oder Solver. Verbindlich für die Logik bleiben `logic.blocked` und
`logic.places`; Dekoration ist keine zusätzliche Regelquelle. Eine neue Grafik
oder eine andere Anordnung darf keine andere Lösung erzeugen.
