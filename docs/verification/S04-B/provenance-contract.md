# S04-B — gezielte Korrektur R1 und R2

Geprüfter Ausgangshead: `617d84a6427de849a9c4c5861abc39c2614f2306`.
Die vollständige unabhängige Review `pr115-independent-review.md` vom 20.11.2026
liegt als Nutzerquelle vor. Ihre mathematischen und architektonischen
Positivbefunde bleiben bestehen. Die Korrektur betrifft ausschließlich den
Herkunfts- und Verifikationsvertrag; der neue vollständige Review-Head und der
abschließende CI-Status werden im bestehenden PR #115 festgehalten.

## Ursache

- **R1:** `if (record.normalization)` ließ das zu prüfende Dokument darüber
  entscheiden, ob sein Transformationsnachweis erforderlich war. Weder die neue
  Laufpolitik noch ein unabhängiger Bestandsvertrag wurden dafür herangezogen.
  Entfernen oder `null` übersprangen so die Herkunftsprüfung.
- **R2:** Die logische Variantenidentität ignoriert redaktionelle Hinweis-IDs
  absichtlich. Auch die Parameterschlüssel ignorieren sie. Eine konsistente
  Umbenennung in Rohhinweisen und Referenzen war deshalb intern konsistent,
  bewies aber nicht die ursprüngliche Bezeichnung. Dieser logische
  Fingerprint-Vertrag wird ausdrücklich **nicht geändert**.

## Herkunftsvertrag und Vertrauensanker

`candidate-origins-1` ist ein privater, vom wirksamen Kandidaten getrennter
Datensatzvertrag. Er enthält die erwartete Politik und ein vollständiges
Inventar aus `(attemptId, variant)`, Status, Rohhinweisen einschließlich IDs,
`rawOriginFingerprint` und Quellenart. Das Inventar darf weder verkleinert noch
umgebunden werden. Die Status sind:

| Status | Politik | Verbindlicher Kandidatenvertrag |
| --- | --- | --- |
| `historical` | `none` | Keine neuen Aufbereitungs-/Normalisierungsfelder; bisheriger unnormalisierter Satz mit seinen IDs |
| `unchanged` | `count-distance-extremes-1` | `preparation` stimmt mit dem externen Vertrag überein; Parameter des Roh- und Ausgabesatzes gleich; kein `normalization`-Feld, auch nicht `null` |
| `normalized` | `count-distance-extremes-1` | Passendes `preparation`, vollständiger nichtleerer Transformationsnachweis und tatsächliche Verringerung der Hinweiszahl; vollständige bisherige Struktur-/Äquivalenzprüfung |

Der neue `gk-raw-clues-v1-sha256:`-Fingerprint hasht einen kanonisch sortierten
Rohsatz **einschließlich** IDs und strukturierter Parameter in einer eigenen
Hashdomäne. Umordnen der Hinweise oder JSON-Objektschlüssel ändert ihn nicht.
Umbenennen von H2 verändert ihn. Die bestehenden logischen Fingerprints und
die wirksamen Hinweis-/Zielroutenidentitäten bleiben unverändert.

Ein Hash der mitgelieferten Daten allein authentifiziert nichts. Deshalb nimmt
`verifyCandidates(file, {originContract, expectedOriginContractSha256})` den
**unabhängig erwarteten** kanonischen Vertragsdigest vom vertrauenden Aufrufer
entgegen. Er wird nicht aus dem Kandidaten, einer benachbarten Datei oder einem
frei deklarierten Feld übernommen. Änderungen an Kandidat **und** Belegdatei
scheitern weiterhin am unveränderten erwarteten Digest. Das Entfernen aller
neuen Felder oder das Herabsetzen der Datensatzversion schafft keinen Altvertrag.
Der Quellenvertrag wird vor den bestehenden Solverprüfungen validiert.

Es gibt zwei ausdrücklich unterschiedliche Quellen:

1. **Referenzfall 06: bereits versionierte unabhängige Rohsatzquelle.**
   `origin-contract.json` verweist auf den vollständigen originalen Kandidaten
   in `974931e95d434a35ce34094f4d5244e289d6fd76:docs/verification/S03-v2/run/candidates.jsonl`.
   Der Prüfer liest diese Quelle mit `git show`, kontrolliert Datensatzkennung,
   kanonischen Datensatzhash und Zielinstanz und vergleicht die originalen
   Roh-IDs/Parameter. Veränderte Arbeitskopien ersetzen diese Git-Quelle nicht.
   `referenceOriginContext()` bindet zusätzlich den erwarteten Vertragsdigest
   als feste Konstante des überprüften Programms:
   `334e17e2ade76e7bb8032d4b4ee00f05bd9fd8a4443747e6c983a88fc57b6b6c`.
   Selbst ein neu berechneter Hash eines Belegs mit `FORGED-ORIGIN` stimmt nicht
   mit H2 in dieser ursprünglichen Quelle überein.
2. **Künftige neue Läufe: separat erfasster Erzeugerbeleg.**
   Die Pipeline kopiert den tatsächlichen ausgewählten Rohsatz vor Übergabe
   des veränderbaren Kandidaten an `evaluateCandidate`. `originReceipts` wird
   getrennt von `candidate.normalization` zurückgegeben. Neue B2-Läufe speichern
   daraus `candidate-origins.json`; das Manifest benennt die Vertragsversion,
   die Zusammenfassung liefert dessen `canonicalSha256`. Das ist zunächst eine
   Aufnahme durch den vertrauenswürdigen Erzeuger, kein rückwirkender historischer
   Nachweis. Für spätere Prüfung muss der Digest unabhängig gesichert sein,
   etwa durch einen überprüften Git-Stand oder bereits vertrauenswürdige
   Laufaufzeichnung. Zwei gemeinsam manipulierbare Dateien mit gegenseitigen
   Hashverweisen reichen dafür **nicht** aus.

