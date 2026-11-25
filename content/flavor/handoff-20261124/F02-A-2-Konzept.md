# F02-A/2 – Konsolidiertes fachliches Zielkonzept

Stand: 24. November 2026 · Konzeptionsabschluss und technische Übergabe

## 1. Ziel und Geltung

F02-A/2 schafft einen dauerhaften, später automatisierbaren Produktionsweg für atmosphärische Rätseltexte aus bereits ausgestalteten Karten und feststehenden Rätseln. Zunächst werden vorhandene ChatGPT-/Codex-Möglichkeiten mit manuellem Transport vollständiger Produktionspakete genutzt. Eine kostenpflichtige API ist keine Voraussetzung.

Das Ergebnis sind nachvollziehbar erzeugte, strukturell vollständige Flavor-Drafts. Ihre Erzeugung oder ihr erfolgreicher Import beweist keine semantische Korrektheit und erteilt keine Veröffentlichungsfreigabe. Die unabhängige Bedeutungsprüfung, gezielte Reparatur und wiederaufnehmbare Qualitätsverarbeitung sind F02-B.

Dieses Dokument beschreibt das fachliche Soll aus dem Konzeptionschat. Die technische Grundlage wurde dort berichtet, hier aber nicht im Repository überprüft. Codepfade, Verträge, PR- und CI-Status sind vor der Implementierung im bestehenden Workchat zu verifizieren. Die Unterlagen legen insbesondere keine neuen F01-Feldnamen oder technischen Statuswerte verbindlich fest.

## 2. Ausgangsbasis und noch ungeprüfter technischer Anschluss

Im Konzeptionschat wurde folgender Ausgangsstand benannt:

