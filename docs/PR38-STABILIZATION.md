# PR #38: Stabilisierung für die Hosting-Abnahme

Historisches Herkunftsdokument. Für den konsolidierten PR48-Stand gilt
[PR48-CONSOLIDATION.md](PR48-CONSOLIDATION.md), insbesondere dessen spätere
Landfeld- und Radarregeln; widersprechende historische Angaben unten sind
keine aktuellen Akzeptanzkriterien.

Auftrag vom 14. Oktober 2026, auf dem bestehenden Branch
`feature/puzzle-schema-loader-solver`. Kein Merge und keine Änderungen an `main`.
Diese Beschreibung ergänzt die historischen Abnahmeberichte; sie überschreibt
weder 3.6-Referenzen noch deren damalige Bedienbeschreibung.

## Gültige Änderungen

### Abstandsanzeige ([#40](https://github.com/roquas/Sams-Gezeitenkarten/issues/40))

| Ausgangszustand | Aktion | Ergebnis |
|---|---|---|
| Aus | Radar drücken | Ursprungsauswahl mit sichtbarem Hinweis |
| Ursprungsauswahl | Befahrbares Feld wählen | Geometrische Hexabstände ab diesem Feld |
| Ursprungsauswahl | Land anklicken | Auswahl bleibt offen, keine Markierung |
| Ursprungsauswahl | Radar drücken | Aus |
| Ursprungsauswahl | Markierungswerkzeug wählen | Auswahl abgebrochen, normal bearbeiten |
| Abstände sichtbar | Radar einmal drücken | Aus; Ursprung gelöscht |
| Abstände sichtbar | Stunde, Markierungswerkzeug oder Radierer wechseln | Overlay unverändert |
| Abstände sichtbar | Notizen, Route, Undo | Overlay unverändert |

Für einen neuen Ursprung zuerst ausschalten, dann erneut einschalten und ein
befahrbares Feld wählen. Toolbar-Tooltip, Live-Status, Werkzeuglegende und Regeln
beschreiben dasselbe Verhalten. Die vorhandene Speicherung bleibt erhalten:
ein gespeicherter Ursprung wird wiederhergestellt, eine gespeicherte Auswahl ohne
Ursprung benötigt weiterhin einen Auswahlklick. Reset entfernt nur den aktiven
Spielstand einschließlich Overlay. Rätsel behalten ihre getrennten Speicherkeys.

### Land und geografische Referenzen ([#40](https://github.com/roquas/Sams-Gezeitenkarten/issues/40))

Gesperrte Felder haben keine aktive Stundenkante. Ihre transparente Umrandung
verwendet 1,05 SVG-Einheiten, Deckkraft 0,62 und ein zurückhaltendes Strichmuster
`4 3`. Wasserfelder und deren Stundenkanten bleiben unverändert. Befahrbarkeit
kommt ausschließlich aus den Rätseldaten, niemals aus der Illustration.

„Die Quittung von Nombreo“, H1, nennt nun **Tintenriff (D4)**. Die Oberfläche
formatiert D4 mit der vorhandenen gemeinsamen Koordinatenkomponente. Die logische
Hinweisbedingung bleibt unverändert.

Die Dreifingerinsel verwendet ein gemeinsames vorhandenes Aquarellmotiv über
**B3/C3/D3**, statt eines Zweiermotivs neben einer isolierten Wiederholung.
Der Mittelpunkt stammt aus den tatsächlichen drei Hexzentren. Der gemeinsame
Darstellungsrahmen ist 246 × 112 SVG-Einheiten; die Illustration wird für die
horizontale Dreiergruppe eingepasst. Das zugrunde liegende PNG bleibt bytegleich.
Die explizite Größe wird nur für Motive über mehr als zwei Felder verwendet;
bisherige Ein- und Zweiermotive behalten ihre abgestimmten Darstellungsgrößen.

### Logbuch ([#37](https://github.com/roquas/Sams-Gezeitenkarten/issues/37))

