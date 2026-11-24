# Produktionsregeln – F02-A/2

Gemeinsamer Paketstand: **v1.0.0, Entwurf zur technischen Übergabe**, 24. November 2026. Diese Regeln beschreiben den verbindlichen fachlichen Produktionsrahmen. Die konkrete Serialisierung und Integration müssen an F01 geprüft werden. Diese Datei ist weder ein bereits implementiertes Schema noch ein Auftrag, jetzt Texte oder Code zu erzeugen.

## P01 – Bearbeitungsgegenstand

Flavorisierung formuliert Titel, erzählerische Einleitung und die Darstellungen vorhandener mathematischer Hinweise für ein **konkretes Rätsel**. Sie ist eine Präsentationsschicht. Karte, Rätseldefinition, Startort, Route, Hinweisbestand, Regeln, Assets, Objektidentitäten und persistierte Namen bleiben unverändert.

Die ausgestaltete Karte besitzt keinen festgelegten Startpunkt. Der konkrete Start gehört zum jeweiligen Rätsel. Eine Karte kann viele Rätsel, ein Rätsel viele Flavor-Varianten tragen. Gleiche Karte bedeutet gleiche Ortsnamen; sie erzwingt weder gleichen Start noch gleiche Geschichte.

## P02 – Zulässige Produktionseingaben

Der Auftrag enthält vollständig und eindeutig referenziert:

- Die fest ausgewählten Rätsel in der beauftragten Reihenfolge und ihre Kartenreferenzen.
- Die zugehörigen ausgestalteten öffentlichen Karten mit Geometrie, Motiven/Assets, Objekttypen, stabilen Objektbezügen und sämtlichen persistierten Namen.
- Den jeweils öffentlich bekannten konkreten Startpunkt samt starttragendem Objekt und dessen Namen.
- Den vollständigen spielerzugänglichen Hinweisbestand mit stabilen IDs und die dazu erforderlichen öffentlichen Regeln einschließlich der tatsächlich geltenden Zeit-, Bewegungs- und Distanzsemantik.
- Das gesamte Welt-/Stilpaket in einer eindeutig bezeichneten Version.
- Den redaktionellen Auftrag, gegebenenfalls einen unverbindlichen Impuls oder ein verbindliches Thema, gemeinsamen Erzählkontext und Episodenplan.
- Das im Workchat an F01 festgelegte Ergebnisformat sowie die Referenzen für Auftrag und Durchlauf.

Eine kompakte Historie bisher verwendeter Themen, Formen und Motive kann ergänzend mitgegeben werden. Sie ist keine Voraussetzung für eine erste Produktion und enthält kein privates Lösungswissen.

## P03 – Ausgeschlossene Informationen und Isolation

Nicht in die Gesamtplanung oder Textproduktion gelangen Zielroute, geheime Zielposition, zusätzliche unveröffentlichte Hinweise, Solver-Ergebnisse, Lösungsprotokolle, interne Analysepfade und sonstige private Lösungsdaten. Das gilt für Hauptdateien, Anhänge, Metadaten und weitere zugängliche Quellen.

Für den Pilot wird ein separater Produktionschat mit ausschließlich geprüftem Export verwendet. Ein Modell mit unbeschränktem Zugriff auf das Repository und mögliche Lösungsdateien ist nicht allein durch ein Leseverbot zuverlässig isoliert. Eine spätere technische Isolation bleibt Teil der technischen Planung.

Öffentliche Startkenntnis ist ausdrücklich zulässig. Die frühere Empfehlung, den Startobjektnamen grundsätzlich auszublenden, wird nicht fortgeführt. Ob F01 dafür geändert werden muss oder verschiedene Vertragsebenen bereits passen, prüft der Workchat.

## P04 – Unveränderliche Karten- und Rätselidentität

Keine Umbenennung, kein Assettausch und keine Auswahl eines anderen Motivs aufgrund einer Geschichte oder eines Hinweises. Ein unbefahrbares Zwei-Hex-Objekt wird nicht nach erzählerischem Bedarf vom Gefängnis zur Siedlungsinsel. Die vorhandene grafische und namentliche Ausgestaltung bleibt maßgeblich.

