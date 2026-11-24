# P3-Nachkorrektur: gleicher Umbruch im Animationsblatt

Ausgangshead: `a51172759d3d989774d55bf631876c7be8742655`, PR #127.

## Nachgewiesene Ursache

Mobil hat die sichtbare `.clue` zwei Spaltenabstände von je 7 px. Das Animationsblatt besitzt eine andere Struktur (linke Einrückung plus Nummer und Text) und erbte weiterhin einen Flex-Abstand von 10 px. Seine linke Einrückung von 23 px berücksichtigt bereits Statusspalte und ersten 7-px-Abstand. Der verbleibende 10-px-Abstand machte den Textbereich deshalb **3 px schmaler**.

Im tatsächlichen Linux-WebKit-Artefakt von [CI #519, Shard 5](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45385272050) betragen die DOM-Messwerte für den langen abgehakten Mobilhinweis:

| Darstellung | Breite | Höhe | y relativ zur Buchkante |
|---|---:|---:|---:|
| Sichtbarer Hinweis | 205,265625 px | 299,0625 px | 142 px |
| Animationsblatt, Ausgangshead | 202,265625 px | 326,25 px | 142 px |

Der Unterschied von **27,1875 px** entspricht einer zusätzlichen Zeile. Auch der vorhandene Retry zeigt dieselben Werte. Die Höhenassertion war berechtigt; der zuvor behobene vertikale Textsprung bleibt behoben.

## Konkrete Korrektur

In `src/ui/layout-polish.css` wird ausschließlich der mobilen `.turning-leaf`-Regel **`gap:7px`** hinzugefügt. Keine Änderung an oberer Ausrichtung, Padding, Schrift, sichtbarer Seite, Statusdarstellung, Bedienelementen oder JavaScript. Die echte Animation bleibt 160 ms lang.

## Reproduktion und präzisierter Test

Der Browser-Test protokolliert zusätzlich berechnete Schriftmetriken, Umbruchregeln und tatsächliche Textzeilen mittels DOM-Ranges. Die vorhandenen Positions- und Höhenassertionen mit jeweils **unter 0,5 px** bleiben erhalten. Neu geprüft werden verfügbare Umbruchbreite (ebenfalls unter 0,5 px), tatsächliche Absatzbreite beim langen Text, identische Schriftmetriken und die **exakte Folge der Texte jeder gerenderten Zeile**. Keine zusätzlichen Skips, Retries oder erhöhten Limits.

Die verfügbare Breite wird vom Textanfang bis zur inneren rechten Containerkante gemessen. Ein kurzer Flex-Absatz kann auf seine intrinsische Breite schrumpfen; seine eigene Box ist deshalb nicht allgemein mit einer gefüllten Grid-Spalte vergleichbar. Der tatsächliche Umbruch und die unverändert strenge Höhenprüfung werden in allen Fällen geprüft.

- Ausgangshead mit erweitertem Test: **4/4 Desktopfälle grün, 4/4 Mobilfälle gezielt rot** (3 px Breitenabweichung), Chromium und WebKit.
- Lokales macOS bei 390 px: die 3 px sind reproduzierbar; der lange Text hat dort vor dem Fix noch dieselbe Zeilenzahl. Das wird ausdrücklich vom nachgewiesenen Linux-CI-Höhenfehler unterschieden.
- Korrigierte Fassung: **8/8 grün**, normale Bewegung ohne Pause oder simulierte Uhr. Breiten-, Höhen- und vertikale Positionsdifferenz jeweils **0 px**, gleiche Schriftmetriken und exakte Textzeilen.
- Mobil nach Fix: sichtbarer Text und Animationsblatt jeweils **205,265625 px** breit. Die sichtbare Position bleibt mobil **142 px**, auf Desktop **144 px**.

[p3-wrap.json](p3-wrap.json) enthält sämtliche lokalen Vorher-/Nachher-Geometrien, Schriftmetriken, Textzeilen und die Originalmessung aus dem CI-Artefakt (ID/Digest inklusive). Die bisherigen P3- und Abnahmenachweise bleiben unverändert erhalten. Relevante Regression, neuer vollständiger Head und dessen abschließender CI-Status stehen in PR #127.
