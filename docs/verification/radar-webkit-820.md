# Radar: Linux-WebKit, 820 px

Untersucht am 25.10.2026 auf `main` `4fbd6f6d9b246fa55ad6db9189c6f13e685b264d`.
PR #78 und sein Head `bf386b4c0766016bb6ee709fef58ac53b6db8d36` werden weder verändert noch gemergt.

## Befund

**C: kumulierte Linux-WebKit-Latenz bis zum 30-s-Testlimit ist reproduziert.**
Der Radar-Zustandsautomat benötigt keine fachliche Änderung. Ein zugestellter
Click schaltet synchron aus; die langen Wartezeiten liegen vor der Eingabe in
Playwrights Sichtbarkeits-/Stabilitäts-/Trefferprüfung und zwischen Frames.
Ob dahinter ein bestimmter WebKit-Defekt oder die Software-Rendering-Leistung
liegt, ist nicht abschließend geklärt. Ein externer Browserbug wird nicht behauptet.

- A, tatsächlicher Zustands-/Bedienfehler: in den untersuchten Läufen nicht beobachtet.
- B, unrealistische Touch-Simulation: nicht bestätigt. `activate(...,'touch',...)`
  ruft `locator.tap()` auf. Playwright 1.64.0 sendet für WebKit
  `Input.dispatchTapEvent`; die Aufzeichnung enthält native, vertrauenswürdige
  `pointerdown/up` mit `pointerType=touch`, `touchstart/end` sowie den vom Browser
  erzeugten Kompatibilitätsclick. Keine manuell dispatchten DOM-Ereignisse.
- C: derselbe unveränderte Test scheitert unter Ubuntu 26.04 / Node 22.23.3 /
  Playwright 1.64.0 / WebKit 27.2, Build 2370, Desktop Safari DPR 2, 820×1000,
  einem Worker und ohne Retry **5/5** am gesamten Testbudget.

## CI-Belege und Übergänge

[Run 40116058110](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/40116058110):
Der ursprüngliche Job `120937455445` betrifft laut tatsächlichem Log den
**Mausfall** (`radar click selects…`), nicht den Touchfall. Ein Retry besteht.
Im Wiederholungsjob `121152570675` scheitert der Touchfall zweimal: zuerst an
`inactive`, danach erst am anschließenden Overlay-Count. Alle Meldungen nennen
das 30-s-Testlimit, nicht eine vollständig ausgeschöpfte 5-s-Assertion mit
nachgewiesenem falschem Wert.

Im lokalen Ubuntu-Vergleich variieren die Abbruchstellen ebenfalls: beim ersten
Lauf schon beim Ursprungstap, in weiteren Läufen bei Ursprung-Assertion bzw.
Werkzeugwahl, und in den letzten beiden Läufen exakt bei `inactive` und der
anschließenden Overlay-Assertion. Im letzten Lauf ist `inactive` bereits
erfolgreich geprüft; der anschließende Count hat vor dem Gesamtlimit nur noch
55 ms. Der Fehlerkontext zeigt den ausgeschalteten Button mit Beschriftung
„Abstände einblenden“ und einen leeren Status. Das ist kein Nachweis eines
zurückgebliebenen Overlays.

Die native Ereignisaufzeichnung zeigt bei DPR 2 Frame-Abstände bis 10.995 ms,
mit vorbereiteten leeren Renderern bis 11.720 ms. Ein zugestellter Einschaltclick
wechselt nach 10 ms auf `waiting`. Unter DPR 1 durchläuft jeder Vergleich
`inactive → waiting → showing(C1) → showing nach Werkzeugwahl → inactive`,
entfernt das Overlay und speichert `{distanceMode:false,distanceOrigin:null,marks:{}}`.
Der Ausschaltclick bis zur DOM-Mutation dauert dort 2–14 ms.

## Kontrollierte Vergleiche

Auf derselben lokalen Ubuntu-Plattform, mit gleichem Testkörper, unveränderten
Viewports, Eingaben, Assertions und 30-s-Testbudget:

| Variante | Ergebnis | Beobachtung |
| --- | --- | --- |
| Original, DPR 2, Trace | 0/5 | Abbrüche an verschiedenen späten/teuren Übergängen |
| DPR 2, zusätzlich Ereignisprotokoll | 0/2 | Frame-Abstände bis 10.995 ms |
| DPR 2, vorbereiteter leerer Renderer und Protokoll | 0/2 | Vorbereitung allein hilft nicht |
| DPR 1, identischer Testkörper und Protokoll | 5/5 | 13,5–15,9 s einschließlich Teardown; maximale Frame-Abstände 1.371–1.727 ms |

Zuvor bestanden auf Debian 13 mit dem zugehörigen Build 2370 alle zehn
unveränderten DPR-2-Wiederholungen. Der reine Testkörper brauchte 22,8–26,6 s.
Drei zusätzliche Ereignisläufe bestanden ebenfalls; Ausschaltclick bis
Mutation 8–40 ms. Das zeigt die Plattformabhängigkeit und erklärt, weshalb ein
einzelner lokaler Erfolg die CI-Instabilität nicht widerlegt.