Keine Neugenerierung, kein Austausch, keine neue Reihenfolge und keine Änderung der Schwierigkeit durch die Flavorisierung. Eine thematisch schwierige Karte erfordert eine andere Geschichte. Probleme dürfen gemeldet werden; sie autorisieren keine Änderung der vorgelagerten Daten.

## P05 – Strikte 1:1-Hinweise

Für jeden mathematischen Hinweis gibt es genau eine vollständige spielerzugängliche Textfassung unter seiner stabilen Hinweisreferenz. Es gibt keine zusätzlichen, fehlenden, doppelten, zusammengefassten oder aufgeteilten Hinweise.

Bewahre exakt die Bedeutung aller Zeiten, Intervalle, Anzahlen, Quantoren, Distanzen, Richtungen, Negationen und Bezugsobjekte sowie ihrer Verknüpfung. Verwende die tatsächlichen Regeln aus dem Auftrag. Die Recherche enthält illustrative Beispielregeln; insbesondere wird daraus keine orthogonale oder andere Entfernungsvorschrift für die reale Hex-Engine übernommen.

Die Sprache darf vollständig neu sein. Die Textfolge muss keine chronologische Fahrt erzählen; die technisch zulässige Präsentationsreihenfolge ist an F01 zu prüfen. Die Identität der Hinweise bleibt erhalten. Titel und Einleitung tragen keine notwendigen Teile eines Hinweises an dessen Stelle.

## P06 – Keine weiteren Lösungsinformationen

Titel, Einleitung, Hinweisflavor und gemeinsamer Serienkontext dürfen keine zusätzlichen räumlichen, zeitlichen oder bewegungsbezogenen Angaben enthalten oder nahelegen. Vorhandene öffentliche Information darf atmosphärisch wiederholt, aber nicht verstärkt oder präzisiert werden.

Prüfe auch naheliegende Spielerfolgerungen: Ein Besuch, Abholen, Anlegen, Umrunden, „wieder dort“ oder „auf dem Rückweg“ kann mehr verraten als die ausdrücklich genannten Zahlen. Keine starre Wortverbotsliste; maßgeblich ist die Bedeutung des konkreten Gesamttexts.

Fantastische Weltmechaniken ändern keine Rätselregeln. Ein Geist fährt nicht durch unbefahrbares Gelände; ein Papierschiff legt keine zusätzliche Höchstdauer fest; eine Uberfahrt setzt keine neuen Stopps voraus; ein Warenauftrag erfindet keinen Abholpunkt.

## P07 – Öffentliche Relevanz von Orten

| Öffentliche Grundlage | Erzählerische Grenze |
|---|---|
| Bekannter Startort | Als Ausgangspunkt und zentraler Anlass verwendbar |
| Positiver räumlicher Hinweisbezug | Thema und Ausschmückung dürfen genau diesen Bezug aufgreifen |
| Distanz- oder Ausschlussbezug | Kein erfundener Besuch; nur entsprechender Abstand oder Ausschluss |
| Weder Start noch Hinweisbezug | Keine eigenständige Verwendung dieses Kartenorts als Schauplatz |

Die Kategorie wird aus Start und öffentlichen Hinweisen gewonnen, niemals aus der Zielroute. Die bloße Kartennennung reicht nicht. Nähe bedeutet nicht automatisch Betreten, Besuch unterschiedlicher Buchten oder Umrundung. Die im Chat diskutierte Tesoro-Übertreibung bleibt ein Prüffall, keine generelle Freigabe.

Zunächst ist keine neue Ortsklassifikationsengine erforderlich. Eine spätere maschinelle Hilfsklassifikation darf nur öffentliche Informationen auswerten.

## P08 – Kreative Freiheit und Herkunft

Nutze `world.md` als Fundus und `style.md` als Erzählrahmen. Verschiedene Aufzeichnungen sind erlaubt; Sams Tagebuch kehrt wieder, ist aber nicht verpflichtend. Keine feste Länge, kein Pflichtaufbau, keine Pflichtpointe und keine Pflichtquote für bekannte Motive. Nicht jeder Hinweis braucht eine Ausschmückung oder durchgehende Handlung.

