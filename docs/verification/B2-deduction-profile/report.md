# B2 – beschreibende Deduktionsprofile

Auswertung gespeicherter Nachweise nach PR #106/#105. Kein Solveraufruf, keine neue Deduktionsregel, kein Generatorlauf. **Keine Schwierigkeitsschätzung, Qualitätsnote oder automatische Auswahl.** Enthält Lösungsschlüsse; kein Spieltestexport.

## Belegte Eigenschaften

| Fall | Einstieg aus ≤2 Hinweisen | Lokal verbleibende Felder S1–S6 | Feste Stunden aus Hinweisen | Lücke Felder / Kanten |
| --- | --- | --- | --- | --- |
| POSITIVE V1 | Stunde 4 (2 Hinweise); Stunde 5 (1 Hinweis) | 1/1/1/1/1/1 | 1, 2, 3, 4, 5, 6 | 0 / 0 |
| POSITIVE V2 | Stunde 4 (2 Hinweise); Stunde 5 (1 Hinweis) | 1/1/1/1/1/1 | 1, 2, 3, 4, 5, 6 | 0 / 0 |
| BC-T02 | keine Festlegung; Alternativmengen mit 3 Feldern | 3/3/9/15/13/18 | keine | 55 / 150 |
| BC-T07 | Stunde 1 (2 Hinweise); Stunde 2 (2 Hinweise) | 1/1/3/4/5/8 | 1, 2 | 16 / 25 |
| BC-T07 + Stunde 3 | keine Festlegung; Alternativmengen mit 2 Feldern | 1/1/1/2/2/4 | keine | 5 / 6 |

Alle fünf vollen Hinweissätze bestimmen exakt alle Stunden und Übergänge. Die Tabelle zeigt den lokalen Apparat. Die Lücken enthalten auch Grenzen der hinweisfreien Legalitätsweitergabe; Basismengen und Basislücke stehen separat im JSON. Start und Vorgaben sind keine aus Hinweisen gewonnenen Erfolge.

### POSITIVE V1

Belegt: Stunde 4: [H2+H3](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L11); Stunde 5: [H3](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L4). Die lokalen Restmengen und exakten Unterschiede beziehen sich auf [H1+H2+H3+H4+H5](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L27).

Alle 32 Teilhinweissätze liegen vor. Kleinster lokaler Hinweisanzahlvektor: **3/4/4/2/1/5**.

