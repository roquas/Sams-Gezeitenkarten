# Originalquellen und spätere Importe (#34)

[Issue #34](https://github.com/roquas/Sams-Gezeitenkarten/issues/34) bleibt offen. Bestandsprüfung am 13.10.2026:

- Im Repository tatsächlich vorhanden: unveränderte Originaldateien unter `prototypes/3.6/`, bisherige modulare Referenzdefinition und deren redaktionelle Inhalte. Der neue JSON-Fall `../reference-3.6.json` wird gegen diese Referenz geprüft.
- In der Arbeitsumgebung zusätzlich vorhanden: `seekarte-spielintegration.zip` mit vier Kartenassets, Installationsskript und README. **Keine historischen Rätselinhalte**. Sonstige ZIPs sind Browser-/Testberichte.
- Nicht vorhanden: `gezeitenkarten_3_0_kartenlesbarkeit.zip`, `gezeitenkarten_3_1_meer_und_markierungen.zip`, `gezeitenkarten_3_2_hilfe_und_lineal.zip`, `gezeitenkarten_3_3_neuer_fall.zip`, `gezeitenkarten_3_4_tesoro.zip`, `gezeitenkarten_3_5_kurswechsel.zip` und gegebenenfalls 2.9. Benötigt werden Original-HTML/JS mit vollständiger Logik, Lösung und Texten, zugehörige README/Provenienz sowie etwaige Asset-Lizenzen. Beschreibungen im Issue reichen nicht zur Rekonstruktion.
- Die Stil-/Weltreferenz ist keine historische Rätselquelle. Sie wurde in diesem technischen Schritt nicht für neue redaktionelle Inhalte verwendet.

Pro späterem Import eine ausgefüllte Kopie von `provenance-template.json` ablegen; **keine leeren Vorlagen ins Spielmanifest aufnehmen**. Quelle mit SHA-256 sichern, UI-Revisionen mit identischer Logik deduplizieren, Unterschiede der Hinweissemantik explizit bearbeiten, ins Schema 1 übertragen und Solver/Katalogprüfung ausführen. Alte Eindeutigkeits-/Redundanzbehauptungen neu überprüfen. Anschließend Manifest ergänzen und Desktop-/Mobil-Smoke-Test durchführen. Originaldokumente nicht überschreiben.

`../test-navigation.json` ist ein eigens markierter **synthetischer Integrationstest**, kein rekonstruiertes Archiv und keines der zwei geplanten redaktionellen Rätsel. Die historische Übernahme und beide neuen redaktionellen Fälle bleiben ausdrücklich Folgearbeit; damit auch der ursprüngliche Inhaltsanteil von #33. #18/#19/#23 und der technische Auswahlanteil von #33 werden unabhängig davon prüfbar.
