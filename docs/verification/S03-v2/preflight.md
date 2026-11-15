# S03-v2 – technischer Vorprüfstand

Am 15.11.2026 am korrigierten Stand vor dem einzigen v2-Pilot bestanden.
Vertrag v2: Commit `772749f`, vor jeder v2-Diagnose festgelegt.
main-Synchronisierung: `70e563d` über Merge `1d80d0c`.
Implementierung: `b88bb98`, Testintegration `13b7b3c`.

- Vollständig erneut ausgeführte Unitsuite: **364 bestanden**, keine Fehler,
  Skips oder offenen Tests; darin sechs gezielte v2-Vertragstests und die
  bestehenden S03-Generator-, Diagnose- und H1-Semantikregressionen.
- Contenttests: **20 bestanden**; reguläre Puzzlevalidierung bestanden.
- Bestehende B2-/Mehrhex-Radar-/H1-Browserregressionen: **30 bestanden** auf
  Chromium Desktop und Pixel 7.
- Paketregressionen: **19 bestanden**.
- v1-Evidenzprüfung: **2 Tests bestanden**, alle ursprünglichen 705 Zustände.
- Ursprünglicher v1-Replay: **1 Test bestanden**, sämtliche deterministischen
  Laufdateien am ursprünglichen Programmcommit bytegleich.
- Archivprüfung gegen main `70e563d`: **zwei gültige Releases**, keine Änderung.
- No-cache-Server-Selbsttest und `git diff --check`: bestanden.

Die erste vollständige Suite hatte genau eine überholte Negativannahme:
S03 wurde nach der main-Integration noch als unbekannter Bestand getestet.
Der Test verwendet nun `UNKNOWN`; zunächst bestanden die betroffenen 13 Tests,
danach die vollständig erneut ausgeführte 364er-Suite. Keine Kriterienlockerung
oder Änderung produktiver Hinweis-/Solverregeln.

Vor dem Lauf bereits geprüft: exakt 80 materialisierte Rohkandidaten, 20 Karten,
62 unveränderte v1-Quelldateien; 72 Kandidaten bestehen den unveränderten frühen
Filter. Der deterministische Round-robin-Plan sieht genau zwei Diagnosen je Karte
vor. Die Planung benutzt keine bisherigen Diagnoseergebnisse.

Noch ausstehend und erst nach diesem Vorprüfstand vorgesehen: genau ein v2-Lauf,
neue Belegprüfung, v2-Replay, tatsächlicher v2-Export und v2-Browserprüfung.
Keine menschliche Testfreigabe und keine Veröffentlichung.
