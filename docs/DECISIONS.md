# Entscheidungen und offene Fragen

| ID | Status | Thema | Stand |
|---|---|---|---|
| ADR-001 | Beschlossen | Ablage | Privates GitHub-Repository `roquas/Sams-Gezeitenkarten` |
| ADR-002 | Beschlossen | Technikprinzip | Schlank, wartbar, möglichst ohne großes Framework |
| ADR-003 | Beschlossen | Workflow | Ideen im Backlog, dokumentierte Anforderungen, Tests und bewusste Releases |
| ADR-004 | Offen | Modulsystem | Native ES-Module oder Buildprozess |
| ADR-005 | Offen | Testtechnik | Node-Test-Runner und Playwright als Vorschlag |
| ADR-006 | Offen | Bildrechte | Vor Veröffentlichung prüfen |
| ADR-007 | Offen | Generator | Datenformat, Schwierigkeit und Qualitätsgrenzen |
| ADR-008 | Offen | Projektboard | GitHub Projects und Statusfelder konfigurieren |
| ADR-009 | Offen | Backend | Für Tagesrätsel/Highscores später entscheiden |

Entscheidungen künftig mit Begründung, Datum und Auswirkungen dokumentieren.


## Umsetzung 0.1 (12.10.2026)

- ADR-004: Native ES-Module, kein Buildschritt. Technische Umsetzung des beauftragten modularen Nachfolgers.
- ADR-005: Node-Test-Runner und Playwright mit Lockfile; Desktop und Mobilansicht in Actions.
- Eigener Einstiegspunkt im Repository-Wurzelverzeichnis; Original 3.6 unverändert.
- Eigener fallbezogener Speichername ohne automatische Prototypmigration.
- Undo speichert Bearbeitungen separat von Anzeigen und bezahlten Denkanstößen.
- Einzelheiten und offene Grenzen: `docs/IMPLEMENTATION-0.1.md`.

## Permanente Ortsringe entfernt (19.10.2026, PR #65)

Beschlossen: Benannte befahrbare Orte und Flavor zeigen nur ihre Illustration, ohne permanenten Kartografenring und ohne Pergamentschild. Benannte unbefahrbare Orte behalten die Pergamentrolle mit Ortsnamen. Die Unterscheidung benannter Orte und Flavor bleibt in den Rätseldaten erhalten. Normale Spielmarkierungen und bestehende Assetfreigaben bleiben unverändert. Diese Entscheidung ersetzt die vorherige Gestaltung mit orange/goldenen Ortsringen.

## Spätere Idee: Referenzorte eines Logbuchhinweises

**Nur vorgemerkt, nicht implementiert und noch nicht im Detail entschieden:** Beim Auswählen eines Logbuchhinweises könnten ausschließlich dessen ausdrücklich genannte Referenzorte vorübergehend dezent auf der Karte hervorgehoben werden. Dabei dürfen keine zusätzlichen Rätselinformationen verraten werden: keine abgeleiteten Orte, Kandidatenfelder, Entfernungen oder Lösungen anzeigen. Die Unterscheidung benannter Orte und Flavor bleibt als Datenbasis erhalten. Diese Idee führt jetzt weder neue Interaktionen noch neue Hervorhebungen ein.


## Kurze, lesbare Ortsnamen (19.10.2026, PR #65)

Beschlossen für künftige Assetgestaltung und Benennung: bevorzugt ein charakteristisches Wort mit etwa 6–12 Zeichen, längere Namen nur nach Prüfung in tatsächlicher Kartengröße; keine extreme automatische Schriftverkleinerung. Humor und klare Unterscheidbarkeit passen zu „Plötzlich Pirat:in“. [Verbindliche Namensregel und unverbindliche Beispiele](WORLD-AND-STYLE.md#verbindliche-gestaltungsregel-ortsnamen-auf-pergamentrollen). Bestehende Namen, Rätseldaten und Logbuchtexte werden damit nicht umbenannt; die Labelarchitektur bleibt unverändert.
