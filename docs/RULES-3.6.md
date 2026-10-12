# Fachliche Regelspezifikation 3.6 – Rekonstruktion, Version 0.1

**Quellenbasis:** Spielregelabschnitt und Konstante `blocked`/`solution` aus `gezeitenkarten_3_6/index.html` sowie dessen README. Dies ist eine **partielle** fachliche Spezifikation. Sie ersetzt noch nicht die vollständige Prüfung aller sieben Hinweisprädikate und aller UI-Zustandsübergänge.

## 1. Spielfeld und Positionen

- Es gibt 25 benannte Hexfelder `A1` bis `E5` (Spalten A–E, Zeilen 1–5).
- Felder `B3`, `C3`, `E2` sind Land und nicht befahrbar.
- `B3` und `C3` bilden die Insel **Tesoro**; `E2` sind die **Klippen**.
- Alle anderen Felder sind befahrbar, **einschließlich** des Riffs Alpha/Violett.
- Startfeld ist `D4` (Delta/Blau).

**Offene technische Präzisierung:** Zuordnung der Buchstaben/Ziffern zu Pixel-/Axialkoordinaten und exakte Parität der versetzten Hexreihen muss noch aus den Koordinatenfunktionen des Codes übernommen und mit Beispielen getestet werden. Nicht allein aus Feldnamen ableiten.

## 2. Route

- Eine Route besteht aus Startposition und **sechs** aufeinanderfolgenden Etappen, also sieben Positionen.
- Jede Etappe führt in **genau eines der sechs Hexfelder mit gemeinsamer Seite**.
- Die Zielposition jeder Etappe muss auf der Karte liegen und befahrbar sein.
- Kein Feld darf auf der Route mehrfach betreten werden.
- Die Etappenpositionen entsprechen den Stunden 1 bis 6; der Start ist Stunde 0.

## 3. Richtungen und Kurswechsel

- Sechs benannte Richtungen: **Ost, Südost, Südwest, West, Nordwest, Nordost**.
- Ein Kurswechsel bezieht sich auf die Richtung der **unmittelbar vorherigen Etappe**.
- „Rechts“ bedeutet **im Uhrzeigersinn**.
- Eine Drehung um 60° entspricht einer benachbarten Richtung im sechsteiligen Richtungszyklus.
- Die erste Etappe besitzt keine vorherige Fahrtrichtung.

## 4. Entfernungen

- Abstand ist die **Hexdistanz** zwischen zwei Feldern (kürzeste Zahl von Hexschritten auf einer *ungehinderten* Hexebene).
- **Landhindernisse verändern den Hexabstand nicht.** Abstand ist nicht gleich Länge eines tatsächlich befahrbaren Umwegs.
- Abstand eines Feldes zu sich selbst = 0; direkt benachbarte Felder haben Abstand 1.
- Die Distanzanzeige wählt ein befahrbares Ursprungsfeld und zeigt die Hexabstände auf allen befahrbaren Feldern.

## 5. Küstenregel

- Als **Küste von Tesoro** gelten befahrbare Wasserfelder, die mit `B3` **oder** `C3` eine gemeinsame Hexseite teilen.
- Reine Berührung an einer Hexecke zählt nicht.
- Küste ist eine **geometrische Eigenschaft des Feldes**, nicht eine besondere Bewegungsart.
- Die Anzahl der Küstenbesuche wird anhand der im Hinweis genannten Stundenpositionen bestimmt; Intervallgrenzen müssen explizit sein.

## 6. Lösung des Referenzfalls

`D4 → E3 → D2 → C2 → B2 → B1 → A1`

Diese Route ist als Referenz in der HTML-Datei hinterlegt. Die Original-README berichtet, dass genau eine der 519 zulässigen Routen alle sieben Hinweise erfüllt.

## 7. Offene Punkte vor vollständiger Reimplementierung

1. Exakte Koordinatenumrechnung und Nachbarschaftstabelle mit Testvektoren.
2. Alle sieben Hinweisformulierungen und ihre formalen Prädikate direkt aus dem Quellcode übernehmen.
3. Exakte Zustandsmaschine für Markierungen, Route, Undo, Hilfen und Ergebnisprüfung.
4. Persistenzformat und Verhalten bei Reload.
5. Fehler-/Randfälle, UI-Interaktion und Tastatur-/Touch-Verhalten.
6. Unabhängigen Lösungsprüfer als Regressionstest erstellen.

**Regel:** Wenn Prototypcode und redaktionell gewünschtes Verhalten abweichen, Abweichung als Issue erfassen, nicht unbemerkt in diese Spezifikation übernehmen.
