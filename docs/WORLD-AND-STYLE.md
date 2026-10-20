# Welt und Stil – Quellenstatus

Gezeitenkarten soll die Namen und den humorvollen, improvisierten Ton von **„Plötzlich Pirat:in“** wiedererkennbar aufgreifen, ohne die Welt zu einem starren Kanon zu machen. „Tapfere Tackerhacker“ wurde als Vergleichsformat betrachtet.

Eine ausführliche Stil- und Weltreferenz wurde am 11.10.2026 im Projekt erarbeitet. Sie unterscheidet **[A]** automatisch transkribierte öffentliche Audioausschnitte, **[B]** Begleittexte/Feed-Metadaten, **[I]** Interpretation und **[N]** neue Spielvorschläge.

**Die vollständige Referenz wurde noch nicht ins Repository übernommen.** Vor einer Übernahme werden Quelleninventar, Spoiler und gewünschter Umfang abgestimmt. Dieser Kurztext ist keine vollständige kanonische Dokumentation.

Arbeitsleitplanken: vorhandene Namen bevorzugen; Quellenwissen von Erfindungen trennen; konkrete Situationskomik statt generischer Piratenfloskeln.

## Tesoro: aktuelle Ortsreferenz

Die [Tesoro-Weltreferenz](TESORO-WORLD-REFERENCE.md) ergänzt die allgemeine Quellenarbeit um die Ankunft aus Kapitel 06 Episode 01 und die anschließend ausdrücklich bestätigte Erzählerergänzung vom 19.10.2026. Maßgeblich sind der Zugang **an einem Stadtende durch die zweigeschossige Wirtschaft**, die Plattformen und Hängebrücken, einzelne Untergeschosse und die gegenüberliegende Klippe mit Schneeweg zum hinter dem Gipfel hervorschauenden Leuchtturm. Die Gebäudezahl ist frei. Diese Angaben bleiben getrennt von Audio-ASR-Belegen. [Tesoro v4, inzwischen exakt auf sea-blue-01 freigegeben](ASSET-INVENTORY-65.md).


## Verbindliche Gestaltungsregel: Ortsnamen auf Pergamentrollen

Beschlossen am 19.10.2026 im Abschlussauftrag zu PR #65. Die Regel gilt für die künftige Assetgestaltung und Benennung.

**Ortsnamen sollen kurz, charakteristisch und auf der Pergamentrolle bei tatsächlicher Spielgröße gut lesbar sein.** Bevorzugt wird ein einzelnes Wort mit etwa **6–12 Zeichen**. Längere Namen sind nur geeignet, wenn ihre Lesbarkeit in der tatsächlichen Kartendarstellung geprüft wurde, einschließlich der vorgesehenen Smartphoneansicht. Zeichenlänge ist eine Orientierung; die sichtbare Lesbarkeit entscheidet.

Keine automatische extreme Schriftverkleinerung, um überlange Namen unterzubringen. Bei künftigen Entwürfen zuerst einen kürzeren, prägnanten Namen wählen. Humorvolle oder ungewöhnliche Namen passen zur Welt von „Plötzlich Pirat:in“; verschiedene Orte müssen dabei gut unterscheidbar bleiben. Diese Leitplanke ändert den bestehenden Labelrenderer nicht.

Mögliche Verkürzungen als unverbindliche Beispiele:

| Bestehender Name | Mögliche Alternative |
|---|---|
| Tempel der Gezeiten | Gezeitentempel |
| Sandriffbogen | Sandriff |
| Schmugglerbucht | Gaunerbucht |

Die Beispiele sind **keine Umbenennungsbeschlüsse**. Bestehende Ortsnamen, Puzzledefinitionen und Logbuchtexte bleiben unverändert. Eine systematische Überarbeitung vorhandener Namen ist ein separater späterer Auftrag. Auch längere Alternativen in dieser Beispieltabelle benötigen die Lesbarkeitsprüfung; sie sind keine pauschalen Ausnahmen von der Regel.

## Verbindliche Einordnung der Kartenmotive (Abschluss PR #65)