Beide Papierseiten verwenden denselben horizontalen Maßstab der vorhandenen
Buchtextur. Die volle linke Seite setzt sich links außerhalb des sichtbaren
Buchausschnitts fort; ihre Außenkante wird nicht als kurze Seite eingequetscht.
Die Falz und die breite rechte Textseite behalten ihre Position. Auf schmalen
Displays erhält der Hinweis zusätzlich Abstand zum gewellten rechten Papierrand;
Browserprüfungen messen die tatsächlichen Textzeilen einschließlich WebKit. Der Ausschnitt
ist begrenzt, ohne horizontales Scrollen zu erzeugen.

Das Steuerrad wird durch `assets/ui/logbook-chart.svg` ersetzt: eine eigens
gezeichnete, rein dekorative Seekartenskizze in brauner Tinte. Sie enthält weder
Koordinaten noch Ortsnamen oder Daten des aktuellen Rätsels. Sie ist für
Screenreader ausgeblendet und hat keine Interaktion. Die Grafik ist ein UI-Detail,
keine neue Spielkartenillustration und kein Ausbau der Kartenbibliothek.

### Blättern ([#39](https://github.com/roquas/Sams-Gezeitenkarten/issues/39))

Statt 82 Grad räumlicher Rotation vor dem Betrachter: 160 ms Ausblenden des
vorherigen Eintrags mit maximal 5 CSS-Pixeln seitlicher Bewegung. Keine Rotation,
Perspektivvergrößerung oder Skalierung. Die Bewegung bleibt auch auf großen
Monitoren gleich klein. Der neue Hinweis ist sofort lesbar und bedienbar.
`prefers-reduced-motion: reduce` schaltet direkt um; Änderungen der Einstellung
brechen eine laufende Animation ab. Dekorative Übergangselemente sind nicht
interaktiv und werden nach Ende oder Abbruch entfernt. Schnelles Weiterblättern,
Tastatur, Wischen, Abhaken und Wechsel des Rätsels bleiben erhalten.

## Redaktionelle Kartengestaltung

Siehe [CHART-EDITORIAL-GUIDELINES.md](CHART-EDITORIAL-GUIDELINES.md) für die
verbindlichen Regeln zu Multihex-Inseln, Archipelen, Nebeninseln, benachbarten
Hindernissen und Ortsreferenzen. Dies sind redaktionelle Abnahmekriterien, keine
neuen harten Schema- oder Solverbedingungen.

## Prüfstrategie

- Unveränderte Logik und Sollrouten aller vier Rätsel werden gegen SHA-256-Werte
  des akzeptierten PR-Stands abgesichert. Solver zählt weiterhin unabhängig von
  der Sollroute.
- Bestehende Unit- und Browserprüfungen bleiben erhalten. Nur Erwartungen an
  ausdrücklich ersetztes Verhalten (Zwei-Klick-Radar, kräftige Landkanten,
  gestauchte linke Seite) werden auf die neuen Vorgaben umgestellt.
- Neue Deploymenttests prüfen Radar, Landkanten über alle sechs Stunden,
  Markieren/Radieren, gemeinsame Inselgrafik, Buchgeometrie, Reduced Motion,
  Animation und die Koordinatenreferenz im tatsächlich ausgelieferten ZIP.
- Der Deploymentserver verwendet `/gk/pr38/`, `nosniff` und absichtlich keine
  `.mjs`-Typisierung. Positive `.js`-Initialisierung und negative `.mjs`-Kontrolle
  bleiben bestehen. Vier Rätsel mit getrennten Spielständen, Reset, Hilfen und
  vollständigen Routen werden weiterhin im entpackten Paket geprüft.
- Chromium auf Desktop und Smartphone sowie WebKit mit iPhone-/iPad-Profilen.
  Das sind echte Browserläufe mit Geräteemulation, keine physischen Apple-Geräte.
