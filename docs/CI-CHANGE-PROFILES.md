# Änderungsabhängige CI

Implementierung: `.github/workflows/tests.yml`, `scripts/ci-changes.mjs`.
Tests: nach `npm ci` mit `node --test tests/contracts/ci-changes.test.mjs`,
automatisch auch in `npm run test:unit`. Ausgangspunkt ist main nach F01 / PR #124
(`7d2e60f2d152f99a429a35f242c6389a9e046092`).

## Profile und Abhängigkeiten

Die bisherigen Jobs hatten keine `needs`-Abhängigkeiten. Sie prüfen jedoch
unterschiedliche Auslieferungs- und Datenpfade. Nur die folgenden schmalen
Dateimengen erlauben das Weglassen von Regressionen:

- **documentation:** `README.md` und unmittelbar unter `docs/` liegende
  Markdown-Dateien mit Namen aus Buchstaben, Ziffern, `_` und `-`.
  Diese Dateien sind redaktionelle Dokumentation, keine aktuellen Eingaben
  von Anwendung, Paketierung, Assetprüfung oder Reproduktionsläufen.
- **offline-flavor:** mindestens eines der drei ausdrücklich geprüften
  F01-Blätter `scripts/lib/flavor-contract.mjs`,
  `tests/contracts/flavor.test.mjs`, `tests/fixtures/flavor/public.mjs`,
  optional zusammen mit obiger Dokumentation. Der Vertrag importiert Schema,
  Validatoren und Hashwerkzeuge; Anwendung, Browser und Paket importieren den
  Offline-Vertrag nicht. Seine Abhängigkeiten sind deshalb **nicht** freigegeben.
- **full:** alle anderen Änderungen, produktive Änderungen, Infrastruktur,
  unbekannte Pfade und Unsicherheit. Keine zusätzliche Regelengine für
  einzelne produktive Teilsysteme: sie erhalten sämtliche bisherigen Prüfungen.

Die Klassifizierung prüft Dateityp und beide Git-Modi. Nur reguläre Dateien
mit Modus `100644` kommen für eine Einsparung infrage. Typänderungen,
Symlinks, ausführbare Dateien und unverständliche Einträge bedeuten `full`.
Ein Dateiname mit „flavor“ genügt ebenso wenig wie das Verzeichnis `docs/`:
Dort liegen unter anderem gehashte Markdown-Verträge, Reproduktionsregister,
Bildquellen und Geometrieverträge. Verschachtelte Dokumentationspfade bleiben
bewusst im vollständigen Profil.

Neue F02-Dateien werden erst nach Prüfung ihrer eingehenden Abhängigkeiten
explizit in `OFFLINE_FLAVOR` aufgenommen. Bis dahin laufen sie vollständig.
Sobald Offline-Code in Laufzeit, Paketierung oder Browserprüfungen eingebunden
wird, muss seine Freigabe entfernt werden. Eine solche Einbindung ändert bereits
nicht freigegebene Dateien und löst selbst den vollständigen Lauf aus.

| Job / Teilprüfung | documentation / offline-flavor | full |
| --- | --- | --- |
| `changes` | Vollständigen Diff klassifizieren, Auswahl zusammenfassen | Ebenso |
| `unit` | Immer alle bisherigen HTTP-, Unit-, Vertrags-, Content- und Rätseltests; einschließlich Flavor und neuer CI-Tests | Ebenso |
| `catalog-releases` | Immer Archiv-/Releasehistorie prüfen | Ebenso |
| `b2-s02-reproduction` | Bewusst nicht erforderlich | S02 und Suchvergleich vollständig reproduzieren |
| `s03-reproduction` | Bewusst nicht erforderlich | Alle vier bisherigen Evidenz-/Reproduktionsprüfungen |
| `assets` | Bewusst nicht erforderlich | Alle bisherigen Normalizer-, Grafik-, Freigabe- und Footprintprüfungen |
| `browser` | Bewusst nicht erforderlich | Vollständiges Chromium Desktop/Mobil |
| `webkit (1)` bis `webkit (6)` | Bewusst nicht erforderlich | Unveränderte sechs Shards, beide Projekte, ein Worker je Runner |
| `deployment`: Pakettests, Veröffentlichung, ZIP-Upload | Immer erforderlich | Ebenso |
| `deployment`: extrahiertes ZIP im Browser | Bewusst nicht erforderlich | Alle bisherigen Chromium-/WebKit-Projekte |

