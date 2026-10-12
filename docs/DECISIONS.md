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
