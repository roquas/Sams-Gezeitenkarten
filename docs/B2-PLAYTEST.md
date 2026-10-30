# B2-Kandidaten spielen (Testbestand S01)

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

Für einen neuen Generatorlauf einen neuen Bestand (`S02` usw.) mit eigener
Zuordnungsdatei und fixiertem Quellmanifest anlegen. Alle gewünschten Kandidaten
einmal an ihre vollständigen technischen Fingerprints und Inhaltshashes binden;
neue Namen vergeben, bestehende S01-Zeilen nicht umwidmen. Danach den kleinen
Adapter explizit um die neue Bestandskonfiguration und Namenskennung erweitern
und dieselben Export-/Lade-/Pakettests ausführen. Das ist bewusst noch kein
allgemeines Bestandsverwaltungssystem.

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
