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
