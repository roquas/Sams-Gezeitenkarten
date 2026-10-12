# Koordinaten, Kartenbeschriftungen und mobiles Logbuch

## Grundlage und Umfang

Branch `feature/coordinates-chart-logbook`, auf dem abgenommenen Grafikstand
`4fabc519` von `feature/nautical-ui-materials`. Dieser Stand ist noch nicht in
`main`; die älteren Grafikbranches werden nicht verändert. Der neue PR baut
auf PR #28 auf. Keine Zusammenführung nach main.

## #26: eine Koordinatendarstellung

`coordinateMarkup` und `coordinateTextMarkup` in `src/ui/coordinates.mjs`
rendern Rechteck mit griechischem Zeichen und Farbkreis mit zusätzlichem
Buchstaben. Jede Kombination hat einen vollständigen Accessible Name wie
„Gamma / Cyan“. Einheitlich verwendet in Gesamthinweisen, einzelner Buchseite,
Blätteroverlay, rekonstruierter Route, Distanzstatus, Hilfeausgaben und den
passenden Koordinatenbeispielen/Spielregelabsätzen. Die Textquellen bleiben
unverändert; ausschließlich die Browserdarstellung wird formatiert.

## #27: ruhige Pergamentschilder und Randabstand

Tesoro, Klippen und Leuchtturm tragen klar lesbare Serifenschrift auf kleinen,
hellen Pergamentplättchen. Die vorhandene Papiertextur wird wiederverwendet;
keine neue Seekartenillustration oder UI-Bildgenerierung.

Die neun Ausschnitte des unveränderten Aquarellrandes erhalten außen mehr
Raum. Spaltenzeichen und Zeilenfarben liegen innen, mit Abstand zu den
Außenkanten und zur Wasserfläche. Der SVG-Ausschnitt wächst auf 563 × 473;
alle Hexzentren, Trefferpolygone und Motivpositionen bleiben unverändert.
Plättchen sind pointer-events:none und verändern keine Karteneingaben.

## #29: Radar und mobile Ansichten

- Inaktiv: neutraler Messingbutton, kein Statushinweis.
- Wartend: Bernstein und „Jetzt ein Feld auf der Karte wählen.“ Der Button
  beschreibt auch die Möglichkeit, die Auswahl durch erneutes Drücken abzubrechen.
- Anzeige: Petrol und Status mit symbolischer Koordinate des Bezugspunktes.

Nach einem Wechsel auf ein anderes Werkzeug verschwinden Status und Abstände
wie bisher. Auch nach dem Werkzeug „Alle Stunden radieren“ kann das Radar seinen
Bezugspunkt wählen, ohne dabei Notizen zu löschen. Regeln, Entfernungsmessung
und Undo-/Speicherformat bleiben unverändert.

Bis 880 CSS-Pixeln wechseln „Seekarte | Logbuch“ über eine feste untere Leiste.
Beide Schaltflächen haben mindestens 44 Pixel Höhe. Safe-Area-Inset und ein eigener Scrollbereich
oberhalb der Navigation verhindern Überdeckung von Inhalten oder Bedienelementen. Das Logbuch nutzt die volle
Breite und zeigt sämtliche sieben Hinweise direkt offen, mit synchronisierten
Abhakzuständen. Andere Hilfeseiten sind darunter weiterhin erreichbar.
Der einzelne blätterbare Hinweis bleibt in der Seekartenansicht.

Ansichtswechsel verändert keinen Spielzustand und erhält pro Ansicht die
Scrollposition. Die unsichtbare Ansicht ist inert; Escape kehrt zur Karte
zurück. Die doppelte Hilfe-Schaltfläche in der Kopfzeile entfällt. Desktop
behält seine Karte und rechte Hilfe gleichzeitig; die Reihenfolge wird beim
Wechsel zurück auf Desktop wiederhergestellt.

## Prüfumfang

Unit: alle 25 Koordinaten und ihre Accessible Names, Formatvarianten,
Dreiphasenstatus ohne Zustandsmutation, Abstand der Randzeichen; weiterhin
Prüfsummen sämtlicher Aquarellassets und Prototyp 3.6 sowie sämtliche Regeln.
Browser: gleiche Komponenten in allen Ausgaben, drei Radarzustände, Abbruch,
Werkzeugwechsel, Notizschutz, mobile Ansicht/Scrollposition/Tastatur/Undo,
Touchflächen, Kartenlabels und sämtliche bestehenden Funktionsprüfungen.

## Verifizierte Ergebnisse und Browserbilder

[Actions 38308339049](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/38308339049),
UI-Commit `30509ec`: 31 Unit-Tests und 77 Browsertests bestanden,
3 erwartete projektabhängige Skips. Keine fehlgeschlagenen Tests.
Erster Lauf `38307815671` ebenfalls grün; seine Sichtprüfung führte zur
separaten mobilen Scrollfläche, damit die Navigation keine Inhalte überlagert.

Die folgenden unveränderten Aufnahmen stammen aus Chromium; keine Mockups.
Desktop: 1440 × 1080 mit Ganzseitenaufnahme. Mobil: Pixel-7-Emulation,
390 × 844 CSS-Pixel. Zusätzlich geprüft: 320, 620 und 768 Pixel.

- [Desktop](screenshots/ux-desktop.jpg)
- [Mobile Seekarte mit wartendem Radar](screenshots/ux-mobile-chart.jpg)
- [Mobiles Bordbuch und Kartenbuttons](screenshots/ux-mobile-bordbook.jpg)
- [Mobile Übersicht, Hinweise I–III](screenshots/ux-mobile-logbook.jpg)
- [Mobile Übersicht nach Scrollen, Hinweise IV–VII](screenshots/ux-mobile-logbook-later.jpg)

Alle sieben Hinweise stehen untereinander in einer durchgehenden Übersicht.
Ein Smartphone kann die sieben langen Texte nicht ohne Scrollen gleichzeitig
auf einer Bildschirmhöhe darstellen; es sind keine einzelnen aufzuklappenden
Hinweisabschnitte und keine Karussellseiten.

Safari ist für diese neue Ausbaustufe noch nicht auf echter Hardware geprüft.
Der Nutzer hat den Ausgangsgrafikstand lokal in Safari abgenommen.
