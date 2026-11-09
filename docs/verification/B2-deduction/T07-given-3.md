# T07-given-3: Details

`B2-BC-T07-M013-D4-R00+given-hour-3`. Vorgaben: [{"hour":3,"cell":"C1"}].

Feldmengen und Übergänge des legalen Raums sowie jeder Szenarioprojektion stehen in `T07-given-3.jsonl`. Indizes: Felder Stunde 0–6, Übergänge Ankunftsstunde 1–6. `A>B` bezeichnet eine gerichtete Kante. Leere Mengen sind widersprüchlich, Singletons fest, größere Mengen unbekannt. Ausschlüsse beziehen sich auf die legale Basis, nicht alle Kartenfelder.

Exakte Basismöglichkeiten Stunde 1–6: 6/12/19/23/23/23; Übergänge: 6/21/49/82/96/96.

## Einzelhinweise, Paare und Tripel

| Hinweise | Routen | Exakte Felder 1–6 | Exakte Übergänge | Neue Kombinationsausschlüsse Felder/Kanten |
| --- | --- | --- | --- | --- |
| keine | 23 | 1/1/1/3/7/13 | 1/1/1/3/8/21 | — |
| H1 | 21 | 1/1/1/3/7/11 | 1/1/1/3/8/19 | — |
| H2 | 15 | 1/1/1/3/5/11 | 1/1/1/3/6/13 | — |
| H3 | 12 | 1/1/1/3/5/8 | 1/1/1/3/6/11 | — |
| H4 | 23 | 1/1/1/3/7/13 | 1/1/1/3/8/21 | — |
| H5 | 23 | 1/1/1/3/7/13 | 1/1/1/3/8/21 | — |
| H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | — |
| H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | — |
| H1+H2 | 13 | 1/1/1/3/5/9 | 1/1/1/3/6/11 | 0/0 |
| H1+H3 | 10 | 1/1/1/3/5/6 | 1/1/1/3/6/9 | 0/0 |
| H1+H4 | 21 | 1/1/1/3/7/11 | 1/1/1/3/8/19 | 0/0 |
| H1+H5 | 21 | 1/1/1/3/7/11 | 1/1/1/3/8/19 | 0/0 |
| H1+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H1+H7 | 5 | 1/1/1/2/2/4 | 1/1/1/2/2/5 | 0/0 |
| H2+H3 | 9 | 1/1/1/3/4/7 | 1/1/1/3/5/8 | 0/0 |
| H2+H4 | 15 | 1/1/1/3/5/11 | 1/1/1/3/6/13 | 0/0 |
| H2+H5 | 15 | 1/1/1/3/5/11 | 1/1/1/3/6/13 | 0/0 |
| H2+H6 | 8 | 1/1/1/3/4/8 | 1/1/1/3/5/8 | 0/0 |
| H2+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H3+H4 | 12 | 1/1/1/3/5/8 | 1/1/1/3/6/11 | 0/0 |
| H3+H5 | 12 | 1/1/1/3/5/8 | 1/1/1/3/6/11 | 0/0 |
| H3+H6 | 4 | 1/1/1/3/2/4 | 1/1/1/3/3/4 | 1/1 |
| H3+H7 | 4 | 1/1/1/2/2/4 | 1/1/1/2/2/4 | 0/0 |
| H4+H5 | 23 | 1/1/1/3/7/13 | 1/1/1/3/8/21 | 0/0 |
| H4+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H4+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H5+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H5+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H6+H7 | 2 | 1/1/1/1/1/2 | 1/1/1/1/1/2 | 2/2 |
| H1+H2+H3 | 7 | 1/1/1/3/4/5 | 1/1/1/3/5/6 | 0/0 |
| H1+H2+H4 | 13 | 1/1/1/3/5/9 | 1/1/1/3/6/11 | 0/0 |
| H1+H2+H5 | 13 | 1/1/1/3/5/9 | 1/1/1/3/6/11 | 0/0 |
| H1+H2+H6 | 8 | 1/1/1/3/4/8 | 1/1/1/3/5/8 | 0/0 |
| H1+H2+H7 | 5 | 1/1/1/2/2/4 | 1/1/1/2/2/5 | 0/0 |
| H1+H3+H4 | 10 | 1/1/1/3/5/6 | 1/1/1/3/6/9 | 0/0 |
| H1+H3+H5 | 10 | 1/1/1/3/5/6 | 1/1/1/3/6/9 | 0/0 |
| H1+H3+H6 | 4 | 1/1/1/3/2/4 | 1/1/1/3/3/4 | 0/0 |
| H1+H3+H7 | 3 | 1/1/1/2/2/3 | 1/1/1/2/2/3 | 0/0 |
| H1+H4+H5 | 21 | 1/1/1/3/7/11 | 1/1/1/3/8/19 | 0/0 |
| H1+H4+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H1+H4+H7 | 5 | 1/1/1/2/2/4 | 1/1/1/2/2/5 | 0/0 |
| H1+H5+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H1+H5+H7 | 5 | 1/1/1/2/2/4 | 1/1/1/2/2/5 | 0/0 |
| H1+H6+H7 | 2 | 1/1/1/1/1/2 | 1/1/1/1/1/2 | 0/0 |
| H2+H3+H4 | 9 | 1/1/1/3/4/7 | 1/1/1/3/5/8 | 0/0 |
| H2+H3+H5 | 9 | 1/1/1/3/4/7 | 1/1/1/3/5/8 | 0/0 |
| H2+H3+H6 | 4 | 1/1/1/3/2/4 | 1/1/1/3/3/4 | 0/0 |
| H2+H3+H7 | 4 | 1/1/1/2/2/4 | 1/1/1/2/2/4 | 0/0 |
| H2+H4+H5 | 15 | 1/1/1/3/5/11 | 1/1/1/3/6/13 | 0/0 |
| H2+H4+H6 | 8 | 1/1/1/3/4/8 | 1/1/1/3/5/8 | 0/0 |
| H2+H4+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H2+H5+H6 | 8 | 1/1/1/3/4/8 | 1/1/1/3/5/8 | 0/0 |
| H2+H5+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H2+H6+H7 | 2 | 1/1/1/1/1/2 | 1/1/1/1/1/2 | 0/0 |
| H3+H4+H5 | 12 | 1/1/1/3/5/8 | 1/1/1/3/6/11 | 0/0 |
| H3+H4+H6 | 4 | 1/1/1/3/2/4 | 1/1/1/3/3/4 | 0/0 |
| H3+H4+H7 | 4 | 1/1/1/2/2/4 | 1/1/1/2/2/4 | 0/0 |
| H3+H5+H6 | 4 | 1/1/1/3/2/4 | 1/1/1/3/3/4 | 0/0 |
| H3+H5+H7 | 4 | 1/1/1/2/2/4 | 1/1/1/2/2/4 | 0/0 |
| H3+H6+H7 | 1 | 1/1/1/1/1/1 | 1/1/1/1/1/1 | 0/0 |
| H4+H5+H6 | 9 | 1/1/1/3/5/8 | 1/1/1/3/6/9 | 0/0 |
| H4+H5+H7 | 6 | 1/1/1/2/2/5 | 1/1/1/2/2/6 | 0/0 |
| H4+H6+H7 | 2 | 1/1/1/1/1/2 | 1/1/1/1/1/2 | 0/0 |
| H5+H6+H7 | 2 | 1/1/1/1/1/2 | 1/1/1/1/1/2 | 0/0 |
| H1+H2+H3+H4+H5+H6+H7 | 1 | 1/1/1/1/1/1 | 1/1/1/1/1/1 | — |

