# UI-Spezifikation – Prototypreferenz 3.6

Die Oberfläche besteht aus Stundenauswahl, Werkzeugleiste, illustrierter Hexkarte, Hinweisen, Schaltern unter der Karte und Einstellungen.

**Werkzeugleiste:** `?`, `✓`, `×`, Radieren für aktuelle Stunde, `⌫∀` für das Feld in allen Stunden, Route zeichnen und direkt daneben eine Einmalaktion „Etappe zurück“. Kein Lineal.

**Unter der Karte:** Rückgängig, Sichtbarkeit der aktuellen Stundenmarkierungen, Routennummern, Abstände. Kein „Rest ausschließen“ oder „Karte leeren“.

**Einstellungen:** „Karte leeren“ betrifft nur die ausgewählte Stunde; „Gesamtes Rätsel zurücksetzen“ ist separat. Seekartenillustration und Markierungen auf Routenfeldern können ein-/ausgeblendet werden.

**Abstände:** Aktivieren → „Bitte Feld wählen“ → Wasserfeld auswählen. Das gewählte Feld zeigt 0; andere Wasserfelder zeigen Hexdistanzen; Land keine Zahlen. Große, halbtransparente Zahlen liegen unter Route/Markierungen. Aus- und Wiedereinschalten setzt die Bezugsfeldauswahl zurück.

**Routennummern:** Optional S am Start und 1–6 auf den Routenfeldern; unabhängig von der aktuellen Stunde.

**Testbedarf:** Touch-Drag, Undo-Grenzen, Kontrast und Überlagerungen, Tastatur/Fokus, kleine Displays, Neuladen/Persistenz. Nichts davon gilt allein durch diese Beschreibung als bestanden.
