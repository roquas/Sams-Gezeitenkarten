# Feste kataloggerechte Generator-Sollvektoren

`catalog-vectors.json` schützt die Kartenfolge dauerhaft über
`tests/contracts/generator-vectors.test.mjs` im regulären Unitlauf. Drei einzelne
Versuche genügen; es wird kein Batch geschrieben und kein Bild neu geprüft.

| Fall | Versuchsindex / Seeds (Geografie, Zuordnung) | Erwarteter Verlauf |
| --- | --- | --- |
| `accepted-reviewed-attempt` | 1 / 1, 100001 | Ein innerer Versuch, vollständige Belegung, akzeptiert |
| `exhausted-placement-budget` | 0 / 0, 100000 | Ein innerer Versuch, `OBJECT_SPACING_EXHAUSTED`, Budget erschöpft, verworfen |
| `accepted-after-filter-rejection` | 20 / 20, 100020 | Erster innerer Versuch ohne geeigneten Start verworfen; zweiter akzeptiert |

## Herkunft

Die Sollwerte wurden am 28.10.2026 einmalig aus dem unabhängig geprüften
PR-89-Head **`81cf564965887645caf52b7035580b458272e75f`** gewonnen. Dafür wurde ein
separater, unveränderter Checkout dieses Commits verwendet. Ausschließlich dessen
`loadReleasedAssetCatalog`, `createCatalogProfile`, `normalizeBatchOptions` und
`generateBatchRecord` lieferten die Referenzausgaben. Der aktuelle Test erzeugt
nur Istwerte; alle Erwartungen werden aus der JSON-Datei gelesen.

Der akzeptierte Versuch wurde zusätzlich gegen die bereits unabhängig mit dem
Ausgangsstand verglichenen Daten in
[`docs/verification/generation-consolidation.json`](../../../docs/verification/generation-consolidation.json)
abgeglichen: Geografie, Fingerprint, beide Seeds, Versuchsindex und die vollständige
Assetzuordnung stimmen mit `contact.rows` / Versuch 1 überein. Die beiden weiteren
Fälle wurden einmalig am selben geprüften Head ermittelt. Der Retry-Seed 20 wurde
fest ausgewählt; im Testlauf findet keine Seedsuche statt.

Release-ID, Hintergrund und Kataloghash sind im Fixture festgehalten. Die Referenz
lässt sich am genannten Commit mit den gespeicherten `options` und `index` jedes
Falls durch `generateBatchRecord(index, normalizeBatchOptions(options), catalog,
profile)` erneut ausgeben. Die Auswahl der gespeicherten Felder entspricht der
Funktion `observe` im Test. Eine Aktualisierung erfolgt bewusst und außerhalb des
Testlaufs; es gibt keinen automatischen Snapshot-Schreibmodus.

## Abgesicherter Vertrag und Pflege

Verglichen werden exakte Objekt-IDs, Zellmengen und Befahrbarkeiten, Fingerprint,
konkrete Asset-IDs/Anker/Platzierungsreihenfolge, Belegungszahlen und Verwendung,
Annahmeentscheidung und Verwerfungsgründe, beide Seeds und ursprünglicher Index.
Hinzu kommen normalisierte Konfiguration, Algorithmusbezeichner, innere Versuchs-
und Platzierungszahlen sowie die einzelnen Filter-/Platzierungsdiagnosen inklusive
Routenmessung. Große wiederholte Katalogprofile und vollständige Analysemetriken
werden nicht dupliziert; dafür bestehen eigene Vertragstests.

Eine bewusste Änderung der Zufallsdomänen, Auswahl-/Retryreihenfolge, relevanter
Konfigurationsdefaults, geografischer Regeln, Assetauswahl oder Fingerprintbildung
kann neue Sollwerte erfordern. Solche Änderungen müssen fachlich erklärt und die
Herkunft neuer Referenzwerte dokumentiert werden. Ein neuer Release allein ändert
diese Vektoren nicht: Sie bleiben an ihren ausdrücklich gewählten Release gebunden.
Fehlgeschlagene Erwartungen werden nicht ungeprüft aus der aktuellen Implementierung
überschrieben. Dieser PR verändert weder Generator noch Versionen oder Releases.

Ausführung:

```sh
node --test tests/contracts/generator-vectors.test.mjs tests/engine/generation.test.mjs
```

## Verifikation dieser Ergänzung

31 relevante Prüfungen bestanden mit:

```sh
node --test tests/contracts/generator-vectors.test.mjs \
  tests/engine/generation.test.mjs tests/engine/catalog-generation.test.mjs \
  tests/engine/catalog-compliant.test.mjs tests/contracts/target-map-batch.test.mjs
```

Zusätzlich wurde der echte neue Testprozess zweimal mit jeweils einer absichtlich
veränderten gespeicherten Erwartung ausgeführt, ausgewählt über
`--test-name-pattern='fixed generator output: accepted-reviewed-attempt'`:

- Befahrbarkeit des ersten erwarteten Objekts umgedreht. Die Karte blieb nach
  `validateMap(...,{separateObjects:true})` geografisch gültig; der Sollvergleich
  scheiterte dennoch mit Exitcode 1 / `ERR_ASSERTION` am Feld `passable`.
- Ausschließlich den erwarteten Fingerprint durch einen anderen, formal gültigen
  SHA-256-Fingerprint ersetzt: ebenfalls Exitcode 1 / `ERR_ASSERTION` am Feld
  `mapFingerprint`.

Nach jeder Negativprüfung wurden die ursprünglichen Fixturebytes wiederhergestellt.
Der abschließende Lauf der drei Sollvektoren bestand erneut (3/3).
Produktionscode, Versionen, freigegebene Assets und Rätsel sind unverändert.
