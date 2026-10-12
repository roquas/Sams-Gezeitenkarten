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

## Stand 12.10.2026 – Interaktionsrekonstruktion

- [Interaktionsspezifikation 3.6](INTERACTION-SPEC-3.6.md) aus dem unveränderten Original-HTML dokumentiert.
- [Fünf Source-Contract-Tests](../tests/reference/source-contract.test.mjs) für Zustandsinitialisierung/Persistenz, Markierungen, Route, Schalter und Strafpunkte/Reset angelegt. Die fünf enthaltenen Assertionsgruppen wurden lokal anhand des Original-HTML abgeglichen und bestanden.
- **Einschränkung:** Source-Contract-Tests prüfen Quelltextfragmente, **nicht** das tatsächliche Verhalten im Browser. Es wurde noch kein Playwright-/Safari-Test ausgeführt und kein CI-Workflow eingerichtet.
- Offene fachliche Punkte: Undo-Grenzen, Stunde-0-Markierungen, Persistenz einzelner Einstellungen, Drag/Pointer-Capture und Schema-Validierung. Diese Punkte vor einer Verhaltensänderung gemeinsam entscheiden.
