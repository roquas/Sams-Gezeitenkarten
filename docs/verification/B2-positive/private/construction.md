# Privat – Konstruktionsprotokoll und tatsächliche Schlusskette

**Enthält Lösung und entscheidende Schlüsse. Nicht vor dem menschlichen Test lesen
oder in ein Webpaket kopieren.** Vertrag vor der Konstruktion: Commit `ada62ad`.
Basis: main `a8f8cbf97005b3ad888d8443fb40e3118781f717`.

## Aufwand und Abweichungen

Genau eine Erstkonstruktion und eine gezielte logische Überarbeitung, keine
Generator-/Hinweissuche, kein automatisches Durchprobieren von Parametern oder
Kandidaten. Die hier notierten Routen wurden von Hand entworfen und jeweils
anschließend mit den bestehenden Regeln geprüft. Eine zweite Überarbeitung war
nicht erforderlich. Nur die endgültige Definition wird als Rätsel ausgeliefert.

**Erstentwurf:** `attempt-0.json`. Offene Karte mit Startwrack A1 und Boje E1;
beide Motive befahrbar. Ziel: A1–B1–C1–C2–D1–E1–E2. Früher Ostkurs,
später Ostkurs, feste Bojenposition, Stundenpaarabstand und Endabstand zum Start.
Genau eine Lösung, vollständige lokale Auflösung. Beim Weglassen von H1…H5:
3/1/21/3/2 Lösungen. H2 war mathematisch redundant. Er wurde nicht still entfernt.

**Gezielte Überarbeitung:** Spätes Stück in die Karte hinein verlegen, damit die
späte Kursbeziehung einen eigenständigen notwendigen Beitrag erhält. Nordboje
nach D2, H2 auf Südost; Enddistanz zu einem zusätzlichen einhexigen Bezugsort E5
statt zum Start. Alle drei Objektmotive bleiben befahrbar. Die Darstellung nutzt
zweimal dieselbe freigegebene Boje; die geografischen Referenzen und ihre
Koordinaten unterscheiden sie. Keine positionsabhängige Motivzulassung.
Ergebnis: alle fünf Hinweise notwendig; genaue Nachweise in `evidence.json`.

## Handentwickelte kurze Argumentation

Die folgende Argumentation erläutert die beim Entwurf beabsichtigten lokalen
Operationen. Sie ist kein nachträgliches Ranking von Solverkonsequenzen und
behauptet keine bereits beobachtete menschliche Verständlichkeit.

1. **A / H1:** Vom Start A1 und dem Ostkurs in der zweiten Etappe bleiben genau
   A1–B1–C1 und A1–A2–B2. Die beiden Möglichkeiten können in den Stundenkarten
   markiert werden; ihre Zuordnung ergibt sich unmittelbar aus dem Kurs.
2. **B / H2:** Die fünfte Etappe verläuft nach Südosten. Das schränkt unabhängig
   von A mögliche späte Übergänge ein, bestimmt aber allein keinen solchen.
3. **C / H3:** Stunde 5 ist D2. B und C bestimmen deshalb Stunde 4 als D1.
   In Stunde 3 bleiben lokal C1/C2. A ist hierfür nicht nötig.
4. **D / H2+H3+H4:** Unter den beiden möglichen Feldern von Stunde 1 liegt nur
   B1 genau zwei Hex von D1 entfernt; A2 liegt drei Hex entfernt. Damit wird der
   erste Übergang A1→B1 fest. Kein echter Teilhinweissatz dieser Dreierkombination
   bestimmt ihn, weder exakt noch lokal. Er gehört zu `combinationOnly` aus #103.
5. **E / D+A:** Mit B1 und dem frühen Ostkurs wird Stunde 2 zu C1. Das Feld C1
   darf in Stunde 3 nicht erneut besucht werden. Aus C1/C2 bleibt dort C2.
6. **F / H5 und E:** Nach D2 und dem Abstand zur Südboje bleiben für Stunde 6
   genau C2/E2. C2 ist nun Stunde 3 zugeordnet, also bleibt E2. Alle übrigen
   Übergänge verbinden die bereits bestimmten benachbarten Stunden.

Zielroute endgültig: **A1–B1–C1–C2–D1–D2–E2**.

## Abhängigkeiten und Diagnosegrenzen

Die unabhängigen Teilzustände A, B und C sowie die Dreierkombination werden mit
dem unveränderten `diagnosePuzzle()` berechnet. Zusätzlich prüfen vollständige
Weglassungszustände (auch die im Standardbericht fehlenden Vierergruppen): Ohne
H2, H3 oder H4 bleiben D und die Folgestunde 2 sowohl exakt als auch lokal offen.
Das belegt die Notwendigkeit der Kombination auch in Anwesenheit der übrigen
Hinweise; eine reine Verringerung der Routenzahl genügt nicht.

Der vollständige lokale Graph enthält einen Pfad von der Feldfestlegung in
Stunde 1 zur Festlegung in Stunde 2, weiter zu Stunde 3 und schließlich Stunde 6.
Die Übergangsfestlegung und ihr Endpunkt sind dieselbe Erkenntnis in zwei
Darstellungen: Folgeschritte zitieren das Feldzertifikat. Es wird ausdrücklich
kein Pfad vom terminalen Protokolleintrag der ersten Übergangsfestlegung behauptet.
Die kleine geometrische Argumentation wird außerdem separat nachgerechnet,
ohne vollständige Routen als Argument zu benutzen.

Alle sechs Stunden und sechs Übergänge werden lokal eindeutig. Die Feld- und
Übergangslücke zum exakten vollen Lösungsraum ist null. Die Referenz beansprucht
damit A–F als technisch erfüllten Vertrag; sie benötigt weder eine neue lokale
Regel noch eine Reduktion auf das kleinere Drehbuch. Drei unabhängige vollständige
Teilrätsel entstehen nicht. C ist bewusst eine direkte, einfache Ortsinformation.

Die lokale Regelimplementierung bleibt bytegleich zu #103. Der allgemeine
P3-Befund zum früheren Testprüfer bleibt separat offen. Die hier geprüften
konkreten Abhängigkeitspfade und Weglassungen ersetzen keine allgemeine Prüfung
der Vollständigkeit aller Begründungskanten. Diese Referenz prüft weder alle sechs
Hinweistypen noch Zählalgebra, globale Wiederbesuchsargumente oder allgemeine
menschliche Rätselqualität. Menschlicher Spieltest steht aus.

## Reproduktion und Lösungsschutz

Node v24.19.0; `npm run report:b2:positive -- --check` prüft drei gespeicherte
Dateien bytegenau. `--write` erneuert sie ausdrücklich. Eingangs- und relevante
Implementierungshashes stehen in `evidence.json`; keine Zeitstempel oder Laufzeiten.
Die gespeicherte Zielroute gelangt nicht in `localDeduction()` oder
`diagnosePuzzle()`, die ausschließlich `logic` erhalten.

Der öffentliche Export nutzt die bestehende Allowlist-Projektion und den
unveränderten Loader. Er enthält Karte, Texte, Hinweise, Motive und Identitäten,
keine gespeicherte Lösung oder private Nachweise. Wie im bisherigen Spiel ermittelt
der Browser die eindeutige Lösung intern für die vorhandenen Prüfknöpfe. Der
gesonderte ZIP-Export sammelt Laufzeitdateien und genau zwei öffentliche
Referenzdateien; er kopiert keine Repositoryverzeichnisse.
