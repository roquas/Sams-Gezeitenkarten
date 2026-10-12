# Spielversion 0.1

## Schritt 1: Oberfläche isolieren

Die Oberfläche von 3.6 liegt als eigener Einstiegspunkt mit CSS und ES-Modul vor.
Das Archiv bleibt unverändert; seine Grafiken werden wiederverwendet.
Eigener Speichername verhindert Änderungen an gespeicherten Prototyp-Spielständen.
Noch keine Migration: Regeln und Bedienung werden im nächsten Schritt angeschlossen.

Validierung: 15 Unit-Tests bestanden. Browserprüfung anfangs durch fehlende
Chromium-Installation blockiert; Installation und erneute Prüfung erfolgen vor Push.

## Schritt 2: Vorhandene Engine anschließen

Start, befahrbare Felder, Sperrfelder, Lösung für Notizprüfung, Hinweistexte,
Hintergrund und Overlays stammen aus `puzzles/reference-3.6.mjs`.
Hexabstände und Nachbarschaft stammen aus `src/engine/hex.mjs`.
Routenprüfung nutzt Legalität und sämtliche Hinweisprädikate der Engine.
Keine neuen Rätselregeln oder Generatorfunktionen.

Schritt 1: GitHub Actions Push-Lauf 38256784467 erfolgreich (Unit + Browser).
Lokale Browsertests können wegen blockierter Chromium-Downloads nicht starten;
die vollständige Browserprüfung erfolgt in Actions für Desktop und Mobilansicht.

## Schritt 3: Spielstand und Undo

Eigene DOM-unabhängige Module für Initialzustand, begrenzte flüchtige Historie
und fehlertolerante Speicherung. Ungültige Routen werden zurückgesetzt;
Notizen und Anzeigeoptionen werden validiert. Persistierte HTML-Rückmeldungen
werden beim Laden verworfen. Kein Zugriff auf den alten 3.6-Speicherschlüssel.

Beschlossene Korrekturen: nur Stunden 1–6 auswählbar; Denkanstöße und ihre Kosten
bleiben auch bei Undo älterer Bearbeitungen bestehen. Reine Anzeigeänderungen
haben keinen Undo-Eintrag und werden nicht zurückgesetzt. Notizprüfung bleibt
wie bisher rückgängig machbar, da keine gegenteilige Produktentscheidung vorliegt.
Werkzeugwechsel beendet die Abstandsanzeige gemäß besprochenem Fehlerbericht.

Schritt 2: Push-Lauf 38257016148 erfolgreich. Neue Unit- und Browserregressionen
prüfen Undo, Speicherung, ungültige Routen und Werkzeugwechsel.