Die letzte Zeile ist der gesonderte Kontrollzustand mit allen Hinweisen. Neue Kombinationsausschlüsse fehlen in jedem echten Teilhinweissatz; „—“ bedeutet nicht untersucht/kein Paar oder Tripel.

## Lokaler Fixpunkt mit allen Hinweisen

| Stunde | Mögliche Felder | Zuerst eindeutig (Regelrunde/Schritt) |
| --- | --- | --- |
| 0 | D4 | 0/D1 |
| 1 | D3 | 2/D34 |
| 2 | C2 | 1/D18 |
| 3 | C1 | 0/D2 |
| 4 | B1, B2 | offen |
| 5 | A2, C3 | offen |
| 6 | A3, B1, B2, B4 | offen |

| Ankunftsstunde | Mögliche Übergänge |
| --- | --- |
| 1 | D4>D3 |
| 2 | D3>C2 |
| 3 | C2>C1 |
| 4 | C1>B1, C1>B2 |
| 5 | B1>A2, B2>C3 |
| 6 | A2>A3, A2>B1, A2>B2, C3>B2, C3>B4 |

## Lokale Schlusskette (alle Hinweise)

Vollständige entfernte Feld-/Kantenmengen und Erklärungen je Schritt stehen im JSONL auch für alle Teilhinweissätze. Die ausführbare API enthält zusätzlich Vorher-/Nachhermengen. Premissen verweisen ausschließlich auf frühere Schritte desselben Szenarios.

