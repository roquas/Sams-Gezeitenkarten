# Menschliche Spielbeobachtungen

**Enthält Lösungsschlüsse.** Die [Sammlung v1](human-playtests.v1.json) enthält
30 getrennte Datensätze: A/B/C/D, POSITIVE V1/V2, BC-T02/T07, die künstliche
T07-S3-Kontrolle, zehn historische Serienpositionen, alle neun S03-v2-Berichte
und zwei ausdrücklich nur technisch untersuchte S01-Kontrollen ohne Spielurteil.
Sie ist die zentrale Erfahrungsevidenz für künftige Diagnose- und Generatorarbeit.
Die [S04-A-Etappenberichte](../verification/S04-A/examples/report.md) sind
getrennte technische Nachweise, keine automatische Bewertung dieser Erfahrungen.

H1 = Hinweis 1, S1 = Stunde 1, S0 = bekannte Startposition.

## Herkunft und Leseregeln

Jeder Datensatz hat eine stabile Beobachtungs-ID, die unveränderte Rätselkennung,
den dokumentierten Spielstatus, Quellen mit Zeilennummern, die ausdrücklich als
Zusammenfassung gekennzeichnete Spielerangabe und offene Unsicherheiten.
`playerAccount` enthält Erfahrung; `technicalFindings` und `laterInterpretations`
sind getrennte, hier leere Felder. Ein technischer Trace ersetzt keine fehlende
Spielerangabe. `actuallyPlayed: null` heißt unbekannt, nicht ungespielt;
`documentedStatus: technical-only` heißt nur technisch dokumentiert.

| Quelle | Verwendung | Aussagegrenze |
| --- | --- | --- |
| [S04-A-Auftrag, inhaltlich unveränderte Eingabe](sources/s04-a-request.md) | belegbare Zusammenfassungen für A/B/C/D und historische Kontrollen | kein vollständiger älterer Spielerwortlaut |
| [S03-Analyse, unveränderte Auszüge](sources/s03-analysis-excerpts.md) | neun konkrete S03-Verläufe, Zuordnung 01–09, bekannte Abweichungen | Sekundärquelle; ursprüngliches `auftrag.md` und Rohdateien nicht verfügbar |
| [Nachlieferung Zehnerserie](sources/ten-series-supplement.md) | Zusammenfassungen tatsächlicher Primärbeobachtungen aus dem damaligen Spieltestchat | vom Nutzer bereitgestellte Zusammenfassung, kein Chattranskript |
| [V2-Spielbeobachtung](../verification/B2-positive-v2-playtest-observation.md) | bereits gespeicherte qualitative Beobachtung | keine konkrete Schlussreihenfolge |
| [Historischer Profilvergleich](../verification/B2-deduction-profile/report.md) | sekundär belegte Einordnungen V1/T02/T07 | knappe historische Zusammenfassung |

Beim Speichern des Auftrags wurden ausschließlich die Markdown-Umbruchleerzeichen
am Zeilenende entfernt. SHA-256 bindet jede gespeicherte Quelle im JSON. Zeilenangaben beziehen sich auf diese
gespeicherte Fassung. Die Auszüge bewahren die betreffenden Formulierungen des
bereitgestellten Analyseberichts; verlinkte externe Rohdateien werden dadurch
nicht als vorhanden behauptet. Die Sammlung wird manuell kuratiert. Sie wird
nicht aus technischen Profilen oder aus einer Qualitätsmetrik erzeugt.

## Explizite Korrekturen und Unsicherheiten

- A/B/C/D besitzen belegte menschliche Beobachtungen. Die frühere Einordnung
  „unbekannt“ in der S03-Analyse ist durch den aktuellen Auftrag korrigiert;
  eingefrorene historische Diagnoseartefakte werden dafür nicht umgeschrieben.
- Zehnerserie 03 wurde bereits früher gespielt. Das einzige hier belegte
  Originalzitat lautet: „Hatte ich schon gelöst, k.A. was ich Dir dazu schrieb :-)“.
  Es gibt kein neues Urteil und keine rekonstruierte alte Bewertung.
- Zehnerserie 05 verwendet die verbindliche Kennung der nachgelieferten Übersicht
  `B2-S02-M015-E4-R00-V01`. Die im Bericht geschriebene Kennung
  `B2-S02-M015-A4-R00-V01` bleibt unter `identityUncertainty` erhalten.
  Die Zuordnung beruht auf Testposition und Kontext; sie ist kein fehlerfrei
  verifizierter Identitätsnachweis. Die ursprüngliche Übersicht selbst liegt
  hier nicht als separate Datei vor.
- S03-01/03/08 nennen Zwischenmengen oder Markierungen, die nicht mit isolierten
  technischen Hinweis-Fixpunkten gleichgesetzt werden dürfen. Diese Differenzen
  bleiben in `uncertainties` erhalten; Spielerangaben werden nicht nachträglich
  an den lokalen Apparat angepasst.
- V1/V2 sind verwandte Konstruktionen, T07 mit S3-Vorgabe ist eine künstliche
  Kontrolle. Daraus werden keine unabhängigen Stichproben gemacht.

Weder Spielzeiten noch Klickzahlen oder eigene Schwierigkeitsgrade werden ergänzt.
Wörter wie „leicht“, „langweilig“ oder „mittelschwer“ sind ausschließlich belegte
subjektive Angaben. Keine Gewichte, automatisch erzeugten Qualitätslabels oder
Generatorfilter konsumieren die Sammlung.

## Fortschreiben

Neue tatsächlich beobachtete Tests als neue Datensätze mit eigener Quellenbindung
ergänzen; Wiederholungen und Vorwissen benennen. Frühere Daten nicht still durch
technische Annahmen ersetzen. Vollständige Primärprotokolle können später die
Sekundärzusammenfassung ergänzen, ohne deren Herkunft zu überschreiben.
`tests/contracts/b2-play-observations.test.mjs` prüft Pflichtfelder, Quellen,
Bestandskennungen, Wiederholung, Identitätsabweichung und fehlende Urteile.
