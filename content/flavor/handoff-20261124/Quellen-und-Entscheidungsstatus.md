# Quellen- und Entscheidungsstatus – F02-A/2

Stand der Übergabe: 24. November 2026

## 1. Verwendete Grundlagen

| Kennung | Quelle | Tatsächlich verwendeter Umfang |
|---|---|---|
| K | [F02-A Konzeptentwicklung](https://chatgpt.com/c/6b059203-5090-83eb-911b-745316182b27) | Abschließender Konzeptionsverlauf vom Ausgangsauftrag über Erzählmodell, U-Ergänzungen, Startort, Identitäten und Serien bis zum vereinbarten Übergabepaket |
| R | [Ursprüngliche Stil- und Weltreferenz](referenzen/ploetzlich-piratin-stil-und-weltreferenz.md) | Vollständige lokale Referenz, Recherche vom 11. Oktober 2026; unveränderte Kopie beigefügt |
| H | Aktueller Auftrag zur Erstellung dieser Unterlagen | Bestätigt Umfang, vier Einzelpilotfälle, später 10+5, Informationsgrenze, Revisionen und offene technische Prüfungen; keine Repositoryänderung oder Implementierung |

Der strukturierte Chatabruf lieferte nur die jüngsten fünf Gesprächsrunden und keinen älteren Cursor. Deshalb wurde der frühere Konzeptionsverlauf zusätzlich in der angemeldeten Browseransicht lesend nachgeladen: Ausgangsauftrag, Wahl verschiedener Aufzeichnungen, Kohärenz, U001–U015, kreative Freiheit, Ortsrelevanz/Start, 1:1-Hinweise, Kartenidentität, freie Textlänge sowie Batch-/Serienplanung. Die Schlussentscheidungen wurden mit dem strukturierten Abruf abgeglichen. Der Browser wurde ausschließlich zur Quellenlektüre verwendet.

Dies ist eine thematische Konsolidierung des letzten Stands, kein wortgetreues Gesprächsprotokoll. Die nachstehende E-Liste dient dem Abgleich mit den ursprünglichen Entscheidungsnummern. Aussagen über das Repository bleiben berichteter Ausgangsstand, bis der Workchat sie am Code verifiziert.

## 2. Grenzen der ursprünglichen Recherche

R beruht auf rund **51 Minuten automatisch transkribiertem Audio in vier Dateien**, nicht auf einer vollständigen unmittelbaren Hörprüfung:

| Kennung | Folge | Auswertung |
|---|---|---|
| R:A1 | Sam und die Ankunft in Nombreo | ca. 03:00–13:00 |
| R:A2 | Sams Tagebuch – Kapitel 01 | vollständige MP3 21:05; erkannte Sprache bis etwa 20:55 |
| R:A3 | Sam und die Erkundungstour in Tesoro | ca. 04:00–14:00 |
| R:A4 | Stefan Schlagfertig (Esel & Teddy) und der versunkene Piratenschatz | ca. 03:00–13:00 der TT-Originalfolge |

Transkription laut R: faster-whisper, Whisper `base`, Deutsch. Namen, Wortspiele und überlappende Stimmen sind besonders unsicher. Zeitmarken sind Näherungen. Eine Audioadresse im Inventar bedeutet nicht, dass die Folge ausgewertet wurde. Die Tagebuchzusammenstellung ersetzt keine vollständige Analyse aller zugrunde liegenden Abenteuerfolgen.

R berichtet für den Recherchetag 61 P:Pin- und 43 TT-Feedeinträge sowie keine gefundenen veröffentlichten Transkripte in den konkret geprüften Quellen. Das sind **historische Rechercheangaben**, keine hier neu geprüften aktuellen Bestandszahlen und keine Behauptung, nirgends existierten Transkripte.

Offizielle Quellenanker aus R:

- [Plötzlich Pirat:in – offizielle Übersicht](https://lanoinc.de/ploetzlich-piratin/)
- [P:Pin-RSS](https://feeds.lanothek.de/ploetzlichpiratin)
- [Tapfere Tackerhacker – offizielle Übersicht](https://lanoinc.de/tapfere-tackerhacker/)
- [TT-RSS](https://feeds.lanothek.de/tapferetackerhacker)
- [Abschied von Tesoro](https://tt.lanothek.de/abschied-von-tesoro/), [Sören und die Bierraten-Meisterschaft](https://tt.lanothek.de/soeren-und-die-bierraten-meisterschaft/), [Koja und das große Kennenlernen](https://tt.lanothek.de/koja-und-das-grosse-kennenlernen/): ergänzende Begleittexte, keine vollständige Audioauswertung.

Die vollständigen offiziellen Folgen-/Audioverweise und weiteren Beleggrenzen bleiben in R erhalten. Für diese Übergabe wurden keine neuen Folgen gehört, transkribiert oder extern inhaltlich nachrecherchiert.

## 3. Herkunft ist nicht Freigabe

[A] bezeichnet automatisch ausgewertetes Audio, [B] offizielle Begleittexte, [U] beigesteuertes Nutzerwissen, [I] Interpretation und [N] neue Gestaltung. Diese Kategorien sind keine Qualitätsstufen. Produktionsfreigabe einer Quelle, semantisches Bestehen eines Texts und Veröffentlichung eines Flavors sind gesonderte Entscheidungen.

Alle 15 U-Einträge sind in `world.md` enthalten: U001 Uberfahren/Uberfahrer, U002 Bierraten, U003 Biersorten, U004 Meisterschaften, U005 Schiff Tackerhacker, U006 Crew/Folgepodcast Tapfere Tackerhacker, U007 Geister/Flaschen/Plüschwal, U008 Miet-Papierschiffe, U009 Gewürzhandelsimperium, U010 Hehlereien, U011 Klüsen klamüsern, U012 Hannes' Hantel Handel, U013 Buddelbecker Bank, U014 Hamsterpost und U015 Gulden.

Für diese U-Aussagen liegen in K keine individuellen Folge-/Zeitmarkenbelege vor. Sie werden produktiv nutzbar aufbereitet, aber nicht zu unabhängig belegtem Audioinhalt umetikettiert. Carribera und Kapuzien stammen zusätzlich aus dem vereinbarten Ausgangskontext; zu Kapuzien werden keine weiteren Eigenschaften ergänzt.

## 4. Abgleich der ursprünglichen Entscheidungen E01–E31

Die Themen sind im Zielkonzept konsolidiert. „Arbeitsgrundlage“ kennzeichnet Vorschläge, die in die abschließend beauftragte Ausarbeitung übernommen werden, ohne rückwirkend jede frühere Tabellenzeile als ausdrücklich einzeln abgestimmt auszugeben. Technische Details bleiben ungeprüft.

| ID | Letzter fachlicher Stand | Behandlung in der Übergabe |
|---|---|---|
| E01 | Verschiedene Aufzeichnungen; Sams Tagebuch wiederkehrend | Beschlossen; `style.md` |
| E02 | Titel, Rahmen, einzelne Hinweise und Rekonstruktionsauftrag | Konkretisiert: Titel/Einleitung/Hinweise generiert; Aufgabe vom Spiel; kein Auflösungstext |
| E03 | Kombinierbare Motive/Formen statt starrer Templates | Übernommene Arbeitsgrundlage; keine Quoten oder festen Geschichtenmuster |
| E04 | Getrennte Identitäten und Lebenszyklen von Karte, Rätsel und Flavor | Beschlossen; Karte ohne festgelegten Start |
| E05 | Stilistische/thematische Kohärenz ohne erzwungene fortlaufende Handlung | Beschlossen; Rahmen und Hinweise flexibel verzahnt |
| E06 | Keine expliziten oder impliziten Zusatzhinweise | Beschlossen; auch Spielerinterpretation berücksichtigen |
| E07 | Laufend erweiterbares, versioniertes Welt-/Stilpaket | Beschlossen; alte Episoden behalten Herkunft und Textstand |
| E08 | Optionale redaktionelle Themenimpulse | Beschlossen; Inspiration oder Themenauftrag innerhalb eines Vertrags |
| E09 | Nutzerwissen mit eigener Kennung U | Im Chat praktisch verwendet; alle 15 Einträge aufbereitet |
| E10 | Direkter, beiläufiger oder indirekter Weltbezug ohne Pflichtquote | Übernommene Arbeitsgrundlage, im Sinn der beschlossenen kreativen Freiheit |
| E11 | Ausdrückliche Freiheit zu absurden und neuen Welterfindungen | Beschlossen; Grenzen durch Rätsellogik und Verständlichkeit |
| E12 | Bewusste Übernahme gelungener Erfindungen in dauerhaften Weltbestand | Übernommene Arbeitsgrundlage; keine automatische Kanonerweiterung |
| E13 | Systematische Welterschließung von P:Pin und TT nach dem Betatest | Vorgemerktes separates Folgevorhaben |
| E14 | Ortsverwendung entsprechend öffentlich belegter Relevanz | Beschlossen; kein eigenständiger Schauplatz ohne Start-/Hinweisbezug |
| E15 | Startpunkt samt Startobjektname ist zulässiger rätselbezogener Input | Beschlossen; konkrete Vertragsintegration offen |
| E16 | Zielroute und internes Lösungswissen ausgeschlossen | Beschlossen; auch für Gesamtplanung |
| E17 | Ortsrelevanz zunächst durch GenAI aus öffentlichen Hinweisen ableiten | Empfehlung für den ersten Schritt; keine neue Klassifikationsengine voraussetzen |
| E18 | Strikte 1:1-Zuordnung mathematischer und formulierter Hinweise | Beschlossen; keine Zusammenfassung/Aufteilung/Auslassung |
| E19 | Flavor ausschließlich als Präsentationsschicht | Beschlossen; keine Mutation von Karte oder Rätsel |
| E20 | Mehrere Flavor-Fassungen desselben Rätsels | Beschlossen; später durch Varianten-/Revisionsunterscheidung präzisiert |
| E21 | Freie Textlänge und Erzählform | Beschlossen; kein 40–120-Wörter-Korridor als Pflicht |
| E22 | Rätselauswahl und Paketbildung unabhängig von Flavor | Beschlossen; spätere Schwierigkeits-/Kalenderlogik außerhalb F02-A/2 |
| E23 | Produktionsauftrag kann ganze Rätselbestände umfassen | Beschlossen; gesammelte Übergabe statt Einzelbearbeitung |
| E24 | Gemeinsame Themen und fortlaufende Geschichten möglich | Beschlossen; späterer 10+5-Betatest konkretisiert die Anwendung |
| E25 | Erzählerische, keine logischen Abhängigkeiten zwischen Episoden | Übernommene Produktionsgrenze; alle Rätsel eigenständig lösbar |
| E26 | Zunächst zwei Durchläufe / acht Rohfassungen vorgeschlagen | **Ersetzt:** nur vier Einzelgeschichten im ersten Pilot; Serie erst im späteren 10+5-Test |
| E27 | Auswahl, Reihenfolge und Kartengestaltung bleiben unverändert | Beschlossen; keine Neugenerierung oder hinweisabhängige Assetauswahl |
| E28 | Gesamtplanung kennt vorab den gesamten ausgewählten Rätselbestand | Beschlossen; nur zulässige Daten, keine Zielrouten |
| E29 | Gesamtplanung und individuelle Textproduktion konzeptionell getrennt | Übernommene Arbeitsgrundlage; beide zunächst im Produktionschat möglich |
| E30 | Export-/Import-Vertrag unabhängig vom ausführenden Modell | Übernommene Arbeitsgrundlage des vereinbarten Produktionswegs; F01-Wiederverwendung prüfen |
| E31 | Minimal strukturiertes, gemeinsam versioniertes Welt-/Stilpaket | Beschlossen: `world.md`, `style.md`, `production.md`, `manifest.json`; keine Aufteilung von Namen/Konzepten |

## 5. Abschließende Präzisierungen ohne erfundene frühere E-Nummern

- Der erste Pilot umfasst exakt C-06, C-02, C-03 und C-11 als vier Einzelgeschichten. Die gemeinsame Qualitätsanalyse folgt danach.
- Der spätere vollständige Test umfasst zehn Einzelgeschichten und eine fünfteilige Geschichte auf 15 bestehenden Rätseln. Die konkrete Fallzuordnung und Reihenfolge bleiben vor diesem Auftrag festzulegen. Alle vollständigen Texte werden menschlich gelesen.
- Serienkennzeichnung zunächst über verständliche Titel/Teilnummern; keine vorausgesetzte neue Seriennavigation.
- Die drei Inhaltsdateien erhalten einen gemeinsamen Paketstand, keine voneinander unabhängigen Versionsnummern.
- Auftrag, tatsächliche Eingaben, Durchlauf/Prompt/Modell soweit bekannt, Draft, erzählerische Metadaten und Qualitätsnachweise bleiben nachvollziehbar getrennt.
- Andere Geschichte = Flavor-Variante; Korrektur derselben Geschichte = Flavor-Revision. Frühere Fassungen bleiben nachvollziehbar, eine Fassung ist aktuell ausgewählt. Diese im letzten Konzeptionsabschnitt empfohlene Unterscheidung wird im aktuellen Auftrag ausdrücklich verlangt.
- Erzeugung, semantisches Bestehen und Veröffentlichung bleiben fachlich getrennt; ihre technische Abbildung wird an F01 geprüft.

## 6. Ersetzte Zwischenstände und verbleibende Prüfungen

| Zwischenstand | Gültiger letzter Stand |
|---|---|
| Startname im Flavor grundsätzlich weiterhin ausblenden | Öffentlicher rätselspezifischer Start einschließlich Name ist bekannt |
| Deshalb F01 sicher direkt ändern | Zunächst Vertragsebenen, Ursprung und Schutzfunktion prüfen; Änderung nur falls tatsächlich erforderlich |
| Acht Texte / zwei Produktionsläufe mit denselben vier Fällen | Vier Einzeltexte; Serie später im 15-Fälle-Test |
| Einleitung etwa 40–120 Wörter | Form/Länge frei, kein Mindestwert oder Pflichtkorridor |
| Rahmen versus integrierte Geschichte als zwei Modi | Flexible Verzahnung, keine erzwungene fortlaufende Hinweisgeschichte |
| Weltbestand stärker in Namen und Konzepte aufteilen | Gemeinsames `world.md` mit zusammenhängenden Einträgen |
| Ein generierter oder importierter Text sei automatisch geprüft | Strukturelle Annahme, semantische Prüfung und Freigabe getrennt |

Offen sind die aktuelle Repository-/PR-/CI-Basis, konkrete F01-Abbildung, Startortprojektion, Export-/Importdetails und Fehlerverhalten, Persistenz und Auswahl von Varianten/Revisionen sowie F02-B-Anschlüsse. Das Manifest dieses Pakets ist ein neuer Übergabeentwurf und keine bestätigte F01-Spezifikation. Neu vorgeschlagene Referenznamen in den Dokumenten sind keine Behauptung bereits existierender Repository-IDs; die im Chat berichtete Bindung `world.tesoro` ist gesondert zu verifizieren.

Die ursprüngliche Recherche unter `sources/` wurde nicht verändert. Es wurden ausschließlich neue Übergabeartefakte erstellt. Eine technische Prüfung oder Implementierung fand in diesem Auftrag nicht statt.
