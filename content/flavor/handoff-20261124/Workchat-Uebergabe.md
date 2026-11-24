# Übergabeauftrag für den bestehenden Workchat – F02-A/2

Stand: 24. November 2026 · Projekt: roquas/Sams-Gezeitenkarten

## Auftrag und erwartetes Ergebnis

Prüfe auf Grundlage dieses vollständigen Übergabepakets **lesend** das aktuelle Repository und bereite anschließend den konkreten, eigenständig ausführbaren Codex-Implementierungsauftrag für **F02-A/2 – Welt-/Stilpaket und GenAI-Textproduktion** vor. Dieser Auftrag endet bei einem belegten Prüfbericht und einem fertigen Auftragsentwurf. **Jetzt keine Implementierung, keine Repositoryänderung, kein PR, kein Merge und keine Veröffentlichung.** Keine Nachrichten an weitere Chats oder Dienste versenden.

Die fachliche Konzeption ist abgeschlossen. Rekonstruiere sie nicht erneut aus vielen Chats und öffne keine bereits entschiedenen Grundsatzfragen. Kläre technische Anschlussfragen anhand des aktuellen Codes. Falls eine fachlich erhebliche Unvereinbarkeit bleibt, dokumentiere den konkreten Konflikt und seine Folgen. Routineentscheidungen zur Vorbereitung können selbstständig ausgearbeitet werden.

## 1. Mitgelieferte Grundlagen

- `F02-A-2-Konzept.md`: konsolidiertes fachliches Soll, Abgrenzungen, Pilot und späterer Betatest.
- `welt-stilpaket-v1/world.md`, `style.md`, `production.md`, `manifest.json`: ein gemeinsam versioniertes Welt-/Stilpaket v1 als Entwurf. Es enthält sämtliche 15 U-Ergänzungen.
- `Quellen-und-Entscheidungsstatus.md`: Herkunft und Grenzen, Abgleich E01–E31, ersetzte Zwischenentscheidungen.
- `referenzen/ploetzlich-piratin-stil-und-weltreferenz.md`: unveränderte ursprüngliche Recherche. Sie bleibt Quellenmaterial und ist keine vollständig gehörte Serienbibel.

Der Entwurf enthält noch keine echten Episoden und kein geprüftes F01-Ausgabeschema. Paketdateien und Manifest sind Übergabeartefakte, keine bereits in das Repository integrierte Vertragsimplementierung.

