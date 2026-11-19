# S04-A — beschreibende Etappendiagnose

**Enthält Lösungen. Keine Qualitätsrangliste, Schwierigkeitsskala oder menschliche Lösungsreihenfolge.**

H1 = Hinweis 1; S1 = Stunde 1; S0 = bekannte Startposition. Kleine Hinweiszusammenstellungen sind mögliche verfügbare Teilzeugen, kein zeitlich gemessener Einstieg. Alternative Teilzeugen stehen nebeneinander. Trace-Zertifikate sind ausreichende technische Beweiswege; menschliche Entdeckbarkeit und Unabhängigkeit sind ungeprüft.

[Menschliche Beobachtungen](../../../observations/README.md) sind eigenständige Evidenz. Die Zuordnung S03-01 bis S03-09 folgt der Tabelle im bereitgestellten Analysebericht, entsprechend der nach vollständiger Kennung sortierten Spieltestanzeige; sie folgt nicht der Reihenfolge des Auswahlregisters.

| Fall | Bekannt/möglich | Lokal fixe S aus Hinweisen (Vollsatz) | Lokal offen (Vollsatz) |
| --- | --- | --- | --- |
| A | 2/2 | S1=E3, S2=D2, S3=D1, S4=C1, S5=B1, S6=A1 | keine |
| B | 8/8 | S1=B1, S2=A2, S3=B2, S4=C2, S5=D2, S6=E1 | keine |
| C | 32/32 | S1=D2, S2=D1, S3=C1, S4=B1, S5=A1, S6=A2 | keine |
| D | 32/32 | S1=B2, S6=B3 | S2–S5 (links S1=B2) (rechts S6=B3) |
| V1 | 32/32 | S1=B1, S2=C1, S3=C2, S4=D1, S5=D2, S6=E2 | keine |
| V2 | 64/64 | S1=A2, S2=B2, S3=C2, S4=D1, S5=D2, S6=E2 | keine |
| T02 | 43/64 | keine | S1–S6 (links S0=A4) |
| T07 | 65/128 | S1=D3, S2=C2 | S3–S6 (links S2=C2) |
| T07-given-3 | 65/128 | keine | S4–S6 (links S3=C1) |
| S03-01 | 43/64 | S1=B3, S2=B4, S3=C5, S4=C4 | S5–S6 (links S4=C4) |
| S03-02 | 27/32 | S1=B5, S2=A4, S3=B4, S4=B3, S5=B2, S6=A2 | keine |
| S03-03 | 43/64 | S1=A2, S2=B3, S3=B4, S4=C5, S5=C4, S6=D5 | keine |
| S03-04 | 43/64 | S1=D4, S2=D3, S3=C2, S4=D1, S5=C1, S6=B2 | keine |
| S03-05 | 16/16 | S1=B5, S2=B4, S3=B3, S4=B2, S5=B1, S6=C1 | keine |
| S03-06 | 43/64 | S1=A4, S2=B3, S3=C3, S4=C2, S5=D2, S6=E3 | keine |
| S03-07 | 8/8 | S1=A3, S2=B3, S3=C3, S4=D3, S5=D4, S6=E5 | keine |
| S03-08 | 43/64 | S1=A3, S2=A2, S3=B3, S4=B2, S5=C2, S6=C3 | keine |
| S03-09 | 8/8 | S1=A4, S2=B3, S3=C3, S4=D3, S5=D2, S6=D1 | keine |

× = zusätzlicher lokaler Ausschluss, ? = lokal verbleibende Menge, ✓ = Singleton. Start, Vorgaben und hinweisfreie Folgen zählen nicht als Hinweisleistung. Lokale Möglichkeiten müssen zu keiner legalen Gesamtroute erweiterbar sein. Exakte Projektionen tragen keine lokalen Beweiszertifikate.

Die Routenansicht enumeriert je ausgewähltem Fall einmal mit höchstens 250.000 Knoten. Fehlende Zustände bleiben unbekannt; bei Budgetabbruch werden keine vollständigen Zählungen behauptet. Die drei festen Stundenintervalle sind Diagnosefenster, keine vorgeschriebenen menschlichen Etappen. Nicht untersuchte Beziehungen bleiben offen.

