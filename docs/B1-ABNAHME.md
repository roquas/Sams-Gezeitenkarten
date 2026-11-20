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