- Die CI erzeugt außerdem den alten Export aus Commit `6479400` und rendert
  Vorher-/Nachher-Aufnahmen. Bilder im Artefakt stammen aus dem Browser, nicht
  aus Konzeptzeichnungen.

## Auf Uberspace manuell abnehmen

1. Den **gesamten Inhalt** des neuen Distributions-ZIPs nach `/gk/pr38/` hochladen,
   einschließlich `index.html`, `src/`, `puzzles/` und `assets/`. Kein Build nötig.
2. Safari auf Mac, iPhone und iPad frisch öffnen: Karte mit 25 Feldern, Stunden,
   mobile Navigation und Einstellungen müssen bedienbar sein.
3. Radar → C1 → `?` → mehrere Felder markieren: Zahlen bleiben. Ein Radar-Klick
   schaltet sie aus; erst der nächste startet eine neue Auswahl.
4. Alle vier Rätsel wechseln, in zwei Fällen unterschiedliche Notizen setzen,
   zurückwechseln und nur das aktuelle Rätsel zurücksetzen.
5. „Das doppelte Ankerbuch“: B3/C3/D3 als eine Dreifingerinsel erkennen; H3 lesen.
6. Buch links, Lesbarkeit rechts, Vor-/Zurückblättern und Abhaken prüfen;
   gegebenenfalls mit „Bewegung reduzieren“ in den Geräteeinstellungen.

Die Veröffentlichung erfolgt durch diesen Upload. Ein grüner PR-Lauf verändert
keine Dateien auf Uberspace. Issues bleiben bis zur visuellen Abnahme offen;
[PR #38](https://github.com/roquas/Sams-Gezeitenkarten/pull/38) bleibt ungemergt.


## Gezielte Landhex-Korrektur nach Spieltest (#40)

Die optische Abschwächung in Commit `c1939d09ce226c2eb0f83333073fd9e24d621a6d`
reduzierte die Landkontur von 1,25/0,72 auf 0,85/0,35 mit kurzen Strichen.
Der Browservergleich zeigte, dass Braun auf dunklem Wasser weiterhin zu wenig
Kontrast bot. Der gedämpfte Pergamentton `#d6c59a`, längere Striche und höhere
Deckkraft erhalten eine erkennbare,
gegenüber Wasserfeldern ohne Stundenkante zurückgenommene Hexstruktur.

Die Interaktionssperre wurde **nicht** durch diese Darstellung verursacht:
`if(land)return`, `tabindex=-1` und die allgemeine `blocked.has(id)`-Sperre
waren bereits beim Übernehmen der Oberfläche in `src/ui/game.mjs` durch
Commit `778f60df36d0ce3cf05aa4d29168d9ab12253100` enthalten. Commit
`2bf814753715c1ad55622fdcc0e47a09e34bab91` verschob den Renderer unverändert
nach `map.mjs`. Die neue Anforderung korrigiert damit eine ältere Einschränkung,
nicht einen durch die Strichelung verursachten Verlust der SVG-Trefferfläche.

Darstellung, Notizbearbeitung und Befahrbarkeit sind unabhängig:
- Alle 25 Hexpolygone haben volle transparente Pointer-Trefferflächen.
- Landnotizen unterstützen alle drei Markierungen, beide Radierer, Undo,
  Speicherung und Tab/Enter/Leertaste ebenso wie Wassernotizen.
- Gesperrte Felder bleiben als Route und Abstandsurprung ausgeschlossen.
- Keine aktive Stundenkante auf Land; keine Änderung an Rätseldaten oder Engine.

`tests/deployment/blocked-hex.spec.mjs` prüft reale Maus-/Touch-Eingaben an
Mitte und mehreren Innenpositionen, Tastatur, Persistenz, Overlay und Route.
Die CI rendert Vergleichsbilder aus zwei tatsächlich entpackten ZIPs:
Baseline `8e3629f` auf Port 4176 und korrigierter Export auf Port 4174.
Die ältere Vergleichsserie zur Logbuch-Stabilisierung bleibt erhalten.