| Fachliche Bedeutung | Technische Abbildung | Verwendung |
|---|---|---|
| Unbefahrbarer Ort: Insel, Fels, Stadt usw. | bestehende Rolle `geographic`, `passable=false`, Einzelhex oder Mehrhex | logischer Ort; belegte Zellen vollständig gesperrt |
| Befahrbarer Ort: Leuchtturm, Boje, Wrack, Fässer, Ruderboot, Kiste, Flaschenpost, Treibholz usw. | bestehende Rolle `geographic`, `passable=true`, hier jeweils ein Hex | kann als Bezugspunkt eines Rätselhinweises dienen |
| Freies Kartenmotiv: Schaum, Wellen, kleine Vögel oder beiläufige Delfine | bestehende Rolle `decoration`, kein eigenes `passable`-Feld, Einzelhex | unbenannt, befahrbar, keine Regelwirkung und niemals logische Hinweisreferenz |

Das sind **fachliche Verwendungsweisen, keine drei neuen technischen Assettypen**. Bestehende `type`-Werte und feste Geometrien bleiben maßgeblich. Insbesondere dürfen bereits vorhandene `accent`-Illustrationen befahrbare Orte sein; ihre Spielbedeutung folgt der Rolle und `passable`, nicht Dateiname oder Typbezeichnung.

Pro Karte sollen später **höchstens 0–3 freie Kartenmotive** sparsam eingesetzt werden. Sie dürfen dezentral beinahe zwischen Hexfeldern erscheinen, aber kein Alphapixel darf die eigene zulässige Grafik-/Sicherheitsfläche verlassen. Das wird beim Authoring geprüft; der Renderer verschiebt, beschneidet, dreht oder skaliert kein einzelnes Motiv zur Laufzeit. Es wird jetzt weder Zufallsplatzierung noch Generatorlogik eingeführt. Namen im Review sind Besprechungstitel; freie Motive werden nie zu logischen Orten.

Befahrbare Orte können logisch benannt werden, erhalten hier aber **keine neuen permanenten Ortsbeschriftungen oder Ringe**. Das Konzept kontextueller Ortslabels aus Issue #68 bleibt unverändert. Die bisherige Regel für lesbare Pergamentnamen gilt weiter dort, wo der bestehende Renderer bereits Ortsnamen zeigt.

Aktuell: [vollständiger Katalogstatus einschließlich Hashbindungen](ASSET-INVENTORY-65.md) und [letzte Wasserillustrationsrunde](CARD-MOTIFS-FINALE-65.md). Zurückgestellte Schildkröte und historische Vögel-/Delfinfassungen sind keine aktuellen statischen Empfehlungen.

## Abschlussentscheidung PR #65 (20.10.2026)

Die künstlerische Produktion ist vorerst beendet. Maßgeblich sind das [vollständige Inventar](ASSET-INVENTORY-65.md) und der [Abschlussbericht](ASSET-CONSOLIDATION-65.md). 18 Ortsillustrationen sind auf `sea-blue-01.webp` produktiv vorgesehen. Die sanfte Schaumströmung behält ihre exakte künstlerische Freigabe, ist jedoch zusammen mit allen anderen atmosphärischen Entwürfen produktiv zurückgestellt ([Issue #70](https://github.com/roquas/Sams-Gezeitenkarten/issues/70)). Die Schildkröte bleibt für einen möglichen späteren beweglichen Einsatz zurückgestellt. Historische Fassungen und reduzierte Felsnadel bleiben ungefreigegeben. Frühere Sichtungsaufrufe und Flavor-Pläne sind historische Arbeitsstände.

`production` trennt die aktuelle Verwendungsentscheidung von der künstlerischen Freigabe: `enabled`, `draft`, `historical`, `deferred`. Dies ist kein technischer Assettyp. Die Produktivprüfung verlangt zusätzlich eine Illustration und eine Freigabe für den konkreten Hintergrund; fehlende Angaben werden abgewiesen. Die Entwicklungsansichten dürfen Entwürfe ausdrücklich anzeigen. Ob ein befahrbarer Ort tatsächlich als Hinweisreferenz verwendet wird, entscheidet ausschließlich die Karteninstanz beziehungsweise der Rätselgenerator. Dieser Auftrag implementiert weder Flavor-Platzierung noch Änderungen am Generator oder an Issue #68.