| Schritt | Runde | Regel | Art/Stunde | Entfernt | Fest | Hinweise | Premissen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | 0 | start | field/0 | 23 | D4 |  |  |
| D2 | 0 | diagnostic-given | field/3 | 23 | C1 |  |  |
| D3 | 1 | no-revisit-singleton | field/1 | 1 | — |  | D1 |
| D4 | 1 | no-revisit-singleton | field/2 | 1 | — |  | D1 |
| D5 | 1 | no-revisit-singleton | field/4 | 1 | — |  | D1 |
| D6 | 1 | no-revisit-singleton | field/5 | 1 | — |  | D1 |
| D7 | 1 | no-revisit-singleton | field/6 | 1 | — |  | D1 |
| D8 | 1 | no-revisit-singleton | field/1 | 1 | — |  | D2, D3 |
| D9 | 1 | no-revisit-singleton | field/2 | 1 | — |  | D2, D4 |
| D10 | 1 | no-revisit-singleton | field/4 | 1 | — |  | D2, D5 |
| D11 | 1 | no-revisit-singleton | field/5 | 1 | — |  | D2, D6 |
| D12 | 1 | no-revisit-singleton | field/6 | 1 | — |  | D2, D7 |
| D13 | 1 | transition-endpoints | transition/1 | 102 | — |  | D1, D8 |
| D14 | 1 | predecessor-support | field/1 | 16 | — |  | D1, D8, D13 |
| D15 | 1 | transition-endpoints | transition/2 | 87 | — |  | D14, D9 |
| D16 | 1 | predecessor-support | field/2 | 10 | — |  | D14, D9, D15 |
| D17 | 1 | transition-endpoints | transition/3 | 107 | C2>C1 |  | D16, D2 |
| D18 | 1 | successor-support | field/2 | 11 | C2 |  | D16, D2, D17 |
| D19 | 1 | transition-endpoints | transition/4 | 104 | — |  | D2, D10 |
| D20 | 1 | predecessor-support | field/4 | 18 | — |  | D2, D10, D19 |
| D21 | 1 | transition-endpoints | transition/5 | 93 | — |  | D20, D11 |
| D22 | 1 | predecessor-support | field/5 | 12 | — |  | D20, D11, D21 |
| D23 | 1 | transition-endpoints | transition/6 | 63 | — |  | D22, D12 |
| D24 | 1 | predecessor-support | field/6 | 6 | — |  | D22, D12, D23 |
| D25 | 1 | count-bounds | field/6 | 3 | — | H1 | D24 |
| D26 | 1 | count-bounds | field/5 | 2 | — | H2 | D22 |
| D27 | 1 | count-bounds | field/6 | 5 | — | H3 | D25 |
| D28 | 1 | turn-two-edges | transition/4 | 1 | — | H7 | D2, D20, D26, D19, D21 |
| D29 | 1 | turn-two-edges | transition/5 | 12 | — | H7 | D2, D20, D26, D19, D21 |
| D30 | 2 | no-revisit-singleton | field/4 | 1 | — |  | D18, D20 |
| D31 | 2 | no-revisit-singleton | field/5 | 1 | — |  | D18, D26 |
| D32 | 2 | no-revisit-singleton | field/6 | 1 | — |  | D18, D27 |
| D33 | 2 | transition-endpoints | transition/2 | 20 | D3>C2 |  | D14, D18, D15 |
| D34 | 2 | successor-support | field/1 | 5 | D3 |  | D14, D18, D33 |
| D35 | 2 | transition-endpoints | transition/4 | 1 | — |  | D2, D30, D28 |
| D36 | 2 | predecessor-support | field/4 | 1 | — |  | D2, D30, D35 |
| D37 | 2 | transition-endpoints | transition/5 | 1 | — |  | D36, D31, D29 |
| D38 | 2 | predecessor-support | field/5 | 5 | — |  | D36, D31, D37 |
| D39 | 2 | transition-endpoints | transition/6 | 40 | — |  | D38, D32, D23 |
| D40 | 2 | predecessor-support | field/6 | 3 | — |  | D38, D32, D39 |
| D41 | 3 | transition-endpoints | transition/1 | 5 | D4>D3 |  | D1, D34, D13 |
