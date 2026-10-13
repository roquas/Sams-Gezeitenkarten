# Spielregeln und abschließender GUI-Feinschliff (#31, #32)

Bestehender GUI-Branch `feature/coordinates-chart-logbook`, bestehender PR #30.

## Umsetzung

- Vollständiger redaktioneller Regeltext aus #31 in der weiterhin eingeklappten Spielregelsektion: ein Artikel, Einleitung, acht Unterabschnitte, Absätze und geordnete/ungeordnete Listen. Papierfarbene Umgebung, Petrolüberschriften, gut lesbare Serifentypografie und begrenzte Zeilenlänge. Keine Änderungen an Regeln, Logbuchhinweisen oder Bedienfunktionen.
- Sanduhr und Feder haben transparente Hintergründe. Die horizontale Linie endet mit wenigen Pixeln Abstand neben dem Icon; keine deckenden Kästen.
- Nummernschalter: Auge über `①②··`, schmale Messingfassung, unveränderte zugängliche Beschriftung und aktive Zustände.
- Radar: mittiges Grid-Layout in allen drei Zuständen, zusätzlich optische Korrektur der asymmetrischen transparenten Atlasränder.
- Prüfen: ein einzelnes bestehendes Häkchen, dezenter grünlicher Hintergrund bei verfügbarer Aktion. Accessible Name, Tooltip und bestehende Freigabe nur bei vollständiger zulässiger Route bleiben erhalten. Mobil 48-Pixel-Touchflächen und zwei Zeilen.

## Offen: zwei separat abnehmbare Illustrationen aus #31

1. Historische Seekarte: geeignetes gemeinfreies oder frei lizenziertes Original auswählen, Lizenz ausdrücklich prüfen, Quelle/Urheber/Lizenz dokumentieren. Geplanter Platz: nach „Was ist eigentlich eine Gezeitenkarte?“. Bildunterschrift: „Historische Seekarte mit Küsten- und Tiefenangaben“. Alt-Text nach Auswahl konkret an den tatsächlichen Ausschnitt anpassen.
2. Regelbeispiel aus der echten Oberfläche: Start, Nordostschritt und sichere Markierung in Stunde 1 mit realer Hexgeometrie zeigen; keine Lösung des aktuellen Rätsels behaupten. Geplanter Platz: nach dem Beispiel in „Mit den Stundenkarten arbeiten“. Bildunterschrift: „Beispiel: Ein Schritt nach Nordosten, als sicher in Stunde 1 markiert.“ Vorgesehener Alt-Text: „Vom Start führt ein Pfeil zum benachbarten Hexfeld im Nordosten; dort ist Stunde 1 mit einem Häkchen markiert.“ Bei UI-Änderungen erneuern.

Es werden vorläufig keine unfertigen Bilder oder Bildplatzhalter in der Spieloberfläche angezeigt. Diese beiden Illustrationen sind ausdrücklich als Folgeaufgabe zugelassen; keine ungeprüften Fremdassets übernommen. Die angehängte Stilreferenz erfordert keine Textänderung, da #31 den verbindlichen Text vorgibt.

## Validierung

35 Unit-Tests bestanden. Neue Browserprüfungen: zunächst geschlossene Regeln, alle Abschnitte, Listen und Hilfekosten, Tastaturbedienung des Details-Elements; transparente Dekorationen, Nummernfolge, Häkchen und Zentrierung des Radars in allen Zuständen bei 320/360/390/600/900/1440 Pixeln. Bestehende Browserprüfungen bleiben erhalten. Screenshots werden mit Playwright in GitHub Actions erzeugt; lokale Chromium-Installation scheitert an einem unvollständigen Download in dieser Umgebung.
