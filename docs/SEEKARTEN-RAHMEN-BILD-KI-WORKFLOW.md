# Herstellungsleitfaden: statische Seekartenrahmen mit Bild-KI

**Stand:** 15.10.2026 · **Projekt:** Sams-Gezeitenkarten · **Issue:** #49 · **PR:** #48 · **Arbeitsbranch:** `experiment/parchment-frame`

## 0. Wichtigster Befund aus der Bildarbeit vom 14./15. Oktober

Das Ziel ist **eine künstlerisch fertig montierte, statische Illustration**, keine zur Laufzeit aus Einzelteilen erzeugte Grafik. Generative Bildmodelle können organische Pergamentstrukturen, Küstenränder und maritime Motive gut zeichnen, **garantieren aber keine pixelgenaue Wahrung der Vorlage**. Insbesondere eine mehrfach wiederholte Bitte „ändere nur X“ sichert unveränderliche Bereiche *nicht* ab.

**Nicht verhandelbar:** Wo die Vorlage Meer zeigt, muss Meer bleiben. Wenn die Küste offener werden soll, darf **nur Pergament zugunsten zusätzlichen Meers weichen**, niemals umgekehrt. Die Ausgangsgeometrie und insbesondere das bereits vorhandene Meer sind Mindestvorgaben, keine Inspiration.

Eine freigegebene Gesamtgrafik nie erneut generativ „verfeinern“ lassen, wenn bereits die Änderung weniger kleiner Details ausreicht. Stattdessen neue Motive auf **echtem transparentem Hintergrund, ohne irgendeinen Rahmen oder Papieruntergrund** ausgeben und einmalig in der Arbeitsdatei montieren. Nach Freigabe **eine einzige fertige statische Rahmen-Datei** exportieren. Das ist ein *Herstellungsprozess*, **kein Bausystem der Anwendung**.

## 1. Der Verlauf: Was funktionierte und was scheiterte

1. **Fehlschlag: monochrome Schablone mit zentraler Aussparung.** Das Modell vertauschte bzw. interpretierte die Flächen frei. In der ursprünglichen Maske gilt: nur beige = zulässiges Pergament, die ausgesparte Mitte = muss transparent bleiben. Wiederholte lange Negativprompts bewirkten keine exakte Geometrie.
2. **Ungeeignete Reparatur: nachträgliche Alpha-Maske über ein falsch komponiertes Bild.** Das würde bereits gemalte Risse, Kantenverdunklung und Küstenschatten abschneiden; die Kante sähe unnatürlich aus. Die Küste muss **während der künstlerischen Gestaltung** als Grenze bekannt sein. Ein abschließender technischer Freistellungsschritt ersetzt das nicht.
3. **Erfolg: Vorlage mit sichtbar gezeichnetem türkisfarbenem Meer und braunem Pergament.** Das Modell verstand „Meer ist fertig, nur Pergament ausgestalten“ wesentlich besser. Der **erste strenge Bearbeitungsversuch** war geometrisch am überzeugendsten, künstlerisch jedoch noch zu gleichmäßig.
4. **Mehr organische Küste:** Der Nutzer malte in einer **neuen Vorlage** zusätzliches Meer **in bislang braune Pergamentbereiche**. So wurden größere Buchten bereits durch die Ausgangsgrafik definiert, statt sie erst vom Modell erfinden zu lassen. Wichtig: Meer nicht verkleinern; größere Buchten in der Vorlage selbst festlegen.
5. **Freigabe der undekorierten Grundlage:** Der Benutzer bestätigte die Ausgestaltung des Pergament-Meer-Rahmens („Sehr gut! Das ist die finale Version.“). Diese Basis wurde danach als unveränderlich behandelt.
6. **Fehlschlag: Miniillustrationen direkt auf den kompletten Rahmen generieren.** Auch bei explizitem Schutz der Meerfläche wurde die Küstenkante mehrfach neu gezeichnet bzw. verschoben. **Nie wieder** eine freigegebene Grafik für bloße Deko-Ergänzungen als vollständiges KI-Edit zurückgeben.
7. **Erfolg: reine transparente Miniillustrations-Ebene.** Die Vorgabe **„Nur Zeichnungen und Punktlinien, kein Pergament, keine Wasserfläche, keine Küste und kein Rahmen“** führte zu einem separat montierbaren Overlay. Ebenso wurden Windrose, Insel, Tisch und Papagei als Einzelgrafiken erstellt und anschließend von Hand zusammengesetzt.
8. **Feinkorrektur Insel:** Große, farbige Küstenillustrationen wurden zugunsten einer **reduzierten Sepia-Tuschzeichnung mit Schraffuren** verworfen: wenige Wellenlinien statt türkis ausgefülltem Wasser, niedrige Küstenlandschaft, Boot im Vordergrund teilweise im Wasser, Ruder im Boot.