## A — B2-S02-M010-E4-R00-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1](../../../../docs/verification/B2-deduction-progress/private/A.jsonl#L2) | S1: ×2; ✓E3; S2: ×7; ✓D2; S3: ×13; ✓D1; S4: ×17; ✓C1; S5: ×20; ✓B1; S6: ×21; ✓A1 | S1=E3, S2=D2, S3=D1, S4=C1, S5=B1, S6=A1 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=E3 | 1 | H1 (D19) |
| S2=D2 | 1 | H1 (D25) |
| S3=D1 | 1 | H1 (D30) |
| S4=C1 | 1 | H1 (D34) |
| S5=B1 | 1 | H1 (D37) |
| S6=A1 | 1 | H1 (D39) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1](../../../../docs/verification/B2-deduction-progress/private/A.jsonl#L2): S1, D19 → D25 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1](../../../../docs/verification/B2-deduction-progress/private/A.jsonl#L2) | 1 / 1 | 1 | 1 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **1** feldkompatible, mit Nachbarkanten **1** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](A.json) · [Begrenzte Routenansicht](A.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## B — B2-S02-M000-A1-R00-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1](../../../../docs/verification/B2-deduction-progress/private/B.jsonl#L2) | S1: ×1; ✓B1; S2: ×3; ?{A2,B2}; S3: ×2; ?{5 Felder}; S4: ×3; ?{8 Felder}; S5: ×2; ?{14 Felder}; S6: ×1; ?{18 Felder} | S1=B1 | S2–S6 (links S1=B1) |
| [H2+H3](../../../../docs/verification/B2-deduction-progress/private/B.jsonl#L7) | S2: ×3; ?{A2,B3}; S3: ×6; ✓B2; S4: ×10; ✓C2; S5: ×15; ✓D2; S6: ×18; ✓E1 | S3=B2, S4=C2, S5=D2, S6=E1 | S1–S2 (links S0=A1) (rechts S3=B2) |
| [H1+H2+H3](../../../../docs/verification/B2-deduction-progress/private/B.jsonl#L8) | S1: ×1; ✓B1; S2: ×4; ✓A2; S3: ×6; ✓B2; S4: ×10; ✓C2; S5: ×15; ✓D2; S6: ×18; ✓E1 | S1=B1, S2=A2, S3=B2, S4=C2, S5=D2, S6=E1 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B1 | 1 | H1 (D19) |
| S2=A2 | 3 | H1+H2+H3 (D38) |
| S3=B2 | 2 | H2+H3 (D39) |
| S4=C2 | 2 | H2+H3 (D31) |
| S5=D2 | 2 | H2+H3 (D45) |
| S6=E1 | 2 | H2+H3 (D42) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1](../../../../docs/verification/B2-deduction-progress/private/B.jsonl#L2): S1, D19 → D20 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

[Etappendaten](B.json) · [Begrenzte Routenansicht](B.routes.json). Für diesen Fall wurde keine zusätzliche Routenberechnung angefordert; mehrstündige Beziehungen bleiben ungeprüft.

## C — B2-BC-T06-M005-E3-R00

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1+H2](../../../../docs/verification/B2-deduction-progress/private/C.jsonl#L7) | S1: ×2; ?{D2,D3,D4}; S2: ×7; ?{5 Felder}; S3: ×12; ?{5 Felder}; S4: ×12; ?{10 Felder}; S5: ×2; ?{22 Felder} | keine | S1–S6 (links S0=E3) |
| [H1+H3](../../../../docs/verification/B2-deduction-progress/private/C.jsonl#L8) | S1: ×4; ✓D2; S2: ×11; ✓D1; S3: ×16; ✓C1; S4: ×19; ?{B1,B2,C2}; S5: ×16; ?{8 Felder}; S6: ×11; ?{13 Felder} | S1=D2, S2=D1, S3=C1 | S4–S6 (links S3=C1) |
| [H1+H2+H3+H4+H5](../../../../docs/verification/B2-deduction-progress/private/C.jsonl#L27) | S1: ×4; ✓D2; S2: ×11; ✓D1; S3: ×16; ✓C1; S4: ×21; ✓B1; S5: ×23; ✓A1; S6: ×23; ✓A2 | S1=D2, S2=D1, S3=C1, S4=B1, S5=A1, S6=A2 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=D2 | 2 | H1+H3 (D38) |
| S2=D1 | 2 | H1+H3 (D24) |
| S3=C1 | 2 | H1+H3 (D25) |
| S4=B1 | 4 | H1+H2+H3+H4 (D40) |
| S5=A1 | 5 | H1+H2+H3+H4+H5 (D34) |
| S6=A2 | 5 | H1+H2+H3+H4+H5 (D43) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H2](../../../../docs/verification/B2-deduction-progress/private/C.jsonl#L7): S1, D28 → D29 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H2](../../../../docs/verification/B2-deduction-progress/private/C.jsonl#L7) | 264 / 264 | 264 | 264 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **412** feldkompatible, mit Nachbarkanten **90** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](C.json) · [Begrenzte Routenansicht](C.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## D — B2-S02-M017-C3-R00-V02

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1+H2](../../../../docs/verification/B2-deduction-progress/private/D.jsonl#L7) | S1: ×5; ✓B2; S2: ×12; ?{5 Felder}; S3: ×10; ?{11 Felder}; S4: ×4; ?{17 Felder}; S5: ×1; ?{20 Felder}; S6: ×1; ?{20 Felder} | S1=B2 | S2–S6 (links S1=B2) |
| [H1+H2+H5](../../../../docs/verification/B2-deduction-progress/private/D.jsonl#L19) | S1: ×5; ✓B2; S2: ×12; ?{5 Felder}; S3: ×10; ?{11 Felder}; S4: ×4; ?{17 Felder}; S5: ×6; ?{15 Felder}; S6: ×16; ?{5 Felder} | S1=B2 | S2–S6 (links S1=B2) |
| [H1+H2+H3+H4+H5](../../../../docs/verification/B2-deduction-progress/private/D.jsonl#L27) | S1: ×5; ✓B2; S2: ×15; ?{A2,B1}; S3: ×19; ?{A1,A2}; S4: ×19; ?{A1,A2}; S5: ×19; ?{A2,A3}; S6: ×20; ✓B3 | S1=B2, S2=B1, S3=A1, S4=A2, S5=A3, S6=B3 | S2–S5 (links S1=B2) (rechts S6=B3) |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B2 | 2 | H1+H2 (D17) |
| S2=B1 | unbekannt | kein lokaler Zeuge bekannt |
| S3=A1 | unbekannt | kein lokaler Zeuge bekannt |
| S4=A2 | unbekannt | kein lokaler Zeuge bekannt |
| S5=A3 | unbekannt | kein lokaler Zeuge bekannt |
| S6=B3 | 5 | H1+H2+H3+H4+H5 (D46) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H2](../../../../docs/verification/B2-deduction-progress/private/D.jsonl#L7): S1, D16 → D17 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H2+H3+H4+H5](../../../../docs/verification/B2-deduction-progress/private/D.jsonl#L27) | 1 / 1 | 1 | 1 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **8** feldkompatible, mit Nachbarkanten **8** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](D.json) · [Begrenzte Routenansicht](D.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## V1 — B2-POSITIVE-01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H3](../../../../docs/verification/B2-positive/private/diagnosis.jsonl#L4) | S2: ×1; ?{5 Felder}; S3: ×6; ?{5 Felder}; S4: ×14; ?{4 Felder}; S5: ×21; ✓D2; S6: ×18; ?{6 Felder} | S5=D2 | S1–S4 (links S0=A1) (rechts S5=D2); S6–S6 (links S5=D2) |
| [H2+H3](../../../../docs/verification/B2-positive/private/diagnosis.jsonl#L11) | S2: ×3; ?{B1,B2,C1}; S3: ×9; ?{C1,C2}; S4: ×17; ✓D1; S5: ×21; ✓D2; S6: ×19; ?{5 Felder} | S4=D1, S5=D2 | S1–S3 (links S0=A1) (rechts S4=D1); S6–S6 (links S5=D2) |
| [H1+H2+H3+H4+H5](../../../../docs/verification/B2-positive/private/diagnosis.jsonl#L27) | S1: ×1; ✓B1; S2: ×5; ✓C1; S3: ×10; ✓C2; S4: ×17; ✓D1; S5: ×21; ✓D2; S6: ×23; ✓E2 | S1=B1, S2=C1, S3=C2, S4=D1, S5=D2, S6=E2 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B1 | 3 | H2+H3+H4 (D28) |
| S2=C1 | 4 | H1+H2+H3+H4 (D38) |
| S3=C2 | 4 | H1+H2+H3+H4 (D42) |
| S4=D1 | 2 | H2+H3 (D25) |
| S5=D2 | 1 | H3 (D19) |
| S6=E2 | 5 | H1+H2+H3+H4+H5 (D43) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H3](../../../../docs/verification/B2-positive/private/diagnosis.jsonl#L4): S2, D30 → D31 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H3](../../../../docs/verification/B2-positive/private/diagnosis.jsonl#L4) | 112 / 112 | 112 | 112 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **13** feldkompatible, mit Nachbarkanten **4** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](V1.json) · [Begrenzte Routenansicht](V1.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## V2 — B2-POSITIVE-V2-01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H3](../../../../docs/verification/B2-positive-v2/private/states.jsonl#L5) | S2: ×1; ?{5 Felder}; S3: ×6; ?{5 Felder}; S4: ×14; ?{4 Felder}; S5: ×21; ✓D2; S6: ×18; ?{6 Felder} | S5=D2 | S1–S4 (links S0=A1) (rechts S5=D2); S6–S6 (links S5=D2) |
| [H2+H3](../../../../docs/verification/B2-positive-v2/private/states.jsonl#L7) | S2: ×3; ?{B1,B2,C1}; S3: ×9; ?{C1,C2}; S4: ×17; ✓D1; S5: ×21; ✓D2; S6: ×19; ?{5 Felder} | S4=D1, S5=D2 | S1–S3 (links S0=A1) (rechts S4=D1); S6–S6 (links S5=D2) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/B2-positive-v2/private/states.jsonl#L64) | S1: ×1; ✓A2; S2: ×5; ✓B2; S3: ×10; ✓C2; S4: ×17; ✓D1; S5: ×21; ✓D2; S6: ×23; ✓E2 | S1=A2, S2=B2, S3=C2, S4=D1, S5=D2, S6=E2 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A2 | 3 | H2+H3+H4 (D30) |
| S2=B2 | 4 | H1+H2+H3+H4 (D40) |
| S3=C2 | 4 | H1+H2+H3+H6 (D37) |
| S4=D1 | 2 | H2+H3 (D25) |
| S5=D2 | 1 | H3 (D19) |
| S6=E2 | 5 | H1+H2+H3+H5+H6 (D38) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H3](../../../../docs/verification/B2-positive-v2/private/states.jsonl#L5): S2, D30 → D31 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H3](../../../../docs/verification/B2-positive-v2/private/states.jsonl#L5) | 112 / 112 | 112 | 112 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **16** feldkompatible, mit Nachbarkanten **4** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](V2.json) · [Begrenzte Routenansicht](V2.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## T02 — B2-BC-T02-M017-A4-R00

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1+H4](../../../../docs/verification/B2-deduction/T02.jsonl#L10) | S1: ×2; ?{A3,B3,B4}; S2: ×7; ?{A2,B2,C3}; S3: ×8; ?{9 Felder}; S4: ×4; ?{17 Felder}; S5: ×1; ?{20 Felder} | keine | S1–S6 (links S0=A4) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/B2-deduction/T02.jsonl#L43) | S1: ×2; ?{A3,B3,B4}; S2: ×7; ?{A2,B2,C3}; S3: ×8; ?{9 Felder}; S4: ×6; ?{15 Felder}; S5: ×8; ?{13 Felder}; S6: ×3; ?{18 Felder} | S1=A3, S2=A2, S3=A1, S4=B1, S5=C1, S6=B2 | S1–S6 (links S0=A4) |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A3 | unbekannt | kein lokaler Zeuge bekannt |
| S2=A2 | unbekannt | kein lokaler Zeuge bekannt |
| S3=A1 | unbekannt | kein lokaler Zeuge bekannt |
| S4=B1 | unbekannt | kein lokaler Zeuge bekannt |
| S5=C1 | unbekannt | kein lokaler Zeuge bekannt |
| S6=B2 | unbekannt | kein lokaler Zeuge bekannt |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H4](../../../../docs/verification/B2-deduction/T02.jsonl#L10): S1, D21 → D22 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H4](../../../../docs/verification/B2-deduction/T02.jsonl#L10) | 487 / 304 | 304 | 304 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **453** feldkompatible, mit Nachbarkanten **280** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](T02.json) · [Begrenzte Routenansicht](T02.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## T07 — B2-BC-T07-M013-D4-R00

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H4+H5](../../../../docs/verification/B2-deduction/T07.jsonl#L24) | S1: ×5; ✓D3; S2: ×11; ✓C2; S3: ×14; ?{5 Felder}; S4: ×10; ?{13 Felder}; S5: ×4; ?{19 Felder}; S6: ×2; ?{21 Felder} | S1=D3, S2=C2 | S3–S6 (links S2=C2) |
| [H1+H2+H3+H4+H5+H6+H7](../../../../docs/verification/B2-deduction/T07.jsonl#L65) | S1: ×5; ✓D3; S2: ×11; ✓C2; S3: ×16; ?{B2,C1,C3}; S4: ×19; ?{4 Felder}; S5: ×18; ?{5 Felder}; S6: ×15; ?{8 Felder} | S1=D3, S2=C2, S3=C1, S4=B1, S5=A2, S6=B2 | S3–S6 (links S2=C2) |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=D3 | 2 | H4+H5 (D24) |
| S2=C2 | 2 | H4+H5 (D18) |
| S3=C1 | unbekannt | kein lokaler Zeuge bekannt |
| S4=B1 | unbekannt | kein lokaler Zeuge bekannt |
| S5=A2 | unbekannt | kein lokaler Zeuge bekannt |
| S6=B2 | unbekannt | kein lokaler Zeuge bekannt |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6; H1+H2+H3+H4+H5+H6; H1+H2+H3+H7; H1+H2+H4+H7; H1+H3+H4+H7; H2+H3+H4+H7; H1+H2+H3+H4+H7; H1+H2+H5+H7; H1+H3+H5+H7; H2+H3+H5+H7; H1+H2+H3+H5+H7; H1+H4+H5+H7; H2+H4+H5+H7; H1+H2+H4+H5+H7; H3+H4+H5+H7; H1+H3+H4+H5+H7; H2+H3+H4+H5+H7; H1+H2+H3+H4+H5+H7; H1+H2+H6+H7; H1+H3+H6+H7; H2+H3+H6+H7; H1+H2+H3+H6+H7; H1+H4+H6+H7; H2+H4+H6+H7; H1+H2+H4+H6+H7; H3+H4+H6+H7; H1+H3+H4+H6+H7; H2+H3+H4+H6+H7; H1+H2+H3+H4+H6+H7; H1+H5+H6+H7; H2+H5+H6+H7; H1+H2+H5+H6+H7; H3+H5+H6+H7; H1+H3+H5+H6+H7; H2+H3+H5+H6+H7; H1+H2+H3+H5+H6+H7; H4+H5+H6+H7; H1+H4+H5+H6+H7; H2+H4+H5+H6+H7; H1+H2+H4+H5+H6+H7; H3+H4+H5+H6+H7; H1+H3+H4+H5+H6+H7; H2+H3+H4+H5+H6+H7. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H4+H5](../../../../docs/verification/B2-deduction/T07.jsonl#L24): S1, D24 → D32 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H4+H5](../../../../docs/verification/B2-deduction/T07.jsonl#L24) | 139 / 139 | 139 | 139 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **58** feldkompatible, mit Nachbarkanten **43** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](T07.json) · [Begrenzte Routenansicht](T07.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## T07-given-3 — B2-BC-T07-M013-D4-R00+given-hour-3

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [none](../../../../docs/verification/B2-deduction/T07-given-3.jsonl#L1) | keine zusätzlichen Feldausschlüsse | keine | S4–S6 (links S3=C1) |
| [H3+H6+H7](../../../../docs/verification/B2-deduction/T07-given-3.jsonl#L60) | S4: ×1; ?{B1,B2}; S5: ×5; ?{A2,C3}; S6: ×9; ?{5 Felder} | S4=B1, S5=A2, S6=B2 | S4–S6 (links S3=C1) |
| [H1+H2+H3+H4+H5+H6+H7](../../../../docs/verification/B2-deduction/T07-given-3.jsonl#L65) | S4: ×1; ?{B1,B2}; S5: ×5; ?{A2,C3}; S6: ×10; ?{4 Felder} | S4=B1, S5=A2, S6=B2 | S4–S6 (links S3=C1) |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=D3 | 0 | none (D29) |
| S2=C2 | 0 | none (D18) |
| S3=C1 | 0 | none (D2) |
| S4=B1 | unbekannt | kein lokaler Zeuge bekannt |
| S5=A2 | unbekannt | kein lokaler Zeuge bekannt |
| S6=B2 | unbekannt | kein lokaler Zeuge bekannt |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6; H1+H2+H3+H4+H5+H6; H1+H2+H3+H7; H1+H2+H4+H7; H1+H3+H4+H7; H2+H3+H4+H7; H1+H2+H3+H4+H7; H1+H2+H5+H7; H1+H3+H5+H7; H2+H3+H5+H7; H1+H2+H3+H5+H7; H1+H4+H5+H7; H2+H4+H5+H7; H1+H2+H4+H5+H7; H3+H4+H5+H7; H1+H3+H4+H5+H7; H2+H3+H4+H5+H7; H1+H2+H3+H4+H5+H7; H1+H2+H6+H7; H1+H3+H6+H7; H2+H3+H6+H7; H1+H2+H3+H6+H7; H1+H4+H6+H7; H2+H4+H6+H7; H1+H2+H4+H6+H7; H3+H4+H6+H7; H1+H3+H4+H6+H7; H2+H3+H4+H6+H7; H1+H2+H3+H4+H6+H7; H1+H5+H6+H7; H2+H5+H6+H7; H1+H2+H5+H6+H7; H3+H5+H6+H7; H1+H3+H5+H6+H7; H2+H3+H5+H6+H7; H1+H2+H3+H5+H6+H7; H4+H5+H6+H7; H1+H4+H5+H6+H7; H2+H4+H5+H6+H7; H1+H2+H4+H5+H6+H7; H3+H4+H5+H6+H7; H1+H3+H4+H5+H6+H7; H2+H3+H4+H5+H6+H7. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H3+H6+H7](../../../../docs/verification/B2-deduction/T07-given-3.jsonl#L60): S4, D34 → D35 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H3+H6+H7](../../../../docs/verification/B2-deduction/T07-given-3.jsonl#L60) | 6 / 4 | 1 | 1 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H3+H6+H7 | lokal kompatibel | S3–S6 | C1→B1→A2→A3; C1→B1→A2→B2; C1→B2→C3→B4; C1→B2→C3→C4 | keines |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **5** feldkompatible, mit Nachbarkanten **3** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](T07-given-3.json) · [Begrenzte Routenansicht](T07-given-3.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-01 — B2-S03-V2-M001-A3-R751-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L4) | S1: ×1; ?{A4,B3}; S2: ×7; ?{B4,B5}; S3: ×12; ✓C5; S4: ×13; ?{4 Felder}; S5: ×9; ?{11 Felder}; S6: ×3; ?{17 Felder} | S3=C5 | S1–S2 (links S0=A3) (rechts S3=C5); S4–S6 (links S3=C5) |
| [H3+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L19) | S1: ×2; ✓B3; S2: ×8; ✓B4; S3: ×12; ✓C5; S4: ×14; ?{B5,C4,D5}; S5: ×12; ?{8 Felder}; S6: ×6; ?{14 Felder} | S1=B3, S2=B4, S3=C5 | S4–S6 (links S3=C5) |
| [H2+H3+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L35) | S1: ×2; ✓B3; S2: ×8; ✓B4; S3: ×12; ✓C5; S4: ×16; ✓C4; S5: ×17; ?{C3,D3,D4}; S6: ×10; ?{10 Felder} | S1=B3, S2=B4, S3=C5, S4=C4 | S5–S6 (links S4=C4) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L43) | S1: ×2; ✓B3; S2: ×8; ✓B4; S3: ×12; ✓C5; S4: ×16; ✓C4; S5: ×18; ?{D3,D4}; S6: ×17; ?{C3,D4,E5} | S1=B3, S2=B4, S3=C5, S4=C4, S5=D3, S6=D4 | S5–S6 (links S4=C4) |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B3 | 2 | H3+H6 (D37) |
| S2=B4 | 2 | H3+H6 (D26) |
| S3=C5 | 1 | H3 (D18) |
| S4=C4 | 3 | H2+H3+H6 (D34) |
| S5=D3 | unbekannt | kein lokaler Zeuge bekannt |
| S6=D4 | unbekannt | kein lokaler Zeuge bekannt |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L4): S1, D31 → D32 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H2+H3+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L35) | 13 / 13 | 13 | 13 |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M001-A3-R751-V01.states.jsonl#L43) | 3 / 3 | 1 | 1 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H2+H3+H6 | lokal kompatibel | S1–S5 | B3→B4→C5→C4→C3; B3→B4→C5→C4→D3; B3→B4→C5→C4→D4 | keines |
| H2+H3+H6 | exakt unterstützt | S1–S5 | B3→B4→C5→C4→C3; B3→B4→C5→C4→D3; B3→B4→C5→C4→D4 | keines |
| H1+H2+H3+H4+H5+H6 | lokal kompatibel | S3–S6 | C5→C4→D3→C3; C5→C4→D3→D4; C5→C4→D4→E5 | keines |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **7** feldkompatible, mit Nachbarkanten **7** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-01.json) · [Begrenzte Routenansicht](S03-01.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-02 — B2-S03-V2-M003-A5-R436-V02

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M003-A5-R436-V02.states.jsonl#L2) | S3: ×5; ?{6 Felder}; S4: ×6; ?{10 Felder} | keine | S1–S6 (links S0=A5) |
| [H1+H4](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M003-A5-R436-V02.states.jsonl#L9) | S2: ×1; ?{5 Felder}; S3: ×6; ?{5 Felder}; S4: ×11; ?{5 Felder}; S5: ×5; ?{13 Felder}; S6: ×3; ?{16 Felder} | keine | S1–S6 (links S0=A5) |
| [H1+H2+H3+H4+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M003-A5-R436-V02.states.jsonl#L27) | S1: ×1; ✓B5; S2: ×5; ✓A4; S3: ×10; ✓B4; S4: ×15; ✓B3; S5: ×17; ✓B2; S6: ×18; ✓A2 | S1=B5, S2=A4, S3=B4, S4=B3, S5=B2, S6=A2 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B5 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D47) |
| S2=A4 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D39) |
| S3=B4 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D40) |
| S4=B3 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D42) |
| S5=B2 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D44) |
| S6=A2 | kleinster bekannter: 5 | H1+H2+H3+H4+H5 (D48) |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M003-A5-R436-V02.states.jsonl#L2): S3, D20 → D22 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H4](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M003-A5-R436-V02.states.jsonl#L9) | 272 / 117 | 75 | 107 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **163** feldkompatible, mit Nachbarkanten **25** legale Wege. Keine beobachtete menschliche Arbeitslast.

H1+H4: 32 rekombinierte Wege erfüllen die Hinweise nicht.

[Etappendaten](S03-02.json) · [Begrenzte Routenansicht](S03-02.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-03 — B2-S03-V2-M008-A3-R51-V02

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M008-A3-R51-V02.states.jsonl#L6) | S2: ×1; ?{6 Felder}; S3: ×7; ?{B3,B4,C5}; S4: ×4; ?{9 Felder}; S5: ×4; ?{12 Felder}; S6: ×2; ?{15 Felder} | keine | S1–S6 (links S0=A3) |
| [H3+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M008-A3-R51-V02.states.jsonl#L19) | S3: ×3; ?{7 Felder}; S4: ×9; ?{4 Felder}; S5: ×14; ?{C4,C5}; S6: ×16; ✓D5 | S6=D5 | S1–S5 (links S0=A3) (rechts S6=D5) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M008-A3-R51-V02.states.jsonl#L43) | S1: ×2; ✓A2; S2: ×6; ✓B3; S3: ×9; ✓B4; S4: ×12; ✓C5; S5: ×15; ✓C4; S6: ×16; ✓D5 | S1=A2, S2=B3, S3=B4, S4=C5, S5=C4, S6=D5 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D55) |
| S2=B3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D54) |
| S3=B4 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D47) |
| S4=C5 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D42) |
| S5=C4 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D43) |
| S6=D5 | 2 | H3+H6 (D31) |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M008-A3-R51-V02.states.jsonl#L6): S2, D21 → D28 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H3+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M008-A3-R51-V02.states.jsonl#L19) | 27 / 27 | 27 | 27 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **4** feldkompatible, mit Nachbarkanten **4** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-03.json) · [Begrenzte Routenansicht](S03-03.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-04 — B2-S03-V2-M010-E4-R568-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M010-E4-R568-V01.states.jsonl#L11) | S1: ×1; ?{D4,E3}; S2: ×6; ?{D3,E2}; S3: ×9; ?{5 Felder}; S4: ×4; ?{14 Felder}; S5: ×2; ?{19 Felder} | keine | S1–S6 (links S0=E4) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M010-E4-R568-V01.states.jsonl#L43) | S1: ×2; ✓D4; S2: ×7; ✓D3; S3: ×13; ✓C2; S4: ×17; ✓D1; S5: ×20; ✓C1; S6: ×21; ✓B2 | S1=D4, S2=D3, S3=C2, S4=D1, S5=C1, S6=B2 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=D4 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D50) |
| S2=D3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D41) |
| S3=C2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D58) |
| S4=D1 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D52) |
| S5=C1 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D48) |
| S6=B2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D59) |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M010-E4-R568-V01.states.jsonl#L11): S1, D23 → D24 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M010-E4-R568-V01.states.jsonl#L11) | 259 / 162 | 162 | 162 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **179** feldkompatible, mit Nachbarkanten **14** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-04.json) · [Begrenzte Routenansicht](S03-04.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-05 — B2-S03-V2-M011-A5-R787-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L9) | keine zusätzlichen Feldausschlüsse | keine | S1–S6 (links S0=A5) |
| [H1+H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L12) | S2: ×3; ?{B3,B4,C5}; S3: ×6; ?{5 Felder}; S4: ×13; ?{5 Felder}; S5: ×17; ?{5 Felder}; S6: ×19; ?{5 Felder} | keine | S1–S6 (links S0=A5) |
| [H2+H3+H4](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L15) | S2: ×4; ?{A3,B4}; S3: ×4; ?{7 Felder}; S4: ×2; ?{16 Felder} | S1=B5, S2=B4, S3=B3, S6=C1 | S1–S6 (links S0=A5) |
| [H1+H2+H3+H4](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L16) | S1: ×1; ✓B5; S2: ×5; ✓B4; S3: ×10; ✓B3; S4: ×17; ✓B2; S5: ×21; ✓B1; S6: ×23; ✓C1 | S1=B5, S2=B4, S3=B3, S4=B2, S5=B1, S6=C1 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=B5 | 4 | H1+H2+H3+H4 (D27) |
| S2=B4 | 4 | H1+H2+H3+H4 (D28) |
| S3=B3 | 4 | H1+H2+H3+H4 (D44) |
| S4=B2 | 4 | H1+H2+H3+H4 (D40) |
| S5=B1 | 4 | H1+H2+H3+H4 (D52) |
| S6=C1 | 4 | H1+H2+H3+H4 (D49) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L12): S2, D21 → D25 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M011-A5-R787-V01.states.jsonl#L9) | 1185 / 1185 | 8 | 8 |

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **509** feldkompatible, mit Nachbarkanten **301** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-05.json) · [Begrenzte Routenansicht](S03-05.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-06 — B2-S03-V2-M014-A5-R160-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H1+H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M014-A5-R160-V01.states.jsonl#L8) | S1: ×1; ✓A4; S2: ×2; ?{A3,B3}; S3: ×4; ?{A2,B2,C3}; S4: ×6; ?{6 Felder}; S5: ×8; ?{8 Felder}; S6: ×5; ?{15 Felder} | S1=A4 | S2–S6 (links S1=A4) |
| [H1+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M014-A5-R160-V01.states.jsonl#L32) | S3: ×1; ?{6 Felder}; S4: ×5; ?{7 Felder}; S5: ×7; ?{9 Felder}; S6: ×4; ?{16 Felder} | S1=A4, S2=B3 | S1–S6 (links S0=A5) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M014-A5-R160-V01.states.jsonl#L43) | S1: ×1; ✓A4; S2: ×3; ✓B3; S3: ×6; ✓C3; S4: ×11; ✓C2; S5: ×15; ✓D2; S6: ×19; ✓E3 | S1=A4, S2=B3, S3=C3, S4=C2, S5=D2, S6=E3 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A4 | 2 | H1+H2 (D34) |
| S2=B3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D42) |
| S3=C3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D48) |
| S4=C2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D41) |
| S5=D2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D37) |
| S6=E3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D33) |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M014-A5-R160-V01.states.jsonl#L8): S1, D34 → D35 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M014-A5-R160-V01.states.jsonl#L32) | 154 / 154 | 4 | 4 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H1+H5+H6 | exakt unterstützt | S0–S3 | A5→A4→B3→A3; A5→A4→B3→C3 | keines |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **81** feldkompatible, mit Nachbarkanten **81** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-06.json) · [Begrenzte Routenansicht](S03-06.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-07 — B2-S03-V2-M016-A2-R116-V01

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L3) | S1: ×1; ?{4 Felder}; S2: ×3; ?{B2,B3,C3}; S3: ×5; ?{C3,C4,D3}; S4: ×7; ?{5 Felder}; S5: ×15; ?{D4,D5,E4}; S6: ×17; ✓E5 | S6=E5 | S1–S5 (links S0=A2) (rechts S6=E5) |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L7) | S1: ×1; ?{4 Felder}; S2: ×4; ?{B2,B3}; S3: ×7; ✓C3; S4: ×11; ✓D3; S5: ×17; ✓D4; S6: ×17; ✓E5 | S3=C3, S4=D3, S5=D4, S6=E5 | S1–S2 (links S0=A2) (rechts S3=C3) |
| [H1+H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L8) | S1: ×4; ✓A3; S2: ×5; ✓B3; S3: ×7; ✓C3; S4: ×11; ✓D3; S5: ×17; ✓D4; S6: ×17; ✓E5 | S1=A3, S2=B3, S3=C3, S4=D3, S5=D4, S6=E5 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A3 | 3 | H1+H2+H3 (D47) |
| S2=B3 | 3 | H1+H2+H3 (D44) |
| S3=C3 | 2 | H2+H3 (D35) |
| S4=D3 | 2 | H2+H3 (D31) |
| S5=D4 | 2 | H2+H3 (D28) |
| S6=E5 | 1 | H2 (D18) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L3): S1, D30 → D31 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L3) | 30 / 30 | 30 | 30 |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M016-A2-R116-V01.states.jsonl#L7) | 4 / 4 | 4 | 4 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H2+H3 | lokal kompatibel | S0–S3 | A2→A3→B3→C3; A2→B1→B2→C3; A2→B2→B3→C3; A2→B3→B2→C3 | C3 |
| H2+H3 | exakt unterstützt | S0–S3 | A2→A3→B3→C3; A2→B1→B2→C3; A2→B2→B3→C3; A2→B3→B2→C3 | C3 |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **1** feldkompatible, mit Nachbarkanten **1** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-07.json) · [Begrenzte Routenansicht](S03-07.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-08 — B2-S03-V2-M017-A4-R74-V02

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H4](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L5) | keine zusätzlichen Feldausschlüsse | keine | S1–S6 (links S0=A4) |
| [H1+H2+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L25) | S1: ×3; ?{A3,B3}; S2: ×9; ✓A2; S3: ×15; ?{B2,B3}; S4: ×17; ?{4 Felder}; S5: ×14; ?{7 Felder}; S6: ×14; ?{7 Felder} | S2=A2 | S1–S1 (links S0=A4) (rechts S2=A2); S3–S6 (links S2=A2) |
| [H2+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L38) | S1: ×2; ?{A3,B3,B4}; S2: ×6; ?{4 Felder}; S3: ×12; ?{5 Felder}; S4: ×14; ?{7 Felder}; S5: ×14; ?{7 Felder}; S6: ×14; ?{7 Felder} | S2=A2 | S1–S6 (links S0=A4) |
| [H1+H2+H3+H4+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L43) | S1: ×4; ✓A3; S2: ×9; ✓A2; S3: ×16; ✓B3; S4: ×20; ✓B2; S5: ×20; ✓C2; S6: ×20; ✓C3 | S1=A3, S2=A2, S3=B3, S4=B2, S5=C2, S6=C3 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D59) |
| S2=A2 | 3 | H1+H2+H5 (D30) |
| S3=B3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D53) |
| S4=B2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D49) |
| S5=C2 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D42) |
| S6=C3 | kleinster bekannter: 6 | H1+H2+H3+H4+H5+H6 (D52) |

