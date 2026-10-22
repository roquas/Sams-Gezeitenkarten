# Regelvertrag `gezeitenkarten-2`

Verbindlicher Stand ab der Konsolidierung F01–F03. Er ersetzt den Prototypvertrag
`gezeitenkarten-1` vollständig. Schema 1, alte Speicherstände und die vier alten
Rätsel werden nicht zur Laufzeit unterstützt. Historische Dokumente und
`prototypes/3.6/` sind Quellen, keine geltenden Verträge.

## Karte und Instanz

Die abstrakte Karte ist unmittelbar die Eingabe von `validateMap(map)` und
`mapFingerprint(map)`:

```json
{
  "geometry": "even-row-offset-pointy-v1",
  "grid": {"columns": 5, "rows": 5},
  "objects": [
    {"id": "o1", "cells": ["A5", "B5"], "passable": true},
    {"id": "o2", "cells": ["B2", "C2"], "passable": false}
  ]
}
```

IDs sind lokal stabil und eindeutig. Jede Zellmenge ist nichtleer, duplikatfrei,
seitenzusammenhängend und innerhalb A1–E5. Objekte dürfen sich nicht überlappen.
**Zusammenhang und exklusive Zellzuordnung sind bewusste v2-Vertragsregeln.**
Beide Befahrbarkeiten erlauben mehrere Zellen. Freie Wasserzellen gehören keinem
Objekt an. Gesperrte Zellen sind exakt die Vereinigung aller Zellen der Objekte
mit `passable:false`; es gibt keine gespeicherte `blocked`-Liste.

Karte und Objekte enthalten keine Starts, Hinweise, Zielrouten, Asset-IDs,
Objektklassen, Namen oder Geschichten. Logik ergänzt die Karte:

```json
{
  "map": {"geometry":"even-row-offset-pointy-v1","grid":{"columns":5,"rows":5},"objects":[{"id":"o1","cells":["C3","D3"],"passable":true}]},
  "start": "C3",
  "steps": 1,
  "clues": [{"id":"A","type":"distanceToPlace","hour":1,"placeId":"o1","distance":0}]
}
```

Der Start muss explizit eine Zelle eines befahrbaren Objekts sein. Die Karte
bleibt unabhängig von der Startauswahl. Etappen: ganzzahlig 1–6. Die Beschränkung
auf 5×5 und höchstens sechs Etappen bleibt bewusst bestehen; ein variables
Spielfeld ist nicht Teil dieser Konsolidierung.

## Geometrie und Route

Nullbasierte Spalte `c`, Zeile `r`: axial `q=c-floor(r/2)`, `r=r`.
Hexabstand `max(abs(dq),abs(dr),abs(dq+dr))`.
Richtungen im Uhrzeigersinn: E, SE, SW, W, NW, NE mit Differenzen
(1,0), (0,1), (-1,1), (-1,0), (0,-1), (1,-1).

Eine Route hat `steps+1` verschiedene bekannte befahrbare Zellen, beginnt bei
`start` und bewegt sich pro Stunde genau zu einem Seitennachbarn. Wiederbesuche
sind verboten, auch die Rückkehr zum Start. Stunde 0 ist der Start. Die
vorhandene Hexgeometrie und der vorhandene Routengenerator werden weiterbenutzt.

## Kleine orthogonale Hinweisfamilie

Alle Hinweise haben eine eindeutige `id`. Unbekannte Felder werden abgewiesen.

| Typ | Parameter | Bedeutung |
| --- | --- | --- |
| `position` | `hour:0..steps`, `cell` | Position dieser Stunde. |
| `direction` | `hour:1..steps`, `direction` | Richtung der Etappe, die in dieser Stunde endet. |
| `turn` | `hour:2..steps`, `degrees` | Änderung zur vorherigen Etappe; positiv rechts, negativ links. Zulässig: −180, −120, −60, 0, 60, 120, 180. |
| `distanceToPlace` | `hour:0..steps`, `placeId`, `distance:0..8` | **Kleinster** geometrischer Abstand zu irgendeiner Zelle dieses Objekts ist exakt `distance`. |
| `distanceBetweenHours` | `hours:[a,b]`, `distance:0..8` | Geometrischer Abstand der Stundenpositionen, `0<=a<=b<=steps`. |
| `countDistanceToPlace` | `fromHour`, `toHour`, `placeId`, `distance:0..8`, `count` | Genau `count` Stunden im inklusiven Intervall haben exakt diesen Mindestabstand. |

Stunden, Abstände und Anzahlen sind ganze Zahlen. `count` liegt zwischen 0 und
`toHour-fromHour+1`. Jede Stunde zählt einmal, auch wenn mehrere Objektzellen
gleich weit entfernt sind. `[h,h]` und Abstand 0 sind erlaubt. `placeId` verweist
immer auf eine ID aus `map.objects`; der Name des Parameters bezeichnet keine
zweite Ortsliste. Unbekannte Referenzen und umgekehrte Intervalle sind Fehler.
Ein leerer Hinweissatz ist ein gültiger Logikkandidat, kein Eindeutigkeitsbeweis.

`adjacentToPlace`, `countAdjacentToPlace` und `coast` entfallen. Nachbarschaft
wird als Distanz 1 ausgedrückt; für Objekte mit mehreren Zellen ist dies stets
der Mindestabstand. Es gibt keinen Legacy-Dispatch.

## Explizite Testvektoren der Vertragsänderung

Für das Objekt `cells:["B2","C2"]` gilt von A1 aus: Abstand zu B2 = 2, zu C2 = 3,
**Objektabstand = 2**. `distanceToPlace(...,distance:3)` ist jetzt falsch; die alte
Existenzsemantik wurde absichtlich ersetzt. Ob das Objekt befahrbar ist und ob
andere Objekte im Weg liegen, verändert diesen geometrischen Wert nicht.

Für `cells:["A3","B3","C3"]` und die Route A3→B3→C3→D3 gilt im Intervall 0–3:
Abstand 0 genau dreimal, Abstand 1 einmal, Abstand 2 nullmal. Im Intervall 2–2
ist Abstand 0 einmal erfüllt. Start- und Endgrenze zählen mit.

Diese Vektoren, alle 625 Zellpaare, beide Zeilenparitäten, Richtungen,
Vorzeichen/Wraparound bei Drehungen, Land, Wiederbesuche, Budgetfehler und die
Solveranwendung beider Distanzoperatoren sind in `tests/engine/` abgesichert.

## Solver und Qualitätsaussagen

Es gibt eine Regelengine (`createRules`) und einen Routengenerator. Vollständige
Analyse nutzt `solvePuzzle`, begrenzte Analyse konsumiert dessen gleichen
Generator mit den gleichen Prädikaten. Ein Budgetfehler ist niemals ein
Eindeutigkeitsbeweis. Der begrenzte Modus sättigt Mehrdeutigkeit bei zwei und
kennzeichnet `countExact:false`.

Irredundanz bedeutet: genau eine Lösung, Übereinstimmung mit der internen
Zielroute und nach **jedem einzelnen** Weglassen mindestens zwei Lösungen.
Einzeln redundante Hinweise dürfen nicht gleichzeitig blind entfernt werden.
Die vorhandenen Enumerationsmetriken sind keine menschlichen Schwierigkeitsgrade.
Ein späterer Generator muss dieses Qualitätsgate vor redaktioneller Freigabe
anwenden. Der Browser verlangt Eindeutigkeit; die generische Dokumentvalidierung
führt keine Suche aus.