**Negativbeispiel, künftig aktiv vermeiden:** Ein vermeintliches „Overlay“ mit neu generierten Pergamentstücken oder eigener Küstenkontur. Ein solches Bild enthält nicht *nur* die Illustrationen und ist kein gültiges Overlay.

## 2. Wiederholbarer Ablauf für einen neuen statischen Rahmen

### A. Geometrie und Farbflächen zuerst definieren

- Ausgangspunkt ist die technische Maske bzw. der polygonale Geometrievertrag aus [SEEKARTEN-BASISASSETS-PHASE1.md](SEEKARTEN-BASISASSETS-PHASE1.md).
- Eine **flache Vorlage** anlegen: innen sichtbares türkisblaues Meer, außen gut unterscheidbares Pergament. Das Meer ist bereits eine echte dargestellte Meeresfläche, weder Schwarz noch Transparenz-„Loch“.
- Die gewünschte Küstenführung **vorher** gestalten: unterschiedlich breite Pergamentbereiche, größere flache Buchten, kleinere Einbuchtungen, ruhige und stärker bewegte Abschnitte. Nicht bloß überall kleine Zacken setzen.
- **Erhaltungsregel:** `Meer_neu ⊇ Meer_vorher`. Bereits vorhandenes Meer nicht durch Pergament ersetzen.
- Äußere Grenzen, Koordinaten-Beschriftungszonen, die transparent zu haltende Spielzone und Sicherheitsabstände sind *eigenständige technische Vorgaben* und müssen unabhängig von der künstlerischen Bildwirkung validiert werden.

### B. Strenger Prompt für die Grundgestaltung (erprobt)

> **Bearbeite das bereitgestellte Bild als Veredelung eines bereits angelegten Rahmens, nicht als freie Neugenerierung. Die Flächenaufteilung ist verbindlich: Die blaue Innenfläche bleibt als Meer erhalten und darf nicht überschrieben, verkleinert, neu platziert oder durch Pergament ersetzt werden. Die braune Außenfläche bleibt Pergament und wird zu einem gealterten, organischen Rahmen ausgearbeitet. Gestalte ausschließlich die Pergamentfläche mit warmer alter Papiertextur, verbräunten und leicht ausgefransten Außenkanten, Knicken, Rissen, Flecken und sehr dezenten historischen Kartenlinien. Die bestehende Küstenlinie bleibt grundsätzlich erhalten und darf sich höchstens in Richtung WENIGER Pergament/MEHR Meer verändern. Wo vorher Meer ist, bleibt Meer. Keine zusätzlichen Illustrationen, Objekte oder Schrift, keine Kompassrose, Schiffe, Inseln oder Tiere. Das vorhandene Meer bleibt in Charakter, Farbe und Grundfläche erhalten.**

Für einen **besonders strengen Erstversuch** zusätzlich:

> **Die vorhandene Meeresfläche ist eine vollständig geschützte, bereits fertig gemalte Ebene. Verändere dort keinen Pixel, auch nicht an der Küste. Das Meer ist kein Platzhalter und darf keinesfalls transparent oder beige werden. Gestalte nur braune Pergamentflächen. Keine neue Gesamtkomposition.**

Diese Aussagen verbessern die Chancen, sind aber **keine technische Garantie**. Ein KI-generiertes Ergebnis muss visuell und anhand der Geometrie geprüft werden. Bei einer falsch interpretierten Kante: nicht immer weiter nachprompten, sondern die **farbige Ausgangsvorlage** ändern.