Unit- und Katalogprüfungen bleiben absichtlich breit: Sie binden Offline-Code
an gemeinsame Schemata und schützen Publikationsverträge. S02/S03 sind teure,
runtimegebundene Reproduktionen von Generatorläufen. Die freigegebenen Blätter
verändern ihre Eingaben nicht. Assets und Browser verwenden andere Datenpfade
als der Offline-Flavor-Vertrag; geteilte Werkzeuge, Rätseldaten, `src/`, `dev/`,
Assets, Archiv, Browser-/Deploymenttests, Playwright-Konfigurationen,
Paketierung, Abhängigkeiten, Lockdateien und sämtliche CI-Dateien führen zu `full`.

## Diff und sicherer Rückfall

`changes` checkt mit vollständiger Historie aus und verwendet ausschließlich
lokales Git, ohne neue Actions oder Dateilisten-API:

- **PR-Checkout:** `GITHUB_SHA` muss ein gültiger Commit-Hash sein und exakt
  Checkout-HEAD entsprechen. Der ausgecheckte synthetische Merge muss genau
  zwei Eltern haben: zuerst Event-`base.sha`, dann Event-`head.sha`. Fehlende,
  veraltete oder widersprüchliche Angaben führen vor der Diff-Auswahl zu `full`.
  `head.sha` allein ist kein gültiger Merge-Checkout. Grundlage ist der
  [GitHub-Vertrag für pull_request](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request).
- **PR-Diff:** gemeinsamer Vorfahr von Event-`base.sha` und `head.sha` bis PR-Head,
  entsprechend einem Drei-Punkt-Vergleich. Bei mehreren gemeinsamen Vorfahren
  wird vollständig geprüft. Da die Testjobs auf dem GitHub-Merge-Stand laufen,
  werden zusätzlich Änderungen vom gemeinsamen Vorfahren bis zur Event-Basis
  geprüft. Produktive/unbekannte Änderungen auf dieser Seite erzwingen `full`.
- **Push auf main:** exakt Event-`before` bis Event-`after`, über alle Commits.
  `after` muss `GITHUB_SHA` entsprechen. Neuer/gelöschter Branch, Force-Push,
  Null-SHA oder fehlende Vorfahren ergeben `full`.
- **workflow_dispatch:** immer `full`.
- Fehlende Commits, flacher Checkout, ungültiges Event-JSON, leere, abgeschnittene
  oder fehlerhafte Diffs und unbekannte Ereignisse ergeben `full`.

`git diff --raw --no-abbrev --no-renames -z` liefert Status und beide Modi.
Umbenennungen werden absichtlich als Löschung **und** Neuanlage betrachtet;
kein alter Laufzeitpfad kann hinter einem neuen Dokumentationsnamen verschwinden.
NUL-Trennung erhält auch ungewöhnliche Dateinamen. Es gibt keine API-Seiten-
oder 300-Dateien-Grenze; bei Überschreiten des lokalen 32-MiB-Pufferlimits folgt
`full`. Diff-Fehler werden als Unsicherheit berichtet, nicht als „keine Änderung“.

