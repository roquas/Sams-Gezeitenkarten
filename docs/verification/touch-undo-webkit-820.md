# Linux-WebKit: Touch/Undo, DPR-2-Gesten und Materials-Prüfungen

Vorbereitet am 25.10.2026 auf main `b29691099c6f068d5022a6017e8b2b9cf35d7678`
nach PR #79. Separater Testfix; PR #78 und dessen Merge-Head
`7deaac7a5bb2c2eeb91d6775829419ecaafbe038` bleiben unverändert.

## Reproduzierter zusätzlicher Befund

Die beiden bisherigen Desktop-WebKit-Fälle bei 820 px überschreiten das
unveränderte gesamte 30-s-Testbudget:

- `native tap and horizontal touch drawing preserve one-step undo`;
- `touch erasing is one undoable gesture`.

[PR-78-Lauf 40218884895](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/40218884895)
scheitert in beiden vollständigen Versuchen in WebKit-Shard 2 an diesen Fällen;
47 andere Fälle des Shards bestehen. Die identischen Fehler treten auch im
[main-Lauf 40218604594](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/40218604594)
auf. Die Radar-Korrektur aus #79 ist davon nicht betroffen. Eine kausale
Verbindung zur Grafikvertragskorrektur ist nicht nachgewiesen.

Lokal wurden die unveränderten beiden Fälle je dreimal mit Desktop-WebKit DPR 2,
einem Worker, `CI=1`, regulären Traces, Assertions, Timeouts, Retries und
`failOnFlakyTests` ausgeführt: **5 bestanden, 1 fehlgeschlagen**. Der Erase-Fall
überschreitet in Erstversuch und Retry das Gesamtbudget an unterschiedlichen
Stellen (Positionsabfrage beziehungsweise Undo-Klick). CI-Annotationen zeigen
ebenfalls späte Abbruchstellen bis zum abschließenden Undo und keinen
nachgewiesenen falschen Spielzustand.

Eigene Traces enthalten mehrsekündige native Eingabewartezeiten, etwa 3,4 s für
den ersten und 6,9 s für den zweiten Tap. Das belegt knappe Gesamtbudgets;
ein bestimmter externer Browserdefekt wird nicht behauptet. CI-Trace-Downloads
waren durch die Zielhost-Netzwerkfreigabe blockiert (403); die Einordnung nutzt
offizielle Check-Annotationen, den main-Vergleich und eigene lokale Traces.

Ein erster Ansatz mit ausschließlich gemeinsam vermessenen Koordinaten reicht
nicht aus: **9 bestanden, 1 flaky** in zehn Wiederholungen; der Timeout lag schon
beim ersten Undo vor der Koordinatenabfrage. `failOnFlakyTests` weist diesen Lauf
korrekt ab. Hohe historische CPU-Werte verwaister Zombieprozesse waren keine
aktuelle Last und wurden nicht als Ursache gewertet.

## Eng begrenzte Testkorrektur

| Prüfziel | Pixeldichte und Eingaben |
| --- | --- |
| Vollständige bisherige Tap-/Undo-/Drag-/Undo- und Tap-/Erase-/Undo-Folgen | Bestehendes `selectionUse`-Funktionsprofil aus #79: WebKit DPR 1; Chromium unverändert. Beide Testkörper einschließlich aller Eingaben und Assertions sind bytegleich erhalten. |
| Neue positive Zeichen-/Lösch-Geste mit anschließendem echtem Undo | Ursprüngliche Projektpixeldichte, insbesondere Desktop-WebKit DPR 2. Zusätzliche Assertions auf tatsächlichen `devicePixelRatio`, eingeschaltete Kartenkunst und beide Trefferfelder. |
| Bestehendes Scrollen, Radar/Scroll-Verbindung, Abbruch-/Diagonalgesten, native Tap-/Undo-Abdeckung nach Abbruch und übrige Rendering-/Pointertests | Unveränderte Projektpixeldichte und unveränderte Testkörper. |

Die neuen Dichtefälle führen genau eine Geste aus und machen sie durch einen
realen Undo-Klick vollständig rückgängig. Der Löschfall startet aus gültigen
persistierten Notizen mit ausgewähltem Radierwerkzeug; die Geste erzeugt ihren
eigenen echten Historyeintrag. Die bisherige komplette native Vorbereitung und
Historyfolge bleibt im Funktionsfall zusätzlich erhalten.

Für benachbarte Felder derselben Zeile werden nach einmaligem Scrollen beide
Feldgeometrien in einer gemeinsamen DOM-Messung gelesen. Beide tatsächlichen Hit-Targets
müssen stimmen. Native Taps und Undo-Klicks bleiben Playwright-Eingaben. Der
bestehende Drag-Treiber bleibt unverändert: Chromium CDP-Touchdrag, WebKit
explizit DOM-Pointer-Grenzprüfung, da Playwright keinen nativen WebKit-Drag
anbietet. Es werden keine Eingaben durch ein neues künstliches Ereignismodell
ersetzt.

