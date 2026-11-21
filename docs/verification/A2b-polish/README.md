# A2b-Nachpolitur: Starthex, Pergament und X-Aktion

Basis: `d7632321e7a626e37a29fb10ff3fa7b428cef2c5` (main nach PR #114).
Branch: `codex/a2b-start-parchment-polish`. Der exakte Review-Head steht im PR.

## Darstellung und Ebenen

Die dauerhafte Startplakette und die goldene Isoellipse entfallen. Ein einzelnes
`start-glow`-SVG markiert das Starthex: dessen unveränderte Hexgeometrie dient
sowohl als Randpfad als auch als `clipPath`. Der braune Rand (`#694934`, Breite
13, Deckkraft 0,65) wird mit `feGaussianBlur` (4 Einheiten) aufgeweicht und
anschließend auf das Hexinnere beschnitten. Es entsteht kein äußerer Ring.

Reihenfolge: Kartenmotiv und Rahmen → Koordinatenhilfen → Startschein →
A3-Routenband und Richtung → A2a-Radar → Hexflächen → optionale Routennummern →
interaktive Hexkonturen und Spielinformationen → temporäre Beschriftungen.
Der Schein bleibt auch bei ausgeschaltetem Kartenmotiv sichtbar. Er und die
Beschriftungen haben `pointer-events:none` und keine Fokusziele.

„Start“ ist ausschließlich ein Präsentationssonderfall: der Initialaufruf nach
Laden, Spielstands-Reload oder Rätselwechsel und die manuelle X-Aktion schließen
es ein. Normale Hinweiswechsel zeigen weiterhin ausschließlich `cluePlaceRefs`
beziehungsweise den vorhandenen `placeId`-Fallback. Es gibt kein neues logisches
Objekt, keine Änderung des Datenmodells und keine neue Persistenzinformation.

Die Pergamente verwenden SVG-Pfade mit leicht gewellten Kanten, ungleichen
Seiten und kleinen Falten. Die Zahl der etwa 24 Einheiten breiten Randsegmente
wächst mit der Namensbreite; Falten und Wellenamplitude werden nicht gestreckt.
Papierfarbe, Textur und Georgia bleiben erhalten. Ausgangsgröße: 18 Einheiten
Schrift, 28 Einheiten Höhe. Breite nach Name, bei Bedarf kleinere Schrift nach
Browser-Schriftmaßen. Der Schwerpunkt der vollständigen Objektinstanz und die
bestehende Begrenzung auf die sichtbare Karte bleiben erhalten. Keine zusätzliche
Kollisionsvermeidung.

Die quadratische X-Aktion verwendet die vorhandene achteckige Messingfassung,
eine verwandte SVG-Pergamentform und dunkelrotbraune Tinte. Zugänglicher Name und
Tooltip sind „Orte zeigen“, ohne Togglezustand. Trefferfläche: 64 × 64 CSS-Pixel,
in schmalen Kartencontainern 48 × 48. Bestehende Aktionszeilen bleiben erhalten.

## Animation und Abbruch

Papier und Schrift sind unabhängige SVG-Unterelemente. Ihre Web Animations
teilen einen gemeinsamen `document.timeline`-Start und jeweils 4900 ms Dauer:

| Zeit | Papier | Schrift |
| --- | --- | --- |
| 0–400 ms | Einblenden | Einblenden |
| 400–900 ms | Voll sichtbar | Voll sichtbar |
| 900–2900 ms | Ausblenden | Voll sichtbar |
| 2900–4900 ms | Unsichtbar | Ausblenden |
| Ab 4900 ms | SVG-Gruppe entfernt | SVG-Gruppe entfernt |

Die Schrift behält eine helle 0,8-Einheiten-Kontur. Jeder neue Auslöser entfernt
die vorherige Gruppe und bricht ihre noch laufenden Animationen ab. Jedes
`finished`-Promise erhält sofort einen Erfolgs- und Fehlerhandler. Nur der
reguläre Abschluss aller Tracks der konkreten aktiven Gruppe darf sie entfernen;
späte Abschlüsse einer älteren Gruppe haben keine Wirkung. Bereits beendete
Animationen werden nicht erneut abgebrochen. Es gibt keine zusätzlichen Timer.

Normale Redraws sowie Motiv- und Rahmenwechsel montieren dieselbe laufende Gruppe
mit denselben Animationen und Startzeiten erneut. Ein Rätselwechsel verwirft den
alten Kontext. `pagehide` räumt auf. Bei reduzierter Bewegung bleiben Papier und
Schrift 3000 ms ohne Übergänge sichtbar und werden dann entfernt; Änderungen
der Systemeinstellung werden ebenfalls berücksichtigt.

## Prüfung

- 154 gezielte Engine-, Integrations- und Geometrievertragstests bestanden.
- 20 Inhaltstests bestanden; Rätselvalidierung erfolgreich.
- Chromium Desktop/Pixel 7: 94 bestanden, 2 passende Eingabeart-Skips,
  4 lokale Ausreißer im 100-Fälle-Lauf. Gezielte Wiederholung: **10/10 bestanden**.
- WebKit Desktop/iPhone 13: 94 bestanden, 2 passende Eingabeart-Skips,
  4 lokale Ausreißer im 100-Fälle-Lauf. Gezielte Wiederholung: **10/10 bestanden**.
- Zusätzliche WebKit-Abbruch-/Start-/Redraw-Matrix: **6/6 bestanden**.
- Finale Screenshotaufnahme: Chromium **2/2**, WebKit innerhalb der genannten
  10/10-Wiederholung; alle drei Zustände plus Aktionsleisten gesichert.
- `git diff --check` bestanden. Playwright 1.64.0, macOS; keine automatischen Retries.

Die breiten lokalen Läufe wurden gleichzeitig ausgeführt. Die Chromium-Ausreißer
betrafen zwei Kartenstarts, eine erwartete Bildfehlermeldung und eine normale
Bilddekodierung. Drei WebKit-Ausreißer überschritten ihr Budget bereits in
`page.goto(..., waitUntil: 'load')`; der vierte betraf die Vorbereitung einer
A3-Screenshotaufnahme. Die gezielten Wiederholungen verwenden unveränderte
Assertions und Budgets. Alle 98 ausführbaren Fälle jeder Browserfamilie haben
somit bestanden, teils in der Wiederholung; die ersten Gesamtläufe werden nicht
als vollständig grün dargestellt. Die vollständige Linux-CI wird am PR-Head
separat gestartet, ihr Status steht im PR.

Die Phasenprüfung setzt die unveränderten Animationen an definierte Zeitpunkte
und prüft die getrennten Deckkräfte, gemeinsame Startzeiten und 4900-ms-Dauern.
Ein separater Test lässt alle acht Tracks natürlich mit exakt 4900 ms Dauer
auslaufen. Die reale Abschlusszustellung erhält ein eigenes Beobachtungsfenster
von insgesamt 7900 ms; nach dem letzten zugestellten Track ist das Aufräumen
zusätzlich auf 1000 ms begrenzt (Begründung und Messwerte in der CI-Nachkorrektur). Schnelle
Auslöser laufen zuletzt ebenfalls natürlich aus und prüfen unbehandelte
Rejections sowie zurückbleibende Gruppen und Animationen.

Die zwei langen WebKit-Fälle behalten ihr aus PR #114 begründetes Gesamtbudget
von 60 s. Einzelassertionen und fachliche Animationsdauer werden nicht verlängert.
Die Erkenntnisse aus [WEBKIT-CI.md](../A2b-place-references/WEBKIT-CI.md) gelten
weiterhin. Kein global erhöhtes Testbudget.

Reproduktion:

```sh
node --test tests/engine/*.test.mjs tests/integration/*.test.mjs tests/contracts/chart-asset-contract.test.mjs tests/contracts/graphic-geometry.test.mjs tests/contracts/model*.test.mjs
node node_modules/@playwright/test/cli.js test tests/browser/place-references.spec.mjs tests/browser/layout-polish.spec.mjs tests/browser/model.spec.mjs tests/browser/k-final-route.spec.mjs tests/browser/multihex-radar.spec.mjs tests/browser/pointer-gesture.spec.mjs --workers=1
node node_modules/@playwright/test/cli.js test --config=playwright.webkit.config.mjs tests/browser/place-references.spec.mjs tests/browser/layout-polish.spec.mjs tests/browser/model.spec.mjs tests/browser/k-final-route.spec.mjs tests/browser/multihex-radar.spec.mjs tests/browser/pointer-gesture.spec.mjs
```

Engine, Generator, Solver, Deduktionsverträge, Rätseldaten, A3-Routengeometrie,
A2a-Distanzsemantik, Undo/Redo und Persistenzmodule bleiben unverändert.

## Visuelle Vergleichsbilder

Die Tests frieren die unveränderten Animationen ausschließlich für die Aufnahmen
bei 650 ms (Papier und Schrift), 3000 ms (nur Schrift) und nach 4900 ms
(Normalzustand) ein. Der natürliche Abschluss wird davon getrennt getestet.
Gezeigt wird ein repräsentativer atmosphärischer Ortsname; zusätzlich wird ein
noch längerer Name auf Textanpassung geprüft. Die Kartenaufnahmen enthalten den
vollständigen SVG-Ausschnitt; die Aktionsleisten zeigen separat Größe und
Anordnung des X-Buttons. Es wurden keine Bildinhalte nachbearbeitet.

| Browser / Ansicht | Pergament sichtbar | Nur Schrift | Normalzustand | Kartenaktionen |
| --- | --- | --- | --- | --- |
| Chromium Desktop | [Bild](chromium-polish-desktop-paper.png) | [Bild](chromium-polish-desktop-ink.png) | [Bild](chromium-polish-desktop-normal.png) | [X-Button](chromium-polish-desktop-actions.png) |
| Chromium Mobil | [Bild](chromium-polish-mobile-paper.png) | [Bild](chromium-polish-mobile-ink.png) | [Bild](chromium-polish-mobile-normal.png) | [X-Button](chromium-polish-mobile-actions.png) |
| WebKit Desktop | [Bild](webkit-polish-desktop-paper.png) | [Bild](webkit-polish-desktop-ink.png) | [Bild](webkit-polish-desktop-normal.png) | [X-Button](webkit-polish-desktop-actions.png) |
| WebKit Mobil | [Bild](webkit-polish-mobile-paper.png) | [Bild](webkit-polish-mobile-ink.png) | [Bild](webkit-polish-mobile-normal.png) | [X-Button](webkit-polish-mobile-actions.png) |

Die spätere gezielte CI-Nachkorrektur ist separat in
[CI-CORRECTION.md](CI-CORRECTION.md) dokumentiert.
