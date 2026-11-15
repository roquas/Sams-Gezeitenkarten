# Technischer Prüfstand vor dem ersten Pilotlauf

Am 14.11.2026 bestanden, Programmstand `d66ec74` (Implementierung `ee5da7d`),
Vertrag bereits in `224f5ce` festgelegt. Der ursprüngliche Lauf wird danach von
seinem eigenen Manifest an den sauberen Programmcommit gebunden.

- `npm run test:unit`: **340 bestanden**, keine Fehler, Skips oder offenen Tests.
- `npm run test:content`: **20 bestanden**.
- `npm run test:puzzles`: vorhandene reguläre Rätselvalidierung bestanden.
- B2- und Mehrhex-Radar-Browserregressionen: **24 bestanden**, Chromium Desktop
  und Pixel 7 (`tests/browser/b2-playtest.spec.mjs`, `multihex-radar.spec.mjs`).
- `python3 tests/test_package.py`: **19 bestanden**.
- `python3 scripts/dev-server.py --self-test`: bestanden.
- Archivprüfung gegen Basis `6445021`: **zwei gültige Releases**, unverändert.
- `git diff --check`: ohne Befund.

Die sieben gezielten S03-Vertragstests sind in der Unitsuite enthalten. Sie prüfen
Parameterproduktion vor Wahrheitstest/ID-Vergabe (Single-Hour S0 und andere
Familien erhalten), Determinismus und Budgets, optionalen Such-Hook,
Identitäts-/Wirkungsduplikate ohne erneute Diagnose, Qualitätsfiltergrenzen,
Serienauswahl, reale Quell-/Releasebindung und privaten/öffentlichen Export.

Im ersten vollständigen Prüflauf scheiterten zwei historische Berichtstests allein
am bewusst geänderten aktuellen Quellhash von `puzzle-clues.mjs`. Der Vergleich
prüft nun historische und aktuelle Provenienz ausdrücklich getrennt; sämtliche
anderen Berichtsbytes müssen weiterhin übereinstimmen. Danach bestanden sowohl
14 gezielte Prüfungen als auch die erneut vollständig ausgeführte 340er-Suite.
Historische Evidenz und Rätselbestände wurden nicht umgeschrieben.

Noch nicht Gegenstand dieses Vorprüfstands: S03-Ausbeute, Prüfung der neu
entstehenden Beweisgraphen, Replay des später gespeicherten Pilots sowie
S03-Browserprüfung. Diese folgen erst auf den begrenzten Pilotlauf. Kein
menschlicher Spieltest und keine Freigabe des täglichen Betriebs.
