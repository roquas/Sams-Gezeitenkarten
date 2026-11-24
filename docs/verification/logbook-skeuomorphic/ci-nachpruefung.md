# Nachprüfung der CI-Teststruktur

Der erste PR-Head `a3c2db08e5f7eb3448d40ba5c7a22c4cedb6f876` bestand den vollständigen Unit-Lauf (525/525), Chromium (579 bestanden, drei bestehende Skips) und Deployment (336/336). Zwei neue WebKit-Desktop-Layouttests überschritten das unveränderte Testlimit von 30 Sekunden. Beide führten sechs Bildschirmbreiten in einem einzigen Test aus; die Abbrüche lagen beim Screenshot beziehungsweise beim abschließenden Auslesen der Textposition. Es gab dabei keine fehlgeschlagene Layout-Assertion.

Die sechs Breiten 320, 390, 620, 768, 900 und 1440 CSS-Pixel werden jetzt jeweils als eigener Test ausgeführt. Alle Assertions, beide Statuswechsel und die Bildschirmaufnahmen bleiben erhalten. Testlimits, bestehende CI-Retries und vorhandene Skips wurden nicht verändert. Die Anwendung sowie alle freigegebenen Bilder bleiben unverändert.

Die vollständigen neuen Logbuch- und Übersichtstests bestehen nach der Aufteilung lokal mit **50/50 in Chromium und 50/50 in WebKit**, jeweils ohne Skips und ohne Retries. Rohprotokolle: `regression-split-chromium.log` und `regression-split-webkit.log`. Die ursprünglichen 30 Fälle wurden durch die Aufteilung zweier Tests auf je sechs Breiten pro Browserprojekt zu 50 Fällen; die abgedeckten Situationen und Prüfungen wurden nicht reduziert.

Der abschließende fixierte Head und dessen eigener CI-Status werden in PR #127 dokumentiert. Der ältere maschinenlesbare Bericht und die bisherigen Nachweise bleiben als zeitlich eingefrorene Dokumentation erhalten; der abgeschlossene macOS-Vergleich steht ebenfalls in der PR-Beschreibung.