Konzeptionsquelle: [F02-A Konzeptentwicklung](https://chatgpt.com/c/6b059203-5090-83eb-911b-745316182b27). Dieser Übergabeauftrag enthält alle für die nächste Arbeit wesentlichen fachlichen Vorgaben und ist ohne Zugriff auf den Chat verständlich.

## 2. Technischer Ausgangspunkt – gezielt verifizieren

Repository: [roquas/Sams-Gezeitenkarten](https://github.com/roquas/Sams-Gezeitenkarten).

Als Ausgangsbasis berichtet wurden:

| Bereich | Suchanker / berichteter Stand |
|---|---|
| F01 | PR #124 integriert; Requests, Drafts, Prüfungen und Checkpoints |
| F01-Verträge | `scripts/lib/flavor-contract.mjs` |
| F01-Dokumentation | `docs/FLAVOR-PIPELINE-F01.md` |
| F02-A erster Schritt | [PR #129](https://github.com/roquas/Sams-Gezeitenkarten/pull/129), unabhängig geprüft und korrigiert |
| Kartenbibliothek | `docs/FLAVOR-CARD-LIBRARY-F02-A.md`; persistente bebilderte/benannte Karten und eigene Ausgestaltungsidentität |
| Namen | 23 Motivpools mit je 20 Namen; ausdrückliche Assetzuordnungen; Tesoro fest an `world.tesoro`; Weltortreservierung unabhängig von Pools |
| Pilotmaterial | C-06, C-02, C-03 und C-11 als vorbereitete Anschlussfälle |

Bestätige aktuelle Branch-/Commitbasis, Merge- und CI-Stand von PR #129 sowie den tatsächlich verfügbaren Stand auf main. Prüfe die Inhalte, nicht nur PR-Titel oder frühere Chatberichte. Historische Hashes aus dem Konzeptionschat sind keine aktuelle Arbeitsbasis. Verweise im Ergebnis auf reale Pfade und konkrete Code-/Testbelege. Falls ein genannter Pfad inzwischen anders heißt, nenne den gefundenen Anschluss.

## 3. Fachliches Soll, das erhalten bleiben muss

### Identität und Reihenfolge

Eine ausgestaltete Karte enthält Geometrie, Assets, Objekt-IDs und Namen, aber keinen festgelegten Startpunkt. Fachlich muss mindestens ein befahrbares Ein-Hex-Motiv als möglicher Start vorhanden sein. Das Rätsel bindet eine Karte an konkreten Start, Route und mathematische Hinweise. Flavor bindet die Erzählfassung an das Rätsel.

Gleiche Karte → gleiche Namen; unterschiedliche Rätsel können unterschiedliche Startorte und Geschichten haben. Dasselbe Rätsel kann mehrere Geschichten erhalten. Flavorisierung ändert weder Karte noch Rätsel, Assets, Namen, Start, Auswahl oder Reihenfolge. Sie löst keine neue Generierung aus und wählt keine Assets nach Thema oder Hinweis aus.

### Informationsgrenze

Die GenAI kennt die vollständige öffentliche ausgestaltete Karte, sämtliche Kartennamen, den öffentlich bekannten rätselspezifischen Startpunkt samt Objektname, alle öffentlichen Hinweise und Regeln sowie Welt-/Stilpaket und redaktionellen Auftrag.

Sie erhält **keine Zielroute, geheime Zielposition, privaten Zusatzhinweise, Solver-Ergebnisse oder Lösungsprotokolle**. Das gilt auch für Gesamtplanung, Anhänge, Metadaten und anderweitig zugängliche Quellen. Ein separater Produktionschat mit geprüftem Export ist für den Pilot vorgesehen; ein unbeschränkter Repositoryagent ist nicht durch bloßes Nichtlesegebot isoliert.

### Texte und Semantik

Generiert werden Titel, Einleitung und genau eine vollständige Formulierung je mathematischer Hinweis-ID. Keine Zusammenfassung, Aufteilung, Auslassung oder Neuerfindung von Hinweisen. Notwendige Angaben wandern nicht in den Rahmen. Regeln und eigentliche Aufgabe kommen aus dem Spiel; kein Auflösungstext.

Alle Werte, Quantoren, Negationen und Bezugsobjekte bleiben semantisch unverändert. Nutze die echte Engine-Semantik; illustrative Distanzsätze der Recherche sind keine Regeldefinition. Rahmen, Titel und Ausschmückung dürfen keine expliziten oder impliziten Zusatzhinweise erzeugen.

Startorte dürfen erzählerisch zentral sein. Weitere Kartenorte nur entsprechend ihrem öffentlichen Hinweisbezug: Nähe ist kein Besuch; Ausschluss ist kein Aufenthalt; ohne Hinweisbezug keine eigene Verwendung als Kartenort. Die Relevanz darf nicht aus der privaten Lösung abgeleitet werden. Zunächst wird keine neue Klassifikationsengine verlangt.

### Erzählfreiheit

Verschiedene persönliche und funktionale Aufzeichnungen; Sams Tagebuch wiederkehrend, nicht verpflichtend. Freie Textlänge und Form, keine Mindestlänge, kein Pflichtaufbau, keine Pflichtpointe, keine Quoten und keine erzwungene durchgehende Handlung in den Hinweisen. Absurde und neue Weltideen sind ausdrücklich erlaubt. Neue Episodenerfindungen bleiben [N], bis sie bewusst redaktionell übernommen werden.

### Paket und Produktionsweg

`world.md` hält Namen und Konzepte gemeinsam; `style.md` enthält Erzählregeln; `production.md` fachliche Grenzen; `manifest.json` eine gemeinsame Paketidentität/-version. Das ganze Paket darf im Auftrag mitgegeben werden. Keine Ontologie, Datenbank oder Vektorsuche erforderlich. Die ursprüngliche Recherche bleibt erhalten.

Ein deterministischer Export → manuelle Übergabe des Gesamtpakets an ChatGPT/Codex → GenAI-Produktion in vereinbartem maschinenlesbarem Format → deterministischer gesammelter Import und Persistenz. Kein Chat und keine manuelle Hinweisübertragung je Rätsel. Eine spätere API ersetzt die GenAI-Stufe ohne neue grundlegende Pipeline.

### Serien und spätere Anwendungen

Rätsel werden vorgelagert ohne Flavor erzeugt, qualifiziert, ausgewählt und geordnet. Aufträge können frei, bewusst vielfältig, thematisch oder zusammenhängend sein. Serienplanung kennt vor Beginn alle ausgewählten öffentlichen Rätseldaten und die feste Reihenfolge. Die Geschichte passt sich an vorhandene Karten an. Erzählerische Abhängigkeiten sind zulässig; logische Abhängigkeiten oder nötige frühere Lösungen sind ausgeschlossen.

### Herkunft, Varianten, Revisionen und Status

Bewahre Auftrag/Auswahl/Reihenfolge, redaktionellen Kontext und Paketstand; tatsächliche Eingaben, Promptfassung, Zeitpunkt und Modell soweit bekannt; Draft und schlanke erzählerische Metadaten. Modell-Selbstauskünfte sind keine unabhängigen Prüfnachweise.

Neue Geschichte zum selben Rätsel = neue Flavor-Variante. Korrektur derselben Geschichte = neue Flavor-Revision, mit nachvollziehbarem Vorgänger statt unbemerktem Überschreiben. Eine aktuell ausgewählte Fassung muss bestimmbar bleiben; keine neue Versionsoberfläche für Spielende.

Strukturell importiert bedeutet semantisch ungeprüft. Semantisches Bestehen und Veröffentlichungsfreigabe bleiben getrennt. Qualitätsnachweise beziehen sich auf die tatsächlich geprüfte Fassung. Nutze vorhandene F01-Status-/Prüfmodelle, soweit sie das fachlich tragen; erfinde nicht ohne Prüfung zusätzliche Statuswerte.

## 4. Besondere Prüfung: Startort und vollständige Namen

Im Konzeptionschat wurde folgender Konflikt als bestehend berichtet:

1. Die Kartenbibliothek speichert alle Ortsnamen.
2. F01 entfernt im Draft den Namen des starttragenden Objekts.
3. Die Beta-Präsentation verlangt Namen für alle Objekte.

Die abschließende fachliche Entscheidung ist: **Der rätselbezogene Produktionsauftrag kennt Startpunkt und Startobjektname.** Die Karte selbst bleibt startunabhängig.

Untersuche deshalb Ursprung, Geltungsbereich und Schutzfunktion der F01-Ausblendung. Prüfe getrennt Karte, Request, Draft und Präsentation. Die frühen Empfehlungen „Startnamen weiter ausblenden“ und „F01 muss sicher direkt geändert werden“ sind beide durch den späteren Klärungsauftrag ersetzt. Entscheide anhand des Codes, ob bestehende Projektionen ausreichen oder eine gezielte Vertragsanpassung nötig ist.

Beschreibe eine konkrete Anschlusslösung samt betroffenen Pfaden, Regressionen und Tests. Erhalte insbesondere den Ausschluss privaten Lösungswissens sowie die Vollständigkeit der karteneigenen Namen. Keine beiläufige Abschwächung vorhandener Schutzgarantien und keine Einführung eines festen Kartenstarts als Umgehung.

## 5. Weitere gezielte Repositoryprüfungen

| Prüfung | Erwartete Antwort |
|---|---|
| Vorhandene F01-Verträge | Welche Requests/Drafts/Prüfungen/Checkpoints sind direkt verwendbar? Welche Lücken bleiben? |
| Karten-/Rätselreferenzen | Wie werden unveränderte ausgestaltete Karte, konkreter Start und stabiler Hinweisbestand verbunden? |
| Öffentlicher Export | Welche Projektion enthält alle benötigten öffentlichen Daten und schließt private Lösungsinformationen tatsächlich aus? |
| Regelbeschreibung | Woher kommen verbindliche öffentliche Zeit-/Bewegungs-/Distanzdefinitionen für das Modell? |
| Maschinelles Ergebnisformat | Wie lassen sich Titel, Einleitung, vollständige Hinweis-ID-Abdeckung und schlanke Metadaten im bestehenden Vertrag abbilden? |
| Batch-Verhalten | Wie sind Reihenfolge, Fallabdeckung, Fehlermeldungen, Teilfehler und Wiederholungsimport zu behandeln? |
| Persistenz/Herkunft | Wo werden Aufträge, tatsächliche Eingaben, Promptfassung, Paketstand, Durchläufe und Drafts unverwechselbar abgelegt? |
| Varianten/Revisionen | Welche Identitäten bestehen bereits, wie werden Vorgänger und ausgewählte Fassung ohne Datenverlust abgebildet? |
| Qualitätsnachweise | Wie bleiben Prüfungen und Freigaben an der richtigen Revision und von bloßer Produktion getrennt? |
| Beta-Anschluss | Wie gelangt eine später freigegebene Fassung in den bestehenden 15-Fälle-Katalog, ohne vorschnelle Freigabe oder neue Serien-UI? |
| F02-B-Anschluss | Welche späteren Prüf-/Reparatur-/Wiederaufnahmeübergaben müssen jetzt vorbereitet werden, welche existieren bereits? |

Prüfe dabei auch bestehende Regeln für Dokumentationsorte, Paketversionierung und Quellenmaterial. Die im Übergabemanifest gewählte Bezeichnung ist kein Beleg eines schon vorhandenen Repository-Schemas. Passe den späteren Integrationsvorschlag an echte Konventionen an, ohne den vereinbarten fachlichen Inhalt zu verlieren.

## 6. Prüfstrategie für den späteren Codex-Auftrag

Leite aus realen Verträgen eine angemessene Validierung ab. Mindestens abzudecken sind:

- Vollständiger Export und Import der vier echten Anschlussfälle; eindeutige Referenzen und 1:1-Hinweisabdeckung.
- Negativfälle für fehlende, doppelte und fremde Hinweise sowie falsche Rätsel-/Kartenreferenzen und strukturelle Mutationsversuche.
- Öffentlicher Startname bleibt verfügbar; private Zielroute, geheimes Ziel und Lösungsdaten gelangen nicht in den Produktionskontext. Prüfe die tatsächliche Projektion, nicht nur einen Prompttext.
- Karte und Rätsel bleiben unverändert; Wiederverwendung einer Karte mit verschiedenen Rätselstarts bleibt möglich.
- Herkunft und Paketversion sind nachvollziehbar; Varianten/Revisionen werden korrekt unterschieden, ältere Fassungen nicht unbemerkt überschrieben.
- Wiederholungsimport, Teilfehler und Abbruch haben ein ausdrücklich festgelegtes, verlustfreies Verhalten.
- Ein importierter Draft erhält weder semantischen Bestehensnachweis noch Veröffentlichungsfreigabe automatisch.

Diese Liste ist Prüfbedarf für die spätere Implementierung. Führe jetzt keine schreibenden Produktions-, Generierungs-, Import- oder Migrationsläufe aus. Rein lesende Bestandsprüfung ist der aktuelle Auftrag. Nenne im vorbereiteten Codex-Auftrag die tatsächlich gefundenen passenden Prüfkommandos; erfinde keine Kommandos oder behaupteten Testergebnisse.

## 7. Pilot, Qualitätsanalyse und späterer Betatest

Nach F02-A/2 folgt **ein** realer Produktionsauftrag mit **vier** Einzelgeschichten zu **C-06, C-02, C-03 und C-11**. Keine acht Rohfassungen und kein zweiter Serienlauf mit denselben vier Fällen. Die Texte werden in einem separaten Produktionschat aus dem geprüften Export erzeugt; die technische Vorbereitung produziert sie noch nicht.

Danach gemeinsame Analyse von Rätselsemantik, Spielerinterpretation und Erzählqualität. Diese Erfahrungen verbessern das Paket und konkretisieren F02-B.

Der spätere vollständige Betatest verwendet **15 bestehende Rätsel**: zehn bewusst unterschiedliche Einzelgeschichten und eine Geschichte aus fünf eigenständig lösbaren Teilen. Welche Fälle zur Serie gehören und in welcher Reihenfolge, ist noch festzulegen. Titel wie „… – Teil 3“ genügen; keine neue Seriennavigation erforderlich. Der Projektverantwortliche liest sämtliche vollständigen Texte. Eine Bierraten-Serie ist ein Beispiel, noch kein festgelegter Themenauftrag.

## 8. Abgrenzung des zu entwerfenden Implementierungsauftrags

F02-A/2 umfasst den vollständigen Produktionsmechanismus mit Paketintegration, öffentlichem Export, modellunabhängigem Ergebnisvertrag, deterministischen Struktur-/Referenzprüfungen, Import/Persistenz, Herkunft sowie den erforderlichen Übergaben für spätere Prüfung und Revision.

F02-B bleibt ein gesonderter Schritt: unabhängige semantische Prüfung freier Texte, gezielte Reparatur, erneute Prüfung und wiederaufnehmbare Qualitätsverarbeitung. F02-A/2 implementiert nicht bereits diese gesamte Pipeline.

Nicht zusätzlich beauftragt sind API-Anbindung, unbeaufsichtigte Massenproduktion, automatische Geschichtenplanung oder Diversitätssteuerung, Kalender-/Paketverwaltung, neue Schwierigkeitseinstufung, neue Rätsel/Assets/Namen, Auflösungstexte, umfassende Podcastauswertung oder integrierte Generierung von Karte, Rätsel und Geschichte.

## 9. Geforderte Ausgabe des Workchats

Liefere zwei klar unterscheidbare Ergebnisse:

1. **Belegter Repository-Prüfbericht:** aktuelle Basis und PR-Status; bestätigte Anschlüsse; konkrete Abweichungen vom berichteten Stand; Startortlösung; Zuordnung fachlicher Anforderungen zu vorhandenen Verträgen; notwendige Erweiterungen; verbleibende echte offene Punkte. Trenne Fakten, Empfehlungen und ungeprüfte Annahmen.
2. **Fertiger Codex-Auftrag als Entwurf:** Ausgangsbasis, Zielverhalten, betroffene reale Pfade, wiederzuverwendende Verträge, notwendige eng begrenzte Anpassungen, zulässige Daten, Ausgabe/Persistenz, Fehlerverhalten, Prüfungen und Abnahmekriterien. Der Auftrag muss ohne Rückgriff auf den Konzeptionschat verständlich sein und den vierteiligen Einzelpilot sowie den späteren 10+5-Test korrekt einordnen.

Schließe mit dem genauen nächsten auszuführenden Schritt und den gegebenenfalls noch benötigten fachlichen Entscheidungen. Behaupte keine Implementierung oder Freigabe. In diesem Arbeitsschritt bleibt das Repository unverändert.
