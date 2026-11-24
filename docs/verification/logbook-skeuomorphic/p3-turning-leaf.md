# P3-Nachprüfung: Textposition beim Blättern

Ausgangshead: `43fbbdb8d099024e54b06020bb74c860d4e5afe5` (PR #127).

## Ursache und begrenzte Korrektur

Die sichtbare `.clue-viewport` richtet den Hinweis oben aus und hat 58 px oberes Padding. Das temporäre `.turning-leaf` erbte dagegen `align-items:center` aus `materials.css`; sein eigenes oberes Padding betrug 20 px auf Desktop und 16 px mobil. Schon im ersten Animationsframe stand derselbe Text deshalb an einer anderen vertikalen Position. Die Animation selbst verschiebt ausschließlich horizontal.

In `src/ui/layout-polish.css` werden ausschließlich zwei Regeln des Animationsblatts geändert: obere Ausrichtung mit `align-items:flex-start`, Übernahme des Paddings vom tatsächlichen Hinweisbereich mit `padding:inherit` und Erhalt der bisherigen linken Einrückung von 26 px beziehungsweise 23 px. Die sichtbare Seite, Typografie, Statusmarkierung, Ortsaktion und Pfeile werden nicht geändert. JavaScript, Semantik und die 160-ms-Animation bleiben unverändert.

## Tatsächliche DOM-Geometrie

Messwerte sind CSS-Pixel relativ zur oberen Buchkante. Die folgenden Werte sind in Chromium und WebKit identisch.

| Ansicht / ausgehender Text | Sichtbarer Text vorher | Animationsblatt vor Fix | Differenz vor Fix | Animationsblatt nach Fix | Differenz nach Fix |
|---|---:|---:|---:|---:|---:|
| Desktop, kurz | 144 | 204,703125 | +60,703125 | 144 | 0 |
| Mobil, kurz | 142 | 174,5625 | +32,5625 | 142 | 0 |
| Desktop, lang und abgehakt | 144 | 158,8125 | +14,8125 | 144 | 0 |
| Mobil, lang und abgehakt | 142 | 79,40625 | −62,59375 | 142 | 0 |

## Regression und Nachweise

`tests/browser/logbook-turning-leaf.spec.mjs` prüft beide Texte in den vorhandenen Chromium- und WebKit-Projekten auf Desktop und Mobil. Bewegung ist ausdrücklich normal (`no-preference`). Der native Pfeilklick erfasst den alten Text in der Capture-Phase; ein MutationObserver misst denselben Text unmittelbar im tatsächlich erzeugten Animationsblatt. Es gibt keine angehaltene oder ersetzte Animation und keine simulierte Uhr. Die erlaubte vertikale Abweichung beträgt weniger als **0,5 CSS-Pixel**.

- Unveränderter Ausgangshead: **8/8 erwartete Fehler**, jeweils genau an der vertikalen Positionsprüfung.
- Korrigierte Fassung: **8/8 bestanden**, keine Skips oder Retries.
- Zusätzlich geprüft: identischer Text und Zeilenumbruch, laufende Animation mit 160 ms und unveränderten horizontalen Keyframes, `aria-hidden` des Blatts, Entfernen nach tatsächlichem Animationsabschluss, Position des nächsten Hinweises bei 144/142 px sowie dessen Tastaturbedienung ohne Textverschiebung.
- Vollständige Vorher-/Nachher-Messdaten: [p3-turning-leaf.json](p3-turning-leaf.json). Die einzelnen Messungen werden auch als Playwright-Anhang ausgegeben.

Weitere relevante Interaktionsergebnisse, neuer vollständiger Head und dessen CI-Status werden in PR #127 dokumentiert. Bestehende Tests, Retries, Skips und Zeitlimits werden nicht verändert. Die bisherigen visuellen Nachweise bleiben erhalten.