Der Container verwendet denselben Ubuntu-/Node-/Playwright-/WebKit-Versionsstand
wie der CI-Job, ist aber kein identischer GitHub-Runner. CI-Logs waren abrufbar;
der Download der vorhandenen CI-Trace-Artefakte lieferte HTTP 403. Die Diagnose
stützt sich deshalb zusätzlich auf eigene Traces, DOM-Fehlerkontexte und
zeitlich geordnete native Ereignisprotokolle. Trace-Screencastbilder sind verfügbar;
separate automatische Fehler-PNGs wurden beim Timeout nicht erzeugt.

## Korrektur und Regression

Nur die funktionalen Radar-Eingabe-/Zustands-/CSS-Layoutfälle verwenden das
bereits für die Rätselauswahl vorhandene `selectionUse`-Profil: WebKit DPR 1,
Chromium unverändert. Die drei Viewports und alle nativen Eingaben bleiben
erhalten. Status-, Karten-/Papierbilder und Kontrastfälle außerhalb der
anonymen Funktionsgruppe behalten die ursprüngliche Projektpixeldichte,
insbesondere Desktop-WebKit DPR 2. Die Worker-Aufwärmfixture wird nicht übernommen.

Alle bisherigen Assertions bleiben fachlich erhalten. Die gemeinsame
Zustandsprüfung ergänzt `aria-pressed` und die zugängliche Beschriftung in jeder
Phase. Sechs zusätzliche 820-px-Fälle wählen tatsächlich jedes Werkzeug
(`maybe`, `yes`, `no`, `erase`, `clearAll`, `route`) und schalten danach per
nativem Touch aus. Sie prüfen Ursprung/Overlay, Werkzeugauswahl, Statusposition,
leeren Status und unveränderte Notizen. Ein-/Aus-Zyklus, neue Quelle,
Undo/Reload und Maus-/Tastatur-/Touch-Matrix bleiben bestehen.

Anwendung, Radarsemantik, Kartenvertrag, Assets, Generatoren, Timeouts,
Retry-Einstellungen, `failOnFlakyTests` und reguläre CI-Workflows bleiben gleich.
Die Korrektur verbessert nicht die Retina-Renderleistung des Produktionsspiels;
die funktionalen Tests versprechen keine DPR-2-Performance-Garantie.

Vor der Korrektur bestanden außerdem die vollständige Unit-Suite (117 Tests)
und zwei Durchläufe der gesamten Radar-Matrix auf Chromium Desktop/Mobil
(120 Fälle einschließlich der Statusbilder). Ergebnisse des endgültigen
Teststands und dessen CI stehen im Pull Request.

## Reproduktion

Mit installierten Playwright-1.64.0-Browsern und deren Systemabhängigkeiten:

```sh
RADAR_SOURCE_REF=4fbd6f6d9b246fa55ad6db9189c6f13e685b264d node scripts/diagnose-radar-webkit.mjs baseline 5
RADAR_SOURCE_REF=4fbd6f6d9b246fa55ad6db9189c6f13e685b264d node scripts/diagnose-radar-webkit.mjs events 2
RADAR_SOURCE_REF=4fbd6f6d9b246fa55ad6db9189c6f13e685b264d node scripts/diagnose-radar-webkit.mjs warm 2
RADAR_SOURCE_REF=4fbd6f6d9b246fa55ad6db9189c6f13e685b264d node scripts/diagnose-radar-webkit.mjs dpr1 5
```

Das Diagnoseskript liest den angegebenen alten Testkörper aus Git, erzeugt
isolierte temporäre Tests und behält native Eingaben und Assertions bei.
`radar-diagnostics/<variante>/results.json` und Traces enthalten die Daten;
`RADAR_TIMELINE` schreibt Zustände und Eingaben zusätzlich direkt ins Log.
Für den korrigierten Teststand den regulären WebKit-Test mit
`--grep 'UI stabilization 820px.*radar touch selects' --repeat-each 10` ausführen.

## Grenzen und PR #78

Die Ergebnisse belegen keinen Radar-Anwendungsfehler und keinen kausalen Bezug
zu PR #78: die Reproduktion gelingt auf dessen unverändertem main-Vorgänger.
Endliche Wiederholungen schließen weitere Browser-/Runner-Probleme nicht aus.
Ein DPR-spezifischer Eingabefehler außerhalb der geprüften Fälle bleibt möglich;
Retina-Darstellung und die übrigen Pointer-/Touch-Suiten bleiben eigenständige
Regressionen. Nach Übernahme der separaten Testkorrektur ist ein grüner
Integrationslauf für PR #78 erforderlich; dessen Grafikreview wird dadurch
nicht ersetzt. Es gibt keine automatische Merge- oder Freigabeaktion.
