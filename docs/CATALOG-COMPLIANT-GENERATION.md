# Kataloggerechte Kartengenerierung

Dies ist der einzige unterstützte Weg zu verwendbaren generierten Seekarten.
Ein ausdrücklich freigegebener Katalog liefert geografische Formen und Kapazitäten;
der Generator erzeugt die Geografie, die getrennte Assetzuordnung belegt sie.
Nur geografisch gültige Karten mit vollständiger Motivbelegung werden akzeptiert.
Noch keine Start-/Zielroutenwahl, Hinweis- oder Rätselgenerierung und keine Veröffentlichung.

## Einstieg und CLI

Node 22+, Git und die vollständige Quellhistorie sind erforderlich. Release und
Hintergrund werden explizit angegeben. Der Releaseadapter liest geprüfte Daten
und unveränderte Grafikbytes aus Git; Python ist erst für das Dekodieren einer
Kontaktübersicht nötig. Programmdateien unter `src/` und `scripts/` müssen für
Batch und Replay sauber und committed sein.

```sh
node scripts/generate-map-batch.mjs run \
  --release gk-catalog-release-v1-sha256-cf40f75ef70ec0ce1455c5de1e8ce99d08a57cd29ec4c202aae9c86a7a5a6ed1 \
  --background sea-blue-01 \
  --target-count 1000 --max-attempts 5000 \
  --seed-start 0 --assignment-seed-start 100000 \
  --out /tmp/gezeitenkarten-batch
```

Pflichtoptionen: `--release`, `--background`, `--target-count`, `--max-attempts`,
`--seed-start`, `--out`. Optional: `--assignment-seed-start` (Standard:
Generierungsseed), `--config <JSON-Datei>`, `--repository <Katalogcheckout>`.
Das Ausgabeverzeichnis darf noch nicht existieren. Es gibt keinen Modusparameter.
Unbekannte und doppelte Optionen werden abgewiesen. Das Budget zählt äußere
Versuche, die Zielzahl ausschließlich akzeptierte Karten. Bei Budgeterschöpfung
endet der Lauf regulär mit `target-unreached` und der tatsächlich erreichten Zahl;
unerwartete Programm-, Release- und Schreibfehler beenden ihn erfolglos.

## Reine Dienste

```js
const catalogProfile = createCatalogProfile(catalog);
const generation = generateMap({seed: 42, config, catalogProfile});
if (generation.status === 'generated') {
  const assignment = assignAssets({map: generation.map, seed: 100042, catalog});
  // Erst assignment.status === 'complete' ergibt eine verwendbare Karte.
}
```

`createCatalogProfile` liefert ausschließlich `catalog-capacities-1`, Kataloghash,
zulässige Platzierungen `{cells, passable}` und Formkapazitäten. Weder Asset-IDs
noch Renderdaten gelangen in den Generator. `generateMap` verlangt dieses Profil.
`assignAssets` verwendet immer die globale Zuordnung: unbefahrbare Motive einmal,
befahrbare zuerst möglichst verschieden und anschließend möglichst selten genutzt.
`partial` und `none` bleiben ausdrückbare Fehlerdiagnosen und Verwerfungsgründe.
Sie sind keine verwendbaren Kartenergebnisse. Profilkapazitäten ersetzen nicht
die abschließende konkrete Zuordnung, insbesondere bei positionsabhängigen Engpässen.

Konfiguration:

| Feld | Standard und Bedeutung |
| --- | --- |
| `objectCount` | `{min:2,max:7}`; alternativ feste Anzahl, einschließlich 0 |
| `objectSizes` | `[1,2,3,4]`; nur passende freigegebene Formen werden gewählt |
| `passableProbability` | `0.5` |
| `maxMapAttempts` | `20`; 1–1000 innere Kandidaten je äußerem Versuch |
| `analysis` | `{steps:[],maxNodes:10000}`; Routenmessung, 1–6 Schritte |
| `filters` | `{routeSteps:[],minLargestComponent:0}`; nur ausdrücklich aktivierte Eignungsfilter |

Alle Parameter werden streng validiert und kanonisiert. Der wirkungslose alte
Parameter `maxPlacementAttempts` entfällt: jeder Objektversuch wählt direkt aus
der aktuell zulässigen Platzierungsmenge. Fehlende Passierbarkeit, Formgröße,
Kapazität oder Platzierung führt zu einer konkreten Diagnose ohne Regelaufweichung.

## Geografischer Vertrag

- Nur kataloggedeckte Formen und Befahrbarkeiten; vollständige Bebilderbarkeit
  wird nach der Geografie mit den konkreten Motiven geprüft.
- Grafiken werden weder rotiert, gespiegelt noch verändert.
- Verschiedene Objekte teilen keine Hexkante. Es gibt keinen zusätzlichen Randabstand.
- Unbefahrbare Motive höchstens einmal; befahrbare dürfen nach bevorzugter Vielfalt wiederholt werden.
- Geografie, konkrete Motivbelegung und spätere Rätsellogik bleiben getrennt.