Absurde neue Figuren, Einrichtungen, Waren, Dienstleistungen, Spiele und fantastische Phänomene sind zulässig. Sie bleiben zunächst episodenlokale [N]-Erfindungen und werden als solche in den Metadaten verzeichnet. Vorhandene Weltideen dürfen weitergedacht werden; neue Handlungen werden nicht als belegte Podcastfakten ausgegeben. Die persistierte Karte und das mathematische Rätsel bleiben dabei verbindlich.

## P09 – Batch und Serien

Ein gemeinsamer Produktionsvertrag trägt freie Gestaltung, bewusste Vielfalt, gemeinsames Thema und fortlaufende Geschichte. Ganze Rätselbestände werden gemeinsam beauftragt und gesammelt zurückgegeben. Keine reguläre Handarbeit an einzelnen Hinweisen oder Einzelchats pro Episode.

Bei Serien erfolgt zuerst Gesamtplanung aus den zulässigen Informationen aller ausgewählten Rätsel samt fester Reihenfolge. Danach werden die Episoden mit ihrem eigenen Rätsel und dem gemeinsamen Erzählkontext verfasst. Für F02-A/2 darf diese Planung im Produktionschat erfolgen; ein automatisierter Geschichtenplaner wird nicht vorausgesetzt.

Erzählerische Verbindungen sind zulässig. Logische Abhängigkeiten zwischen Rätseln sind ausgeschlossen: keine nötige frühere Lösung, Route, geheim gehaltene Erkenntnis oder Hinweisübertragung. Jedes Rätsel ist eigenständig lösbar. Ein gemeinsames Thema darf nicht zur Behauptung zusätzlicher Anlegepunkte oder Besuche führen.

## P10 – Erwartetes Ergebnis

Für jedes beauftragte Rätsel wird ein vollständiger Flavor-Draft mit folgenden fachlichen Inhalten zurückgegeben:

| Inhalt | Anforderung |
|---|---|
| Zuordnung | Eindeutige Referenz auf Auftrag, Rätsel und zugehörigen Kartenstand gemäß geprüftem Vertrag |
| Titel | Zur Episode passend, ohne Lösungsinformation |
| Einleitung | Erzählerischer Rahmen in frei gewählter Form und Länge |
| Hinweise | Exakt eine vollständige Textfassung je vorhandener Hinweis-ID |
| Metadaten | Kompakte Erzählform, Themen, verwendete Weltmotive und neue Weltbestandteile |

Die eigentliche Spielaufgabe, Regeln, Kartenobjekte und Namen werden nicht generiert. Ein Auflösungstext ist nicht Bestandteil. Auch eigene Qualitätsbewertungen des Modells ersetzen keine unabhängigen Nachweise.

Das konkrete maschinenlesbare Format, Pflichtfelder und die Form von Problemmeldungen sind vor der ersten Produktion an F01 festzulegen. Diese Liste ist ein vollständiger fachlicher Inhaltsvertrag, kein paralleles neues JSON-Schema. Ein unvollständiges Ergebnis darf nicht stillschweigend als vollständiger Batch gelten.

## P11 – Herkunft und Paketbindung

Bewahre für den Auftrag Auswahl, Reihenfolge, redaktionelles Ziel, Kontext und Paketidentität/-version. Bewahre für den Durchlauf tatsächliche Eingaben, Promptfassung, Produktionszeitpunkt und Modell soweit bekannt. Unbekannte Angaben werden als unbekannt behandelt, nicht geraten.

Die drei Inhaltsdateien sind gemeinsam versioniert. Der verwendete Stand ist reproduzierbar zuzuordnen; ein neuer Paketstand schreibt alte Produktionsnachweise nicht um. Ein Modellwechsel benötigt keine neue fachliche Pipeline. Deterministische Exportierbarkeit bedeutet nicht, dass kreative Ausgaben bitgleich reproduziert werden müssen.

