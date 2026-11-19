# Auszüge der bereitgestellten S03-Analyse vom 19.11.2026

Quelle: vom Nutzer in diesem S04-A-Chat vollständig bereitgestellter Bericht
„S03-v2: Spielerfahrung, Deduktionsprofile und Entscheidung für S04“.
Repositorybasis des Berichts: `602c597a4fc434d018afceb21c8029cfd5eefbae`.
Die folgenden Absätze und Tabellenzeilen sind unveränderte Auszüge; ausgelassene
Abschnitte sind nicht als neue Datei oder Rohdatennachweis verfügbar. Insbesondere
liegen `auftrag.md`, `extracted.json`, `zustandsvergleich.csv` und `extract.mjs`
hier nicht vor. Der Bericht ist für die Spielerfahrung eine Sekundärquelle.
Seine historischen „unbekannt“-Einträge für A/B/C/D werden durch den aktuellen
S04-A-Auftrag berichtigt. Die technischen Zahlen werden durch S04-A separat geprüft.

## Vergleich aller neun Fälle (Auszug)

| Test | Vollständige Kennung | Menschliches Gesamturteil | Hinweise | Zustände bekannt/möglich | Legale Routen ohne Hinweise |
| --- | --- | --- | ---: | ---: | ---: |
| 01 | B2-S03-V2-M001-A3-R751-V01 | sehr schön, klar positiv | 6 | 43/64 | 1.178 |
| 02 | B2-S03-V2-M003-A5-R436-V02 | sehr schwer, machbar, eher negativ | 5 | 27/32 | 746 |
| 03 | B2-S03-V2-M008-A3-R51-V02 | okay, nicht wirklich gut | 6 | 43/64 | 198 |
| 04 | B2-S03-V2-M010-E4-R568-V01 | besser als 02/03, weiter kopflastig | 6 | 43/64 | 1.459 |
| 05 | B2-S03-V2-M011-A5-R787-V01 | nett, eher einfach, gelegentlich positiv | 4 | 16/16 | 1.185 |
| 06 | B2-S03-V2-M014-A5-R160-V01 | lohnend, aber anstrengend | 6 | 43/64 | 242 |
| 07 | B2-S03-V2-M016-A2-R116-V01 | nett, simpel, gutes Einstiegsrätsel | 3 | 8/8 | 189 |
| 08 | B2-S03-V2-M017-A4-R74-V02 | sehr gut, klar positiv; viel Markierarbeit | 6 | 43/64 | 1.684 |
| 09 | B2-S03-V2-M018-A5-R30-V04 | gut, anspruchsvoll, eher schnell | 3 | 8/8 | 328 |

## 01

**Erfahrung:** frühe Markierbarkeit, S3-Anker, S1/S2 über H6, weiterer Fortschritt an S4/S5 und ein befriedigendes finales Aha.

**Einordnung:** Das Profil unterstützt mehrere vor dem Abschluss verfügbare Anker. Es beweist weder den berichteten Aha-Moment noch seine Reihenfolge. H1+H5 allein lässt technisch sechs S6-Felder, während der Bericht fünf nennt; zusätzliche bereits benutzte Geometrie/Markierungen sind aus dem Bericht nicht vollständig rekonstruierbar. Diese Differenz bleibt bestehen, ohne die Erfahrung zu korrigieren. Ebenso ist die berichtete Zweiermenge für S5 nicht mit dem isolierten Dreierzustand gleichzusetzen, der dort drei Felder lässt. Quelle: [Profil 01](profiles/01.json).

## 02

**Erfahrung:** H1 erlaubt Markierungen, danach belastende Prüfung ganzer Routen und spät eine Entscheidung für S6.

## 03

**Erfahrung:** viel Markierbarkeit, zunächst kein erkannter Fixpunkt, dann ein großer geometrischer Kombinationsschluss; zu wenig aufeinander aufbauende Teilerkenntnisse.

**Einordnung:** Früher später Anker und technische Wiederverwendung sind hier vorhanden, ohne das positive Erlebnis von 08 zu erzeugen. Der Bericht nennt zunächst vier S6-Möglichkeiten; das ist weder H6 allein noch der Fixpunkt H3+H6. Welche Zwischeninformation wann genutzt wurde, bleibt unbekannt. Die vier Restwege sind kein Maß der erlebten Granularität. Der Vorschlag des Spielers bleibt plausibel: Einen solchen geometrischen Schluss als Teilaufgabe behalten und anschließend einen andersartigen Abschluss ermöglichen. Quelle: [Profil 03](profiles/03.json).

## 04

**Erfahrung:** zunächst zwei Anfangskombinationen, danach drei Fortsetzungen, H2 entscheidet S1–S5, H3 beendet die Route; besser, aber kopflastig.

## 05

**Erfahrung:** leicht, nett, einige Kopfarbeit, überschaubare Alternativen; H2/H3 verbinden mehrere Stunden über dasselbe Distanzziel.

## 06

**Erfahrung:** H2/H3 wirken unnötig aufgeteilt und verursachen Kontrollarbeit; H5/H6 zum selben Radarziel helfen schließlich, S6 und die Route zu finden.

## 07

**Erfahrung:** direkter S6-Anker, Markierungen, danach geometrisch eindeutige Route; angenehm als Einstieg.

## 08

**Erfahrung:** mehrere getrennte Erkenntnismomente, kurze Prüfung von S3/S4-Fortsetzungen, Rückwärtsbestimmung von S1/S2, erneute Nutzung früherer H4-Markierungen für S5/S6; klar positiv.