Diese Regeln gelten für den Generatorvertrag. Die allgemeine Hexgeometrie,
`validateMap` und veröffentlichte Rätsel erhalten ihre bisherigen Verträge.
Die Objektabstandsprüfung wird ausdrücklich über `separateObjects:true` gewählt;
sie wird keine neue allgemeine Grundannahme der Engine. Künftige Regeländerungen
entwickeln diesen einen Vertrag weiter; es werden keine vorsorglichen Strategien implementiert.

## Zielzahlbatch und Format 3

`manifest.json` speichert normalisierte Optionen, Kapazitätsprofil,
Algorithmusversionen, Programmcommit/Node-Version und Releaseprovenienz.
`candidates.jsonl` enthält jeden ursprünglichen Versuch samt beiden Seeds,
Geografie, Analyse, Fingerprint, Assetzuordnung, `decision` und `rejectionReasons`.
`accepted.jsonl` ist die unveränderte, geordnete Teilfolge akzeptierter Datensätze.
Der Ergebnisindex ist dessen nullbasierte Zeilenposition; `index` bleibt immer
der ursprüngliche Versuchsindex. Seeds sind jeweils Startseed + Versuchsindex;
Überläufe über uint32 werden vor Beginn abgewiesen.

`summary.json` entsteht erst atomar nach regulärem Abschluss. Sie enthält Ziel,
Budget, tatsächliche Versuch-/Ergebniszahlen, Verwerfungsgründe sowie getrennte
Analyse-/Belegungsstatistiken für alle Versuche und akzeptierte Karten. Sie
bewahrt exakte und begrenzte Routenmessungen samt Suchbudgetkennzeichnung;
Einzigartigkeit und Qualitätsranking sind keine Annahmebedingungen.

**Warum eine neue Formatnummer:** Die gespeicherte Struktur ändert sich tatsächlich:
`options.mode`, `options.preferencePercent`, `versions.catalogGenerator`,
`config.maxPlacementAttempts` sowie die nur für Wachstums-/Präferenzstrategien
benötigten Zähler `preferenceDraws`, `growthPlacements`, `catalogMisses` entfallen.
Deshalb wird Format 3 eingeführt. Format 2 künstlich mit bedeutungslosen Feldern
fortzuführen würde die entfernten Verträge weitertragen. Es gibt weder Migration
noch produktive Leser für Format 1 oder 2; historische Batches werden mit ihrem
aufgezeichneten Gitcommit reproduziert.

Der Generator heißt `catalog-compliant-maps-2` wegen des geänderten Diagnose- und
Konfigurationsvertrags. Seine Zufallsdomänen bleiben ausdrücklich
`catalog-compliant-maps-1/<innerer Versuch>/layout`, `/passability`, `/placement`.
Zuordnung (`catalog-assignment-1/selection`), Seedfolge, geografische Regeln und
Identitätsdefinitionen bleiben gleich. Der [Batchnachweis](verification/generation-consolidation.md)
vergleicht Karten, Belegungen und Entscheidungen mit dem Stand nach PR #88/#86.

## Replay und Sichtung

```sh
node scripts/generate-map-batch.mjs replay \
  --batch /tmp/gezeitenkarten-batch --index 1402 --out /tmp/versuch-1402.jsonl
node scripts/render-map-contact-sheet.mjs \
  --batch /tmp/gezeitenkarten-batch --accepted-indices 0,1,500,999 \
  --out /tmp/gezeitenkarten-kontakt
```

Replay zählt ursprüngliche Versuche, einschließlich verworfener. Es verlangt den
aufgezeichneten sauberen Programmcommit, Versionen, Profil, stabile Provenienz
und einen vollständig identischen Datensatz. Ein späterer Archivcommit allein
ändert die Releaseidentität nicht. Einzelne vollständige Zeilen bleiben nach
Abbruch replayfähig, auch ohne Abschlusszusammenfassung.

Die [Kontaktübersicht](MAP-CONTACT-SHEET.md) akzeptiert ausschließlich Ergebnisindizes
vollständiger Karten im aktuellen Format. Sie zeigt beide Indexräume, Seeds,
Fingerprints, konkrete Asset-IDs/Anker und Provenienz, ohne neue Karten zu generieren.

## Tests und Grenzen

```sh
npm run test:all
npm run test:assets
npx playwright test --config playwright.webkit.config.mjs
python3 tests/test_package.py
```

Die Generator-, Batch-, Replay-, Diagnose- und Kontaktübersichtstests gehören zum
regulären Unitlauf; Offline-Sichtung gehört zu den Chromium-/WebKit-Browsertests.
Der [Nachweis](verification/generation-consolidation.md) enthält vollständige
Ergebnisse, den realen 1.000-Karten-Lauf und die bewertete Altlastensuche.

Begrenzte zufällige Packung ist kein Vollständigkeitsbeweis; eine packbare
Konfiguration kann ihr Budget erschöpfen. Keine Gleichverteilung, garantierte
Einzigartigkeit oder menschliche Rätselqualität. Die spätere Rätselgenerierung
kann an gültiger Karte und konkreter Belegung ansetzen, ohne einen Generierungsmodus
zu kennen. Start-/Zielroute, Hinweise und redaktionelle Freigabe bleiben zukünftige Arbeit.