### C. Grenze für Folgeänderungen: sobald die Basis gefällt, einfrieren

Nach Freigabe das **unveränderte Original** als Masterdatei sichern. Für zusätzliche Motive nicht mehr das Gesamtbild neu zeichnen lassen.

Prompt für Miniillustrations-Overlay:

> **Erstelle nur kleine historische nautische Feder-/Tuschzeichnungen auf einem vollständig transparenten Bild mit denselben Proportionen wie die Karte: winzige Schiffe, Möwen, kleine Felsen und Inselchen, Seezeichen, vereinzelte Windrosen und gestrichelte Fahrtrouten. Vorwiegend gealterte braune/sepiafarbene Tinte, höchstens sehr schwache Farb-Lavierung. Verteile sie als kleine separate Motive entlang der späteren Pergamentflächen, Ecken für große Illustrationen frei lassen. Absolut KEIN Pergament, keine Rahmen- oder Küstenkontur, keine Meeresfläche, keine Papiertextur, keine Hintergrundfläche. Alles außer den Zeichnungen vollständig transparent.**

Danach in einem Grafikeditor auf **eigener Ebene** montieren. Einzelmotive leicht verschieben/verkleinern, bis sie komplett auf der erlaubten Pergamentzone liegen. Das Freistellen darf **nicht** dazu dienen, einen zuvor falsch generierten Küsten-/Papierabriss zu kaschieren; bei einem transparenten **Motivoverlay** ist es unproblematisch, Position und Sichtbarkeit unabhängig vom fertigen Grundbild zu kontrollieren.

### D. Prompt für große Eckillustrationen (je ein separates PNG mit Alpha)

> **Erstelle ausschließlich die beschriebene Eckvignette als vollständig freigestelltes, einzelnes Motiv mit echtem transparentem Hintergrund. Keine Karte, kein Pergamentrahmen, keine Umgebung außerhalb des Motivs. Historische Illustration mit Linien, Tusche, Schraffuren und sparsamer Kolorierung. Das Bild wird später unverändert auf einen vorhandenen Seekartenrahmen gelegt.**

Freigegebene Motivabsichten:
- **NW:** Windrose mit **genau sechs** Hauptarmen, beschriftet `N, NO, SO, S, SW, NW`.
- **NE:** Küsten-/Inselvignette, oben eher schlank, rechts L-förmig nach unten; niedrige Hügel, Palmen und Strand; **Ruderboot als deutlicher Vordergrund**, zum Teil im Wasser, Ruder im Boot; zuletzt bevorzugt sehr reduzierte **Sepia-/Tusch-Buchillustration**, keine flächig türkisfarbene Wasserzone.
- **SW:** fliegender farbiger Papagei **deutlich über** Steuerrad, Reling und Sitzstange; **durchgehende längere Kette** vom Fuß zum Befestigungspunkt; Messingsextant an der Stange. Bei Kettenreparatur nur das fehlende Kettenstück ergänzen, nicht Vogel oder Holzbau neu zeichnen.
- **SE:** angeschnittener Kneipentisch, Bierhumpen, Münzbeutel/Münzen, Papierkarte und **einfache hölzerne Flöte**.

Beim erneuten Erzeugen können selbst akzeptierte Motivdetails verloren gehen. Daher **freigegebene PNG-Dateien als unveränderliche Originale aufbewahren**, nicht als bloße Modellreferenzen.

### E. Einmalige Endmontage und Abnahme

