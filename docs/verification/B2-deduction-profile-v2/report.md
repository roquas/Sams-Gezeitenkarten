# B2 – markierbare Zwischenfortschritte

Profilversion 2 ergänzt die fünf bisherigen Merkmalsfamilien. Alle Daten stammen aus gespeicherten Zuständen. Die Auswertung ist rein lesend, ohne Solver- oder Generatorlauf. **Enthält Lösungsschlüsse; keine Qualitätsnote oder Schwierigkeitsschätzung.**

**C: markierbarer Ausschluss ohne feste Stunde.** Im Zustand [H1+H2](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L7) gibt es 0 zusätzliche feste Stunden. Trotzdem belegt D19 (`count-bounds`) für Stunde 4 **× {B2, B3, B4, C1, C5}**. Erreichbare Hinweiszeugen: H1+H2; direkte Prämissen: D11, D18, D15. Dieser Fortschritt wird gleichwertig zu einer Feldfestlegung sichtbar.

× bedeutet sicher ausgeschlossen, ? lokal noch nicht ausgeschlossen und ✓ eine eindeutige Stundenposition. Fragezeichen beweisen keine Erweiterbarkeit zu einer legalen Route. Alle Markierungen beziehen sich auf dieselbe hinweisfreie Basis einschließlich möglicher Vorgaben.

Die Tabellen sind fest dokumentierte Lesebeispiele. Sie erhalten unterschiedliche bekannte Hinweiszeugen und mögliche Einstiege, geben aber weder eine menschliche Reihenfolge noch einen optimalen Lösungsplan vor. Ein Pfeil zwischen Trace-IDs belegt nur eine zitierte Prämisse. Zertifikatsvorfahren sind ausreichend, nicht zwingend minimal.

| Fall | Lokal feste Stunden aus Hinweisen | Feldanzahlen S1–S6 im Vollsatz | Lücke Felder/Kanten |
| --- | --- | --- | --- |
| A | 1, 2, 3, 4, 5, 6 | 1/1/1/1/1/1 | 0/0 |
| B | 1, 2, 3, 4, 5, 6 | 1/1/1/1/1/1 | 0/0 |
| C | 1, 2, 3, 4, 5, 6 | 1/1/1/1/1/1 | 0/0 |
| D | 1, 6 | 1/2/2/2/2/1 | 4/6 |
| V1 | 1, 2, 3, 4, 5, 6 | 1/1/1/1/1/1 | 0/0 |
| V2 | 1, 2, 3, 4, 5, 6 | 1/1/1/1/1/1 | 0/0 |
| T02 | keine | 3/3/9/15/13/18 | 55/150 |
| T07 | 1, 2 | 1/1/3/4/5/8 | 16/25 |
| T07-given-3 | keine | 1/1/1/2/2/4 | 5/6 |

## A – B2-S02-M010-E4-R00-V01

