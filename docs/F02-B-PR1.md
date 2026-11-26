# F02-B PR 1: manueller Prüfweg

Dieser Schritt ergänzt F01/F02-A um eine eigene Qualitätsmethode `f02b-three-stage-2` und übernimmt die nachträglich beschlossene Gleichbehandlung benannter Startorte. Alle persistierten Ortsnamen bleiben in neuen Drafts vollständig erhalten; neue Drafts/Checkpoints verwenden v2. `FLAVOR_VERSION=1` bezeichnet weiterhin den unveränderten Request-/Quellhashvertrag. Historische Antwortbytes und die 23 `flavor-check-v1`-Prüfungen mit `UNCERTAIN` des tatsächlichen Piloten bleiben unverändert. Es werden keine Modellantworten erzeugt. Automatische Klärung, Reparatur, Ersatzproduktion, Auswahl, Merge und Veröffentlichung gehören nicht zu PR 1.

Der Pilotleser validiert gespeicherte Records mit `validateStoredProductionRecords`, statt sie unter dem aktuellen Generator neu zu erzeugen. Benannte Startorte dürfen und sollen wie jeder andere Ort namentlich referenziert werden. Ihre Startfunktion beschränkt die Benennung nicht. Vertrag und historische Lesekompatibilität sind in [FLAVOR-PIPELINE-F01.md](FLAVOR-PIPELINE-F01.md#vollständige-ortsnamen) und [FLAVOR-PRODUCTION-F02-A-2.md](FLAVOR-PRODUCTION-F02-A-2.md) beschrieben.

Die ursprüngliche fachliche Übergabe und technische Konzeption stehen unverändert unter `docs/handoff/f02-b-20261125/`. Deren Aussagen über einen global unveränderten F01-v1-Vertrag sind durch die spätere Startnamen-Korrektur insoweit überholt. Die dort enthaltene Konzeptionsanweisung „noch keine Implementierung“ beschreibt den damaligen Auftrag. Die Implementierung folgt `02-Codex-Auftrag-PR1.txt` mit dieser ausdrücklich beauftragten Namenskorrektur; der fachliche Umfang von PR 2 wird nicht vorgezogen.

## Reale Quellen und Grenzen

`tests/fixtures/flavor-quality/pilot/` archiviert unverändert die mitgelieferten echten Importdateien einschließlich `complete.json`, `receipt.json`, Antwort, Records und Transportherkunft. `verifyPilot()` prüft den versiegelten Snapshot, die Antwort-SHA `e69847b8d1c031196aeeb455f558ce2621a0bb6b33af67cff0310e2748adf3c1`, den gespeicherten Originalauftrag aus PR #130, die vier Records sowie die vollständig materialisierte Präsentation. C-06/C-02/C-03/C-11 haben 6/7/6/4 Hinweise, jeweils `independent-1`, Revision 1. Es sind keine technischen Produktionsfixtures.

Die Antwort wurde aus einer maskierten Nutzereinfügung rekonstruiert. Ursprüngliche Produzentenbytes, Modell und Produktionszeitpunkt sind unbekannt. Die Originalbelege werden übernommen, nicht neu datiert. Die Herkunft ist kein semantischer Freigabenachweis.

Für den ersten echten Blindlauf liegt ein versiegelter Reader-Auftrag in `content/flavor/quality-pilot-v1/local/jobs/`. Nur dessen `public/`-Inhalt darf den separaten Reader-Chat erreichen. `binding.json` und der übrige Store bleiben lokal. Es gibt dort keine Reader-/Reviewer-Antworten, Vergleiche oder Qualifikationen. Technische Testantworten sind ausschließlich Testdoubles unter `tests/fixtures/flavor-quality/technical-responses.mjs` und in temporären Teststores.

## Ausführbarer Ablauf

Voraussetzungen: Node 22, Git und die bestehenden Repositorydaten. Für die unveränderten Bild-/Browsergates zusätzlich Python mit Pillow/numpy und die konfigurierten Playwright-Browser. Keine kostenpflichtige API oder neue Anwendung erforderlich.

Alle konkreten Befehle stehen auch in `node scripts/flavor-quality.mjs --help`. Folgendes erzeugt einen **neuen** unabhängigen Blindauftrag in expliziten getrennten Stores:

```sh
mkdir -p .dev/f02b-pr1
node scripts/flavor-quality.mjs prepare-pilot \
  --production-store .dev/f02b-pr1/production \
  --quality-store .dev/f02b-pr1/quality \
  --out .dev/f02b-pr1/reader-public > .dev/f02b-pr1/reader-export.json
```

Das Kommando kopiert den vorhandenen versiegelten Orderbestand und den tatsächlichen Importsnapshot bytegleich in den benannten Produktionsstore. Es überschreibt nichts und erzeugt weder neue Produktion noch einen neuen historischen Importbeleg. Der ausgegebene `jobId` ist im Folgenden `READER_JOB`.

1. Ausschließlich `.dev/f02b-pr1/reader-public/` vollständig an einen frischen Chat ohne Repository-/Projektquellen übergeben. `prompt.txt` ist die genaue Anweisung für den gesamten Batch. Die unveränderte UTF-8-JSON-Antwort lokal als `reader-response.json` speichern.
2. Antwort importieren, dann deterministisch vergleichen:

```sh
node scripts/flavor-quality.mjs reader-import \
  --production-store .dev/f02b-pr1/production --quality-store .dev/f02b-pr1/quality \
  --job READER_JOB --run reader-1 --response reader-response.json
node scripts/flavor-quality.mjs compare \
  --production-store .dev/f02b-pr1/production --quality-store .dev/f02b-pr1/quality \
  --job READER_JOB > .dev/f02b-pr1/comparison.json
node scripts/flavor-quality.mjs review-export \
  --production-store .dev/f02b-pr1/production --quality-store .dev/f02b-pr1/quality \
  --reader-job READER_JOB --out .dev/f02b-pr1/reviewer-public
```

3. Den **separaten Gesamtprüfungsordner** vollständig an einen weiteren frischen unabhängigen Chat geben. Keinesfalls das Implementierungs-/Konzeptionspaket, Erwartungen oder eine behauptete Pilotfreigabe hinzufügen. Mit dem ausgegebenen `REVIEW_JOB`:

```sh
node scripts/flavor-quality.mjs review-import \
  --production-store .dev/f02b-pr1/production --quality-store .dev/f02b-pr1/quality \
  --job REVIEW_JOB --run reviewer-1 --response reviewer-response.json
node scripts/flavor-quality.mjs inspect \
  --production-store .dev/f02b-pr1/production --quality-store .dev/f02b-pr1/quality \
  --job REVIEW_JOB
```

`READER_JOB`/`REVIEW_JOB` sind durch die tatsächlich ausgegebenen IDs zu ersetzen. Modell und Zeitpunkt können mit `--model`/`--produced-at` ausdrücklich deklariert werden; ohne Kenntnis bleiben sie `null`. `--evidence-kind technical-test` kennzeichnet Infrastrukturtests und verhindert eine reale Qualifikation, auch wenn `technicalWouldQualify` den internen Gatepfad bestätigt. Die Infrastruktur beobachtet keine verborgenen Chats oder Modellaufrufe und kann eine falsche Betreiberdeklaration nicht verifizieren.

Für bereits vorhandene Revisionen: `blind-export --references refs.json --out DIR`, wobei `refs.json` ein Array der bestehenden `revisionRef`-Objekte enthält. `export --job ID --out DIR` reproduziert einen gespeicherten öffentlichen Auftrag exakt. Abgeschlossene Reader-/Reviewer-Items werden bei neuen Batches standardmäßig ausgelassen; `--repeat yes` fordert einen gesonderten Lauf mit neuen opaken Kennungen an. Innerhalb eines Auftrags werden gegenläufige Wiederholungsantworten abgewiesen. Neue unabhängige Läufe bleiben gesonderte Nachweise und überschreiben keine alten Blindantworten. PR 1 enthält keine automatische Auswahl zwischen widersprüchlichen Läufen oder eine Klärungssteuerung.

Der unter `content/flavor/quality-pilot-v1/local` beigefügte ursprüngliche Auftrag bleibt nach der Korrektur der itemweisen Aktualitätsprüfung ein **historischer Methodenstand**. Seine Bytes und bisherigen Transportdateien bleiben erhalten. Für einen aktuellen Blindlauf den oben beschriebenen `prepare-pilot`-Weg mit getrennten Stores verwenden und ausschließlich dessen neu erzeugten öffentlichen Ordner übergeben. Antworten auf alte Job-/Methodenkennungen werden nicht auf den neuen Stand übertragen. Der Produktionsstore ist nur Vertrauensanker; `select` oder Beta-Materialisierung sind nicht Teil dieses Wegs.

## Verträge und Bindungen

Seit Methodenstand 2 sind die Modellantwortschemas an den jeweiligen Job gebunden: feste Kennungen/Hashes, öffentliche Einheiten-/Hinweis-IDs, zulässige Fakten-/Evidenz-Namensräume und vollständige Pflichtplätze. Reader-kind/state/atoms-Kombinationen werden mit disjunkten Schema-Varianten ausgedrückt. Gegenseitige Claim-/Einheitenbezüge und Engine-Gültigkeit bleiben zusätzliche, im Prompt ausdrücklich benannte Laufzeitprüfungen. Vorlagen enthalten die erforderlichen Plätze, aber absichtlich ungültige leere/null-Werte statt voreingestellter Urteile; sie sind kein Prüfergebnis.

Die ausführbaren geschlossenen Antwortschemas sind `readerItemSchema`, `reviewerItemSchema` und `responseSchema(stage)` in `scripts/lib/flavor-quality-contract.mjs`. Jedes Exportpaket enthält das genaue Schema und eine leere Vorlage. Unbekannte Felder, fremde/doppelte IDs, doppelte JSON-Schlüssel (auch escaped), falsche Hashes und ungültige Referenzen werden kontrolliert. Ein fehlerhafter Umschlag erzeugt keinen Teilerfolg. Innerhalb eines eindeutig gültigen Umschlags dürfen vollständige gültige Items angenommen werden; defekte oder fehlende Items bleiben technisch offen.

Stufe 1 bildet Claims mit Einheitenbezügen, Art, rekonstruierter Bedeutung, optionaler äußerer Hinweis-ID, Zustand und Atomen. `interpretations` bindet **alle** Claims dieses Hinweises. Sicher formalisierbare Mathematik verwendet nur die sechs vorhandenen Atome. Nicht formalisierbare Bedeutung bleibt `unresolved`, ohne stillschweigend einen Zusatz zu verwerfen. Auch Mathematik außerhalb von Hinweisen ist ein eigener Claim.

Die Einheitenmethode `whole-field-utf16-1` segmentiert nicht: Titel, jeder Einleitungsabsatz, jeder vollständige Hinweis sowie alle entsprechenden Kontextfelder bilden je eine vollständige Einheit. IDs, Feldpfade, unveränderte Texte und `[start,end)` in UTF-16 werden eingefroren. Umlaute, Emoji, Abkürzungen, Zeilenumbrüche und mehrsatzige Frage-Antwort-Hinweise bleiben verlustfrei. Abdeckungs-/Claimbezüge werden in beiden Richtungen kontrolliert. Diese formale Vollständigkeit beweist keine richtige Interpretation.

Die öffentliche Positivliste enthält nur die tatsächliche Präsentation, Karte, sämtliche Namen, Flächen, Befahrbarkeit, Start/Etappen, statische Assets, Regeln, Welt-/Stilrahmen und tatsächlichen Serienkontext. Keine Quellprädikate, technischen Ausgangstexte, Produzentenmetadaten, Prüfergebnisse, Hinweis-Ortsmarker, Zielroute, ursprünglichen Fallkennungen oder lokalen Bindungen gelangen hinein. Opake Job-/Item-IDs sind zufällig; öffentliche Inhaltshashes enthalten nur zulässige Daten. Der vorhandene statische Kartenrenderer wird ohne hinweisbezogene Marker verwendet. Alle Bilddateien sind unveränderte verifizierte Ressourcen, mit pseudonymen Inhaltsdateinamen, Inventar und auflösbaren relativen SVG-Verweisen.

Die öffentliche Quellenansicht ist versioniert: Die Regelerklärung verweist auf `job.json`; aus `world/production.md` werden P01–P14 übernommen. P15/P16 enthalten private Pilot-/Kalibrierungsplanung bzw. spätere Arbeit und werden nicht transportiert. `world.md` und `style.md` bleiben vollständig bytegleich. Der vollständige unveränderte Ursprungsstand bleibt lokal gebunden. Eine unbekannte Produktionsquellenstruktur wird abgewiesen. Die Reader-Anweisung ersetzt die ältere Produktionsanweisung als aktuelle Aufgabe.

Der lokale Sidecar bindet zusätzlich `revisionRef`, F01-`sourceHash`, die **vollständige** materialisierte Präsentation, ursprüngliche Regeln/Weltquellen, tatsächlichen Kontext und sämtliche Stufenabhängigkeiten. `METHOD_HASH` umfasst Prompts, ausführbare Schemas, Einheiten-/Vergleichsmethode und relevante Implementierungsdateien einschließlich Engine/Normalisierung. Andere Texte, Namen, Karten, Quellen, Methoden oder Kontexte bekommen andere Bindungen. Eine Änderung nur privater Originalhinweise bei gleichem Spielertext verändert den fachlichen Blindinput nicht, wohl aber die lokale Quellbindung. Alte Befunde werden nicht übertragen.

Serienkontext: `{version:1,episodes:[revisionRef,...]}` mit `--context FILE`. Die tatsächlichen Präsentationen werden aus dem Produktionsstore in der angegebenen Reihenfolge aufgelöst. `editorial.context` wird niemals als Spielertext benutzt. Der erste Pilot hat einen ausdrücklich leeren Snapshot. Ein anderer Snapshot oder eine neuere referenzierte Revision macht alte Nachweise für den neuen Stand unanwendbar. Historische Methoden bleiben bytegleich lesbare Archive; diese Laufzeit qualifiziert sie nicht mit einer neueren Methode und übernimmt ihre Ergebnisse nicht.

Die Aktualität wird je Item geprüft: eigene Flavor-Revision plus alle Revisionen des tatsächlich gebundenen Serienkontexts. Eine neue C-06-Revision invalidiert bei leerem Kontext nur C-06; C-02 behält seinen Reader-, Vergleichs- und Review-Fortschritt. Ein geänderter gemeinsamer Kontext invalidiert dagegen jedes davon abhängige Item. Statusanzeige, Vergleich, Review-Export und Wiederverwendung fertiger Items verwenden dieselbe Prüfung.

Bei einer verspäteten gemischten Antwort bleiben technisch gültige Ergebnisse als Nachweise ihrer gepinnten Revisionen erhalten; aktuelle Geschwister können weiterarbeiten. `staleItemIds` benennt die veralteten Antwort-Items, `applicable` fasst die Anwendbarkeit der gelieferten Items zusammen. `accepted` bedeutet strukturelle Annahme, keine aktuelle Qualifikation. Maßgeblich für weitere Verarbeitung ist die itemweise Anzeige in `inspect`; Vergleich und Review-Export lassen veraltete Items aus. Neue Antworten ausschließlich veralteter Items oder mit veraltetem gemeinsamem Kontext werden abgewiesen. Ein exakter bereits gespeicherter Import bleibt unverändert idempotent lesbar.

## Vergleich und lokaler Befund

`flavor-quality-compare.mjs` verwendet ausschließlich `createRules().routes`, `legal` und `matches`. Original und vollständige rekonstruierte Konjunktion werden je äußerer Hinweis-ID über alle legalen Routen verglichen, ohne andere Originalhinweise oder gespeicherte Zielroute. ID-unabhängige Atome und die vorhandene sichere Null-/Alle-Intervallnormalisierung werden nur **innerhalb eines Hinweises** verwendet. Historische B2/S03-Verträge bleiben unverändert.

Ergebnisse: `equivalent`, `weakened`, `strengthened`, `changed`, `different-incomplete`, `incomparable`. Beide Differenzrichtungen, exakte oder vorläufige Zähler, Suchumfang und wenige deterministische legale Gegenbeispiele mit Wahrheit auf beiden Seiten bleiben erhalten. Maximal 250000 Knoten; Budgetende beweist keine Gleichheit oder einseitige Inklusion. Ein bereits gefundener Gegenbeispielpfad bleibt belastbar. Ein leerer legaler Vergleichsraum und ungelöste Bedeutung führen nicht zur Qualifikation. Eingabe-/Ressourcenfehler sind operative Fehler, keine Text-Findings.

Stufe 3 bekommt vollständigen Spielertext, Originalquellen, Reader-Claims/Abdeckung und Vergleichsevidenz separat. Pflichtbereiche: Interpretation, Zusatzinformation, Deduktionsvorwegnahme, eigenständig vollständige Hinweise, Widersprüche, Mehrdeutigkeit, Welt/Stil, Verständlichkeit, Recht, Politik, Diskriminierung, Sexualität und Namen. Alle Einheiten, Claims und Hinweise müssen bewertet sein. Findings enthalten Schwere, Anforderung, Belege, Begründung, Methode und gegebenenfalls Reparaturziel. Formen, Themen, Motive, Erfindungen, Namen und redaktionelle Beobachtungen werden unabhängig aus Texten erhoben, einschließlich ausdrücklicher Abwesenheit.

Lokale Qualifikation verlangt gültige vollständige Stufen für dieselbe Bindung, abgeschlossene gleichwertige Einzelvergleiche, bestätigte vollständige Interpretationen, gewahrte Informationsgrenzen und keine offenen ERROR/relevanten UNCERTAIN. Ein Modellfeld `qualified:true`, bloße Abdeckung, Modellkonfidenz oder gleiche Gesamtlösung genügen nicht. ADVISORY ist optional und löst keine Änderung aus. Falsche Reader-Interpretationen können diagnostiziert werden, bleiben aber offen, bis eine neue Interpretation erneut blind gelesen, verglichen und unabhängig geprüft ist. Die ursprüngliche Blindantwort bleibt erhalten. PR 2 ergänzt die begrenzte Klärungs-/Reparatursteuerung.

Reader-Folgerungen über mehrere Hinweise: `clueId:null` bezeichnet nicht automatisch Mathematik im Erzählrahmen. Eine mathematische Reader-Kombination darf als `supported` gelten, wenn sämtliche belegten Einheiten aus mindestens zwei konkreten Hinweisen stammen, die Gesamtprüfung alle beteiligten Originalfakten ausdrücklich nennt und die betroffenen Hinweise unabhängig als bestätigt, vollständig und ohne vorweggenommene Information bewertet. Die allgemeinen Prüfbereiche bleiben zusätzlich blockierend. Das ist eine evidenzbasierte semantische Einordnung, kein neuer mathematischer Beweis freier Sprache. Der deterministische Einzelvergleich bleibt strikt je Hinweis; andere Hinweise dürfen dessen Gleichwertigkeit nicht retten.

Mathematik mit Textbezug zu Titel, Einleitung oder Serienkontext benötigt weiterhin ausdrückliche Autorisierung durch öffentliche/Originalfakten, auch wenn der Reader zusätzlich eine Hinweis-ID zuordnet. Ein einzelner Hinweis ohne klare Zuordnung, fehlende Faktenbezüge, ungelöste Bedeutung und beanstandete Deduktionsoffenlegung werden durch die Mehrhinweisregel nicht freigegeben. Eine pauschale Reviewer-Zustimmung reicht nicht.

Methodenwechsel und Historie: Die Korrektur von Schemas, Prompts und Qualifikation erzeugt einen neuen Methodenhash. Bereits abgeschlossene Pilotjobs, Antwortbytes und gespeicherte Softwarebefunde bleiben unverändert historisch. Ein diagnostisches Replay dieser Daten unter der neuen Logik ist ein Regressionsergebnis und keine Übertragung alter Qualifikationen auf neue Jobs. Dieser Schritt fordert keine erneuten manuellen Chatläufe an. Liveausführung und ein zulässiger automatisch ausführbarer Modellzugang werden im überarbeiteten Folgeauftrag festgelegt; der manuelle Adapter ist keine Liveautomatisierung.

Der Befund nennt die Methode und den noch **nicht empirisch nachgewiesenen** Kalibrierungsumfang. Technische Doubles können keinen realen Text qualifizieren. Manuelle externe Antworten bleiben deklariert, nicht unabhängig beobachtete Modellaufrufe. Qualifikation ist weder Auswahl noch Veröffentlichung und keine Garantie künftiger Produktionszuverlässigkeit.

## Persistenz und Kalibrierung

Jobs/Sidecars, echte Antwortbytes, Importbelege, Vergleiche und Exportbelege sind getrennte immutable Snapshots mit Inventar, Sperre, fsync und atomarem Rename. Die kleinen gemeinsamen Dateisystemmechaniken wurden aus dem Produktionsstore extrahiert, dessen historische Serialisierung unverändert bleibt. Reader-/Reviewer-Antworten ersetzen nie den lokalen Auftrag. Exakte Wiederholung ist idempotent; widersprüchliche Wiederholung und beschädigte Bestände werden abgewiesen; veraltete Quellen werden itemweise von aktueller Weiterverarbeitung ausgeschlossen. Unterbrochene `.pending-*`-Verzeichnisse sind unsichtbar. Zurückgelassene Schreiberlocks erfordern eine bewusste lokale Prüfung, keine automatische unsichere Entfernung.

`inspect` zeigt pro explizitem Job die Stufen und gebundene Detailbefunde. Ein Reader-Job zeigt Reader/Vergleich; der abschließende Befund gehört zum abhängigen Reviewer-Job. Aufwand: aufgezeichnete Exportziele, Paketbytes und importierte Antworten; unbekannte Modellaufrufe, Token und Kosten bleiben `null`. Ein Absturz zwischen öffentlichem Export und Exportbeleg kann durch Wiederholung vervollständigt werden und verändert keine Qualifikation.

`tests/fixtures/flavor-quality/synthetic-corpus.mjs` enthält 22 handgeschriebene künstliche Fälle mit begründeten lokalen Erwartungen: Grenzen/Stunde 0, Negation/Häufigkeit, falsches Objekt, Mehrhexfläche/Bildanker, Hexdistanz/Etappen, Zusatzbedingung trotz korrektem Original, Besuche, Titel/Einleitung/Serienkontext, Mehrdeutigkeit, zulässige Kreativität und alle sechs Typen. Wichtig: zusätzlicher anderer Originalhinweis bleibt im Gesamträtsel redundant, ist isoliert dennoch eine Verschärfung; erste Richtung und daraus abgeleitete Position können denselben Routeneffekt haben und dennoch die Informationsgrenze verletzen. Es entstehen keine Produktionsvarianten oder Reparaturrevisionen echter Piloten.

`createCalibrationPackage()` in `scripts/lib/flavor-quality-calibration.mjs` erzeugt einen einzelnen ungepaarten öffentlichen Blindauftrag aus einem künstlichen Fall; Mutationsname, Originale und Erwartungen bleiben im lokalen Sidecar. Er gehört ausdrücklich nicht in den Produktions-/Qualifikationsstore. `recordCalibrationResponse()` kann spätere echte manuelle Reader-Antwortbytes mit deklarierter Methode/Modell/Zeit als immutable Beobachtung sichern. Die normalen Vergleichs-/Gesamtprüfungsadapter können auf diesen getrennten Artefakten arbeiten. Die CI verwendet nur klar markierte technische Doubles. Sie behauptet keine empirische GenAI-Zuverlässigkeit. Der 10+5-Test und eine Entscheidung über unbeaufsichtigte Produktion bleiben späteren Schritten vorbehalten.

Die tatsächlich ausgeführten Prüfungen, Umgebung und offenen Grenzen sind in `docs/verification/F02-B-PR1.txt` protokolliert. CI und deren bestehende Profilerkennung bleiben vollständig unverändert; neue Pfade bekommen keine neue Gate-Allowlist.
