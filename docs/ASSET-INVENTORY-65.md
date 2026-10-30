> Ergänzung vom 30.10.2026: [A0 abgeschlossen – vier Einzelhexinseln, sechs befahrbare Akzente und elf Zweierinseln](A0-COMPLETION.md). Arbeitskatalog: 55 Assets, 34 exakte Kunstfreigaben, 33 vorgesehene Ortsmotive. Die folgenden PR-65-Zahlen und Hashes dokumentieren den historischen Stand; archivierte Releases bleiben unverändert.

# Vollständige Assetübersicht – PR #65

Abschließende Konsolidierung, 20.10.2026. Künstlerische Produktion vorerst beendet. Maßgeblich ist die tatsächliche Datei in `assets/catalog/library.json`. Frühere Berichte bleiben historische Nachweise. **19 unverändert erhaltene exakte Bild-/Meer-Freigabepaare**: 18 produktiv vorgesehene Orte und die künstlerisch freigegebene, produktiv zurückgestellte Schaumströmung. Keine siebte Ortsfreigabe aus einer Zählung abgeleitet.

Technische Rollen bleiben `geographic` mit eigenem `passable`-Wert bzw. `decoration` ohne Regelwirkung. Einzelhex/Mehrhex und bestehende `type`-Werte bleiben unverändert. Die sechs kleinen Ortsmotive behalten aus Identitätsgründen ihre vorhandenen IDs `sea-life.accent…` und den vorhandenen Typ `accent`; ihre Rolle ist nun ausdrücklich `geographic`, `passable=true`. Ob befahrbare Orte Hinweisreferenzen werden, entscheidet die Karteninstanz beziehungsweise der Rätselgenerator. Alle atmosphärischen Motive sind gemäß [Issue #70](https://github.com/roquas/Sams-Gezeitenkarten/issues/70) zurückgestellt. Das separate Feld `production` ist Verwendungspolitik, kein neuer Assettyp; Produktionsplatzierungen benötigen sowohl `enabled` als auch eine künstlerische Freigabe. Fehlendes Feld, Entwürfe, historische Varianten und zurückgestellte Motive werden abgewiesen.

## Sämtliche 40 Katalogassets

Freigaben in der Tabelle gelten ausschließlich für die aktuelle Version von `sea-blue-01.webp`. Auf beiden anderen Hintergründen sind alle modernen Illustrationen weiterhin pending. Die Hashspalte zeigt nur tatsächliche Approval-Hashes, keine bloßen Dateiprüfsummen. **Vollständige SHA-256-Werte und sämtliche Hintergrundreviews** stehen in [full-inventory.json](reviews/consolidation/full-inventory.json) und im [Katalog](../assets/catalog/library.json).

| Motiv / Asset-ID | Technische Kategorie | Datei | Künstlerischer Status | Hashprüfung / Approval-Hash Bild | Produktiv auf sea-blue-01 |
|---|---|---|---|---|---|
| Technischer Einzelhex-Platzhalter · `technical.single.v1` | geographic / island · 1 Hex · unbefahrbar | [technical-single.png](../assets/library/technical-single.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Technischer Platzhalter |
| Technischer Zweierhex-Platzhalter · `technical.double.v1` | geographic / island · 2 Hex · unbefahrbar | [technical-double.png](../assets/library/technical-double.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Technischer Platzhalter |
| Technischer Leuchtturm-Platzhalter · `technical.lighthouse.v1` | geographic / lighthouse · 1 Hex · befahrbar | [technical-lighthouse.png](../assets/library/technical-lighthouse.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Technischer Platzhalter |
| Technischer Dekorations-Platzhalter · `technical.decoration.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [technical-decoration.png](../assets/library/technical-decoration.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Technischer Platzhalter |
| Reduzierte Felsnadel · `land-coast.island.h1.basalt-spire.v1` | geographic / island · 1 Hex · unbefahrbar | [basalt-spire-v1.png](../assets/library/basalt-spire-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Entwurf / erneut zu prüfen |
| Wasserreiche Felsnadel (Original) · `land-coast.island.h1.basalt-spire-water.v1` | geographic / island · 1 Hex · unbefahrbar | [basalt-spire-water-v1.png](../assets/library/basalt-spire-water-v1.png) | approved | geprüft, exakt · `21986016dcaf203ae7e2036cf19e35e1437d23fc90b196c87b46b26c1a7fd2cd` | Ja |
| Leuchtturm · `navigation.lighthouse.h1.offcenter-beacon.v1` | geographic / lighthouse · 1 Hex · befahrbar | [lighthouse-offcenter-v1.png](../assets/library/lighthouse-offcenter-v1.png) | approved | geprüft, exakt · `716ab0f81fafb7669ccad71907c6845c7db77d380595abcdefa7b4139dc4e68f` | Ja |
| Zerbrochenes Atoll · `land-coast.atoll.h1.broken-passages.v1` | geographic / atoll · 1 Hex · befahrbar | [atoll-broken-v1.png](../assets/library/atoll-broken-v1.png) | approved | geprüft, exakt · `764bf3e2f85e566fe30d380af6ea8d6835d1936d533f76a295fd0e638b98f8d2` | Ja |
| Versunkenes Wrack · `navigation.wreck.h1.offcenter-sloop.v1` | geographic / wreck · 1 Hex · befahrbar | [wreck-offcenter-v1.png](../assets/library/wreck-offcenter-v1.png) | approved | geprüft, exakt · `a7c9386e7ff0b291015a6e1b0a88c5a29b9d36cc5f174e7d09a326f9dda42fec` | Ja |
| Palmenbuchten · `land-coast.island.h2.tropical-bays.v1` | geographic / island · 2 Hex · unbefahrbar | [tropical-bays-h2-v1.png](../assets/library/tropical-bays-h2-v1.png) | approved | geprüft, exakt · `03f70eb90085f36ebf5d7a06db158e73048282f68be580465021d5bc0a31c773` | Ja |
| Glutberg · `land-coast.island.h3.massive-volcano.v1` | geographic / island · 3 Hex · unbefahrbar | [massive-volcano-h3-v1.png](../assets/library/massive-volcano-h3-v1.png) | approved | geprüft, exakt · `9dc2e28e8edba04cb768bc8650640ad4c4f3b2a5778f6519da4f713b6e79b828` | Ja |
| Sandriffbogen – früher Entwurf · `land-coast.archipelago.h3.bent-reefs.v1` | geographic / archipelago · 3 Hex · unbefahrbar | [bent-reefs-h3-v1.png](../assets/library/bent-reefs-h3-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Sandriffbogen · `land-coast.archipelago.h3.sand-reefs.v2` | geographic / archipelago · 3 Hex · unbefahrbar | [sand-reefs-h3-v2.png](../assets/library/sand-reefs-h3-v2.png) | approved | geprüft, exakt · `4ecc67e6704b9bb2124b3f56804799a8debacb93fa2e171619d3e220a037f78e` | Ja |
| Südhafen · `land-coast.island.h3.south-harbor.v1` | geographic / island · 3 Hex · unbefahrbar | [south-harbor-h3-v1.png](../assets/library/south-harbor-h3-v1.png) | approved | geprüft, exakt · `cb4086c17282d8fc94cadf3c6508a8b41bd3287b88b78dfc348fe6f0f85b5f62` | Ja |
| Schmugglerbucht · `land-coast.island.h3.smuggler-cove.v1` | geographic / island · 3 Hex · unbefahrbar | [smuggler-cove-h3-v1.png](../assets/library/smuggler-cove-h3-v1.png) | approved | geprüft, exakt · `ef714948e10fb923fc6c7e5299ea4cc7064468a8d267c5e0f6463dbe0c1d4075` | Ja |
| Langer Strand · `land-coast.island.h4.long-sand.v1` | geographic / island · 4 Hex · unbefahrbar | [long-sand-h4-v1.png](../assets/library/long-sand-h4-v1.png) | approved | geprüft, exakt · `599ff785c04453aa9f75b9214b7c994a6596b3b63026b8bfd31d89c8870f2130` | Ja |
| Krabbenzange v1 · `land-coast.island.h4.crab-claw.v1` | geographic / island · 4 Hex · unbefahrbar | [crab-claw-h4-v1.png](../assets/library/crab-claw-h4-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Tempel der Gezeiten · `land-coast.island.h4.jungle-temple.v1` | geographic / island · 4 Hex · unbefahrbar | [jungle-temple-h4-v1.png](../assets/library/jungle-temple-h4-v1.png) | approved | geprüft, exakt · `6b3a942beda696b1fca3039fb032d7a2719c9ecc42e5e3c9741a530479b31254` | Ja |
| Krabbenzange v2 · `land-coast.island.h4.crab-claw.v2` | geographic / island · 4 Hex · unbefahrbar | [crab-claw-h4-v2.png](../assets/library/crab-claw-h4-v2.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Tesoro v1 · `land-coast.settlement.h4.tesoro.v1` | geographic / settlement · 4 Hex · unbefahrbar | [tesoro-h4-v1.png](../assets/library/tesoro-h4-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Tesoro v2 · `land-coast.settlement.h4.tesoro.v2` | geographic / settlement · 4 Hex · unbefahrbar | [tesoro-h4-v2.png](../assets/library/tesoro-h4-v2.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Tesoro v3 · `land-coast.settlement.h4.tesoro.v3` | geographic / settlement · 4 Hex · unbefahrbar | [tesoro-h4-v3.png](../assets/library/tesoro-h4-v3.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Tesoro v4 · `land-coast.settlement.h4.tesoro.v4` | geographic / settlement · 4 Hex · unbefahrbar | [tesoro-h4-v4.png](../assets/library/tesoro-h4-v4.png) | approved | geprüft, exakt · `5f0e774404cdea43237b230d3b12515df5c4b0dc547b3ff5bee8ad33c1ed2b61` | Ja |
| Treibende Fässer · `sea-life.accent.h1.barrels.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-barrels-v1.png](../assets/library/flavor-barrels-v1.png) | approved | geprüft, exakt · `d2f224a66834d413dc4137c0a394fd5f1a58e0bd534d72566ea7fd88343f7795` | Ja |
| Einzelne Boje · `sea-life.accent.h1.buoy.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-buoy-v1.png](../assets/library/flavor-buoy-v1.png) | approved | geprüft, exakt · `10a5f73cd6a2a26d785521c3c03753f79af02c016a086441093894248606e2a4` | Ja |
| Seevögel v1 · `sea-life.accent.h1.gulls.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-gulls-v1.png](../assets/library/flavor-gulls-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Delfine v1 · `sea-life.accent.h1.dolphins.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-dolphins-v1.png](../assets/library/flavor-dolphins-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Historisch |
| Ruderboot · `sea-life.accent.h1.rowboat.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-rowboat-v1.png](../assets/library/flavor-rowboat-v1.png) | approved | geprüft, exakt · `2f70f944606bd8b86e0ef74e1f60a53475c6c2a85d610b0f76098968dfd26e6b` | Ja |
| Treibende Kiste · `sea-life.accent.h1.crate.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-crate-v1.png](../assets/library/flavor-crate-v1.png) | approved | geprüft, exakt · `84fa17dd6a7e10db9ab888f5e6f4719aa74775f112c7b3edafdf6588f754e180` | Ja |
| Sanfte Schaumströmung · `sea-life.accent.h1.foam.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-foam-v1.png](../assets/library/flavor-foam-v1.png) | approved | geprüft, exakt · `a92b6daadeabed732ecba1a8e00b7ebbbd6ee94104f326553c94a11f8e18611b` | Nein · Zurückgestellt |
| Flaschenpost · `sea-life.accent.h1.bottle.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-bottle-v1.png](../assets/library/flavor-bottle-v1.png) | approved | geprüft, exakt · `2d281966978a7ae1d83603723d713810cfde253a0538457915c8e7ef5c076150` | Ja |
| Treibholz und Seetang · `sea-life.accent.h1.driftwood.v1` | geographic / accent · 1 Hex · befahrbar | [flavor-driftwood-v1.png](../assets/library/flavor-driftwood-v1.png) | approved | geprüft, exakt · `daa7091a699ea6a217381fd937c0c0a55f6b0c9beb37192aae14c32e954cd378` | Ja |
| Meeresschildkröte · `sea-life.accent.h1.turtle.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-turtle-v1.png](../assets/library/flavor-turtle-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Kleine Seevögel · `sea-life.accent.h1.gulls.v2` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-gulls-v2.png](../assets/library/flavor-gulls-v2.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Beiläufige Delfine · `sea-life.accent.h1.dolphins.v2` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-dolphins-v2.png](../assets/library/flavor-dolphins-v2.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Lockere Schaumkronen · `sea-life.accent.h1.foam-flecks.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-foam-flecks-v1.png](../assets/library/flavor-foam-flecks-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Sanfter Strömungsbogen · `sea-life.accent.h1.current-arc.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-current-arc-v1.png](../assets/library/flavor-current-arc-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Feines Gischtfeld · `sea-life.accent.h1.spray.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-spray-v1.png](../assets/library/flavor-spray-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Schmale Schaumspur · `sea-life.accent.h1.foam-trail.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-foam-trail-v1.png](../assets/library/flavor-foam-trail-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |
| Kreuzende Wellenzüge · `sea-life.accent.h1.cross-ripples.v1` | decoration / accent · 1 Hex · befahrbar, ohne Regelwirkung | [flavor-cross-ripples-v1.png](../assets/library/flavor-cross-ripples-v1.png) | pending | Datei geprüft, keine Freigabebindung | Nein · Zurückgestellt |

Die 19 Bildfreigaben sind an exakt diesen Hintergrund gebunden: `e33cf0d09477e93588cfc209bb0ab9b224d7624139d707fede23a390b14f2582`. Andere Varianten, historische Tiere und die zurückgestellte Schildkröte erhalten keine Hashfreigabe.

## Übergangskatalog / Legacy-Zuordnungen

Diese acht Alias-Einträge bleiben unverändert. Historische Größen und Versätze sind Ausnahmen vom modernen Grafikvertrag; vorhandene frühere Gestaltungsentscheidungen werden hier nicht zurückgesetzt oder neu bewertet. Keine neue pauschale Hashfreigabe.

| Legacy-ID | Datei / Zuordnung | Technische Verwendung | Künstlerischer Status / Hashprüfung | Produktive Verwendung |
|---|---|---|---|---|
| `legacy.insel-zweier-01` | [tesoro.png](../assets/seekarte/tesoro.png) | island / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.insel-einzeln-01` | [tesoro.png](../assets/seekarte/tesoro.png) | island / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.insel-einzeln-02` | [tesoro.png](../assets/seekarte/tesoro.png) | island / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.riff-01` | [tesoro.png](../assets/seekarte/tesoro.png) | island / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.segelboot-01` | [segelschiff.png](../assets/seekarte/segelschiff.png) | ship / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.segelboot-02` | [segelschiff.png](../assets/seekarte/segelschiff.png) | ship / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.leuchtturm-01` | [leuchtturm.png](../assets/seekarte/leuchtturm.png) | lighthouse / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe · Datei geprüft, SHA-256 im JSON | Unveränderter expliziter Legacy-Pfad bestehender Karten |
| `legacy.krabbe-01` | kein separates Bild; historisch ausgelassen | accent / Legacy-Geometrie | Legacy unverändert; keine moderne hashgebundene Katalogfreigabe | Kein Bild / historisch ausgelassen |

## Alle drei Kataloghintergründe

| Hintergrund | Datei | Aktuelle Bindungen |
|---|---|---|
| sea-blue-01 | [sea-blue-01.webp](../assets/seekarte/sea-blue-01.webp) | 19 hashgebundene Bildfreigaben |
| legacy-parchment-sea | [meer-pergament.webp](../assets/seekarte/meer-pergament.webp) | 0 hashgebundene Bildfreigaben |
| prototype-sea | [meer-ohne-objekte-prototyp.webp](../assets/seekarte/meer-ohne-objekte-prototyp.webp) | 0 hashgebundene Bildfreigaben |

## Weitere Grafikdateien unter assets/

Vollständiger ergänzender Dateibestand (Rahmen, Bedienoberfläche und weitere Prototypen). Keine dieser Dateien wird durch diesen Auftrag neu freigegeben, abgelehnt oder ersetzt. Technische Dateiprüfsummen stehen im maschinenlesbaren Inventar und sind keine künstlerischen Freigaben.

| Datei | Status in diesem Auftrag |
|---|---|
| [frame-parchment-01.webp](../assets/seekarte/frame-parchment-01.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [frame-parchment-02.webp](../assets/seekarte/frame-parchment-02.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [pergament-rahmen-prototyp.webp](../assets/seekarte/pergament-rahmen-prototyp.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [brass-bezel.webp](../assets/ui/brass-bezel.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [brass-rail.webp](../assets/ui/brass-rail.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [brass-strip.webp](../assets/ui/brass-strip.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [hourglass.webp](../assets/ui/hourglass.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [logbook-chart.svg](../assets/ui/logbook-chart.svg) | unverändert, außerhalb des Illustrationskatalogs |
| [open-bordbook.webp](../assets/ui/open-bordbook.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [paper-grain.webp](../assets/ui/paper-grain.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [ship-wheel.webp](../assets/ui/ship-wheel.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [tool-atlas.webp](../assets/ui/tool-atlas.webp) | unverändert, außerhalb des Illustrationskatalogs |
| [tool-refinements.webp](../assets/ui/tool-refinements.webp) | unverändert, außerhalb des Illustrationskatalogs |
