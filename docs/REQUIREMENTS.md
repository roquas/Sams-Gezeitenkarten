# Anforderungen – Baseline 0.1

**Status:** `IST` = in Prototyp 3.6 beobachtbar/implementiert, **nicht** regressiongetestet; `ZIEL` = künftige Anforderung; `OFFEN` = noch zu entscheiden.

| ID | Status | Anforderung |
|---|---|---|
| CORE-001 | IST | Eine Karte definiert befahrbare und gesperrte Hexfelder; die Anzahl und Position gesperrter Felder sind **Falldaten**, keine globale Konstante. Referenzfall 3.6: 5×5, gesperrt B3/C3/E2. |
| CORE-002 | IST | Route startet festgelegt, verläuft über benachbarte Wasserfelder und besucht kein Feld zweimal. |
| CORE-003 | IST | Sechs Fahrtstunden; Start und sechs Folgestationen ergeben sieben Positionen. |
| CORE-004 | IST | Route kann gegen eine hinterlegte Lösung geprüft werden. |
| UI-001 | IST | Sechs Stunden mit unabhängigen Feldmarkierungen. |
| UI-002 | IST | Werkzeuge für vielleicht, ja, nein, stundenweises und stundenübergreifendes Radieren sowie Route und Etappe zurück. |
| UI-003 | IST | Rückgängig für unterstützte Bearbeitungen. |
| UI-004 | IST | Stundenmarkierungen sichtbar/unsichtbar schalten und optional auf Routenfeldern ausblenden. |
| UI-005 | IST | Routennummern S und 1–6 optional anzeigen, unabhängig von der gewählten Stunde. |
| UI-006 | IST | Hexabstände nach Wahl eines Wasserfelds einblenden, bei Deaktivierung entfernen. |
| UI-007 | IST | Aktuelle Stunde leeren und gesamtes Rätsel separat zurücksetzen. |
| UI-008 | IST | Hinweise anzeigen und abhaken, Hilfen und Rückmeldungen anbieten. |
| UI-009 | ZIEL | Gut lesbare und bedienbare Desktop- und Mobilansicht, inkl. Touch. |
| ENG-001 | ZIEL | Regeln und Hinweisprädikate DOM-unabhängig testbar. |
| GEN-001 | ZIEL | Generator liefert genau eine gültige Route je Rätsel. |
| GEN-002 | ZIEL | Generator prüft auch Lösungsqualität, nicht nur Eindeutigkeit. |
| DATA-001 | ZIEL | Rätsel sind als versionierte Daten vom UI getrennt. |
| OPS-001 | ZIEL | Reproduzierbarer Build, Tests und dokumentierte Releasefreigabe. |
| RIGHTS-001 | OFFEN | Grafiken und Bezüge vor Veröffentlichung rechtlich klären. |

## UI-006: Akzeptanzkriterien

1. Aktivieren fordert zunächst ein befahrbares Bezugsfeld an.
2. Bezugsfeld zeigt 0, andere Wasserfelder die korrekte Hexdistanz; Landfelder keine Zahl.
3. Zahlen liegen über der Seekartenillustration, aber unter Route und Markierungen.
4. Ausschalten entfernt die Anzeige; erneutes Einschalten fordert erneut ein Bezugsfeld.

**Nicht mehr gewünscht:** Lineal, „Rest ausschließen“, beige Mittelpunktmarkierung, separate „Letzte Etappe zurück“-Schaltfläche unter der Karte.

**Noch nicht spezifiziert:** Persistenzmigration, Tastaturbedienung, Barrierefreiheit, exakte Scoring-/Hilferegeln, vollständige Undo-Semantik.