**H1 allein trägt bereits alle sechs Stunden.** Ein Mehrhinweis-Kombinationsschluss ist für diese vollständige lokale Lösung nicht erforderlich.

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1](../../../docs/verification/B2-deduction-progress/private/A.jsonl#L2) | Stunde 1: × {D4, E5}; ✓ E3 | D19 (`count-bounds`; H1); bekannte Weitergabe z. B. D19→D25 |
| [H1](../../../docs/verification/B2-deduction-progress/private/A.jsonl#L2) | Stunde 2: × 7 Felder (im JSON vollständig); ✓ D2 | D25 (`no-revisit-singleton`; H1) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D25→D30 |

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](A.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## B – B2-S02-M000-A1-R00-V01

B besitzt getrennte bekannte Hinweiszeugen und einen Verbindungsschluss; eine menschliche Qualitätsbewertung wird nicht ergänzt.

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L2) | Stunde 1: × {A2}; ✓ B1 | D19 (`count-bounds`; H1); bekannte Weitergabe z. B. D19→D20 |
| [H2+H3](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L7) | Stunde 3: × {A2, A3, A4, B1, B3, C2}; ✓ B2 | D39 (`successor-support`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D39→D40 |
| [H2+H3](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L7) | Stunde 4: × 10 Felder (im JSON vollständig); ✓ C2 | D31 (`successor-support`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D31→D32 |
| [H2+H3](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L7) | Stunde 5: × 15 Felder (im JSON vollständig); ✓ D2 | D45 (`successor-support`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D45→D46 |
| [H2+H3](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L7) | Stunde 6: × 18 Felder (im JSON vollständig); ✓ E1 | D42 (`distance-pair`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D42→D44 |
| [H1+H2+H3](../../../docs/verification/B2-deduction-progress/private/B.jsonl#L8) | Stunde 2: × {A3, B1, B2, B3}; ✓ A2 | D38 (`distance-pair`; H1+H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D38→D40 |

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](B.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## C – B2-BC-T06-M005-E3-R00

Die ersten beiden Paarzustände sind alternative nutzbare Teilbefunde, keine erzwungene Reihenfolge. Beim markierten D19-Beispiel zeigt × nur dessen fünf Ausschlüsse; ? zeigt den Fixpunkt des gesamten Zustands einschließlich weiterer Propagation.

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1+H2](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L7) | Stunde 4: × {B2, B3, B4, C1, C5}; ? 10 Felder (im JSON vollständig) | D19 (`count-bounds`; H1+H2); bekannte Weitergabe z. B. D19→D22 |
| [H1+H3](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L8) | Stunde 1: × {D3, D4, E2, E4}; ✓ D2 | D38 (`successor-support`; H1+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D38→D43 |
| [H1+H3](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L8) | Stunde 2: × 11 Felder (im JSON vollständig); ✓ D1 | D24 (`successor-support`; H1+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D24→D25 |
| [H1+H3](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L8) | Stunde 3: × 16 Felder (im JSON vollständig); ✓ C1 | D25 (`predecessor-support`; H1+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D25→D26 |
| [H1+H2+H3](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L17) | Stunde 4: × 20 Felder (im JSON vollständig); ? {B1, C2} | D33 (`no-revisit-singleton`; H1+H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D33→D40 |
| [H1+H2+H3+H4](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L32) | Stunde 4: × 21 Felder (im JSON vollständig); ✓ B1 | D40 (`successor-support`; H1+H2+H3+H4) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D40→D44 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L27) | Stunde 5: × 23 Felder (im JSON vollständig); ✓ A1 | D34 (`count-bounds`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D34→D40 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-deduction-progress/private/C.jsonl#L27) | Stunde 6: × 23 Felder (im JSON vollständig); ✓ A2 | D43 (`predecessor-support`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON) |

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](C.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## D – B2-S02-M017-C3-R00-V02

Stunde 6 ist im frühen H1+H2+H5-Zustand als Alternativmenge markierbar, noch nicht als sichere Position. „H6“ bezeichnet hier Stunde 6, keinen sechsten Hinweis.

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L2) | Stunde 1: × {C2, D3}; ? {B2, B3, B4, C4} | D16 (`count-bounds`; H1); bekannte Weitergabe z. B. D16→D17 |
| [H2](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L3) | Stunde 1: × {B3, B4, C2, C4}; ? {B2, D3} | D16 (`count-bounds`; H2); bekannte Weitergabe z. B. D16→D17 |
| [H1+H2](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L7) | Stunde 1: × {B3, B4, C2, C4, D3}; ✓ B2 | D17 (`count-bounds`; H1+H2) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D17→D18 |
| [H1+H2+H5](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L19) | Stunde 6: × 16 Felder (im JSON vollständig); ? {B3, B4, C2, C4, D3} | D23 (`no-revisit-singleton`; H1+H2+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D23→D32 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L27) | Stunde 3: × 19 Felder (im JSON vollständig); ? {A1, A2} | D37 (`count-bounds`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D37→D41 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L27) | Stunde 4: × 19 Felder (im JSON vollständig); ? {A1, A2} | D38 (`count-bounds`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D38→D42 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-deduction-progress/private/D.jsonl#L27) | Stunde 6: × 20 Felder (im JSON vollständig); ✓ B3 | D46 (`predecessor-support`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON) |

**Relationale Restalternativen:** Stunde 2→3: {A2→A1, B1→A1, B1→A2}; Stunde 3→4: {A1→A2, A2→A1}; Stunde 4→5: {A1→A2, A2→A3}. Feldmarkierungen können die Endpunkte festhalten, ihre Zuordnungen bleiben in der heutigen GUI unvollständig darstellbar. Lokale Kanten sind keine bewiesenen Restwege.

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](D.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## V1 – POSITIVE V1

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L2) | Stunde 1: ? {A2, B1} (bereits Basis) | Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext |
| [H1](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L2) | Stunde 2: × {A2, A3, B1, B3}; ? {B2, C1} | D20 (`predecessor-support`; H1); bekannte Weitergabe z. B. D20→D21 |
| [H3](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L4) | Stunde 5: × 21 Felder (im JSON vollständig); ✓ D2 | D19 (`direct-hour`; H3); bekannte Weitergabe z. B. D19→D20 |
| [H2+H3](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L11) | Stunde 4: × 17 Felder (im JSON vollständig); ✓ D1 | D25 (`successor-support`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D25→D28 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L27) | Stunde 3: × 10 Felder (im JSON vollständig); ✓ C2 | D42 (`successor-support`; H1+H2+H3+H4) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D42→D43 |
| [H1+H2+H3+H4+H5](../../../docs/verification/B2-positive/private/diagnosis.jsonl#L27) | Stunde 6: × 23 Felder (im JSON vollständig); ✓ E2 | D43 (`no-revisit-singleton`; H1+H2+H3+H4+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D43→D45 |

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](V1.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## V2 – POSITIVE V2

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1](../../../docs/verification/B2-positive-v2/private/states.jsonl#L2) | Stunde 1: ? {A2, B1} (bereits Basis) | Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext |
| [H1](../../../docs/verification/B2-positive-v2/private/states.jsonl#L2) | Stunde 2: × {A2, A3, B1, B3}; ? {B2, C1} | D20 (`predecessor-support`; H1); bekannte Weitergabe z. B. D20→D21 |
| [H3](../../../docs/verification/B2-positive-v2/private/states.jsonl#L5) | Stunde 5: × 21 Felder (im JSON vollständig); ✓ D2 | D19 (`direct-hour`; H3); bekannte Weitergabe z. B. D19→D20 |
| [H2+H3](../../../docs/verification/B2-positive-v2/private/states.jsonl#L7) | Stunde 4: × 17 Felder (im JSON vollständig); ✓ D1 | D25 (`successor-support`; H2+H3) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D25→D28 |
| [H1+H2+H3+H4+H5+H6](../../../docs/verification/B2-positive-v2/private/states.jsonl#L64) | Stunde 3: × 10 Felder (im JSON vollständig); ✓ C2 | D43 (`successor-support`; H1+H2+H3+H4+H6) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D43→D44 |
| [H1+H2+H3+H4+H5+H6](../../../docs/verification/B2-positive-v2/private/states.jsonl#L64) | Stunde 6: × 23 Felder (im JSON vollständig); ✓ E2 | D44 (`no-revisit-singleton`; H1+H2+H3+H4+H5+H6) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D44→D46 |

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](V2.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## T02 – BC-T02

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H1+H4](../../../docs/verification/B2-deduction/T02.jsonl#L10) | Stunde 1: × {A5, B5}; ? {A3, B3, B4} | D21 (`successor-support`; H1+H4); bekannte Weitergabe z. B. D21→D22 |
| [H1+H4](../../../docs/verification/B2-deduction/T02.jsonl#L10) | Stunde 2: × 7 Felder (im JSON vollständig); ? {A2, B2, C3} | D22 (`predecessor-support`; H1+H4) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D22→D23 |

**Relationale Restalternativen:** Stunde 1→2: {A3→A2, B3→B2, B4→C3}; Stunde 2→3: 12 gerichtete Übergänge (im JSON vollständig); Stunde 3→4: 39 gerichtete Übergänge (im JSON vollständig); Stunde 4→5: 46 gerichtete Übergänge (im JSON vollständig); Stunde 5→6: 53 gerichtete Übergänge (im JSON vollständig). Feldmarkierungen können die Endpunkte festhalten, ihre Zuordnungen bleiben in der heutigen GUI unvollständig darstellbar. Lokale Kanten sind keine bewiesenen Restwege.

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](T02.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## T07 – BC-T07

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [H4+H5](../../../docs/verification/B2-deduction/T07.jsonl#L24) | Stunde 1: × {C4, D5, E3, E4, E5}; ✓ D3 | D24 (`successor-support`; H4+H5); bekannte Weitergabe z. B. D24→D32 |
| [H4+H5](../../../docs/verification/B2-deduction/T07.jsonl#L24) | Stunde 2: × 11 Felder (im JSON vollständig); ✓ C2 | D18 (`count-bounds`; H4+H5) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D18→D19 |
| [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07.jsonl#L65) | Stunde 3: × 16 Felder (im JSON vollständig); ? {B2, C1, C3} | D55 (`successor-support`; H1+H2+H3+H4+H5+H7) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D55→D56 |
| [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07.jsonl#L65) | Stunde 4: × 19 Felder (im JSON vollständig); ? {B1, B2, B3, B4} | D56 (`predecessor-support`; H1+H2+H3+H4+H5+H7) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D56→D57 |

**Relationale Restalternativen:** Stunde 3→4: {B2→B3, C1→B1, C1→B2, C3→B2, C3→B3, C3→B4}; Stunde 4→5: {B1→A2, B2→A2, B2→C3, B3→A4, B3→B4, B4→C5}; Stunde 5→6: 14 gerichtete Übergänge (im JSON vollständig). Feldmarkierungen können die Endpunkte festhalten, ihre Zuordnungen bleiben in der heutigen GUI unvollständig darstellbar. Lokale Kanten sind keine bewiesenen Restwege.

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](T07.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## T07-given-3 – BC-T07 + Stunde 3

| Bekannter Zustand | Zusätzlicher feldbezogener Befund am Fixpunkt | Regelzeugen / Begründungsweitergabe |
| --- | --- | --- |
| [none](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L1) | Stunde 1: ✓ D3 (bereits Basis) | Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext |
| [none](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L1) | Stunde 2: ✓ C2 (bereits Basis) | Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext |
| [none](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L1) | Stunde 3: ✓ C1 (bereits Basis) | Keine zusätzliche Hinweisleistung; Start, Vorgaben und Basisfolgen sind Kontext |
| [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L65) | Stunde 4: × {D1}; ? {B1, B2} | D36 (`predecessor-support`; H2+H7); bekannte Weitergabe z. B. D36→D37 |
| [H1+H2+H3+H4+H5+H6+H7](../../../docs/verification/B2-deduction/T07-given-3.jsonl#L65) | Stunde 5: × {B1, B2, B3, D2, E1}; ? {A2, C3} | D38 (`predecessor-support`; H2+H7) (weitere Zeugen im JSON); bekannte Weitergabe z. B. D38→D39 |

**Relationale Restalternativen:** Stunde 4→5: {B1→A2, B2→C3}; Stunde 5→6: {A2→A3, A2→B1, A2→B2, C3→B2, C3→B4}. Feldmarkierungen können die Endpunkte festhalten, ihre Zuordnungen bleiben in der heutigen GUI unvollständig darstellbar. Lokale Kanten sind keine bewiesenen Restwege.

Alle untersuchten Zustände, konkreten Markierungen, direkten Prämissen und bekannten Folgefestlegungen: [Profilversion 2](T07-given-3.json). Exakte Projektionen stehen dort getrennt unter `intermediateProgress.states[].exact` und tragen keine lokalen Regelzertifikate.

## Bestandsschutz und Grenzen

Die Profilversion 1 aus PR #107 und sämtliche bisherigen Diagnoseartefakte bleiben unverändert. Version 2 erhält ihre bestehenden Aussagen und ergänzt `intermediateProgress`; die eigene Formatkennung macht die Erweiterung explizit. Fehlende Teilzustände bleiben unbekannt. C/D besitzen zusätzlich genau die zehn nachgeprüften Viererzustände, daher sind ihre 32 Teilmengen jeweils vollständig; das erweitert weder Regeln noch Kandidatenbestand.

V1 und V2 behalten den minimalen lokalen Hinweisanzahlvektor **3/4/4/2/1/5**, gemeinsame Einstiege und den Abschluss über Wiederbesuchsweitergabe. Für Stunde 3 unterscheiden sich ihre bekannten Zeugen und Mechanismen. Ausschlüsse, Feldfestlegung und angehängte feste Kante werden nicht zu mehreren Meilensteinen derselben Erkenntnis gezählt.

Entdeckbarkeit, Markieraufwand, Gedächtnislast, tatsächliche Stillstände und menschliche Präferenzen werden nicht gemessen. Die genannten Folgebeziehungen sind bekannte Beweisverwendungen, keine vollständige Sammlung menschlicher Argumente. Es gibt keine neue GUI und keinen Tagesrätsel-Selektor.

Reproduktion: `npm run report:b2:progress` zeigt diesen Bericht; `-- --check` prüft neun kompakte JSON-Profile und den Bericht, `-- --write` erneuert ausschließlich diese zehn Dateien. [Datenformat und Quellenreproduktion](../B2-markable-progress.md).