Scheitert der gesamte `changes`-Job, starten abhängige Jobs durch `!cancelled()`
trotzdem. Jeder bedingte Job startet mit `RUN_REGRESSIONS=true`. Ein kurzer
Auswahlschritt prüft den Detektorstatus und die rohen Outputs mit einem
**groß-/kleinschreibungssensitiven Shell-`case`**. Nur `success` zusammen mit
`documentation`/`false` oder `offline-flavor`/`false` setzt den Wert auf `false`.
Fehlende, unbekannte, widersprüchliche oder anders geschriebene Outputs lassen
vollständig testen. Die folgenden Actions-Ausdrücke erhalten ausschließlich
kanonisches `true`/`false`; ihre Stringvergleiche ignorieren
[laut GitHub-Dokumentation](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#operators)
Groß-/Kleinschreibung. `$GITHUB_ENV` aktualisiert dafür auch den `env`-Kontext
der Folgeschritte ([Runner-Implementierung](https://github.com/actions/runner/blob/main/src/Runner.Worker/FileCommandManager.cs)).
Der fehlgeschlagene Detektor bleibt dabei als Workflow-Fehler sichtbar.
Abgebrochene Workflows werden nicht künstlich weiter ausgeführt.

## Check-Namen, Zusammenfassung und ZIP

Keine `paths`-/`paths-ignore`-Filter und kein Überspringen ganzer Testjobs.
Jeder bisherige Check einschließlich der **sechs statischen WebKit-Shards**
wird weiterhin angelegt. Nur seine teuren Schritte sind bedingt; bei einer
Einsparung laufen nur Auswahl- und Zusammenfassungsschritt. Das
benötigt weiterhin kurze Runner-Belegungen, erhält aber die Check-Verträge.
Ein abschließender Gate-Job ist deshalb nicht erforderlich. Die Summary nennt
Profil, Grund, Vergleich und vollständige Dateiliste und markiert ausgelassene
Prüfungen als **nicht erforderlich, nicht ausgeführt und nicht bestanden**.
Ein grüner Check bestätigt in diesem Fall die Auswahlentscheidung.

GitHub unterscheidet bedingtes Job-Skipping von übersprungenen Workflows;
Required Checks bei Pfadfiltern können ausstehend bleiben. Wir erhalten sogar
die einzelnen Matrixchecks, anstatt uns auf einen übersprungenen Matrixjob zu
verlassen. Siehe [GitHub: Required Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks)
und [Workflow-Syntax / Bedingungen und Matrix](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

Abfrage am 24.11.2026: Die Branch-API meldete für main `protected=false`,
`enforcement_level=off`, leere Required-Check-Listen; die Repository-Rulesets
waren leer. Der dedizierte Protection-Endpunkt antwortete mit 403 („Resource
not accessible by integration“). Es wurden keine Schutzregeln verändert.
Bei späterem Schutz sollten `changes` und die vorhandenen Testchecks verlangt
werden. Externe Organisationsregeln oder spätere Änderungen sind hierdurch
nicht vollständig auditiert.

Der Deployment-Job behält alle drei Python-Pakettests, mandatory Pillow,
`sh scripts/package.sh`, dessen Veröffentlichungsvalidierung und den Upload
`static-deployment` aus `dist/Sams-Gezeitenkarten.zip` mit drei Tagen
Aufbewahrung. Auch Dokumentations-/Offline-PRs liefern also das übliche ZIP.
Nur Extraktion und Browserregression entfallen. Paketierung, Laufzeitdateien,
ZIP-Inhalte und bisherige Artefaktoptionen werden nicht verändert. Die
Browser-Review-/Timing-Artefakte entstehen nur bei tatsächlich ausgeführten
Regressionen; insbesondere verlangt ein ausgelassener WebKit-Lauf kein JSON.

## Nachweis und erwartete Ersparnis

Die Vertragstests prüfen künstliche Listen und echte temporäre Git-Repositories:
Dokumentation, tatsächlichen F01-Dateiumfang, Browsercode, geteilte Laufzeit,
Assets, Rätsel, Releases, Browsertests, Konfiguration, Abhängigkeiten, Workflow,
Detektor selbst, unbekannte Pfade, Löschung, beide Umbenennungsseiten,
Dateitypen, Mehrcommit-Push, fortgeschrittene PR-Basis, manuelle Ausführung,
fehlerhafte Events, nicht verfügbare Historie und CLI-Outputs. Ein zusätzlicher
Workflow-Vertrag schützt stabile Checks, sechs Shards, den strikten Rückfall,
Schrittbedingungen und immer ausgeführte Paketierung samt ZIP-Upload.

Der echte PR-#124-Diff von `a18a0af855b70199139edfc503732e8a761f1769` bis
`cd5266b38148beec91d1c1c8c85891e5010af1a7` wurde mit dem Detektor wiederholt:
**offline-flavor**, fünf Dateien, `regressions=false`.
Der Optimierungs-PR selbst muss wegen Workflow, Detektor und Tests **full**
ausführen, auch bereits in seinem ersten Lauf.

Zusätzlich geprüft: actionlint 1.7.7 und der offizielle
`@actions/workflow-parser`. Die R1-Vertragstests führen den tatsächlichen
Shell-Auswahlschritt aus dem YAML mit rohen Detektor-Outputs aus. Danach
werten sie die tatsächlichen Schrittbedingungen aller sechs bedingten Jobs
mit dem offiziellen `@actions/expressions` aus, einschließlich Fehlerartefakten,
Auslassungs-Summary und Abbruchbedingung. Die Bibliothek ist als reine
Testabhängigkeit auf 0.3.62 gepinnt; `unit` installiert dafür mit `npm ci`.
Die übrigen Parserwerkzeuge bleiben lokal. Keine neue Action oder neuer CI-Job.
Die Ausdruckstests ersetzen keinen echten GitHub-Runnerlauf.

### Review-Korrekturen R1 und R2

Eigene Reproduktion auf `dfe296fe85ace0cafd75fb9d8ce122d7ce7bb55d`:
Die ursprüngliche Browser-Ausdrucksauswertung mit `@actions/expressions`
übersprang Regressionen in allen fünf folgenden ungültigen Fällen. Das Profil
wurde ignoriert, und selbst ein zusätzlicher Vergleich mit `'false'` wäre wegen
der Actions-Stringsemantik nicht groß-/kleinschreibungssensitiv gewesen.

| Rohe Outputs bei erfolgreichem Detektor | Vorher | Nach Korrektur |
| --- | --- | --- |
| `full`, `false` | Regressionen ausgelassen | vollständig |
| fehlendes Profil, `false` | Regressionen ausgelassen | vollständig |
| unbekanntes Profil, `false` | Regressionen ausgelassen | vollständig |
| `documentation`, `FALSE` | Regressionen ausgelassen | vollständig |
| `documentation`, `FaLsE` | Regressionen ausgelassen | vollständig |
| `documentation`, `false` | reduziert | weiterhin reduziert |
| `offline-flavor`, `false` | reduziert | weiterhin reduziert |

R2 wurde in einem echten temporären Repository reproduziert: Der PR änderte
nur README, main enthielt inzwischen eine Laufzeitänderung, und Checkout-HEAD
war der synthetische Merge der **neueren** Basis mit dem PR. Das Event enthielt
noch die **alte** Basis. Der ursprüngliche Detektor meldete `documentation`,
auch bei fehlendem/ungültigem Commit oder übergebenem PR-Head. Jetzt erzwingt
jede dieser Inkonsistenzen `full`. Passende Merge-Eltern bei fortgeschrittener
Basis bleiben zulässig: redaktionelle Basisänderungen erlauben weiterhin ein
reduziertes Profil, Laufzeitänderungen auf der Basis-Seite erzwingen `full`.

Regressionstests verwenden echte Git-Merges, abweichenden Checkout-HEAD,
vertauschte/unpassende Eltern, fehlende/ungültige Merge-SHAs sowie die CLI mit
`GITHUB_SHA`. Gültige Dokumentations-/Offline-PRs bleiben reduziert; ein gültiger
Laufzeit-PR bleibt vollständig. Die Änderungen beschränken sich auf diese
Verträge und ihre Tests; Jobnamen, Matrix, Testbefehle und Release-Artefakte
bleiben erhalten. Für den Fix-Commit ist wegen der Infrastrukturänderungen
wieder der vollständige CI-Lauf erforderlich.

Referenz: [vollständiger F01-Lauf 45352584129](https://github.com/roquas/Sams-Gezeitenkarten/actions/runs/45352584129).
Seine Browser-Testschritte (Chromium, sechs WebKit-Shards, Deployment) summieren
sich auf **105:06 Runner-Minuten**; genau diese Testarbeit entfällt bei einem
qualifizierenden PR zusätzlich zu Installationen, Asset- und Reproduktionsjobs.
Die Unit-Suite samt Setup dauerte **6:01 Minuten**, Pakettests/ZIP/Extraktion
vor npm-Setup etwa **3:03 Minuten**. Daher ist für einen vergleichbaren
schlanken Lauf eine Größenordnung von **6–10 Minuten** plausibel, zuzüglich
Warteschlange. Das ist eine Schätzung, keine gemessene neue End-to-End-Laufzeit.

Der Referenzlauf dauerte wegen einer einzelnen 39:47-minütigen
WebKit-Installation insgesamt etwa 46 Minuten. Diese Störung darf nicht als
typische Ersparnis verkauft werden. Auch ohne sie lagen einzelne WebKit-Jobs
bei 19–21 Minuten. Vollständige Läufe erhalten nur den kleinen vorgeschalteten
Detektoraufwand; Unit und Katalog starten weiterhin unabhängig parallel.
Kurze No-op-Runner, Checkoutkosten, Runnerauslastung und das weiter gebaute ZIP
begrenzen die Einsparung. Die historischen Messungen in
[CI-PERFORMANCE.md](CI-PERFORMANCE.md) beschreiben eine frühere Suite mit vier
Shards, nicht die heutige Sechs-Shard-Matrix.
