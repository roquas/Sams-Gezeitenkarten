# B2-Kandidaten spielen (Testbestand S01)

Einzelner handentwickelter Referenzspieltest: siehe
[lösungsfreie Anleitung und ZIP-Export](B2-POSITIVE-PLAYTEST.md).

Nach dem Merge im aktuellen Checkout mit Node 22+ und Python 3:

```sh
npm run dev:b2
```

[http://localhost:8000/?dev=b2](http://localhost:8000/?dev=b2) öffnen.
Der Befehl exportiert alle **95** Kandidaten des korrigierten B2-Beispielbestands
und startet den vorhandenen lokalen Server. Keine zusätzlichen Assets,
Generatorläufe, JSON-Bearbeitung oder Fingerprints nötig.

Die Auswahl steht direkt über der Seekarte. Ein Name wie
`B2-S01-M000-A3-R00-V01` bedeutet: Bestand S01, ursprünglicher akzeptierter
Kartenindex 000, Start A3, B1-Zielroutenindex 00, fest zugeordnete Variante 01.
Gleicher Präfix bis `R…`, anderes `V…`: gleicher Zielroutenfall, andere Hinweise.
Der Name bleibt im Titel sichtbar. Beim Berichten diesen vollständigen Namen nennen.
Nach Auswahl enthält die URL `puzzle=<Testname>` und kann als direkter Einstieg
gespeichert werden, beispielsweise:

[Ersten Kandidaten starten](http://localhost:8000/?dev=b2&puzzle=B2-S01-M000-A3-R00-V01).

Stunde wählen, Hinweise durchblättern, Wasserfelder markieren und mit dem
Routenwerkzeug sechs Etappen einzeichnen. Die bestehende Prüfung kontrolliert
Legalität und sämtliche Hinweise. Notizprüfung, Radar, Undo und Rücksetzen
funktionieren wie bisher. Die Auswahl enthält außerdem die handentwickelte
Probefahrt. „Reguläres Spiel öffnen“ führt zum normalen Einstieg ohne B2-Katalog.

Bei bereits laufendem Server genügt `npm run export:b2`, danach die B2-URL öffnen.
Bei fehlendem Export nennt die Oberfläche diesen Befehl. Server mit Strg+C beenden.

## Integrationsentscheidung

Der normale Pfad ist `puzzles/manifest.json` → `createPuzzleLoader()` → öffentliches
Projektionsformat v2 → `compilePuzzle()` → dieselbe `game.mjs`-Oberfläche.
B2 speichert bereits das identische strukturierte `logic`-Modell samt Start,
sechs Etappen und allen sechs Hinweisarten. Es speichert zusätzlich die private
Zielroute, Fingerprints, Motivbelegung und Suchdiagnostik. Es fehlen lediglich
Präsentation und Hinweisformulierungen. Ein Engineumbau ist nicht erforderlich.

Der Offlineadapter `scripts/lib/b2-playtest.mjs` ergänzt diese Präsentationsdaten,
verwendet die ursprünglichen Motivbelegungen und den vorhandenen Hintergrund
`sea-blue-01`, und ruft `projectPublicPuzzle()` auf. Jeder Export wird mit dem
unveränderten Compiler/Solver geprüft und seine rekonstruierte Lösung mit der
B2-Zielroute verglichen. Keine zweite Engine, keine Qualitätsfilter.

Die exportierten Dateien liegen ausschließlich unter dem ignorierten `.dev/b2/`.
Das dortige Manifest verwendet den bestehenden Loader und nimmt zusätzlich die
regulären Rätsel auf. `?dev=b2` wählt ausschließlich dieses Manifest. Ohne den
Parameter bleibt der bisherige Ladepfad erhalten; die letzte Auswahl für B2 wird
separat gespeichert. Spielstände verwenden wie bisher die jeweilige Rätsel-ID
und Datenversion; jeder Variantenname besitzt seinen eigenen Speicherbereich.
Beim Wechsel werden History, Geste, Bordbuchposition und transiente Meldungen
zurückgesetzt; frühere Eingaben desselben Rätsels werden bewusst wieder geladen.

`scripts/package.py` sammelt weiterhin ausschließlich den normalen Manifestbestand
und statische Modulabhängigkeiten. Weder `.dev/`, B2-Quellartefakte, Zuordnung noch
Exportskripte gelangen in das ZIP. Der Laufzeitcode kennt lediglich die optionale
Manifestadresse. Es gibt keinen neuen produktiven Rätselkatalog.

## Identitäten, Herkunft und Reproduzierbarkeit

`scripts/config/b2-playtest-s01.json` bindet jeden Namen explizit an Bestand,
Experiment-ID, unveränderte Karten-/Instanz-/Variantenfingerprints, Wirkungsschlüssel,
Zielversuch-ID und SHA-256 der kanonischen Originaldefinition einschließlich Lösung
und Motivbelegung. Der Quellmanifesthash fixiert Generatorlauf und Herkunft.
Namen werden beim Export niemals aus einer Listenposition neu berechnet.
Die Nummern wurden einmal vergeben und sind Teil dieser versionierten Zuordnung.

Der Adapter berechnet die bestehenden logischen Fingerprints mit der vorhandenen
Archivfunktion nach. Die IDs im öffentlichen DTO sind die vorhandenen Hashwerte
mit den vom öffentlichen Schema verlangten `map-`/`inst-`/`var-`-Präfixen; die
Originalfingerprints in der Zuordnung bleiben unverändert maßgeblich. Testnamen
sind Berichtsnamen und lokale Speicherkennungen, keine neue logische Identität.

Sortierung der Kandidaten oder Zuordnung verändert den Export nicht. Fehlende,
doppelte, neue oder geänderte Kandidaten brechen den Export ab. Der Export ist
bei gleichen Eingaben bytegleich und liest die Originalartefakte ausschließlich.
Erst nach vollständiger Validierung wird der lokale Bestand ersetzt.

Für eine Analyse außerhalb des Spiels:

```sh
npm run inspect:b2 -- B2-S01-M000-A3-R00-V01
```

Dies zeigt Zuordnung und vollständigen Originalkandidaten einschließlich Lösung,
Herkunft und Nachweisen im Terminal. Diese Daten werden beim Spielen nicht
abgerufen. Die Webdateien enthalten keine Lösung, Zielroute oder Suchdiagnostik;
der vorhandene Solver rekonstruiert die Lösung lokal für die Bedienhilfen.

## Hinweistext und Grenzen

Die Oberfläche konsumiert bisher feste `presentation.clueTexts`; allgemeine
Textvorlagen für die sechs strukturierten Hinweisarten gibt es nicht.
`scripts/lib/clue-text.mjs` formuliert sie deshalb zentral und sachlich.
Die Funktion enthält keine Prädikate und keine Solveraufrufe. Ortsbezüge nennen
ID und sämtliche Zellen, Intervalle beide eingeschlossenen Grenzen, Kurswechsel
die vorherige Richtung und Drehrichtung. Die vorhandene Koordinatendarstellung
ersetzt Zellnamen in der Oberfläche durch ihre bekannten Symbole.

Es gibt keine erzählerischen Texte oder zusätzlichen, lösungsspezifischen
Denkanstöße. Der vorhandene Tippbutton verwendet bei leerer Tippliste seinen
allgemeinen Hinweis und die üblichen Strafpunkte. Diese Entwicklungsintegration
bewertet weder Schwierigkeit noch Qualität und speichert kein Feedback.
Der reguläre Download/Deployment-Build enthält diesen Testbestand bewusst nicht;
gespielt wird im lokalen Checkout. Clientseitige Rätsel sind außerdem kein Schutz
gegen bewusstes Auslesen oder eigenes Lösen per Entwicklerwerkzeugen.

## Weitere Bestände

### S02: ungefilterter 20-Karten-Probelauf

```sh
npm run dev:b2:s02
```

[S02 öffnen](http://localhost:8000/?dev=b2&stock=S02). Dieser Einstieg enthält alle
**96 Kandidaten** aus 20 Karten und die reguläre Probefahrt. Es gibt keine qualitative
Vorauswahl. S01 bleibt mit `npm run dev:b2` und `?dev=b2` unverändert erreichbar.
Beide Exporte können gleichzeitig vorhanden sein: `.dev/b2/` für S01 und
`.dev/b2-s02/` für S02. Die Bestandskennung wird beim Variantenwechsel in der URL
beibehalten; die zuletzt gewählten Rätsel und die namensgebundenen Spielstände
bleiben getrennt. Ein unbekannter Bestand wird ausdrücklich abgewiesen.

Ein direkter Einstieg ist beispielsweise
[B2-S02-M000-A1-R00-V01](http://localhost:8000/?dev=b2&stock=S02&puzzle=B2-S02-M000-A1-R00-V01).

Bei bereits laufendem Server sowie für private Diagnose:

```sh
npm run export:b2 -- --stock S02
npm run inspect:b2 -- --stock S02 B2-S02-M000-A1-R00-V01
npm run inspect:b2 -- --stock S02 --statistics
npm run report:b2:s02
node scripts/inspect-b2-playtest.mjs --stock S02 --report-markdown
```

Ohne `--stock` verwenden Export und Inspektion weiterhin S01. `--statistics`
behält sein bisheriges Ausgabeformat; `--report` ergänzt Gesamtzahl, getrennte
Häufigkeiten, Prozentanteile, Kreuztabelle und jeden gezählten Hinweis mit Testname
und Hinweis-ID. Die Bestandsauswertung validiert zuvor sämtliche Namens-/Inhaltsbindungen.

[Diagnosebericht, Grenzen und vollständige Reproduktion](verification/B2-S02.md) ·
[Hinweisauswertung](verification/B2-S02/clue-report.md).

### BC: acht Varianten aus dem Suchvergleich

```sh
npm run dev:b2:bc
```

[BC öffnen](http://localhost:8000/?dev=b2&stock=BC) oder direkt
[T01 starten](http://localhost:8000/?dev=b2&stock=BC&puzzle=B2-BC-T01-M017-A4-R00).
Die vorhandene Auswahl oberhalb der Seekarte enthält die acht Testvarianten und
die Probefahrt. Beim Wechsel bleibt `stock=BC` erhalten; direkte Rätsellinks,
Notizen, Undo und Spielstände funktionieren wie bei S02. Die Testkennung im Titel
bitte beim Berichten nennen. Die T-Nummer ist eine feste, strategieneutrale
Testkennung, keine Rangfolge. Gleiche M-/Start-/R-Kennung bedeutet gleiche
Zielroute; wiederholtes Spielen kann Erinnerungseffekte erzeugen.

[Auswahlbericht mit Einzel-/Paarwirkungen](verification/B2-BC.md) ·
[Validierungsnachweis](verification/B2-BC-validation.md) ·
[Vollständige feste Zuordnung](../scripts/config/b2-playtest-bc.json).
Je vier gespeicherte B-/C-Kandidaten, fünf bis sieben Hinweise; diese Kriterien
sind Testhypothesen und kein Qualitätsnachweis. Kein Generatoraufruf beim Export.
Registryvertrag 2 bindet den vollständigen 167-Zeilen-Kandidatenstrom samt Manifest
und wählt daraus explizite Kandidaten-IDs. S01/S02 behalten Registryvertrag 1 und
ihre bisherigen Inhalte. Die alten Bestände werden weder ersetzt noch ergänzt.

Bei bereits laufendem Server:

```sh
npm run export:b2 -- --stock BC
node scripts/report-b2-bc-playtest.mjs --check
node --test tests/contracts/b2-bc.test.mjs
npx playwright test tests/browser/b2-bc.spec.mjs
```

`npm run report:b2:bc` schreibt den lösungsfreien Auswahlbericht auf stdout.
`npm run inspect:b2 -- --stock BC <Testkennung>` zeigt privat den vollständigen
Originalkandidaten **einschließlich Lösung**; diese Ausgabe nicht im Spieltest
öffnen oder ausliefern. Beim Spielen bleiben Strategie und Suchdiagnosen verborgen.
S02 ist separat mit `?dev=b2&stock=S02` verfügbar, sofern es exportiert wurde.

#### Lokalen Webordner für Uberspace vorbereiten

Voraussetzungen wie beim regulären Paket: Node 22+, Python 3 mit Pillow, `unzip`.
Das reguläre ZIP bleibt unverändert frei von Entwicklungsbeständen. Für diesen
Spieltest wird es in einen neuen temporären Ordner entpackt und **nur** um die
neun öffentlichen BC-Dateien ergänzt (acht Rätsel und Manifest):

```sh
npm run export:b2 -- --stock BC
sh scripts/package.sh
b2_bc_stage=$(mktemp -d "${TMPDIR:-/tmp}/b2-bc-web.XXXXXX")
unzip -q dist/Sams-Gezeitenkarten.zip -d "$b2_bc_stage"
mkdir -p "$b2_bc_stage/.dev"
cp -R .dev/b2-bc "$b2_bc_stage/.dev/"
find "$b2_bc_stage" -type d -exec chmod 755 {} +
find "$b2_bc_stage" -type f -exec chmod 644 {} +
printf '%s\n' "$b2_bc_stage"
```

Die vorhandene Paketierung prüft reguläre Inhalte/Bilder und schreibt `.mjs` zu
`.js` um; das funktioniert auch für die optionale BC-Manifestadresse. So ist keine
zusätzliche MIME-Konfiguration auf Uberspace nötig. Das BC-Manifest behält seine
relativen Asset-/Rätselpfade, auch unter einem URL-Unterverzeichnis. `docs/`,
`scripts/`, Registry und Originalkandidaten werden nicht kopiert. Der Export setzt
bereits `.dev/` und das Bestandsverzeichnis auf 755, Dateien auf 644; das behebt
auch vorhandene 700-Exportordner. Die Rechte im fertigen Webordner trotzdem mit
den obigen Befehlen setzen: Jeder übergeordnete Hostpfad muss durchsuchbar sein.

Optional vor Upload unter dem bestehenden strengen Testhost prüfen:

```sh
DEPLOY_ROOT="$b2_bc_stage" python3 tests/deployment/static_host.py
```

Dann [lokalen Export öffnen](http://localhost:4174/gk/pr38/?dev=b2&stock=BC).
Der Host verwendet einen URL-Unterpfad und `nosniff` ohne `.mjs`-MIME-Zuordnung.

#### Ausschließlich manuell veröffentlichen

Der obige Ablauf bleibt lokal. Erst bei gewünschter Veröffentlichung einen
**neuen freien** Testpfad wählen; Beispiel für den bestehenden Uberspace-Host:

```sh
ssh roquas@roquas.uber.space 'test ! -e ~/www/roquas.de/sgk/b2-bc-test-01 && mkdir -p ~/www/roquas.de/sgk/b2-bc-test-01 && chmod 755 ~/www/roquas.de/sgk/b2-bc-test-01'
rsync -a --chmod=D755,F644 "$b2_bc_stage/" roquas@roquas.uber.space:www/roquas.de/sgk/b2-bc-test-01/
```

Den Upload nur nach erfolgreicher Anlage des freien Verzeichnisses ausführen.
Anschließend wäre der Einstieg
[BC auf dem Beispielpfad](https://roquas.de/sgk/b2-bc-test-01/?dev=b2&stock=BC).
Dieser Link ist eine Zielvorlage, keine Meldung über erfolgtes Deployment.
Alle acht Varianten, Auswahlwechsel und eine Markierung mit Neuladen prüfen.
Bei HTTP 403 besonders `.dev/`, `.dev/b2-bc/` und alle Host-Elternverzeichnisse auf
755 sowie JSON-Dateien auf 644 prüfen. `scripts/deploy` liefert den regulären
CI-Bestand ohne BC und wird für diesen Zusatzbestand nicht verwendet.

### Spätere Bestände

Für einen neuen Generatorlauf einen neuen Bestand mit eigener
Zuordnungsdatei und fixiertem Quellmanifest anlegen. Alle gewünschten Kandidaten
einmal an ihre vollständigen technischen Fingerprints und Inhaltshashes binden;
neue Namen vergeben, bestehende S01-Zeilen nicht umwidmen. Danach den kleinen
Adapter explizit um die neue Bestandskonfiguration und Namenskennung erweitern
und dieselben Export-/Lade-/Pakettests ausführen. Das ist bewusst noch kein
allgemeines Bestandsverwaltungssystem. S02 benutzt denselben Registryvertrag 1;
S01-Zeilen, Originalartefakte und Fingerprints wurden weder ersetzt noch migriert.

## Prüfung

```sh
node --test tests/contracts/b2-playtest.test.mjs
npx playwright test tests/browser/b2-playtest.spec.mjs
npm run test:unit
npm run test:content
npm run test:puzzles
python3 tests/test_package.py
sh scripts/package.sh
```

Die Vertragstests laden alle 95 Exporte mit dem echten Loader und kontrollieren
Logik, Lösung, Motive, Zuordnung, Reihenfolgeunabhängigkeit und Änderungsablehnung.
Browserprüfungen decken Entwicklereinstieg, Variantenwechsel, getrennte Eingaben,
Bedienhilfen, Lösungskontrolle und fehlenden Export ab. Der Pakettest prüft die
Grenze zu privaten B2-Dateien auch bei lokal vorhandenem Export.
