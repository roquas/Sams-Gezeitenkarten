# Interaktionsspezifikation – beobachteter Code von 3.6

**Status:** Quellcode-Rekonstruktion, keine abgenommene Soll-Spezifikation. Quelle: `prototypes/3.6/index.html`, insbesondere Zeilen 299–306, 434–435, 472–556 und 579–590. Die Angaben unten beschreiben das tatsächliche Verhalten, auch wenn es fragwürdig ist.

## Zustand und Speicherung

`initial()` liefert `layer:1`, `tool:"maybe"`, `hideRouteMarks:false`, `showRouteNumbers:false`, `distanceMode:false`, `distanceOrigin:null`, `marks:{}`, `route:["D4"]`, `penalty:0`, `hintCount:0`, `hiddenHours:[]`, `doneClues:[]`, `help:""`, `result:""`.

Beim Start wird ein JSON-Objekt aus `localStorage["gezeitenkarten-fall5-v1"]` **flach** über den Initialzustand gelegt. Wenn JSON fehlschlägt oder `route` kein Array ist bzw. nicht mit D4 beginnt, wird vollständig zurückgesetzt. Es gibt **keine vollständige Schema-/Versionsvalidierung**. `render()` schreibt den Zustand zurück. `history` ist nur im Arbeitsspeicher und geht beim Neuladen verloren.

## Stunden und Werkzeuge

- Stundenauswahl 0–6; Start ist Stunde 0. Auswahl verändert `layer`, erzeugt **keinen** Undo-Eintrag.
- `marks` ist eine Zuordnung `"<Stunde>:<Feld>" → "no" | "maybe" | "yes"`; `erase` entfernt den Eintrag. `clearAll` entfernt alle Einträge mit Suffix `:<Feld>` in **allen** Stunden.
- Pointerdown auf befahrbarem Feld beginnt eine Geste und ruft `apply(id,true)`; Pointermove kann weitere Felder mit demselben `dragValue` bearbeiten. Ein erneuter Klick auf eine bereits identische Markierung löscht sie. **Eine Geste erzeugt grundsätzlich einen Snapshot beim ersten Feld**, nicht je gezogenem Feld.
- `clearAll` hat Vorrang vor dem Distanzursprung und wirkt unabhängig von der Stunde. Wenn kein Eintrag existiert, wird kein Snapshot erstellt, aber ein Hinweistext angezeigt.
- Ist `distanceMode` an und noch kein `distanceOrigin` gesetzt, wählt ein Klick auf ein Wasserfeld den Ursprung; das geschieht **vor** der Routen-/Markierungsbearbeitung und ohne Snapshot. Mit gesetztem Ursprung funktionieren die normalen Werkzeuge wieder.
- `route` akzeptiert nur Nachbarwasserfelder, die noch nicht in der Route stehen, bis Länge 7. Ungültige Klicks haben keine Wirkung. `routeBack` entfernt bei Länge größer 1 das letzte Feld.
- **Auffälligkeit:** Der Start-Tab `layer=0` ist auswählbar; Markierungswerkzeuge verwenden dennoch `"0:<Feld>"`. Ob dies fachlich gewünscht ist, ist offen.

## Undo und Darstellung

- `snapshot()` speichert JSON des vollständigen Zustands, maximal 100 Einträge. Undo ersetzt den aktuellen Zustand durch den letzten Snapshot; es gibt kein Redo.
- Snapshots bei: Markierbeginn, `clearAll` nur bei Treffern, gültigem Routenschritt, `routeBack`, Leeren der aktuellen Stunde, Umschalten der Stundenmarkierungs-Sichtbarkeit, Hinweis abhaken, Notizprüfung, Denkanstoß.
- **Keine Snapshots** bei: Stundenwechsel, Werkzeugwahl, Routennummern, Distanzmodus/Ursprung, `hideRouteMarks`, Ergebnisprüfung, kompletter Reset.
- Stundenmarkierungen lassen sich für Stunden 1–6 verstecken (`hiddenHours`); die Daten bleiben erhalten. `hideRouteMarks` unterdrückt Notizen auf allen Routenfeldern nur visuell. Routennummern sind unabhängig von der Stundenauswahl.
- `showChart` (Seekartenillustration) wird über DOM-Checkbox gesteuert und **nicht im Zustand gespeichert**; Änderung ruft nur `renderMap()` auf.

## Hinweise, Prüfung, Reset