Anwendung, Grafiken, Freigaben, Generatoren, Viewports, bestehende Assertions,
Timeouts, Retry-Einstellungen, `failOnFlakyTests`, Playwright-Konfigurationen
und reguläre Workflows bleiben unverändert. Die Ergänzung betrifft nur die
beiden Browser-Testdateien und diesen Prüfbericht.

## Bisher ausgeführte Validierung

- Die unveränderten beiden bisherigen Testkörper und der Abbruch-/Diagonaltest
  wurden per Textvergleich gegen main nachgewiesen.
- Neue 820-px-DPR-2-Zeichen-/Löschfälle je fünfmal: **10/10 bestanden**, 0 flaky,
  0 übersprungen und keine Retry-Ausführungen; mit `CI=1` und unveränderten
  CI-Einstellungen.
- Die vollständige betroffene Desktop-/Mobilmatrix und der vollständige
  GitHub-Actions-Lauf werden im zugehörigen Pull Request dokumentiert.

Lokal: Debian 13, Node 24.19.0, Playwright 1.64.0 / WebKit Build 2370. Zusätzliche
Linux-Bibliotheken liegen isoliert unter `/tmp` und sind im Browsercache verlinkt.
Die lokale ldconfig-Vorprüfung wird mit
`PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` übersprungen, nachdem das tatsächliche
Laden der Bibliotheken geprüft wurde. Browserassertionen und die CI-Retry-/Flaky-
Einstellungen bleiben aktiv; GitHub Actions installiert reguläre Systempakete.

## Grenze

Der Fix verspricht keine Performancegarantie für lange kombinierte Abläufe mit
Software-Rendering und DPR 2. Er erhält deren fachliche Historyfolge vollständig
und prüft die positive dichteabhängige Gesten-/Undo-Funktion zusätzlich separat.
Reale Geräteprüfungen und die unveränderten DPR-2-Rendering-/Gestenfälle bleiben
notwendig. Kein automatischer Merge dieses Testfixes oder von PR #78.

## Zusätzliche Materials-Befunde und Korrektur

Im ersten Testfix-Lauf [40223305598](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/40223305598)
bestehen die bisherigen Touch-/Undo-Fälle und die neuen DPR-2-Gestenfälle.
Shard 2 bleibt jedoch wegen **zweier flakiger Materials-Fälle** rot:
`raster upper materials load…` endet am Gesamtbudget bei der zweiten PNG-Aufnahme;
`all seven clues stay legible…` endet bei einer der sequenziellen Bounding-Box-Abfragen.
Beide bestehen erst im regulären Retry; `failOnFlakyTests` weist den Job korrekt
ab. Die Lesbarkeitsinstabilität ist bereits im main-Vergleich sichtbar.

Die Materials-Korrektur verändert weder Renderdichte noch Grenzwerte:

- Die vollständige native Raster-/Werkzeugprüfung einschließlich der vier
  Responsive-Breiten bleibt als Funktionsfall erhalten.
- Die drei bisherigen PNG-Aufnahmen erhalten jeweils einen isolierten Fall,
  mit identischen Viewports, Formaten, Bildnamen und ursprünglicher Projekt-DPR.
  Ein gültiger persistierter Zustand setzt nur Stunde und Werkzeug voraus; der
  echte letzte Zellklick erzeugt weiterhin die abgebildete Markierung und den
  Fokus. Stunde, Werkzeug, tatsächliche Markierung und DPR werden zusätzlich
  geprüft. Das entspricht dem sichtbaren Zustand nach der bisherigen nativen
  Funktionsfolge.
- Jede der vier bisherigen Lesbarkeitsbreiten durchläuft separat denselben
  vollständigen Drei-Seiten-Zyklus mit echten Weiter-Klicks. Horizontaler
  Überlauf, rechte Textkante, Abstand zu den Seitenkontrollen und mindestens
  16 px Schrift bleiben unverändert geprüft, einschließlich der bestehenden
  0,5-px-Toleranzen. Sichtbarkeit und Seitennummern werden ausdrücklich geprüft.
- Text-, Navigations- und Sichtfensterrechteck sowie Schriftgröße werden je
  Seite gemeinsam aus einem Layoutzustand gelesen. Positive sichtbare Boxen
  bleiben Pflicht; Null-Rechtecke versteckter Inhalte können nicht bestehen.
- Die bisherigen JPEG-Kompositionsaufnahmen, Animations-, Exportdekodierungs-
  und Iconprüfungen bleiben unverändert.

Gezielte neue Materials-Fälle auf Desktop-WebKit DPR 2 jeweils dreimal:
**24/24 bestanden**, 0 flaky und 0 übersprungen, bei unveränderten CI-Einstellungen.
Die vollständige Materials-Matrix sowie der neue vollständige CI-Lauf werden im
Pull Request dokumentiert. Es wurden weiterhin keine Anwendungs-, Bild-,
Freigabe-, Timeout-, Retry-, Flaky- oder Workflowänderungen vorgenommen.
