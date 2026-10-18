# Drei befahrbare Einzelhex-Prototypen zur Nutzerabnahme

Stand **19.10.2026**, bestehender PR #65, Branch `feature/asset-library-integration`. Alle drei Motive sind **Prototypen, künstlerisch nicht freigegeben**: `stage: illustration`, `passable: true`, `geometry.cells: [[0,0]]`, Hintergrundprüfung `sea-blue-01: pending`. Bestandene technische Tests ersetzen keine Nutzerabnahme. Die bestehende Freigabe der wasserreichen Felsnadel gilt weiterhin ausschließlich für diese Felsnadel auf `sea-blue-01`.

## Gemeinsamer Vergleich im Kartenkontext

Die **bestehende Galerie** `/dev/asset-library.html#passable-prototypes` enthält oben einen gemeinsamen Vergleich. Lokal nach `python3 scripts/dev-server.py --port 4173`:
[Galerie mit allen drei Prototypen](http://127.0.0.1:4173/dev/asset-library.html#passable-prototypes).

Alle drei stehen für den direkten Vergleich jeweils an **B3** im selben Originalmeer `assets/seekarte/sea-blue-01.webp`, umgeben von den echten Nachbarfeldern. Der Vergleich verwendet den **unveränderten produktiven `drawMap`-Renderer**, einschließlich Meer, Rahmen, Koordinatenführungen und Spielmarkierungen. Die Galerie hat eine Projektwurzel als Dokumentbasis, damit dessen echte Bildpfade auch unter `dev/` korrekt aufgelöst werden; Produktion und Architektur bleiben unverändert.

Die Bildrechtecke betragen durchgehend **90×102 SVG-Einheiten**, ohne individuellen Transform, Zuschnitt oder Clip. Der Ausschnitt `42 107 200 170` zeigt B3 und Nachbarn. Bei 1120 px Browserbreite erscheinen die drei vollständigen Assetleinwände jeweils rund **146×166 CSS-Pixel** groß; auf dem Smartphone rund **158×179 CSS-Pixel**. Das entspricht dem Kartenmaßstab einer ungefähr 916–985 px breiten Gesamtkarte. Die folgenden rund 1000 px breiten Vergleichsbilder sind Screenshots dieser Galerie bei DPR 1, keine isolierten Assets und keine nachträglich vergrößerten Motive. Auf schmalen Bildschirmen stehen die drei Karten untereinander.

**Mit echten Hexgrenzen, ohne Markierungen:**

![Leuchtturm, Atoll und Wrack an B3 auf sea-blue-01 mit Nachbarhexen](reviews/passable-prototypes/comparison-hexes.png)

**Ohne Hexlinien und ohne Markierungen:**

![Derselbe Vergleich ohne Hexlinien](reviews/passable-prototypes/comparison-clean.png)

**Mit echten Spielmarkierungen:**

![Derselbe Vergleich mit Stundenzeichen, Ortsring und Route](reviews/passable-prototypes/comparison-overlays.png)

Der ausdrücklich beschriftete **Entwicklungs-Beispielzustand** zeigt an B3 Stunden 1–6 (`✓ / ? / × / ✓ / ? / ×`), die aktive Stunde 2, den echten Kartografenring und die Route A3–B3–C3. Er ändert keine Rätseldaten und erteilt keine Freigabe. „Echte Spielmarkierungen anzeigen“ schaltet diesen Zustand; „Hexgrenzen anzeigen“ schaltet zusätzlich die normalen Zellpolygone. Die Stundenrandmarkierung gehört zum Beispielzustand. Der Vergleich bleibt absichtlich auf `sea-blue-01`, auch wenn für die darunterliegende technische Galerie ein anderer Hintergrund gewählt wird. Die grüne Grafikflächenprüfung beeinflusst den gemeinsamen Vergleich nicht.

**Einschränkung:** Der vorhandene Kartenrenderer zeichnet Ortsnamensschilder nur auf gesperrten Landfeldern. Für diese befahrbaren Orte erscheinen daher echte Ortsringe, aber keine Ortsnamensschilder im Hex. Die Namen stehen als Bildunterschrift; es wird keine neue Namensplatzierungslogik eingeführt. Route, zentrale Fragezeichen und Stundenkreise überdecken sichtbar Teile der Motive. Das ist der tatsächliche Ebenenaufbau und ausdrücklich Teil der noch offenen visuellen Abnahme. Der Beispielzustand ist keine Prüfung sämtlicher möglicher Spielzustände.

## Motive und Einordnung

| Motiv / Asset-ID | PNG | Komposition |
| --- | --- | --- |
| Leuchtturm · `navigation.lighthouse.h1.offcenter-beacon.v1` | [lighthouse-offcenter-v1.png](../assets/library/lighthouse-offcenter-v1.png) | Rot-weißer markanter Turm auf kleinem Felsen links/hinten; rechts bleibt offene See. |
| Atoll · `land-coast.atoll.h1.broken-passages.v1` | [atoll-broken-v1.png](../assets/library/atoll-broken-v1.png) | Drei asymmetrische, getrennte Sand-/Korallenstücke mit Felsen und Palmen. Breite Öffnungen verbinden Innenraum und Außenmeer; kein fast geschlossener Ring. |
| Wrack · `navigation.wreck.h1.offcenter-sloop.v1` | [wreck-offcenter-v1.png](../assets/library/wreck-offcenter-v1.png) | Diagonaler halb versunkener Holzrumpf mit gebrochenem Mast und Segelresten, nach links versetzt; freie See rechts. |

Der größere Atollteil ist in diesem ersten Durchgang felsiger und höher ausgefallen als eine flache Sandbank. Die drei Wasserpassagen bleiben im realen Kartenkontext sichtbar. Beim Wrack macht die etwas kleinere Einpassung die Rechtsdurchfahrt deutlicher. Diese gestalterischen Eigenschaften sind Prüfgegenstand, keine erklärte künstlerische Freigabe. Befahrbarkeit ist die explizite logische Klassifikation des gesamten Einzelhexes; es wird kein neues pixelgenaues Schiffs-Kollisionsmodell eingeführt.

## Herstellung und technischer Export

**Ein gemeinsamer Produktionsdurchgang, genau eine eingebaute `image_gen`-Generierung je Motiv**, jeweils mit echter Transparenz. Stilreferenz war die Originalquelle der ausdrücklich freigegebenen wasserreichen Felsnadel: plastische, farbenfrohe, detailreiche Abenteuer-/Brettspielillustration mit Aquarellcharakter. Die frühere Dreierstudie wurde nicht benötigt. [Vollständiger Prompt-Satz](reviews/passable-prototypes/generation-prompts.json).

Alle Ausgaben sind statische **360×408-RGBA-PNGs**. Die vollständigen 1177×1336-Quellleinwände wurden proportional mit Lanczos3 verkleinert und transparent ergänzt. Kein Bild wurde an einer Zellmaske abgeschnitten; kein Alpha-Schwellwert, kreisförmiger Verlauf oder geometrischer Küstenrand wurde ergänzt. Lokale türkisfarbene Flachwasserflächen und Brandung bleiben erhalten. Ihre Farbabweichung vom echten Meer bleibt sichtbar und wird nicht durch eine allgemeine verbindliche Wasserregel bewertet.

| Export | Abgetastete Quelle | Transparenter linker/oberer Rand | Sichtbare Pixel | Alpha 1 |
| --- | --- | --- | --- | --- |
| Leuchtturm | 313×355 | 23 / 33 | 24.679 | 864 |
| Atoll | 247×280 | 56 / 72 | 29.308 | 1.462 |
| Wrack | 218×247 | 43 / 91 | 23.706 | 1.238 |

Der Wrackexport setzt die komplette abgetastete Quelle beim Authoring **28 px weiter links** als eine zentrierte Einpassung. Die dafür nötige geringere Größe bewahrt sämtliche Alpha-Ränder an allen Kartenpositionen. Das ist fest in der PNG enthalten; die Platzierung im Renderer bleibt geometrisch zentriert. [Leuchtturm-Export](reviews/passable-prototypes/lighthouse-export.json), [Atoll-Export](reviews/passable-prototypes/atoll-export.json), [Wrack-Export](reviews/passable-prototypes/wreck-export.json) enthalten Quellhash, Abtastung und Ränder. Die Originalgenerierungen und das Exportwerkzeug sind lokal unter `output/passable-prototypes/` im übergeordneten Aufgabenordner erhalten; die ausgelieferten PNGs liegen vollständig im Branch.

## Prüfbelege

- **Alle drei jeweils 25/25 Positionen A1–E5 bestanden**, zusätzlich lokaler Voronoi-Vertrag und Originalmaske `single.png`: **0 unzulässige sichtbare Pixel**, einschließlich Alpha 1. Geprüft werden vollständige ¼×¼-SVG-Pixelquadrate mit dem unveränderten `check_image` / `PixelFootprint` aus `scripts/check-library-images.py`. [Vollständiger Pixelbericht mit SHA-256](reviews/passable-prototypes/pixel-audit.json).
- Der vorhandene Bildregressionstest prüft jetzt **alle Illustrationen** automatisch an allen 25 Ankern. Die ursprünglichen beiden Felsnadeldateien und ihre Freigabehashes bleiben unverändert.
- Katalog: neun Assets, drei Hintergründe, weiterhin genau eine freigegebene Kombination. Neue Prototypen bleiben für ungeprüfte produktive Platzierungen gesperrt; der Unit-Test prüft diese Sperre und erlaubt ausschließlich die Entwicklungsansicht.
- Lokal: **89/89 Unit-Tests**, vier Rätsel mit weiterhin jeweils genau einer Lösung, **13/13 Bildregressionen**, **12/12 Chromium-Galeriefälle und 12/12 WebKit-Galeriefälle**. Die Browserfälle prüfen den echten Meerpfad, drei befahrbare B3-Felder, Stundenzeichen, Route, Ebenenreihenfolge und beide Schalter. Ergänzende Aufnahmen: Chromium/WebKit Desktop und Chromium Smartphone mit DPR 2, ohne Bildlade- oder JavaScriptfehler; [Browserbericht](reviews/passable-prototypes/browser-audit.json).
- Lokal zusätzlich **27/27 Pakettests und 4/4 Asset-Deploymenttests** des frisch erzeugten ZIPs bestanden (Desktop, Smartphone, iPhone/WebKit, iPad/WebKit, jeweils im Unterpfad). Die vollständige bestehende CI wird für den gepushten Stand über [PR #65 / Checks](https://github.com/roquas/Sams-Gezeitenkarten/pull/65/checks) nachvollziehbar. Die Deploymentregression dekodiert alle fünf Illustrationen aus dem tatsächlich erzeugten ZIP, einschließlich der drei neuen befahrbaren Prototypen.

Keine veröffentlichten Platzierungen, keine Änderung von Spielmechanik, Produktionsrenderer, Voronoi-Geometrie, `main` oder Architektur; kein Merge. Die ursprünglichen offenen Punkte B4/B6 bleiben im bestehenden PR dokumentiert.