- Sieben Hinweise werden per Pfeiltasten/Swipe/Schaltflächen durchgeblättert; `currentClue` ist **nicht persistiert**. Abhaken wird in `doneClues` gespeichert und ist undo-fähig.
- Routenprüfung: weniger als sieben Positionen → unvollständig; bei sieben Positionen **exakter Vergleich** mit der hartcodierten `solution` → Erfolg, sonst generische Fehlermeldung. Kein Strafpunkt für Routenprüfung.
- Notizprüfung: +5 Strafpunkte, betrachtet nur `yes` und `no`, meldet die Anzahl widersprüchlicher Markierungen ohne Felder zu verraten. `maybe` wird ignoriert.
- Denkanstoß: +10 Strafpunkte und `hintCount++`; Textauswahl hängt von Routenfortschritt, sicheren Markierungen und Anzahl angeforderter Denkanstöße ab.
- „Karte leeren“ löscht Markierungen **nur für `layer`**, nicht Route/Strafpunkte. Bei `layer=0` betrifft es die Startschicht.
- Gesamter Reset fordert `confirm()`; nach Bestätigung `state=initial()`, `history=[]`, `render()`. Abbruch lässt alles unverändert.

## Risikopunkte / fachlich zu entscheiden

1. Ein Undo nach nicht protokollierten UI-Aktionen kann deren Zustand indirekt zurücksetzen, weil Snapshots den **gesamten** Zustand speichern.
2. Beim Drag kann `render()` die SVG-Knoten austauschen; Pointer-Capture und reale Browserereignisse sind gesondert zu testen.
3. `localStorage` lädt ungeprüfte Teilzustände; ungültige `marks`, `layer` oder `hiddenHours` können zu Fehlern führen.
4. Stunden-0-Markierungen und Verhalten des Stunden-0-Löschens fachlich prüfen.
5. Persistenz von Seekartenillustration und aktuellem Hinweis ist uneinheitlich.
6. Undo, Speicherung und Prüfung sind **nicht** als isolierte Module testbar; dafür ist eine spätere Extraktion unter Regressionstests erforderlich.

**Wichtig:** Diese Liste ist keine Freigabe, merkwürdiges Ist-Verhalten als Soll-Verhalten beizubehalten.


## Produktentscheidungen nach Befundbesprechung (12.10.2026)

Diese Entscheidungen gelten **für die künftige Version**, nicht rückwirkend für das unveränderte 3.6:
- Stunden-0-Auswahlknopf entfernen; Startfeld bleibt vorhanden.
- Undo-Historie braucht nicht in `localStorage` persistiert zu werden.
- Undo-Verhalten nicht pauschal vereinheitlichen; absichtlich nicht undo-fähige Aktionen dokumentieren. Insbesondere **Denkanstoß/Tipps sollen nicht rückgängig machbar sein** (gegenwärtig ruft der Tipp-Handler `snapshot()` auf, also Abweichung zwischen Ist und Soll).

### Inventar: Aktionen ohne eigenen Undo-Snapshot in 3.6

| Aktion | Grund im Quellcode | Einordnung |
|---|---|---|
| Stundenwechsel | Handler setzt nur `state.layer` und ruft `render()` auf | UI-Navigation; logisch plausibel |
| Werkzeugwahl | Handler setzt `state.tool` ohne Snapshot | UI-Modus; logisch plausibel |
| Routennummern ein/aus | Toggle ohne Snapshot | Anzeigeoption; logisch plausibel |
| Distanzmodus ein/aus | Toggle ohne Snapshot; Ursprung wird zurückgesetzt | Anzeige-/Messmodus; logisch plausibel, Ursprungsverlust prüfen |
| Distanzursprung wählen | Früher Rücksprung aus `apply()` ohne Snapshot | Messinteraktion; logisch plausibel |
| Routennotizen ausblenden | Toggle ohne Snapshot | Anzeigeoption; logisch plausibel |
| Route prüfen | Schreibt nur `result`, ohne Snapshot | Abfrage; logisch plausibel |
| Hinweis-Karussell vor/zurück | `currentClue` außerhalb `state` | Navigation; logisch plausibel |
| Seekartenillustration umschalten | DOM-Checkbox außerhalb `state` | Anzeigeoption; technische Implementierung |
| Reset | Setzt `history=[]` statt Snapshot | Absichtliche irreversible Gesamtaktion |
| Ungültigen Routenschritt klicken | Früher Rücksprung ohne Snapshot | Keine Zustandsänderung; logisch notwendig |
| „Alle Stunden radieren“ ohne Treffer | Kein Snapshot, aber Hinweistext | Keine inhaltliche Änderung; logisch plausibel |

**Aktuell MIT Snapshot, fachlich zu prüfen:** Denkanstoß (+10 Strafpunkte, `hintCount`), Notizprüfung (+5 Strafpunkte), Leeren einer bereits leeren Stunde (erzeugt dennoch Snapshot), Klick auf ein bereits identisch markiertes Feld (löscht Markierung), Hinweis abhaken. Ein Undo kann wegen vollständiger Zustandssnapshots auch Einstellungen zurücksetzen, die selbst keinen Snapshot erzeugten. „Ohne eigenen Snapshot“ ist deshalb **nicht gleichbedeutend mit „kann niemals durch Undo zurückspringen“**.