`pinOriginContract` und `legacyVerificationContext` hashen vertrauenswürdige
Eingaben; sie schaffen kein Vertrauen in unbekannte Daten. Die bestehenden
unnormalisierten S03-/Suchvergleichseinstiege verwenden den expliziten
Altvertrag aus ihrem im Speicher erzeugten beziehungsweise bereits gegen Git
geprüften Eingabebestand, getrennt von der danach eingelesenen Prüfdatei.
Diese Helfer dürfen nicht auf die zu prüfende unbekannte Datei angewandt werden,
um ihr anschließend selbst den Status „vertrauenswürdig“ zu bescheinigen.
`historical` bezeichnet den expliziten Altvertrag, keinen durch einen Hash
bewiesenen Entstehungszeitpunkt eines neuen Laufergebnisses.

Ohne expliziten Herkunftsvertrag ist ausschließlich der vollständige,
unveränderte historische Datensatzbestand aus Git-Stand
`617d84a6427de849a9c4c5861abc39c2614f2306` zugelassen. Das ist eine Prüfung der
gesamten historischen Datensatzidentität, kein Vertrauen in eine alte Versions-
oder Politikangabe des Kandidaten. Temporäre Kopien und JSON-Rundläufe derselben
Altzeilen bleiben gültig; unbekannte Dateien benötigen einen separat bestätigten
Vertrag. Historische Rätsel, ihre Texte und gespeicherten Diagnosen werden nicht
migriert. Historische Metadaten mit Dezimalzahlen haben eine eigene kanonische
Quellenhashbildung; die logische Kanonisierung wurde dafür nicht erweitert.

## Grenzen

Der Vertrauensanker liegt außerhalb der Angreiferdaten. Wer auch den vom Prüfer
vertrauten Programmsnapshot oder den unabhängig vorgegebenen erwarteten Digest
ersetzt, ersetzt die Vertrauensentscheidung selbst. Das wird nicht durch einen
weiteren selbst berechneten Hash verhindert. Es gibt keine Signatur, Zeitstempel-
oder vollständige Generatorausführungsattestierung. Ein neuer Erzeugerbeleg
beweist die beim vertrauenswürdigen Erzeuger erfassten Rohhinweise, nicht von sich
aus eine frühere menschliche Urheberschaft oder tatsächliche historische Auswahl.
Ohne solchen Anker behauptet der Prüfer bei unbekannten Kandidaten keinen
vollständigen S04-B-Herkunftsnachweis und weist sie zurück.

## Abgewiesene Manipulationen und Nachtests

Die drei Reviewfälle — `normalization` entfernt, `normalization: null`, H2 samt
allen Referenzen zu `FORGED-ORIGIN` umbenannt — scheitern mit dem vollständigen
Vertrag bei unveränderter wirksamer Definition. Außerdem geprüft:

- fehlendes `preparation`, falsche Politik/Status und Version-1-Downgrade;
- gleichzeitig geänderte Roh-IDs, Referenzen, Rohherkunftshash und Statusfelder;
- veränderter Beleg samt konsistent geänderten Kandidatenfeldern bei festem Digest;
- beschädigte Git-Quellenbindung und verändertes Vertragsinventar;
- bewusst neu gehashter gefälschter Rohsatz bei weiterhin originaler Git-Quelle;
- Rohsatzmutation durch `evaluateCandidate` bei erhaltenem separatem Erzeugerbeleg;
- bisherige beschädigte Quellenabdeckungen, Parameter, Rohfingerprints und Modi.

Gültige historische Zeilen, neue unveränderte Kandidaten und der normalisierte
Referenzfall bestehen jeweils ihren eigenen Vertrag. JSON-Rundlauf, Permutationen,
Hinweisidempotenz und deterministische logische Identität bleiben geprüft.
Die S04-B-Nachweisdatei enthält nur die zusätzlichen Herkunftsfelder; ihre
Routenhashes, Lösungen, Auslassungszahlen, Texte und Suchkosten bleiben gleich.

```sh
node --test tests/contracts/candidate-origin-contract.test.mjs tests/contracts/count-clue-normalization.test.mjs tests/integration/count-clue-normalization.test.mjs
node scripts/report-count-clue-normalization.mjs --check
node scripts/report-b2-stages.mjs --check
```

Lokal: 40 gezielte Tests, 120 relevante Regressionen, 20 Content-Tests und die
Rätselvalidierung bestanden; alle 37 S04-A-Artefakte bytegleich reproduziert.
Die Regressionen umfassen die gespeicherten S03-v1/v2-Nachweise und historischen
Exporte. Kein neuer Generator- oder Pilotlauf und keine vollständige lokal
generatorgestützte Unit-Suite wurden für diese Korrektur gestartet. Der
CI-Abschlussstand des neuen Heads steht im PR.

Die Byte-Erhaltung des Programmcodes wird gegen den tatsächlichen PR-Head
geprüft. GitHub Actions testet zusätzlich einen synthetischen Merge mit dem
aktuellen `main`; dessen unabhängig gemergte Änderungen werden nicht als
S04-B-Änderung ausgegeben. Historische Artefakte werden weiterhin auch im
Arbeitscheckout gegen die unveränderte feste Basis geprüft. Arbeitskopien des
Programmcodes müssen außerdem mit ihrem jeweiligen Checkout übereinstimmen.
