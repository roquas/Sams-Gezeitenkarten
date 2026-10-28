> **Historischer Nachweis vor der Generatorkonsolidierung.** Aufrufe und Versionsverträge gelten am damaligen Gitcommit. Aktuell: [Generatorvertrag](../../CATALOG-COMPLIANT-GENERATION.md).

# Sichtungsnachweis: kataloggerechte Kontaktübersicht

Quellprogramm: `9d3bd4e8d1d1e47a3f81b1be425ac2b3cdf346e3` (main nach PR #88).
Release, Konfiguration, Auswahl, Originalversuche, Seeds, Fingerprints, konkrete
Assetbelegungen und Ausgabedatei-Hashes stehen in
[catalog-compliant.json](catalog-compliant.json). Der [Aufruf](../../MAP-CONTACT-SHEET.md)
erzeugt denselben Batch; die dortige Liste mit 24 Ergebnisindizes reproduziert
diese Auswahl.

- Ziel erreicht: 1.000 akzeptierte Karten aus 1.403 Versuchen, 403 Verwerfungen.
- Sichtung: 24 verschiedene Karten, ausschließlich `complete`, verteilt über
  den Batch bis Ergebnis 999 / Versuch 1402. Ergebnis 0 gehört zu Versuch 1.
- Unveränderte Freigabe: 18 konkrete Motive plus Meer und Rahmen; 20 geteilte
  Bildressourcen. Kein neues Bild, keine Bildanpassung oder Pixelfreigabe.
- Praktische Chromium-Sichtung über `file://`, 1560 × 1350 Pixel: alle 144
  Bildverwendungen dekodiert, kein Bildfehler, keine Platzhalter, kein horizontaler
  Überlauf. Die [Aufnahme](catalog-compliant.jpg) zeigt einen Ausschnitt; das
  lokale HTML-/ZIP-Artefakt enthält alle 24 Karten.
- Die bestehenden Renderer übernehmen Bildrechteck, Anker, Ausrichtung und
  transparente Bildbereiche. Randregressionen decken alle vier Kartenseiten ab.

Validierung der Integration:

```sh
node --test tests/contracts/map-contact-sheet.test.mjs tests/contracts/target-contact-sheet.test.mjs
node --test tests/contracts/map-batch.test.mjs tests/contracts/target-map-batch.test.mjs tests/contracts/released-asset-catalog.test.mjs tests/contracts/chart-asset-contract.test.mjs tests/contracts/graphic-geometry.test.mjs tests/engine/catalog-compliant.test.mjs
npx playwright test tests/browser/contact-sheet.spec.mjs --workers=1
npm run test:content
npm run test:puzzles
git diff --check
```

16 Kontaktübersichts- und 55 bestehende Batch-/Release-/Geometrie-/Generator-
Regressionen bestanden, dazu sechs Chromium-Browsertests (Desktop und Mobil),
drei Contenttests und die Rätselvalidierung. Die Format-2-Tests prüfen unter
anderem nicht übereinstimmende Indexräume, modifizierte oder fehlende Zeilen,
Budgeterschöpfung, exakte SVG-Platzierung, Bytegleichheit und die Auswahl aus
1.000 akzeptierten Ergebnissen. Die bisherigen Format-1-Diagnosefälle einschließlich
`partial` und `none` bleiben enthalten.

Dies ist eine lokale visuelle Sichtung und keine Grafikfreigabe oder
Rätselbewertung. WebKit wurde lokal wegen fehlender Systembibliotheken nicht
betrieben; die vorhandenen CI-Jobs installieren diese Abhängigkeiten. Eine
komplette Nachberechnung sämtlicher Analysemetriken gehört weiterhin zum
Batch-Replay, nicht zur Kontaktübersicht. Es wurde kein Vertragsfehler in PR #88
festgestellt; Generatorregeln und Renderingverträge wurden nicht verändert.