## P12 – Import und deterministische Prüfungen

Der spätere Import prüft maschinell Format, Referenzen, Vollständigkeit und die 1:1-Abdeckung. Er ordnet Ergebnisse dem richtigen Auftrag, Rätsel und Kartenstand zu und persistiert Drafts samt Herkunft. Er mutiert keine Karte und keine Rätseldefinition.

Fehlende/doppelte/fremde Hinweisreferenzen, falsche Rätsel- oder Kartenreferenzen und unzulässige strukturelle Änderungen sind zu erkennen. Verhalten bei Wiederholungsimport, Teilfehlern und Abbruch sowie eine sichere Behandlung früherer Fassungen werden im Workchat konkretisiert. Es darf keinen unbemerkten Datenverlust oder unbemerkte Überschreibung geben.

Diese deterministischen Prüfungen beweisen keine Bedeutungsidentität freier Sprache. Der erfolgreiche Import führt nur zu einem strukturell akzeptierten, semantisch noch ungeprüften Draft.

## P13 – Varianten, Revisionen und Qualitätsnachweise

Eine andere Geschichte zum selben Rätsel ist eine neue Flavor-Variante. Eine Korrektur oder Verbesserung derselben Geschichte ist eine neue Revision. Frühere Fassungen und ihre Herkunft bleiben nachvollziehbar. Eine aktuell ausgewählte Fassung muss bestimmbar sein; es wird keine Versionsverwaltung im Spielerfrontend verlangt.

Qualitätsprüfungen, Findings, Reparaturbezüge und Freigaben werden getrennt gespeichert und müssen erkennen lassen, welche konkrete Fassung sie betreffen. Eine Reparatur darf nicht den Anschein erwecken, ein früheres Prüfergebnis gelte automatisch auch für den neuen Text. Die technische Abbildung wird an den F01-Verträgen geprüft.

## P14 – Grenzen zwischen Produktion, Qualität und Veröffentlichung

F02-A/2: strukturell vollständiger/importierbarer Draft mit Herkunft und Anschluss für spätere Prüfung.

F02-B: unabhängige semantische Prüfung freier Texte, Findings, gezielte Reparaturen, erneute Prüfung und wiederaufnehmbare Qualitätsverarbeitung.

Veröffentlichung: gesonderte redaktionelle Freigabe einer konkreten Flavor-Fassung. Produktion, semantisches Bestehen und Veröffentlichung werden nicht gleichgesetzt. Die genannten Begriffe sind fachliche Zustände und keine Anordnung neuer technischer Statuswerte.

## P15 – Verbindlicher Erprobungsumfang

Erster realer Pilot nach technischer Vorbereitung: ein Batch mit **vier eigenständigen Episoden**, je eine zu **C-06, C-02, C-03 und C-11**. Nicht zwei Durchläufe und nicht acht Rohfassungen. Anschließend gemeinsame Qualitätsanalyse und gegebenenfalls Fortschreibung des Pakets.

Späterer vollständiger Betatest: **zehn unterschiedliche Einzelgeschichten plus eine fünfteilige Geschichte** auf den 15 vorhandenen Rätseln. Konkrete Fallzuordnung und Reihenfolge werden vor diesem Auftrag bestimmt. Titel mit Teilnummern genügen zunächst. Der Projektverantwortliche liest alle vollständigen Texte; diese Kalibrierung ist keine dauerhafte Vorgabe menschlicher Einzelredaktion.

## P16 – Nicht Bestandteil von F02-A/2

Keine automatische API-Anbindung, unbeaufsichtigte Massenproduktion, vollständige Qualitäts- und Reparaturpipeline, automatische Serienplanung oder Diversitätssteuerung, neue Kalender-/Paketverwaltung, neue Schwierigkeitseinstufung, Auflösungsgeschichte, neue Seriennavigation, vollständige Podcastauswertung oder integrierte GenAI-Generierung von Rätsel, Asset und Geschichte. Diese Vorhaben bleiben separat und sind keine Voraussetzung für den Pilot.
