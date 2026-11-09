# B2: einzelner redaktioneller Referenzspieltest

Dieser Bestand enthält genau ein neues, von Hand entwickeltes Rätsel. Die
bisherigen S01-/S02-/BC-Bestände bleiben unverändert. Diese Anleitung enthält
keine Lösungspositionen oder entscheidenden Kombinationen.

## Lokal spielen

Voraussetzungen: Node 22+, Python 3; für den ZIP-Export zusätzlich Pillow.

```sh
npm run dev:b2:positive
```

[Referenz öffnen](http://localhost:8000/?dev=b2&stock=POSITIVE&puzzle=B2-POSITIVE-01).
Die bestehende Entwicklungsauswahl bietet das Referenzrätsel und die Probefahrt.
Markierungen, Undo, getrennte Spielstände und Routenprüfung funktionieren wie in
den anderen Entwicklungsbeständen. Keine weiteren Spielhilfen wurden ergänzt.

Bei bereits laufendem Server genügt:

```sh
npm run export:b2 -- --stock POSITIVE
```

## Lokales ZIP für Uberspace

```sh
npm run package:b2:positive
```

Ergebnis: `dist/B2-positive-playtest.zip`. Der Export erstellt die öffentlichen
Referenzdateien neu, prüft sie mit den vorhandenen Validatoren und sammelt die
bisherigen Laufzeitdateien plus genau diese beiden öffentlichen Dateien. Module
werden wie im regulären Paket nach `.js` umgeschrieben. Das ZIP enthält keine
gespeicherte Zielroute, privaten Definitionen, Begründungsgraphen, Diagnosewerte,
Verträge oder Versuchsdaten. S01/S02/BC werden nicht mitgepackt.

Das reguläre `sh scripts/package.sh` und dessen ZIP bleiben unverändert frei von
Entwicklungsrätseln. Der Referenzexport führt keinen Upload aus.

Für eine optionale lokale Kontrolle das ZIP in einen neuen Ordner entpacken:

```sh
reference_stage=$(mktemp -d /tmp/gk-positive-web.XXXXXX)
unzip -q dist/B2-positive-playtest.zip -d "$reference_stage"
find "$reference_stage" -type d -exec chmod 755 {} +
find "$reference_stage" -type f -exec chmod 644 {} +
DEPLOY_ROOT="$reference_stage" python3 tests/deployment/static_host.py
```

[Paket unter Test-Unterpfad öffnen](http://localhost:4174/gk/pr38/?dev=b2&stock=POSITIVE&puzzle=B2-POSITIVE-01).
Für einen späteren manuellen Upload ausschließlich den entpackten Webordner in
einen neuen freien Uberspace-Testpfad kopieren. Alle Host-Elternverzeichnisse
müssen durchsuchbar sein. Einstieg am gewählten Pfad:
`?dev=b2&stock=POSITIVE&puzzle=B2-POSITIVE-01`.
Keinen Repositorycheckout als Webordner verwenden: Er enthält private Nachweise.

## Menschlicher Test und technische Grenzen

Zunächst ohne technische Artefakte spielen. Dabei eigene Teilschlüsse, offene
Alternativen, Stillstände, Hilfen und gedankliches Ausprobieren vollständiger
Routen notieren. Kein vorgegebener Bearbeitungsablauf und keine Zeitvorgabe.
Erst nach dem Spiel mit den privaten Nachweisen vergleichen.

Technisch erreicht die Referenz den vorher festgeschriebenen A–F-Vertrag: eine
eindeutige Lösung, fünf irredundante Hinweise und vollständige lokale Auflösung
mit dem unveränderten Apparat aus #103. Das ist eine positive Kontrollreferenz
für diese Regeln, kein menschlicher Qualitätsnachweis oder allgemeines
Gütesiegel für die Diagnostik. Die Oberfläche speichert weiterhin Feldmarkierungen
und einen Routenzug; alternative Übergangsmengen und Begründungen werden nicht
als neue Werkzeuge eingeführt. Der allgemeine P3-Befund bleibt separat offen,
weil für diese Referenz keine lokalen Deduktionsregeln geändert wurden.

Die Dateien unter `docs/verification/B2-positive/private/` und der dort zugeordnete
Deduktionsvertrag sind ausschließlich technische, lösungshaltige Unterlagen.
Vor dem Spieltest nicht öffnen.

## Technische Prüfung nach dem Spieltest

```sh
npm run report:b2:positive -- --check
node --test tests/contracts/b2-positive.test.mjs
npx playwright test tests/browser/b2-positive.spec.mjs
python3 tests/test_b2_positive_package.py
```

Der erste Befehl prüft die gespeicherten privaten Nachweise bytegenau; er gibt
keinen Lösungsweg aus. Nur bei einer ausdrücklichen redaktionellen Änderung
`--write` verwenden und Änderungen an Vertrag/Nachweisen gemeinsam prüfen.
