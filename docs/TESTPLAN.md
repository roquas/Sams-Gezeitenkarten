# Teststrategie – Entwurf

## Automatisierte Ebenen

- **Unit:** Hex-Nachbarschaft, Distanz (Symmetrie, 0, Nachbarn), Richtungen und 60°-Drehungen, Küstenregel, Routenvalidierung, Hinweisprädikate.
- **Generator:** Genau eine Lösung je Fall; reproduzierbare Seeds; keine unerreichbaren Felder; Schwierigkeitsmetriken, Randfälle, Laufzeit.
- **UI/Integration:** Stundenwechsel, Markierungen, `⌫`/`⌫∀`, Undo, Route/Etappe zurück, Distanzanzeige, Routennummern, Einstellungen, Reset, Speichern/Neuladen, Hinweisstatus, Lösungskontrolle.
- **Manuell:** Safari auf Mac und iPhone, Touch, Lesbarkeit, Überlagerungen, Performance, Rätselqualität.

## Release-Gate (Ziel, noch nicht umgesetzt)

Scope/Akzeptanzkriterien festgelegt → Tests grün → Browser-Smoke-Test → manuelle Abnahme → Changelog, bekannte Fehler und Releaseartefakte dokumentieren.

## Ist-Stand

Das README von Prototyp 3.6 dokumentiert eine Prüfung aller 519 zulässigen Routen auf genau eine Lösung sowie einen JavaScript-Syntaxcheck. **Es existiert noch keine vollständige automatisierte Browser- oder Regressionstestsuite im Repository.** Testberichte müssen zwischen bestanden, fehlgeschlagen und nicht ausgeführt unterscheiden.