- Repository: [roquas/Sams-Gezeitenkarten](https://github.com/roquas/Sams-Gezeitenkarten).
- F01 über PR #124 integriert; Verträge für Flavor-Requests, Drafts, Prüfungen und Checkpoints, insbesondere `scripts/lib/flavor-contract.mjs` und `docs/FLAVOR-PIPELINE-F01.md`.
- Erster F02-A-Schritt in PR #129: persistente Bibliothek bebilderter und benannter Karten, eigene Identität aus logischer Karte und konkreter Ausgestaltung, Wiederverwendung mit verschiedenen Rätseln.
- Berichtet wurden 23 Motiv-Namenspools mit je 20 Namen und ausdrücklichen Assetzuordnungen, feste Bindung des Tesoro-Assets an `world.tesoro` sowie eine von austauschbaren Pools unabhängige Reservierung bekannter Weltortnamen.
- Anschlussdokumentation: `docs/FLAVOR-CARD-LIBRARY-F02-A.md`; vier vorbereitete Fälle C-06, C-02, C-03 und C-11.
- PR #129 wurde laut Konzeptionsgrundlage unabhängig geprüft und korrigiert. Sein aktueller Merge-, Head- und CI-Stand ist hier nicht bestätigt.

Diese Angaben sind Suchanker für den Workchat, keine Ergebnisse einer neuen Codeprüfung.

## 3. Drei Identitäten, drei Lebenszyklen

| Ebene | Verbindlicher Inhalt | Veränderung durch Flavorisierung |
|---|---|---|
| Ausgestaltete Karte | Geometrie, Assets, Objektidentitäten und persistierte Ortsnamen | Keine |
| Rätsel | Kartenreferenz, konkreter Startpunkt, Route und mathematische Hinweise | Keine |
| Flavor | Rätselreferenz, Titel, Einleitung, formulierte Hinweise, Metadaten und Herkunft | Erzählerische Bearbeitung innerhalb der fachlichen Grenzen |

Eine ausgestaltete Karte hat **keinen festgelegten Startpunkt**. Sie muss fachlich mindestens ein befahrbares Ein-Hex-Motiv als möglichen Startort besitzen. Ob und wie diese Voraussetzung schon implementiert ist, prüft der Workchat.

Verschiedene Rätsel dürfen auf derselben Karte mit verschiedenen Startorten und Routen spielen. Gleichbleibende Karte bedeutet gleichbleibende Objektidentitäten und Namen, aber weder gleichbleibenden Startort noch gleichbleibendes Thema. Der Wald namens „Nebelwald“ wird in einer anderen Episode derselben Karte nicht zur „Dunkelbauminsel“.

Dasselbe gewöhnliche Asset darf auf einer anderen ausgestalteten Karte anders heißen. Namen müssen zum Motiv passen. Fest gebundene Weltorte wie Tesoro sind gesondert zu behandeln; weitere Unique-Assets sollen später ergänzbar sein. Die Namensvergabe erfolgt vor der Textproduktion aus vorbereiteten Pools ohne laufenden GenAI-Aufruf je Karte.

Die konzeptionelle Reihenfolge lautet: logische Karte → Assets zuordnen → Namen vergeben und Karte speichern → darauf unterschiedliche Rätsel mit eigenen Startorten und Routen erzeugen → ausgewählte Rätsel flavorisieren. Die Flavorisierung darf keine vorgelagerte Stufe neu auslösen.

## 4. Flavor als reine Präsentationsschicht

Jeder mathematische Hinweis erhält genau eine vollständige Textfassung mit stabiler Hinweisreferenz. Keine Zusammenfassung mehrerer Hinweise, keine Aufteilung, kein Weglassen und kein neu erfundener Hinweis. Die logischen Angaben bleiben unverändert: Bezugsobjekte, Stunden, Intervalle, Quantoren, Anzahlen, Distanzen, Richtungen, Negationen und deren jeweilige Verknüpfung.

Die Hinweise müssen nicht chronologisch erzählt werden. Eine zulässige Darstellungsreihenfolge ist am bestehenden Vertrag zu prüfen; sie darf weder die Hinweisidentität noch die Semantik verändern. Daraus folgt keine Erlaubnis, die beauftragte Reihenfolge der Rätsel zu ändern.

Titel und Einleitung dürfen vorhandene öffentliche Hinweisinformationen aufgreifen. Sie dürfen keine notwendigen Angaben ersetzen und keine weiteren räumlichen, zeitlichen oder bewegungsbezogenen Aussagen hinzufügen. Der mathematische Hinweisbestand bleibt auch ohne Einleitung vollständig.

Die eigentliche Spielaufgabe und die Spielregeln werden vom Spiel vorgegeben. Die GenAI erzeugt keine alternative Gewinnbedingung. Eine zusätzliche Auflösungsgeschichte nach erfolgreichem Spielen ist zurückgestellt und würde einen eigenen Vertrag benötigen.

## 5. Informationsgrenze

| Für Planung und Textproduktion zulässig | Ausgeschlossen |
|---|---|
| Vollständige öffentliche ausgestaltete Karte | Zielroute und private Lösungsexporte |
| Sämtliche persistierten Kartennamen und Objektbezüge | Nicht öffentlich bekannte Zielposition |
| Dem Spieler bekannter konkreter Startpunkt einschließlich Startobjekt und Name | Interne Solver-Ergebnisse, Lösungsprotokolle und Analysepfade |
| Alle verbindlichen spielerzugänglichen Hinweise und öffentlichen Regeln | Zusätzliche nicht veröffentlichte Hinweise |
| Vollständiges Welt-/Stilpaket in bestimmter Version | Versteckte Lösungsdaten in Anhängen, Metadaten oder unbeschränktem Repositoryzugriff |
| Redaktioneller Auftrag, feste Auswahl und Reihenfolge, optionaler Erzählkontext | Rückgriff auf private Informationen zur Dramaturgie oder Ortsauswahl |

Der bekannte Startpunkt ist eine rätselspezifische Eingabe. Seine Kenntnis verletzt keine Geheimhaltung, weil auch die Spielenden ihn kennen. Die Karte wird dadurch nicht nachträglich an einen Start gebunden.

Ein separater Produktionschat ist für den Pilot der geeignete Weg, diese Grenze praktisch herzustellen. Er erhält nur den geprüften Export samt Welt-/Stilpaket. Ein Agent mit freiem Zugriff auf das Repository und private Lösungsdaten ist nicht allein durch die Anweisung „Zielroute nicht lesen“ ausreichend isoliert. Die technische Ausgestaltung einer späteren Isolation bleibt zu prüfen.

Der Ausschluss der Zielroute verhindert nicht jede unbeabsichtigte Zusatzinformation. Deshalb bleiben Produktionsregeln, unabhängige Prüfung und menschliche Kalibrierung erforderlich.

## 6. Ortsbezug aus öffentlichen Informationen

Die erzählerische Bedeutung eines Kartenorts muss seiner öffentlich belegten Bedeutung für die Fahrt entsprechen:

| Öffentlich belegter Bezug | Zulässige Verwendung |
|---|---|
| Startort | Darf die Vorgeschichte zentral tragen |
| Positiver räumlicher Hinweisbezug | Darf in entsprechendem Umfang thematisch aufgegriffen werden |
| Distanz- oder Ausschlussbezug | Darf genau diesen Bezug tragen; daraus wird kein Besuch oder Aufenthalt am Ort |
| Kein Hinweisbezug und kein Startort | Keine eigenständige erzählerische Verwendung als Kartenort |

Eine zufällige Nähe in der tatsächlichen Lösung begründet keine Verwendung: Diese Lösung kennt die Produktion nicht. Ein positives Näheprädikat erlaubt außerdem nicht automatisch Anlegen, Betreten, Umrunden oder den Besuch verschiedener Buchten.

Das im Chat diskutierte Beispiel „dreimal neben Tesoro in Stunden 2–5“ darf Tesoro atmosphärisch relevant machen. „Fast jede Bucht erkundet“ kann jedoch zusätzliche unterschiedliche Positionen oder eine Umrundung suggerieren. Der Fall wird als Qualitäts- und Kalibrierungsbeispiel bewahrt, nicht als pauschal freigegebene Übersetzung. Lebendige Übertreibung soll nicht durch starre Wortverbote verhindert werden; ihre tatsächliche Spielerwirkung muss überprüft werden.

Für F02-A/2 wird zunächst empfohlen, die GenAI diese Relevanz aus den öffentlichen Hinweisen interpretieren zu lassen. Eine neue Klassifikationsengine ist kein notwendiger Bestandteil. Spätere deterministische Hilfen müssten ausschließlich aus öffentlichen Daten abgeleitet werden.

## 7. Erzählmodell und kreative Freiheit

Gezeitenkarten erzählt kleine Episoden aus Carribera durch unterschiedliche persönliche und funktionale Aufzeichnungen. Sams Tagebuch kehrt wieder, dominiert aber nicht verpflichtend jede Episode. Möglich sind Logbuch, Merkzettel, Brief, Reklamation, Auftrag, Telegramm, Fahrtbericht oder Prüfungsunterlage.

Die Episoden sind keinem bestimmten Podcastabschnitt verpflichtet. Vorhandenes Weltwissen darf aus verschiedenen Abschnitten als Fundus dienen, ohne damit eine neue verbindliche Chronologie zu behaupten. Aus Nombreo, Tiburon, Tesoro, Kapuzien und dem Meer Carribera folgen keine unbelegten Entfernungen oder Himmelsrichtungen. Behauptet ein Text ausdrücklich eine konkrete historische Phase, muss er deren bekannte Umstände respektieren.

Stilistische und thematische Kohärenz sind erwünscht; eine fortlaufende Handlung innerhalb der Hinweise ist nicht erforderlich. Rahmen und Hinweise dürfen unterschiedlich stark verzahnt sein. Nicht jeder Hinweis braucht Witz, Handlung oder Ausschmückung. Auch nüchterne Genauigkeit gehört zum Ton.

Form und Länge sind frei. Keine Mindestlänge, kein Pflichtaufbau, keine erzwungene Pointe. Ein Telegramm kann genügen; eine längere Geschichte darf einen eigenen Unterhaltungswert haben. Der zwischenzeitliche Vorschlag eines 40–120-Wörter-Korridors ist keine Produktionsvorgabe.

Absurde, wirre, seltsame und unerwartete Kombinationen sind ausdrücklich erwünscht. Neue Figuren, Institutionen, Waren, Dienstleistungen, Spiele und fantastische Phänomene dürfen entstehen; bestehende Weltideen dürfen improvisatorisch weitergedacht werden. Nicht jede Nebenhandlung braucht eine Erklärung oder Auflösung. Die unveränderte Rätsellogik und die Verständlichkeit bleiben verbindlich.

Neue Episodenideen erhalten den Status [N]. Sie werden nicht automatisch zu dauerhaftem Weltwissen und nicht nachträglich als Podcastfakten ausgegeben. Besonders gelungene Neuerfindungen können bewusst redaktionell übernommen werden. Belegter Weltbestand, persistierter Kartenbestand und episodische Erfindung bleiben unterscheidbar.

## 8. Welt-/Stilpaket v1

Die Minimalstruktur ist abschließend gewählt:

| Datei | Inhalt |
|---|---|
| `world.md` | Weltwissen einschließlich Namen, Figuren, Orten, Institutionen, Gegenständen, Beziehungen, U-Ergänzungen und Quellenstatus |
| `style.md` | Erzählformen, Humor, Freiheiten, Variation und als neu gekennzeichnete Beispiele |
| `production.md` | Verbindliche fachliche Produktionsgrenzen und Anforderungen an Eingabe und Ergebnis |
| `manifest.json` | Eine Paketidentität und gemeinsame Version mit Dateireferenzen |

Namen und Konzepte werden nicht künstlich getrennt. Bank, Standort und Hamsterpost dürfen gemeinsam verständlich beschrieben werden. Es gibt keine drei unabhängig verwalteten Inhaltsversionen. Jede produktiv verwendete Fassung des Gesamtpakets muss eindeutig referenzierbar sein; Änderungen erzeugen einen neuen Paketstand. Das gesamte Paket darf zunächst jeder Produktion beiliegen.

Die ursprüngliche Recherche bleibt unverändert als Quelle erhalten. Sie ist nicht unverändert mit dem produktiven Prompt gleichzusetzen. Die Herkunftskategorien sind [A] automatisch ausgewertetes Audio, [B] offizielle Begleittexte, [U] beigesteuertes Nutzerwissen, [I] Interpretation und [N] neue Gestaltung. Herkunft ist keine Freigabe und kein Qualitätsurteil.

Eine Ontologie, Datenbank, Vektorsuche und automatische Auswahl relevanter Weltinformationen sind nicht erforderlich. Neue Quellen oder Weltpaketversionen verändern bereits gespeicherte Episoden nicht automatisch.

## 9. Produktionsauftrag, Gesamtplanung und Batchweg

Rätselgenerierung und Qualifikation erfolgen ohne Flavor. Spätere Auswahl nach Schwierigkeit, Lösungstypen und Abwechslung sowie Daily-Kalender und Paketbildung liegen vor dem redaktionellen Auftrag. Beispielsweise unterschiedliche Wochentagsschwierigkeiten oder „100 leichte Rätsel“ sind langfristige Anwendungen, keine hier implementierte Einstufung.

Ein gemeinsamer Produktionsvertrag soll freie Gestaltung, bewusste Vielfalt, ein gemeinsames Thema und fortlaufende Geschichten ermöglichen. Dies sind Ausprägungen eines Auftrags, keine vier getrennten Pipelines. Ein Impuls kann unverbindliche Inspiration oder ein konkreter Themenauftrag sein. Eine mangelnde Eignung darf als Problem zurückgemeldet werden; daraus folgt keine Erlaubnis zu neuen Rätseln oder Kartenänderungen.

Für eine Serie kennt die Gesamtplanung **vor** dem Verfassen der ersten Episode die zulässigen Daten sämtlicher ausgewählter Rätsel und ihre feste Reihenfolge. Sie entwickelt daraus Kontext und bei Bedarf einen Episodenplan. Die Einzelproduktion verwendet diesen Kontext samt ihrem eigenen Rätsel. Eine Restaurantinsel, die erst in Episode acht verfügbar ist, beeinflusst die Geschichte; sie wird nicht für Episode drei neu erzeugt.

Erzählerische Abhängigkeiten, wiederkehrende Motive und ein gemeinsamer Handlungsbogen sind erlaubt. Logische Abhängigkeiten sind ausgeschlossen: Kein Rätsel erfordert eine frühere Lösung, Route, versteckte Information oder einen Hinweis aus einer anderen Episode. Auch eine frei gewählte mittlere Episode bleibt eigenständig lösbar. Gesamtplanung und Textproduktion erhalten keine Zielrouten.

Praktischer Ablauf nach Implementierung:

1. Ein deterministischer Export stellt den vollständigen Auftrag aus fest ausgewählten Rätseln, Karten, öffentlichen Regeln und einer bestimmten Paketversion zusammen.
2. Der Nutzer übergibt das Gesamtpaket an den getrennten Produktionschat. Dort erfolgen gegebenenfalls Gesamtplanung und Textproduktion im vereinbarten maschinenlesbaren Ergebnisformat.
3. Der Nutzer gibt die vollständige Ergebnisdatei zurück. Ein deterministischer Import prüft Struktur, Referenzen und Vollständigkeit und speichert die Drafts mit Herkunft.
4. Drafts und getrennte Nachweise stehen anschließend F02-B zur unabhängigen Prüfung zur Verfügung.

Manuell ist zunächst der Transport ganzer Pakete. Eine Episode pro Chat, Kopieren einzelner Hinweise, regelmäßige Einzelrückfragen und manuelle Zusammenführung von Textfeldern sind nicht das Ziel. Die GenAI-Produktion ist modellunabhängig; eine spätere API kann sie ersetzen, ohne den grundlegenden Vertrag wegzuwerfen. Der Export ist reproduzierbar zu gestalten; eine bitgleiche Reproduktion kreativer Modellausgaben wird nicht zugesagt.

## 10. Ergebnis, Herkunft und Revisionen

| Ebene | Fachlich zu bewahrende Angaben |
|---|---|
| Auftrag | Ausgewählte Rätsel und Referenzen, Reihenfolge, redaktionelles Ziel, Thema/Impuls, optionaler Kontext, Paketidentität und Version |
| Durchlauf | Tatsächliche Eingaben, verwendete Promptfassung, Zeitpunkt, ausführendes Modell soweit bekannt |
| Flavor-Draft | Rätselreferenz, Titel, Einleitung, vollständige 1:1-Hinweistexte mit stabilen Referenzen |
| Erzählerische Metadaten | Erzählform, Themen, verwendete Weltmotive, neu erfundene Weltbestandteile |
| Qualitätsnachweise | Getrennte Prüfungen, Findings, Reparaturen und Freigaben mit Bezug auf die untersuchte Fassung |

Metadaten sollen kompakt bleiben. Sie ermöglichen später, wiederkehrende Themen wie Bierraten auszuzählen, ohne alle Texte erneut zu analysieren. Selbstauskünfte der produzierenden GenAI sind kein unabhängiger Qualitätsnachweis. Ist ein Modellname unbekannt, wird er nicht erfunden.

Eine **neue Variante** erzählt eine andere Geschichte zum selben Rätsel. Eine **neue Revision** korrigiert oder verbessert dieselbe Geschichte. Reparierte Texte überschreiben ihre Vorgänger nicht unbemerkt. Eine aktuell ausgewählte Fassung bleibt bestimmbar; im Spielerfrontend ist keine Versionsverwaltung erforderlich. Die technische Repräsentation und die Auswahlzuständigkeit sind an F01 zu prüfen.

## 11. Lebenszyklus und Abgrenzung F02-B

Der fachliche Ablauf lautet: erzeugter Draft → unabhängige semantische Prüfung → gegebenenfalls beanstandet, gezielte Reparatur und erneute Prüfung → semantisch bestanden → gesonderte redaktionelle Freigabe/Veröffentlichung.

F02-A/2 schafft Eingaben, Ausgabe, deterministische Strukturprüfungen, Persistenz und Anschlussnachweise. F02-B behandelt freie Bedeutung, Zusatzhinweise, Spielerinterpretation, Qualitätsfindings, gezielte Reparatur und Wiederaufnahme. Eine vollständige F02-B-Pipeline wird nicht in F02-A/2 vorgezogen. Bestehende F01-Prüfungen und Checkpoints sollen wiederverwendet werden, soweit geeignet.

Das Modell beschreibt fachliche Zustände, keine neuen technischen Enum-Werte. Produktion, Qualität und Veröffentlichung dürfen auch bei technischer Wiederverwendung nicht in einen undifferenzierten Status fallen.

## 12. Erprobung in zwei Phasen

### Phase 1: vier Einzelpilotfälle

Nach der technischen Umsetzung erfolgt ein gemeinsamer Auftrag für **C-06, C-02, C-03 und C-11**, je eine eigenständige Episode. Erwartet werden **vier** vollständige Drafts mit unterschiedlichen Geschichten und überprüfbarer Herkunft. Der frühere Vorschlag zweier Durchläufe beziehungsweise acht Rohfassungen ist ersetzt.

Zu beobachten sind die kreative Ergiebigkeit des Pakets, Passung zu Karte und Hinweisen, natürliche und eindeutige Formulierungen, der gesammelte Export-/Importweg und die spätere gezielte Prüf- und Reparierbarkeit. Anschließend werden die Ergebnisse gemeinsam analysiert; Erkenntnisse fließen in das Paket und die konkrete Ausgestaltung von F02-B ein.

### Phase 2: vollständiger Betatest mit 15 Rätseln

Zehn Rätsel erhalten bewusst unterschiedliche Einzelgeschichten; fünf bilden eine gemeinsame Geschichte mit eigenständig lösbaren Episoden. Die konkrete Zuordnung und Serienreihenfolge der 15 Fälle ist noch nicht festgelegt. Sie wird vor Produktion bestimmt und während der Flavorisierung nicht verändert.

Für die Darstellung genügen zunächst verständliche Episodentitel wie „… – Teil 3“. Eine eigene Seriennavigation, neue Gruppierungsfunktionen oder besondere UI-Komponenten sind keine Voraussetzung. Die im Chat genannten Titel zur Bierraten-Meisterschaft sind Beispiele, kein bereits verbindliches Serienthema.

Der Projektverantwortliche liest **alle 15 vollständigen Rätseltexte**. Die Prüfung trennt mathematische Bedeutung, mögliche Spielerinterpretation und erzählerische Qualität. Dieses vollständige Lesen dient der Kalibrierung; dauerhafte menschliche Einzelredaktion jedes produzierten Rätsels ist nicht das langfristige Produktionsmodell.

## 13. Erfolgskriterien für F02-A/2

- Ein vollständiger Batchauftrag lässt sich ohne Lösungswissen exportieren, extern bearbeiten und gesammelt importieren.
- Karte, Namen, Assets, Startpunkt, Rätselidentität, mathematischer Hinweisbestand und beauftragte Reihenfolge bleiben erhalten.
- Pro mathematischem Hinweis existiert exakt eine referenzierbare Textfassung; fehlende, doppelte oder fremde Referenzen werden erkannt.
- Paketstand, tatsächliche Eingaben, Promptfassung, Durchlauf und Ergebnis sind nachvollziehbar verbunden.
- Varianten und Revisionen sowie deren ausgewählte Fassung sind fachlich unterscheidbar; frühere Fassungen bleiben nachvollziehbar.
- Importierte Drafts werden nicht automatisch zu semantisch bestandenen oder veröffentlichten Fassungen.
- Die vier Pilotepisoden lassen sich gemeinsam erzeugen; ihre erzählerische Bewertung bleibt ein eigener nachgelagerter Schritt.

Die exakten technischen Prüfungen, Fehlerfälle und Persistenzgarantien werden nach der Repositoryprüfung konkretisiert. Insbesondere ist vorab festzulegen, wie ungültige oder teilweise Ergebnisse ohne unbemerkten Datenverlust behandelt werden.

## 14. Offene technische Prüfungen und Folgevorhaben

Der Workchat prüft PR #129 und aktuellen main-Stand, F01-Request-/Draft-/Prüf-/Checkpointverträge, Startortprojektion, vollständige Namen in der Beta-Präsentation, Export-/Importanschluss, Persistenz von Herkunft und Textrevisionen, Auswahl einer Fassung sowie Übergaben an F02-B. Der zunächst berichtete Konflikt – Kartenbibliothek mit allen Namen, F01-Draft ohne Startobjektname, Beta mit allen Namen – wird ausdrücklich untersucht.

Die frühe Empfehlung, Startnamen weiterhin auszublenden, ist überholt. Ebenso ist die zwischenzeitliche Behauptung zurückgenommen, eine direkte F01-Vertragsänderung sei bereits sicher nötig. Das Soll steht fest; ob die bestehenden Verarbeitungsebenen es schon erlauben oder gezielt angepasst werden müssen, ist offen.

Zurückgestellt bleiben API-Anbindung und unbeaufsichtigte Massenproduktion, automatische Geschichtenplanung und Diversitätssteuerung, Kalender- und Paketverwaltung, neue Schwierigkeitseinstufung, Auflösungstexte, integrierte Generierung von Rätseln/Assets/Geschichten und vollständige Podcastauswertung. Nach dem Betatest ist die systematische Erschließung sämtlicher P:Pin- und TT-Folgen als eigenes Vorhaben vorgemerkt: mit Transkription, Quellenbezügen und gezielter Audioauswertung, ohne die Annahme eines dauerhaften vollständigen Modellgedächtnisses.

## 15. Nächster Schritt

Der bestehende Workchat erhält diese Unterlagen und führt die **lesende Repositoryprüfung mit anschließendem konkretem Codex-Auftragsentwurf** durch. Erst danach folgt die Implementierung von F02-A/2. Diese Lieferung selbst enthält weder Repositoryänderungen noch fertige Rätseltexte.
