# B1: Implementierung und Abnahme

## Architektur und Schnittstellen

Eigenständiger Branch `codex/b1-beta-landing`, Ausgangspunkt `main` bei
`545d7f3591c0572204b7d24f662d72118161c6fe` (PR #113). Vor Abschluss konfliktfrei
auf den inzwischen aktuellen `main` bei
`974931e95d434a35ce34094f4d5244e289d6fd76` (gemergtes S04-A, PR #112)
rebasiert. Dessen Diagnose- und Beobachtungsdateien bleiben unverändert erhalten.
Keine Übernahme ungemergter Feature-Branches. Die parallel bearbeitete A2b-Arbeitskopie wurde nicht verändert.

- `src/ui/app.mjs`: Einstieg in Landingpage oder bestehendes Spiel anhand der URL.
- `src/beta/context.mjs`: Bestand, Direktlinks und unveränderter Katalogloader;
  Transportadapter bewahrt öffentliche F02-Identitäten ohne zusätzlichen Request.
- `src/beta/storage.mjs`: separate Betatestdaten, Phasen, Feedback, Exportprojektion.
- `src/beta/clock.mjs`, `session.mjs`: monotone Näherungszeit und exklusive Tab-Sperre.
- `src/beta/feedback.mjs`, `result-dialog.mjs`: gemeinsames freiwilliges Formular,
  Ergebnisdialog, Fokusführung, unabhängig optionale Ergebnistexte.
- `src/beta/local-storage.mjs`, `export.mjs`: ehrliche Speicherhinweise und Download,
  einschließlich eines Notfallexports direkt im Spiel.
- `src/beta/landing.mjs`, `beta.css`: schlanke Auswahl, allgemeines Feedback,
  Rückmeldungsverwaltung und vollständige, direkt sichtbare Regeln.
- `index.html`: unveränderte gemeinsame Regelquelle und bestehende vollständige
  Seitenleiste; zusätzliche Auswahl-Navigation und kleine Zeitsteuerung.
- `src/ui/cell-registry.mjs`: Listen und Lookup werden beim Wechsel gemeinsam
  erneuert. Das derzeitige Schema erzwingt ohnehin 5×5; zusätzlich werden Start,
  Sperrfelder und getrennte Notizen beim Wechsel im Browser geprüft.

Engine, Solver, Generator, Hinweissemantik, Kartenrenderer, Kartenwerkzeuge,
Ortsdarstellung, Schemas und `src/persistence/storage.mjs` bleiben unverändert.
Der Bytevertrag von `src/puzzles/loader.mjs` bleibt ebenfalls erhalten. B1 enthält
weder neue Rätsel noch redaktionelle Flavortexte.

Das statische Paket wird weiterhin mit `scripts/package.py` erstellt. Statische
ESM-Imports halten dessen vorhandene Abhängigkeitssammlung vollständig; die
Auslieferung enthält weiterhin `.js` statt `.mjs`. Die Warteschlange der lokalen
Testserver wurde für parallele Modulanforderungen vergrößert. Kein neuer
Produktionsserver und keine neue Laufzeitabhängigkeit.

Datenstruktur, Deduplication, Versionsregeln und Zeitmessgrenzen stehen in
[Betatest-Dokumentation](BETA-FEEDBACK.md).

## Nutzerabläufe

Die Startseite zeigt den tatsächlichen Katalog mit Neu/Begonnen/Gelöst und
Beginnen/Fortsetzen/Erneut spielen. Schwierigkeit bleibt vor einer Bewertung
verborgen. Nach dem Laden kann man jederzeit zur Auswahl zurückkehren. Route,
Notizen und vorhandene Spielhilfen werden mit dem bestehenden Speicher gesichert.
Ein gewöhnlicher Wechsel ist keine Aufgabe.

Die vorhandene Routenprüfung liefert einmalig das Ergebnis an den Dialog.
Falsch: „Leider falsch“, neutraler Text, weiterspielen. Richtig: sichtbarer Erfolg,
Strafpunkte, freiwilliges Feedback speichern oder überspringen. Der Lösungsnachweis
bleibt unabhängig von Feedback, Reset oder erneutem Spielen erhalten.

Auf der Landingpage sind Rückmeldungen auch zu ungelösten oder noch nicht
begonnenen Rätseln möglich. Ein allgemeiner Kommentar ist unabhängig davon
editierbar und exportierbar. Änderungen dort speichern automatisch, soweit
Browserspeicherung verfügbar ist. Der Export enthält alle gespeicherten Revisionen,
auch für entfernte Manifesteinträge, aber keine Lösungsrouten.

## Automatisierte Prüfungen

Tatsächliche lokale Ergebnisse (20.11.2026):

| Prüfung | Ergebnis |
| --- | --- |
| B1-Matrix: Chromium/WebKit, Desktop/Mobil | **60/60 bestanden** |
| Zusätzlicher Nachlauf: Fortsetzen nach Aufgabe und während Wiederholung | **8/8 bestanden** |
| Mehrtab-/Notfallexport-Randfälle, vier Browserprofile | **8/8 bestanden** |
| Engine- und Integrationstests (`tests/engine`, `tests/integration`) | **137/137 bestanden** |
| Loader, historische B2-positive/V2-Nachweise und Betatestverträge | **22/22 bestanden** |
| Nach Rebase: zusätzlich S04-A-Etappendiagnose und Spielbeobachtungen, zusammen mit Loader/B2/Beta | **40/40 bestanden** |
| Inhaltsprüfungen | **20/20 bestanden** |
| Regulärer Rätselkatalog | **1/1 eindeutig**, vorhandener Bestand |
| Bestehende Karten-/Spielregressionen, Chromium und Mobil | **169 bestanden**; ein 320-px-Setup-Timeout; isolierter Nachlauf **1/1 bestanden** |
| Echtes Deployment-ZIP unter `/gk/pr38/`, Desktop/Smartphone/iPhone/iPad | **43 bestanden** im Hauptlauf, ein Notiz-/Radar-Timeout; Nachlauf dieses Falls und der Paket-Landingpage **8/8 bestanden** |
| Vorhandener statischer Paketierer | Erfolgreich, **122 Laufzeitdateien**, verpflichtende Bildvalidierung bestanden |
| HTTP-No-Cache-Selbsttest | Bestanden |
| `git diff --check` | Bestanden |

Die Setup-/Browser-Timeouts werden nicht als erfolgreiche Erstläufe ausgegeben.
Die betroffenen Assertions blieben erhalten und wurden gezielt erneut ausgeführt.
Die letzten reinen Textänderungen im ZIP verwenden dasselbe validierte
Ressourceninventar und dieselbe vorhandene `.mjs`→`.js`-Transformation; Bildbytes
wurden dabei nicht verändert. Vor endgültiger Auslieferung mit dem normalen
Paketierer frisch bauen.

Der zusätzlich gestartete vollständige `npm run test:unit`-Lauf mit sämtlichen
bildintensiven Archiv-/Katalogprüfungen wurde nach über 25 Minuten beendet und
wird **nicht** als bestanden gewertet. Die separat vollständig ausgeführten
137 Engine-/Integrationstests und 22 Vertragsprüfungen sind oben ausgewiesen.
Die vollständige CI-Prüfung bleibt für die Merge-Abnahme erforderlich. Es wurde
keine Freigabe oder Merge vorgenommen.

Die neue Browsermatrix `npm run test:beta` umfasst Chromium und WebKit, jeweils
Desktop und Mobil, einschließlich Direktlink, zweitem kontrolliertem Katalogeintrag,
Spielstandswechsel, Modalfokus, Erfolg/Falschantwort, Editieren, Aufgabe, Zeit,
Reload, Hintergrund, Pause, Mehrtabbetrieb, Revisionen, entfernten Rätseln,
Speicherfehlern, allgemeinem Feedback und Exporten ohne/einer/mehreren Rückmeldungen.

Die Tests erfinden keine spielbaren Produktionsrätsel: zusätzliche Katalogeinträge
werden ausschließlich als isolierte Transport-Fixtures im Test abgefangen.
Bestehende Spieltests verwenden nun ausdrücklich `?play=1`; ihre fachlichen
Prüfungen bleiben erhalten. Nach einer korrekten Prüfung schließt der bestehende
Integrationstest den neuen Dialog, bevor er die Karte weiterbedient.

## Grenzen und offene Ausgestaltung

- Der reguläre Bestand besteht derzeit aus genau einem technischen Demo-Rätsel.
  Ein kuratierter Bestand von 10–20 redaktionell freigegebenen Rätseln ist keine
  Voraussetzung dieser Infrastruktur und wird hier nicht erfunden.
- Zeit bleibt eine Näherung: 15-Minuten-Heuristik, manuelle Pause, Hintergrundpause,
  keine Nachzählung langer Gerätepausen, möglicher Verlust der letzten fünf
  Sekunden bei einem abrupten Prozessabbruch. Ohne Web Locks wird die fehlende
  Messung sichtbar ausgewiesen.
- Ohne funktionierende Browserspeicherung sind die aktuelle Seite und ihr Export
  verfügbar; Reload-Persistenz oder eine dauerhafte Testkennung sind dann technisch
  nicht zusicherbar.
- Ohne Veröffentlichungs-ID erfordern redaktionelle Revisionen eine neue
  `dataVersion`. Unversionierte Änderungen können ohne konkurrierende Hashlogik
  nicht erkannt werden. Der bestehende Spielstandschlüssel wird nicht migriert.
- Animationen, neue Illustrationen und redaktionelle Ergebnistexte aus Issue #35
  bleiben ausdrücklich späterer Arbeit vorbehalten. Beide Ergebnistextfelder und
  neutrale Fallbacks werden bereits unterstützt.
- WebKit mit iPhone-/iPad-Viewports ist eine automatisierte Browserprüfung;
  VoiceOver, echte Bildschirmtastatur und gerätespezifische Downloadbedienung
  sollten zusätzlich auf realen Geräten geprüft werden.

## B2 und A2b: Überschneidungen und Rebase-Risiken

B2: `src/ui/game.mjs` enthält weiterhin die bestehenden Entwicklungsbestände und
Auswahlzweige. Änderungen an Bestandnamen oder der Auswahl müssen mit
`src/beta/context.mjs` abgestimmt werden. Die historischen B2-Nachweise pinnen
unter anderem den Loader; dieser bleibt deshalb unverändert. Keine Änderung an
Solver, Generator oder Diagnoseformaten.

A2b: größtes textuelles Konfliktrisiko ist `src/ui/game.mjs` bei Imports,
Aktivierung/Wechsel und Routenprüfung. Die A2b-Ergänzungen für Ortsbezüge und
`bordbook` müssen beim Rebase erhalten bleiben. B1 verändert weder `map.mjs`,
`toolbar.mjs`, `bordbook.mjs`, `place-labels.mjs` noch vorhandene UI-CSS-Dateien.
Bei Tests können die mechanisch geänderten Einstiegs-URLs dieselben Dateien
berühren wie A2b. Alle A2b-Assertions erhalten, lediglich Einstieg und neues
Dialogschließen zusammenführen. `index.html` kann bei paralleler Navigation oder
Ortsbuttons einen kleinen Integrationskonflikt haben.

Nach einem Rebase Katalogwechsel, Notizen, Ortsbezüge, falsche/korrekte Prüfung,
mobile Logbuchnavigation und statischen Unterverzeichnisbetrieb erneut prüfen.
Kein automatischer Merge oder eigenständige Freigabe.

## Manuelle Abnahme am Desktop

1. Lokal mit `python3 scripts/dev-server.py --port 8000` starten. Ohne Query die
   Startseite öffnen. Titel, Auswahl, Feedback und direkt lesbare Regeln nach unten
   kontrollieren. Nur „Die Probefahrt“ darf im regulären Bestand erscheinen.
2. Ein allgemeines Feedback eingeben, neu laden, JSON exportieren. Der Kommentar
   bleibt erhalten; ohne Spielen ist `puzzles` leer. Dieselbe lokale Testkennung
   muss in späteren Exporten wiederkehren.
3. „Beginnen“ wählen. Notizen auf A1 setzen, Logbuch öffnen und Geschichte, Regeln,
   Hinweise, Hilfen und Einstellungen prüfen. Zur Auswahl zurück, „Fortsetzen“ und
   Reload: Die Notiz muss erhalten bleiben.
4. Routenwerkzeug wählen: A5 ist der Start, danach A4 → A3 → A2. Prüfen: „Leider
   falsch“, keine richtige Route. Tab/Shift+Tab, Escape und Schließen prüfen;
   Fokus kehrt zum Prüfbutton zurück.
5. Route zurücknehmen oder Spielstand zurücksetzen; dann B5 → C5 → D5 eintragen.
   Prüfen: Erfolg. Schwierigkeit, Fairness und Kommentar optional angeben. Einmal
   speichern, anschließend auch Überspringen/Escape separat prüfen.
6. Reset betätigen und zur Auswahl wechseln: Status bleibt „Gelöst“. Feedback
   nachtragen, reloaden und erneut exportieren. Rückmeldung und Lösungsnachweis
   bleiben erhalten; keine `route`- oder Notizdaten in der Datei.
7. „Spielstand ansehen“: keine neue Zeit. „Erneut spielen“: neue Phase, leerer
   Spielstand, altes Feedback als frühere Rückmeldung weiterhin vorhanden.
8. Manuell pausieren, warten, neu laden: Pause bleibt erhalten. Fortsetzen, anderen
   Tab öffnen oder Seite in den Hintergrund legen: keine doppelte oder
   Hintergrundzeit. Nach 15 Minuten ohne Eingabe die automatische Pause prüfen.
9. Ein offenes Rätsel als „Aufgegeben“ kennzeichnen. Gewöhnliches Verlassen darf
   diesen Status nicht setzen. Erneutes Fortsetzen legt eine neue Phase an und erhält Route und Notizen.
10. In einem separaten Testprofil Browserspeicherung sperren oder per DevTools
    `Storage.prototype.setItem` einen Quota-Fehler werfen lassen. Sichtbare Warnung
    und Notfallexport prüfen; die Oberfläche darf keine erfolgreiche Speicherung
    behaupten. Keine echten Feedbackdaten zum Testen löschen.
11. Das erstellte ZIP unter einem URL-Präfix ausliefern, etwa `/gk/pr38/`.
    Landingpage, `?puzzle=model-demo`, Reload, Rückkehr und JSON-Download prüfen.
    Optionalen B2-Bestand nur über dessen ausdrücklichen Entwicklungseinstieg öffnen.

## Manuelle Abnahme auf iPhone und iPad

1. Safari im Hoch- und Querformat öffnen; Startseite vollständig nach unten bis zu
   den Regeln scrollen. Kein horizontales Überlaufen. Beginnen, Feedback und Export
   müssen zuverlässig per Touch bedienbar sein.
2. Spielen, Seekarte/Logbuch wechseln, vorhandene Hinweise und Einstellungen lesen.
   Die bisherige Logbuchbedienung bleibt erhalten. Notizen setzen, zur Auswahl
   zurückkehren, reloaden und Fortschritt prüfen.
3. Falsche und korrekte Route wie oben prüfen. Dialog bei sichtbarer Bildschirmtastatur
   scrollen, Freitext bearbeiten und mit sichtbarer Schließenaktion beenden. Mit
   externer Tastatur Tab, Shift+Tab und Escape prüfen.
4. VoiceOver aktivieren: Auswahlstatus, Dialogtitel, Beschreibung, Formularlabels,
   Schließen und Rückgabe zum Prüfbutton nachvollziehen. Eine reduzierte
   Bewegungseinstellung darf keine Information entfernen.
5. App wechseln, Display sperren, wieder aktivieren und eine manuelle Pause über
   Reload prüfen. Lösungsstatus und Feedback müssen erhalten bleiben, sofern
   Safari die lokale Speicherung zulässt.
6. JSON exportieren, Safari-Download beziehungsweise Dateien-App öffnen und eine
   einzelne lesbare JSON-Datei kontrollieren. Export ohne Rätselbewertung und nur
   mit allgemeinem Kommentar separat ausprobieren. Die Datei wird ausschließlich
   durch die Testperson selbst weitergegeben.

## Gezielte Browser-CI-Korrektur: aktive Zeit nach Inaktivität

Ausgangspunkt ist PR-Head `10c4d86614558d3aede617a9e9cd5dac8181abc5`,
fehlgeschlagener Workflow
[44719546273](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/44719546273).
Dort bestanden zwölf Jobs; `browser` meldete 455 bestandene Tests, einen Skip,
einen fehlgeschlagenen Mobile-Chromium-Fall und denselben Desktop-Fall als flaky.

**Ursache: Synchronisationsproblem im Test.** Der Klick auf „Zeit fortsetzen“
fordert nach der automatischen Pause erneut die exklusive Web-Lock-Zuteilung an.
`page.clock.runFor(5000)` steuert JavaScript-Timer und die gemockten Uhren, wartet
aber nicht auf die native Lock-Antwort des Browsers. Im Fehlerfall liefen die fünf
virtuellen Sekunden vollständig vor dem Ownership-Callback ab. Die Produktuhr
zählte währenddessen korrekt nichts; beim Callback setzte sie ihren monotonen
Ausgangspunkt. Die ursprüngliche Assertion verlangte Fortschritt, bevor überhaupt
fünf aktive Sekunden unter Lock-Besitz stattgefunden hatten.

Instrumentierter Nachweis mit unveränderten Produktdateien, beispielhafter Lauf:

| Ereignis | `performance.now()` (ms) | kumulierte aktive Zeit (ms) |
| --- | ---: | ---: |
| Expliziter Fortsetzen-Klick | 950167 | 905001 |
| Native Lock-Anfrage | 950168 | 905001 |
| Native Zuteilung erst am Ende der virtuellen fünf Sekunden | 955168 | 905001 |
| Nächster Zeitschritt, ohne weiteren Klick | später | 909935 |

Die Phase blieb offen und `paused=false`. In zwölf instrumentierten Läufen
(sechs je Desktop/Mobil) trat der ausbleibende Fortschritt elfmal an der alten
Prüfstelle auf; im nächsten Zeitschritt stieg die Zeit in allen zwölf Läufen ohne
weitere Benutzeraktion. Im Vergleichslauf mit bestätigter Zuteilung vor dem
Vorspulen stieg sie in allen zwölf Läufen bereits am vorgesehenen Prüfpunkt.
Eine anfängliche unveränderte Zieltestserie hatte zehn erfolgreiche Läufe und
zwei Start-Timeouts; diese Startfehler sind kein Nachweis des CI-Zeitfehlers.

**Korrektur:** Ausschließlich `tests/browser/beta.spec.mjs` wartet nun nach
Sichtbarwerden, nach explizitem Fortsetzen aus Inaktivität und nach manueller
Wiederaufnahme beim Reload auf den bereits vorhandenen Status „Aktive Zeit läuft“.
Dieser wird von `session.mjs` erst nach gesetztem Lock-Besitz ausgegeben. Die
bestehenden Zeitfortschritts-Assertions bleiben erhalten. Keine festen Sleeps,
zusätzlichen Retries oder großzügigeren Zahlen-/Zeitgrenzen. Die 15-Minuten-Grenze,
Produktdateien, Web-Lock-Schutz, Speicherung und UI-Anbindung bleiben unverändert.

**Regression:** Ein zusätzlicher Browserfall verzögert gezielt die Zustellung der
nativen Lock-Zuteilung. Der reale exklusive Lock bleibt aktiv; nur sein Callback
zur Produktuhr wird durch eine explizite Testbarriere zurückgehalten. Der Test
prüft: `paused=false`, trotzdem keinerlei Zeit während des Wartens, anschließend
exakt 5000 ms zusätzliche aktive Zeit nach Zuteilung sowie denselben Wert im
JSON-Export. Die Interzeption liegt auf dem nativen Methodenprototyp und gilt
nur im isolierten Testkontext. Es gibt keine Produktinstrumentierung.

Lokale Nachweise ohne automatische Retries:

- B1-Unit-/Integrationstests: **12/12 bestanden**.
- Korrigierter CI-Fall und deterministischer Regressionstest: jeweils zehnmal
  in Chromium, Mobile-Chromium, WebKit und Mobile-WebKit; **80/80 bestanden**.
- Vollständige B1-Matrix: **63 bestanden**, ein Timeout im separaten
  Ergebnistext-Szenario; kein fehlgeschlagener Zeitmessungsfall.
- Vollständiger Browserlauf mit sämtlichen Dateien und beiden Chromium-Profilen:
  **454 bestanden, 1 übersprungen, 5 Timeouts**. Betroffen waren Katalog-Proof,
  Mehrtab-Szenario, zwei K-final-Screenshotfälle und S03-v2-Hinweistexte.
  Auch hier kein Fehler der untersuchten Inaktivitäts-Wiederaufnahme.

Die lokalen Timeout-Läufe werden ausdrücklich nicht als grüne Gesamtläufe gewertet.
Aktuelle isolierte Nachläufe und die vollständige GitHub-CI des Korrektur-Heads
werden im PR-Bericht ausgewiesen. Es werden weder parallele B2-/A2b-Dateien
geändert noch neue Branches integriert oder Rebase-/Merge-Aktionen ausgeführt.
Restrisiken sind die tatsächliche native Lock-Latenz und Last-/Rendererunterschiede
zwischen Desktop, Mobilprofilen und CI; die Tests synchronisieren deshalb den
Ownership-Zustand und behalten die unabhängigen Mehrtab-/Hintergrundprüfungen bei.

Ein isolierter Nachlauf der separaten Ergebnistext-/Mehrtab-Szenarien ergab
3 bestandene Fälle und einen Timeout beim Schließen des Mobile-Chromium-Kontexts.
Das Browserlog meldete dabei `CVDisplayLinkCreateWithCGDisplay failed`,
`CVReturn: -6670`; es scheiterte dort keine Zeitfortschritts-Assertion.
Auch dieser Nachlauf wird nicht als vollständig bestanden gewertet.

## Gezielte P2-Korrektur R1/R2 nach Review von `587fde7`

R1 betraf die Vermischung von editierbarer Rückmeldung, abgeschlossener Phase
und dem bisherigen gemeinsamen Neustart-/Fortsetzen-Pfad. „Noch offen“ änderte
nur das Feedback; die Auswahl zeigte weiter „bewusst aufgegeben“. Beim Fortsetzen
wurde die bisherige Phase nachträglich mit dem inzwischen korrigierten Feedback
archiviert und das aktuelle Feedback wie bei einem neuen Spiel geleert.

Die Aufgabe archiviert jetzt ihre Rückmeldung sofort in `feedbackAtEnd`. Eine
spätere Feedbackkorrektur verändert diese historische Phase nicht und startet
keine Zeitmessung. Erst „Fortsetzen“ legt aus einer aufgegebenen Phase eine neue
Phase mit eigener ID und eigenen Zählern an. Route, Notizen und normale
Spielstandzähler werden weiter geladen. Aktuelle Bewertungen bleiben erhalten;
ein noch auf „Aufgegeben“ stehendes Feedback wird beim ausdrücklichen Fortsetzen
auf „Noch offen“ gesetzt. Ein wiederholt verwendeter Fortsetzen-Link erzeugt bei
bereits offener Phase keine weitere Phase. Eine gelöste Phase und `solvedAt`
werden durch manuelle Feedbackänderungen oder einen Fortsetzen-Link nicht geöffnet
oder gelöscht. Die Auswahlaktion richtet sich nach der tatsächlichen Phase.

R2 lag in `createBetaSession().count()`: Die Phasen-ID wurde geprüft, der offene
Status fehlte. Die zentrale Funktion zählt nun nur bei passender ID **und**
`status === 'open'`. Nach der Lösung bleiben die Betatest-Zähler und die dortigen
Strafpunkte unverändert. Die bestehenden Hilfe-/Notiz-/Routenbedienelemente und
die normalen Spielstand-Strafpunkte behalten ihre bisherigen Verträge.

Geändert sind nur `src/beta/storage.mjs`, `src/beta/session.mjs`,
`src/beta/landing.mjs`, die Weitergabe der getrennten Startoptionen in
`src/ui/game.mjs`, die zwei Betatest-Testdateien und dieser Bericht. Keine
Änderung an Zeitmessungsalgorithmus, Lock-Protokoll, Schema, Identitäten,
Katalog, Engine, Deduktion, Kartenrenderer oder A2b; kein Rebase oder Merge.

### Nachvollziehbarer negativer Gegenlauf

Die endgültigen neuen Browserfälle wurden mit den unveränderten vier
Produktdateien aus `587fde7964a8eac80237d9eb438a08def08c8fc9` ausgeführt:

```sh
npm exec playwright test -- --config=playwright.b1.config.mjs \
  --project=chromium --project=mobile-chromium \
  --grep 'abandonment feedback correction|solved beta counters' \
  --workers=2 --retries=0 --reporter=line
```

Ergebnis vor der Korrektur: **6/6 erwartete Fehlschläge**. Die vier R1-Fälle
(mit/ohne Reload, Desktop/Mobil) meldeten nach der Feedbackkorrektur weiter
`Begonnen · bewusst aufgegeben`. Die beiden R2-Fälle zeigten im Export statt
`hints=1, noteChecks=1, routeChecks=1, penaltyPoints=15` die Werte
`2, 2, 2, 30`. Ein früherer negativer R1-Durchlauf erreichte außerdem den
Fortsetzen-Pfad und wies die nachträgliche Änderung von `feedbackAtEnd` nach.
Vier neue Speicherfälle scheiterten am Original ebenfalls: Der explizite
Resume-Übergang legte noch keine neue Phase an. Der bestehende Lösungsnachweis
blieb bereits vor der Korrektur erhalten und wird weiterhin positiv abgesichert.

Nach dem Gegenlauf wurden die gesicherten Korrekturdateien bytegleich
wiederhergestellt. Der gleiche Browserbefehl ohne Projektfilter bestand danach
**12/12 Fälle** über Chromium/WebKit, jeweils Desktop/Mobil. Diese Fälle prüfen
auch erhaltene Daten und Feedbackhistorie, exakt neue Zeitdeltas, Reload,
wiederholte Fortsetzen-Links in zwei Tabs, unveränderte abgeschlossene Zähler,
neue eigene Zähler und tatsächliche JSON-Downloads. Keine zusätzlichen Retries,
Skips, festen Wartezeiten oder abgeschwächten Zählererwartungen.

Weitere tatsächliche Ergebnisse werden im PR-Bericht ergänzt. Bereits bestanden:
**17/17 B1-Unit-/Integrationstests** und **156/156 Engine-/Integrations-/Loader-/
Modelltests**, jeweils ohne Fehler oder übersprungene Fälle.

Die bestehende Näherung der Zeitmessung und Speichergrenzen gelten weiter.
Bei bereits vor dieser Korrektur aufgegebenen Datensätzen ohne `feedbackAtEnd`
kann nur die noch vorhandene Rückmeldung archiviert werden; eine damals nicht
gespeicherte frühere Bewertung lässt sich nicht nachträglich rekonstruieren.
Echte Mobilgeräte und die separate Integration mit dem aktuellen A2b-Stand
bleiben eigene Abnahmeschritte.

Abgeschlossene Gesamtläufe auf der Korrektur, jeweils ohne Retries:

- `node --test tests/integration/beta-*.test.mjs`: **17/17 bestanden**.
- `node --test tests/integration/*.test.mjs tests/engine/*.test.mjs tests/contracts/loader.test.mjs tests/contracts/model.test.mjs`: **156/156 bestanden**, einschließlich der 17 B1-Fälle.
- `npm exec playwright test -- --config=playwright.b1.config.mjs --workers=2 --retries=0`: **76/76 bestanden** (19 Fälle × vier Browserprofile).
- Bestehende `note-check.spec.mjs`, `model.spec.mjs` und `ui-page-resume.spec.mjs`
  auf beiden Chromium-Profilen mit unveränderter Konfiguration der Fälle und
  eigenem Serverport: **40/40 bestanden**.
- `git diff --check`: bestanden.

Der zusätzliche fokussierte Nachher-Lauf mit 12 bestandenen Fällen ist ein
separater Lauf; die 17 B1-Unitfälle sind in den 156 Fällen enthalten. Die Zahlen
werden deshalb nicht als Anzahl unterschiedlicher Tests addiert.
