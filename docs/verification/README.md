# Verifikationsnachweise

[Markierbare Zwischenfortschritte, Profilversion 2](B2-deduction-profile-v2/report.md):
konkrete ×/?/✓ mit Zustands- und Regelzeugen für A–D und die bisherigen Referenzen.
[Datenformat und Reproduktion](B2-markable-progress.md),
`npm run report:b2:progress -- --check`. Enthält Lösungsschlüsse; Version 1 bleibt unverändert.

[B2-Deduktionsprofile](B2-deduction-profile/report.md): beschreibender Offline-Vergleich
von V1/V2, T02/T07 und der T07-Kontrolle; enthält Lösungsschlüsse.
[Datenformat und Grenzen](B2-deduction-profile.md). Reproduktion:
`npm run report:b2:profile -- --check`; keine Schwierigkeitsschätzung oder Auswahl.

B2 V2 mit echtem Zählschluss: [lösungsfreie Spieltestanleitung](../B2-POSITIVE-V2-PLAYTEST.md).
`B2-positive-v2/private/` enthält Lösung und Begründungsgraphen; erst nach dem
Spieltest öffnen. Der V2-Vertrag wurde vor der Konstruktion festgeschrieben.

Positive B2-Kontrollreferenz: [lösungsfreie Spieltestanleitung](../B2-POSITIVE-PLAYTEST.md).
Die Nachweise unter `B2-positive/private/` und der Deduktionsvertrag enthalten
konkrete Lösungsschlüsse; erst nach dem menschlichen Test öffnen.

[B2-Deduktionsdiagnose](B2-deduction/report.md): Offline-Prototyp für T02/T07,
T07-Kontrollversuch mit vorgegebener Stunde 3 und dokumentierte Modellgrenze der
historischen Quittung von Nombreo. Reproduktion:
`npm run report:b2:deduction -- --check`; kein Generatorlauf oder Browserexport.

Aktueller Generator-/Batch-/Sichtungsnachweis:
[generation-consolidation.md](generation-consolidation.md).

Die Dateien `F04b-map-sample.json`, `F04b-catalog-sample.json`,
`graphic-contract-A-catalog-sample.json`, `catalog-compliant-batch.json` und die
zugehörigen älteren Markdownberichte sind historische Entwicklungsnachweise.
Sie gehören ausschließlich zu den dort angegebenen ursprünglichen Gitcommits.
Ihre Modi, Formatversionen und Messverträge sind keine verfügbaren Alternativen
im aktuellen Programm. Gleiches gilt für die ausdrücklich historische
Format-2-Sichtung unter `docs/reviews/contact-sheet/catalog-compliant.*`.

Andere Nachweise zu Grafikverträgen, Releases und veröffentlichten Rätseln behalten
ihre jeweilige fachliche Bedeutung. Historische Zahlen werden nicht nachträglich
auf neue Verträge umgeschrieben.