**Einordnung:** Das Zertifikat benutzt eine andere ausreichende Reihenfolge als der Mensch. Es bestätigt deshalb nicht „den“ beschriebenen menschlichen Lösungsplan. Besonders aufschlussreich: H4 allein bewirkt im lokalen Fixpunkt **keinen** zusätzlichen Feldausschluss, obwohl der Spieler H4 als eintragbar und später nützlich beschreibt. Bereits benutzter Kontext und relationales Verständnis sind nicht mit einem isolierten Hinweiszustand gleichzusetzen. H6 bleibt mathematisch notwendig (ohne H6 zwei Lösungen), auch wenn der Bericht ihn nicht gesondert erklärt. Hoher Markierungsaufwand ist menschlich beobachtet; die Trace-Schrittzahl misst keine Klicks. Quelle: [Profil 08](profiles/08.json).

## 09

**Erfahrung:** wenige H1-Markierungen, S2-Alternativen aus H3, ungewöhnlich frühe S5/S6-Festlegung aus H2, danach überschaubare Rückprüfung; gut und schnell für den geübten Spieler.

## Projektionslücke (Auszug)

Die vorhandene Repräsentation kennt Feldmengen und benachbarte Übergangsmengen. Beide verlieren Beziehungen über mehrere Stunden. Das ist eine konkret nachgewiesene Informationslücke, nicht nur eine Vermutung: In 02, Zustand H1+H4, gibt es exakt **75** passende Routen. Die bereits **exakten** Feld- und Nachbarkantenmengen lassen beim Wiederzusammensetzen trotzdem **107** legale Routen zu. 32 Kombinationen verletzen also noch die Hinweise, obwohl alle ihre lokalen Bestandteile in einer passenden Route vorkommen. Quelle: Zustandsdatei 02, Zeile 9; siehe [Zustandstabelle](zustandsvergleich.csv).

## Historische Kontrollen (Auszug)

| Kontrolle | Vorhandene menschliche Einordnung | Relevanter technischer Befund | Bedeutung für S04 |
| --- | --- | --- | --- |
| S01-M000-A3-R00-V01, dokumentiertes Kombinationsbeispiel | unbekannt | 3 Hinweise, 1.760 Grundrouten; keine einzelne exakte Folgestunde; H1 lässt dennoch nur 35 Routen | Starke Routeneinschränkung ist nicht dasselbe wie ein Anker; menschlichen Wert nicht erfinden |
| S01-M003-A1-R00-V04, dokumentierter Kursfall | unbekannt | 6 Hinweise, 1.185 Grundrouten; H5 fixiert S1 exakt | Früher Anker als alter Strukturtyp; ohne Spielurteil kein Qualitätsbeweis |
| POSITIVE V1 | im späteren Profilbericht angenehm/eher leicht | S5 direkt, S4 aus H2+H3; lokaler Mindestvektor 3/4/4/2/1/5 | Positive Referenz für späte Anker und gestuften Aufbau, trotz früher Kopplungen |
| POSITIVE V2 | positiv, angenehm; ähnlich wie V1 | gleicher Mindestvektor und ähnliche Anker, anderer Zählzeuge für S3 | Mechanismusänderung erzeugt nicht zwingend erlebte Serienvielfalt |
| BC-T02 | als schwieriger/teilweise frustrierend dokumentiert | keine lokale Folgestunde fix; Vollsatz 3/3/9/15/13/18, Lücke 55/150 | Alter lokaler Restfilter erkennt einen Problemtyp; identische Karte/Start wie sehr gutes 08 |
| BC-T07 | als schwieriger/teilweise frustrierend dokumentiert | S1/S2 aus H4+H5, danach lokal offen; Lücke 16/25; 24 wiederverwendete Feldschritte | Früher Anfangsanker und viele Wiederverwendungen reichen nicht |
| BC-T07 mit vorgegebenem S3 | berichteter problematischer Rest; künstliche Kontrolle | S1–S3 schon Basis, S4/S5 zweifach, S6 vierfach; Lücke 5/6 | Vorgaben nicht als Hinweisleistung zählen; Restkopplung bleibt |

Für die beiden S01-Fälle gibt es in dieser Analyse **keine lokalen Zustandsprofile**. Deren lokale Fortschritte sind unbekannt, nicht null. Die ergänzende Enumeration bestätigt nur die dokumentierten exakten Einzelhinweiswirkungen. V1/V2 sind eng verwandte Konstruktionen und zählen nicht als zwei unabhängige Bestätigungen einer Regel. Auch BC-T07 mit Vorgabe ist keine unabhängige menschliche Wiederholung.

Die frühere positive historische Referenz „Quittung von Nombreo“ bleibt wegen inkompatibler Originalsemantik außerhalb des aktuellen Zahlenvergleichs. Es wurde weder eine Migration noch ein Ersatzrätsel angelegt.

## Grenzen (Auszug)

Die Daten stammen von einer geübten Person mit fortschreitender Erfahrung; Reihenfolge, Lerneffekte und subjektive Präferenzen sind nicht kontrolliert. Es gibt keine konsistenten Zeitmessungen, Klickzahlen, vollständigen Zwischenzustandsprotokolle oder Daten zu Neueinsteigern. Positive V1/V2 und künstliche T07-Vorgabe sind abhängige Kontrollen. Die historischen negativen Einordnungen sind knapp dokumentiert. Damit ist weder eine statistische Wirkung noch eine allgemeine Schwierigkeitsskala ableitbar.