Fehlende Teilmengen: H1+H2+H3+H4; H1+H2+H3+H5; H1+H2+H4+H5; H1+H3+H4+H5; H2+H3+H4+H5; H1+H2+H3+H4+H5; H1+H2+H3+H6; H1+H2+H4+H6; H1+H3+H4+H6; H2+H3+H4+H6; H1+H2+H3+H4+H6; H1+H2+H5+H6; H1+H3+H5+H6; H2+H3+H5+H6; H1+H2+H3+H5+H6; H1+H4+H5+H6; H2+H4+H5+H6; H1+H2+H4+H5+H6; H3+H4+H5+H6; H1+H3+H4+H5+H6; H2+H3+H4+H5+H6. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H1+H2+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L25): S1, D27 → D28 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H1+H2+H5](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L25) | 29 / 29 | 17 | 22 |
| [H2+H5+H6](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M017-A4-R74-V02.states.jsonl#L38) | 101 / 62 | 20 | 38 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H1+H2+H5 | lokal kompatibel | S0–S3 | A4→A3→A2→B2; A4→A3→A2→B3; A4→B3→A2→B2 | keines |
| H1+H2+H5 | exakt unterstützt | S0–S3 | A4→A3→A2→B3; A4→B3→A2→B2 | keines |
| H2+H5+H6 | exakt unterstützt | S0–S3 | A4→A3→A2→B3; A4→B3→A2→B2 | keines |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **18** feldkompatible, mit Nachbarkanten **6** legale Wege. Keine beobachtete menschliche Arbeitslast.

H1+H2+H5: 5 rekombinierte Wege erfüllen die Hinweise nicht. H2+H5+H6: 18 rekombinierte Wege erfüllen die Hinweise nicht.

[Etappendaten](S03-08.json) · [Begrenzte Routenansicht](S03-08.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## S03-09 — B2-S03-V2-M018-A5-R30-V04

| Bekannter Zustand | Lokale Feldmarkierungen gegenüber Basis | Exakt feste Stunden aus Hinweisen | Lokal offene Abschnitte |
| --- | --- | --- | --- |
| [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L3) | S2: ×3; ?{B3,B4,C5}; S3: ×8; ?{C3,C4}; S4: ×13; ✓D3; S5: ×15; ✓D2; S6: ×18; ✓D1 | S4=D3, S5=D2, S6=D1 | S1–S3 (links S0=A5) (rechts S4=D3) |
| [H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L4) | S2: ×4; ?{B3,C5}; S3: ×2; ?{8 Felder} | keine | S1–S6 (links S0=A5) |
| [H1+H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L5) | S2: ×4; ?{B3,B4}; S3: ×9; ✓C3; S4: ×13; ✓D3; S5: ×15; ✓D2; S6: ×18; ✓D1 | S3=C3, S4=D3, S5=D2, S6=D1 | S1–S2 (links S0=A5) (rechts S3=C3) |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L7) | S2: ×4; ?{B3,C5}; S3: ×8; ?{C3,C4}; S4: ×13; ✓D3; S5: ×15; ✓D2; S6: ×18; ✓D1 | S4=D3, S5=D2, S6=D1 | S1–S3 (links S0=A5) (rechts S4=D3) |
| [H1+H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L8) | S1: ×1; ✓A4; S2: ×5; ✓B3; S3: ×9; ✓C3; S4: ×13; ✓D3; S5: ×15; ✓D2; S6: ×18; ✓D1 | S1=A4, S2=B3, S3=C3, S4=D3, S5=D2, S6=D1 | keine |

| Stundenposition | Minimale Hinweisanzahl / Kenntnisgrenze | Alternative ausreichende lokale Teilzeugen |
| --- | --- | --- |
| S1=A4 | 3 | H1+H2+H3 (D43) |
| S2=B3 | 3 | H1+H2+H3 (D41) |
| S3=C3 | 2 | H1+H2 (D36) |
| S4=D3 | 1 | H2 (D29) |
| S5=D2 | 1 | H2 (D24) |
| S6=D1 | 1 | H2 (D25) |

Fehlende Teilmengen: keine. Die vollständigen Quellen, direkten Prämissen, lokalen Nachbarkopplungen und exakten Zeugen stehen im JSON.

Beispiel belegter Weiterverwendung: [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L3): S2, D31 → D34 (direkte Trace-Prämisse). Weitere Nachfolger stehen pro Feldzeuge im JSON.

| Zustand | Lokal: Felder / +Kanten | Exakt unterstützt | Exakte Felder/Kanten rekombiniert |
| --- | --- | --- | --- |
| [H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L3) | 6 / 6 | 6 | 6 |
| [H1+H2](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L5) | 3 / 3 | 3 | 3 |
| [H2+H3](../../../../docs/verification/S03-v2/run/evidence/B2-S03-V2-M018-A5-R30-V04.states.jsonl#L7) | 2 / 2 | 2 | 2 |

| Zustand | Darstellung | Fenster | Vollständige kleine Teilroutenmenge | Gemeinsames Endstück |
| --- | --- | --- | --- | --- |
| H2 | lokal kompatibel | S3–S6 | C3→D3→D2→D1; C4→D3→D2→D1 | D3→D2→D1 |
| H2 | exakt unterstützt | S3–S6 | C3→D3→D2→D1; C4→D3→D2→D1 | D3→D2→D1 |
| H1+H2 | lokal kompatibel | S0–S3 | A5→A4→B3→C3; A5→A4→B4→C3; A5→B5→B4→C3 | C3 |
| H1+H2 | exakt unterstützt | S0–S3 | A5→A4→B3→C3; A5→A4→B4→C3; A5→B5→B4→C3 | C3 |
| H2+H3 | lokal kompatibel | S0–S3 | A5→A4→B3→C3; A5→B5→C5→C4 | keines |
| H2+H3 | exakt unterstützt | S0–S3 | A5→A4→B3→C3; A5→B5→C5→C4 | keines |

Lesebeispiele mit zwei bis vier Alternativen, höchstens ein festes Fenster je Darstellung/Zustand. Die Anzeigebegrenzung ist kein Qualitätskriterium; Teilstücke sind nicht unabhängig kombinierbar.

Schnitt aller gespeicherten Einzelhinweise, ohne Propagation: **1** feldkompatible, mit Nachbarkanten **1** legale Wege. Keine beobachtete menschliche Arbeitslast.

[Etappendaten](S03-09.json) · [Begrenzte Routenansicht](S03-09.routes.json). Dort stehen für S0–S3, S3–S6 und S1–S5 genaue Teilroutenzahlen, gemeinsame Anfangs-/Endstücke und bis zu zwölf konkrete Alternativen; größere Listen sind als gekürzt gekennzeichnet.

## Verpflichtende Gegenproben und Grenzen

S03-02/H1+H4 reproduziert 75 exakt unterstützte gegenüber 107 aus exakten Feld-/Kantenprojektionen rekombinierten legalen Routen. Die 32 zusätzlichen Wege enthalten ausschließlich einzeln exakt unterstützte Bestandteile und verletzen trotzdem Hinweise.

S03-05/H2+H3 besitzt acht exakte Routen, während lokale Felder die Kombination nicht erklären. Der Schnitt aller Einzelhinweise lässt sogar 509 feldkompatible bzw. 301 kantenkompatible Wege. Die menschliche positive, leichte Erfahrung verbietet es, solche Zahlen pauschal als Last oder Qualität auszulegen.

S03-08 hat bis zwei Hinweise keine lokale Stundenfixierung und wurde sehr positiv erlebt. H1+H2+H5 liefert einen lokalen S2-Zeugen; H2+H5+H6 einen anderen exakten Zeugen. Frühe Fixierungen werden nicht vorausgesetzt. Die beobachtete H4-Wiederverwendung ist nicht mit H4 allein gleichzusetzen.

A/B/C/D und V1/V2, T02/T07 einschließlich der künstlichen S3-Vorgabe bleiben Kontrollen. Ihre technischen Profile bestimmen keine nachgetragenen menschlichen Urteile. Die nachgelieferte Zehnerserie einschließlich Wiederholung und Kennungsabweichung ist in der Beobachtungssammlung erfasst.

Reproduktion: `npm run report:b2:stages -- --check`; bewusstes Erneuern nur mit `--write`. [Architektur, Format und Aussagegrenzen](../README.md).
