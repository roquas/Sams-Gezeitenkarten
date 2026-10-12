# Gezeitenkarten 3.6 – Der verschwundene Kompass

Die `index.html` und den Ordner `assets/` zusammen auf einen Webserver (z. B. Uberspace) kopieren. Die Anwendung benötigt keine Bibliotheken oder externe Dienste.

## Änderungen gegenüber 3.5

- Neuer Fall mit sieben Hinweisen und sechs Schritten. Start Delta/Blau, Landfelder B3, C3 und E2 unverändert.
- Werkzeugleiste: Radieren für aktuelle Stunde (⌫), Radieren für alle Stunden (⌫∀), Route und Route zurück direkt nebeneinander.
- Unter der Karte: Rückgängig, Sichtbarkeit der Markierungen der aktuellen Stunde, Routennummern und Abstände.
- Abstände: Toggle einschalten, Wasserfeld als Ursprung wählen, Entfernungszahlen auf allen befahrbaren Feldern einblenden. Aus- und Wiedereinschalten fordert einen neuen Ursprung an.
- Routennummern zeigen S und 1–6 auf den Feldern der eingezeichneten Route.
- Aktuelle Stundenkarte leeren unter Einstellungen; Rest ausschließen, Lineal und beigefarbener Mittelpunkt entfallen.

## Prüfstand

519 zulässige Routen ab Delta/Blau wurden gegen alle sieben Hinweise geprüft. Genau eine Route erfüllt alle Hinweise; sechs der sieben Hinweise sind für die Eindeutigkeit notwendig. Die JavaScript-Syntax wurde mit Node.js geprüft. Ein automatisierter Browser-Test war in der Ausführungsumgebung nicht möglich; bitte Desktop- und Mobilbedienung praktisch testen.