Stunde 3: [H1+H2+H3+H4](../../../docs/verification/B2-positive/private/ablations.jsonl#L5); kleinste bekannte Anzahl 4 (Minimum belegt).

Abschluss Stunde 6: Wiederbesuchsverbot nach bereits belegten Positionen. Die Festlegung von Stunde 3 trägt im gespeicherten Zertifikat dazu bei. Weitere Prämissen und Trace-IDs stehen im Profil; daraus folgt keine notwendige menschliche Reihenfolge.

Nachweise: [versioniertes Profil](V1.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.

### POSITIVE V2

Belegt: Stunde 4: [H2+H3](../../../docs/verification/B2-positive-v2/private/states.jsonl#L7); Stunde 5: [H3](../../../docs/verification/B2-positive-v2/private/states.jsonl#L5). Die lokalen Restmengen und exakten Unterschiede beziehen sich auf [H1+H2+H3+H4+H5+H6](../../../docs/verification/B2-positive-v2/private/states.jsonl#L64).

Alle 64 Teilhinweissätze liegen vor. Kleinster lokaler Hinweisanzahlvektor: **3/4/4/2/1/5**.

Stunde 3: [H1+H2+H3+H6](../../../docs/verification/B2-positive-v2/private/states.jsonl#L40); kleinste bekannte Anzahl 4 (Minimum belegt).

Abschluss Stunde 6: Wiederbesuchsverbot nach bereits belegten Positionen. Die Festlegung von Stunde 3 trägt im gespeicherten Zertifikat dazu bei. Weitere Prämissen und Trace-IDs stehen im Profil; daraus folgt keine notwendige menschliche Reihenfolge.

Nachweise: [versioniertes Profil](V2.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.

### BC-T02

Belegt: Kein zusätzlicher Stundenanker aus Einzelhinweisen oder Paaren. Die lokalen Restmengen und exakten Unterschiede beziehen sich auf [H1+H2+H3+H4+H5+H6](../../../docs/verification/B2-deduction/T02.jsonl#L43).

43/64 Teilhinweissätze liegen vor; **21 sind unbekannt**. Pro Erkenntnis wird nur bei Abdeckung sämtlicher kleineren Kombinationen ein Minimum behauptet.

Darstellungsgrenze im lokalen Rest: Stunde 1→2: A3→A2, B3→B2, B4→C3. Die Feldmarkierungen speichern diese Zuordnungen nicht.

Nachweise: [versioniertes Profil](T02.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.

### BC-T07

Belegt: Stunde 1: [H4+H5](../../../docs/verification/B2-deduction/T07.jsonl#L24); Stunde 2: [H4+H5](../../../docs/verification/B2-deduction/T07.jsonl#L24). Die lokalen Restmengen und exakten Unterschiede beziehen sich auf [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07.jsonl#L65).

65/128 Teilhinweissätze liegen vor; **63 sind unbekannt**. Pro Erkenntnis wird nur bei Abdeckung sämtlicher kleineren Kombinationen ein Minimum behauptet.

Darstellungsgrenze im lokalen Rest: Stunde 3→4: B2→B3, C1→B1, C1→B2, C3→B2, C3→B3, C3→B4. Die Feldmarkierungen speichern diese Zuordnungen nicht.

Nachweise: [versioniertes Profil](T07.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.

### BC-T07 + Stunde 3

Belegt: Kein zusätzlicher Stundenanker aus Einzelhinweisen oder Paaren. Die lokalen Restmengen und exakten Unterschiede beziehen sich auf [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L65).

65/128 Teilhinweissätze liegen vor; **63 sind unbekannt**. Pro Erkenntnis wird nur bei Abdeckung sämtlicher kleineren Kombinationen ein Minimum behauptet.

Darstellungsgrenze im lokalen Rest: Stunde 4→5: B1→A2, B2→C3. Die Feldmarkierungen speichern diese Zuordnungen nicht.

Exakt, lokal nicht erklärt: Stunde 4: [H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L29); Stunde 5: [H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L29); Stunde 6: [H3+H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L60).

Die Vorgabe in Stunde 3 sowie die daraus schon ohne Hinweise folgenden Stunden 1 und 2 zählen nicht als Erfolge aus Hinweisen.

Nachweise: [versioniertes Profil](T07-given-3.json); jeder Befund verweist auf einen Quellzustand, lokale Festlegungszeugen zusätzlich auf Trace-Schritte.

## Vergleich der Lösungsstruktur

V1 und V2 teilen den sofort markierbaren Anker Stunde 5, den Anker Stunde 4 aus H2+H3 und den Hinweisanzahlvektor **3/4/4/2/1/5**. Beide besitzen unter H1 kleine frühe Alternativmengen und gekoppelte Übergänge; der Abschluss nutzt die Belegung von Stunde 3 und das Wiederbesuchsverbot. Die Quellen dieser Gemeinsamkeiten stehen in `entryOffer`, `clueWitnesses`, `representation.smallEntryCouplings` und `milestones` der beiden Profile.

Der Zeuge für Stunde 3 unterscheidet sich: V1 H1+H2+H3+H4, V2 H1+H2+H3+H6. Bei V2 ist H6 eine wirksame Mehrstundenzählung mit innerem Zählziel. Sie ist für diesen Zeugen notwendig. Ein neuer Mechanismus bedeutet somit nicht automatisch einen neuen Gesamtverlauf. T02 erreicht keine weitere feste Stunde; T07 gewinnt einen frühen Anker und bleibt später offen. Die Vorgabe verkleinert T07s Rest, beseitigt die gekoppelten Alternativen aber nicht.

## Mögliche spielerische Interpretationen

Markierbare Anker und kleine Feldmengen könnten Zwischenfortschritt erleichtern. Gemeinsame Anker- und Abschlussmuster könnten Wiederholungen in einer Tagesrätselserie sichtbar machen. Gekoppelte Übergänge könnten Gedächtnisarbeit verlangen; auch die positiven Referenzen enthalten solche Kopplungen. Keine dieser Deutungen ist eine automatische Bewertung. Die menschlichen Beobachtungen aus dem Analyseauftrag bleiben eigenständige Evidenz: V1 angenehm und eher leicht, V2 angenehm und ähnlich erlebt, T02/T07 schwieriger und teilweise frustrierend.

## Unbekannt und Grenzen

Entdeckbarkeit, Bedienaufwand, Gedächtnislast, Freude und menschliche Bearbeitungsreihenfolge sind nicht gemessen. Die Trace-Reihenfolge ist keine Spielerreihenfolge. Zertifikatsvorfahren sind ausreichend, aber nicht zwingend minimal; alternative bekannte Hinweiszeugen ersetzen keine vollständige Sammlung menschlicher Argumente. Es wird keine technische Graphentiefe als Denktiefe ausgegeben. Lokale Kanten müssen nicht zu einer legalen Gesamtroute erweiterbar sein. Auch Nachbarschaft erzeugt Kopplungen; höhere Korrelationen fehlen.

## Reproduktion

`npm run report:b2:profile` zeigt diesen Bericht; `-- --check` prüft die fünf JSON-Dateien und diesen Bericht bytegenau; `-- --write` erneuert ausschließlich diese sechs Dateien. Datenformat und Methodik: [Dokumentation](../B2-deduction-profile.md).