- Nur während der Herstellung Illustrationen/Ecken/Grundgrafik als Ebenen zusammensetzen, zum Schluss **eine statische Rahmenillustration** exportieren. Keine dynamische „Asset-Baukasten“-Konstruktion in der Website.
- Bildkorrekturen so weit möglich auf *bereits vorhandenen* Originalebenen durchführen; einzelne Motive dürfen verschoben werden, ohne die Küste neu zu generieren.
- Getrennte Produktionsbilder bleiben: **`sea-blue-01.webp` = neutrales durchgehendes Meer** und **`frame-parchment-01.webp` = Pergament mit tatsächlich transparentem Innenbereich**. Die vorliegende farbig montierte Gesamtansicht ist **nur Stil-/Anordnungsreferenz**, kein automatisch einsatzfähiges Alpha-Rahmenasset.
- Keine produktiven Assets durch bloßes Hochskalieren „zertifizieren“: echte Ausgangspixel zählen. Zielmaße im Projektvertrag **2252 × 1892** (563:473). KI-Ergebnisse hatten mehrfach **1368 × 1149**, die Nutzermontage **2048 × 1720** – beides ist **nicht** die Zielauflösung. Die geometrische Einpassung ist ebenfalls gesondert zu prüfen.
- Koordinaten- und Spiel-Sicherheitszonen des v2-Vertrags prüfen; Beschriftungen nicht von Deko verdecken. Das Vorgabe-Issue #49 enthält teils engere Regeln für kleine Illustrationen als die später montierte Referenz. **Vor Produktionsfreigabe im Issue entscheiden**, welche Illustrationen auf dem Rand zulässig sind.
- [Asset-Prüfer](../scripts/check-chart-assets.py) und Screenshots/DPR-Tests aus [Phase 1](SEEKARTEN-BASISASSETS-PHASE1.md) verwenden. Keine Integration, kein Merge allein wegen eines optisch gelungenen Vorschaubilds.

## 3. Dateien und Status der Bildfreigabe

**Visuelle Benutzerreferenz:** Die vom Benutzer manuell zusammengesetzte Karte vom 14.10.2026, 22:12 (Dateiname im Chat: `image(20261014-221234).png`, **2048 × 1720**, enthält Meer + Pergament + Eck-/Miniillustrationen). Das ist die ungefähr gewünschte Komposition und ein **Abnahmebeispiel für die Ästhetik**, kein fertig getrenntes produktives `frame-parchment-01.webp`.

**Undekorierte Grundreferenz:** `image(20261014-214856).png`, **1368 × 1149**, illustriertes Pergament um das Meer, ohne kleine oder große Deko. Diese Version dient zum Vergleich der Küstenkontur, nicht als produktionsfertiger transparenter Rahmen.

**Zuletzt gelobte Arbeitsmethode:** Die kleinen Illustrationen wurden separat auf transparentem Grund erzeugt und erst danach vom Benutzer selbst auf den unveränderten Rahmen gesetzt.

Die Originaldateien sind derzeit als Bildanhänge im Chat vorhanden. **Eine reine Textdokumentation im Git-Repository enthält nicht automatisch die Binärdateien.** Sie müssen getrennt als Source-/Referenzassets versioniert werden; nicht durch ein ähnlich aussehendes KI-Bild ersetzen.

## 4. Architekturentscheidung für #49 / #48

Die **Website** rendert später **zwei feste Rasterebenen**, nicht zur Laufzeit viele Deko-Einzelteile. Verschiedene Seekartenrahmen können als mehrere vollständig montierte statische Varianten entstehen. Ein algorithmisches Kompositionssystem wäre für den selten wechselnden Rahmen mehr Fehlerquelle als Nutzen. Allenfalls ein kleiner Validator ist sinnvoll.

**PR #48 bleibt offen, kein Merge ohne explizite Freigabe.** Die bestehende Phase-1-Geometrie darf durch die bildnerische Dokumentation nicht geändert werden.

## 5. Checkliste vor dem nächsten KI-Versuch

- [ ] Ist die farbige Eingabevorlage bereits geometrisch richtig und enthält sie *fertiges Meer*?
- [ ] Sind die Spiel-/Text-Schutzzonen berücksichtigt?
- [ ] Verlangt die Aufgabe wirklich eine vollständige Neugestaltung oder nur neue Deko?
- [ ] Bei Deko: **ausschließlich transparente Motivbilder**, niemals neue Papierstücke/Küsten!
- [ ] Ist die letzte künstlerisch freigegebene Datei separat und unverändert gesichert?
- [ ] Stimmen echte Pixelmaße und Seitenverhältnis?
- [ ] Wurde geprüft, dass jeder vorherige Meerpunkt Meer bleibt und der Rahmen keine Koordinaten verdeckt?
- [ ] Sind Grafikfreigabe, Alpha-Spezifikation und Produktionsintegration ausdrücklich getrennt?
