# F01: Offline-Verträge und semantische Prüfgrundlage

Implementierung: `scripts/lib/flavor-contract.mjs`. Öffentliche künstliche
Fixtures: `tests/fixtures/flavor/public.mjs`. Ausführbar mit
`node --test tests/contracts/flavor.test.mjs` (auch Teil von `test:unit`).
Kein GenAI-Aufruf, keine neuen Laufzeitfelder, keine Änderung bestehender Inhalte.

## Bestehende Architektur und Umfang

`src/puzzles/schema.mjs` bleibt die Quelle der Rätselparameter. Der Offline-
Vertrag übernimmt dessen Feldschemas, insbesondere die vollständige `oneOf`-
Definition der sechs Hinweistypen. `validateLogicDefinition`, `validateLogic`
und bei der Eingabeerzeugung `validateDefinition` bleiben zuständig. Es gibt
keine zweite mathematische Regelimplementierung. Engine, Solver, Generator,
UI, öffentliche Projektion und bestehende Identitätsbildung bleiben unverändert.

`logic.map.objects[].id` ist die Objektidentität, `objectNames` die vorhandene
Namenszuordnung, `clueTexts` die Textzuordnung je Hinweis-ID. `cluePlaceRefs`
bleibt die bestehende optionale Präsentationsreferenz. Keine neue Ortsklasse,
keine Ableitung aus Motiv, Koordinate oder Textsuche. Bereits vorhandene
Archividentitäten können im späteren Batchindex zusätzlich geführt werden;
F01 erfindet keinen Ersatz für mapStructureId/instanceId/variantId.

## Versionierte JSON-Verträge

Alle drei Schemas sind exportiert, strikt gegen unbekannte Felder und mit dem
vorhandenen Schema-Evaluator ausführbar. Requests und ihre Quellhashes bleiben
bei `contractVersion:1`. Neue Drafts und Checkpoints verwenden Version 2 mit
vollständigen gepinnten Ortsnamen; kontrollierte Belege und Prüfmethode heißen
`controlled-v2` / `flavor-check-v2`. Historische v1-Snapshots werden nur gelesen
und unverändert geprüft. Rätselschema 2 und rulesVersion bleiben bestehen.

- **Request** (`flavorRequestSchema`): `contractVersion`, `sourceHash`, `source`.
  Source enthält `schemaVersion`, `rulesVersion`, `dataVersion`, `id`, die
  vollständige `logic`, die ursprüngliche `presentation` und optional
  `resultTexts`. Zielroute und interne Metadaten werden nicht übernommen.
  Strukturierte Originalhinweise und Originaltexte sind ausschließlich Referenz.
- **Draft** (`flavorDraftSchema`): `contractVersion`, `sourceHash`, `revision`,
  `presentation`, `resultTexts`, `evidence`. Editierbar sind die bestehenden
  Textfelder title/intro/clueTexts/hints/cluePlaceRefs und resultTexts.
  Hintergrund und Assetplatzierungen verbleiben unverändert in Source.
  Die Namen entsprechen vollständig der eingefrorenen Eingabe, einschließlich des Startortes.
  `evidence` ist eine optionale Belegzuordnung je Hinweis-ID. Fehlende Belege
  bedeuten freie Prosa, niemals Erfolg.
- **Checkpoint** (`flavorCheckpointSchema`): `contractVersion`, `sourceHash`,
  vollständiger `draft` und berechnete `checks` je Hinweis-ID. Ein Check enthält
  `status`, `method`, `scope`, `code`, `details` und `inputHash`.

Der SHA-256-Hash nutzt die bestehende kanonische JSON-Funktion, mit eigener
Domain `gezeitenkarten-flavor/v1` für Requests; neue Einzelchecks verwenden
`gezeitenkarten-flavor/v2`. Er bindet alle Eingabefelder einschließlich
Objektnamen, Präsentation und Originalhinweisen. Er ist ein Integritätsbezug,
keine Signatur: Der Batchrunner muss den ursprünglich gespeicherten Request als
vertrauenswürdige Referenz behalten. Eine neue Quelle oder Namensrevision erhält
einen neuen Request und invalidiert bisherige Ergebnisse. Kein Chatverlauf ist
für Erzeugung, Prüfung oder Reparatur erforderlich.

`createFlavorRequest(document, options)` validiert das vollständige Original,
bei Illustrationen mit dem expliziten `assetLibrary`-Kontext. Persistierte
Requests benötigen bei der späteren Prüfung keinen externen Katalog: geprüft
werden eingebettete Rätselstruktur, Logik, Referenzen und Hash; erneute grafische
Assetfreigabe ist keine Flavor-Aufgabe. Erzeugung, Checkpoint und Reparatur liefern Kopien und
mutieren die Originale nicht. Die Unveränderlichkeit gilt relativ zum gepinnten
Request, nicht als JavaScript-Schreibschutz.

## Prüfergebnisse und belastbare Aussage

| Ergebnis | Aussage |
| --- | --- |
| PASS | Der gesamte Hinweis entspricht exakt einer kontrollierten Formulierung eines unveränderten strukturierten Originalhinweises; explizite Ortsreferenzen passen dazu. |
| FAIL | Eine belegte F01-Vertragsverletzung liegt vor: veränderte Aussageparameter, nicht vollständig abgedeckter Text oder widersprechende Präsentationsreferenzen. |
| UNCERTAIN | Vollständige semantische Interpretation fehlt. Auch ein scheinbar korrekter freier Text bleibt unbestätigt. |

Ungültige Struktur, unbekannte IDs/Versionen, unzulässige Parameter, fehlende
Hinweistexte und Quellkonflikte werfen einen Vertragsfehler. Dies ist kein
semantisches Prüfergebnis und muss der Batchrunner als Eingabefehler berichten.

`scope:single-clue-contract` ist bewusst eng. Ein FAIL wegen abweichender
Parameter behauptet keine mathematische Widerlegung: Auch zufällig redundante
Änderungen oder äquivalente andere Darstellungen der strukturierten Logik
verletzen den strikten F01-Erhaltungsvertrag. Beispielsweise werden +180° und
−180° nicht normalisiert. Eine spätere breitere Äquivalenzprüfung braucht einen
eigenen ausgewiesenen Beweisumfang.

### Kontrollierte Belege

`evidence[id]` ist entweder `{mode:"free"}` oder:

```js
{
  mode: 'controlled-v2',
  statement: originalClue, // bestehende Hinweisstruktur, keine neue Logiksprache
  order: 'time-first'     // alternativ 'fact-first'
}
```

`renderControlledClue(request, statement, evidence)` hat zwei endliche,
vollständig festgelegte Satzstellungen. Der Prüfer vergleicht **den gesamten
Text bytegenau** mit dieser Ausgabe und alle Aussageparameter mit dem Original.
Das ist kein Musterabgleich freier Prosa. Ein kopiertes korrektes Statement
neben beliebiger Erzählung besteht nicht. Zusätzliche Sätze, Präfixe, Negationen
oder selbst Leerzeichen außerhalb der kontrollierten Ausgabe werden abgewiesen.
Objektnamen sind zitierte Labels; die eingeblendete stabile ID legt die Referenz
fest. Redaktionsnamen bleiben im Draft an die Quelle gebunden.

Abgedeckte Bedeutung gemäß bestehender Engine:

| Typ | Erhaltener Inhalt |
| --- | --- |
| direction | gerichtete Fahrt von hour−1 zu hour, eine der sechs Hexrichtungen |
| turn | vorzeichenbehafteter Kurswechsel gegenüber der vorherigen Fahrtrichtung, 0° geradeaus |
| position | genau das angegebene Feld zur Stunde, einschließlich Stunde 0 |
| distanceToPlace | exakter kleinster Hexabstand zur **gesamten** Objektfläche |
| distanceBetweenHours | exakter geometrischer Hexabstand zwischen beiden Stundenpositionen |
| countDistanceToPlace | exakte Anzahl im beidseitig inklusiven Intervall, Stunde 0 eingeschlossen; count=0 ist die ausdrückliche Negation, count=Intervalllänge bedeutet alle Stunden |

Explizite `cluePlaceRefs` müssen bei kontrollierten Hinweisen genau die
referenzierte Objekt-ID enthalten, bei Hinweisen ohne Ort `[]`. Fehlende
Einträge behalten die bestehende placeId-Rückfallregel. Die Referenz ist
Präsentation, keine neue mathematische Bedingung.

Freie Prosa kann fehlende/zusätzliche Stunden, ungenaue Quantoren, mehrdeutige
Namen, versteckte Negationen oder weitere Einschränkungen enthalten. F01 erkennt
diese nicht zuverlässig und vergibt deshalb stets UNCERTAIN. Ein künftiger
KI-Interpreter muss **sämtliche** logischen Aussagen und unaufgelöste Textstellen
abdecken. Eine vom Generator selbst behauptete Gleichwertigkeit oder eine
bloße extrahierte Teilmenge genügt nicht. KI-Konfidenz allein wird kein Beweis.

## Vollständige Ortsnamen

Jeder benannte Ort behält seinen tatsächlichen gepinnten Namen. Das gilt
unabhängig davon, ob das konkrete Rätsel dort startet. Draft und kontrollierte
Formulierung verwenden den Namen des Startobjekts wie jeden anderen Ortsnamen.
Die Startfunktion wird durch die UI hervorgehoben; sie verändert keinen Namen.
Es gibt keine Ausblendung, Aliasvorgabe oder Ersetzung durch „Start“ in der
aktuellen Flavor-Erzeugung.

Bei allen Distanzhinweisen zählt weiterhin die vollständige Objektfläche.
Ein mehrfeldriger Ort wird durch einen Start auf einer seiner Zellen nicht
auf dieses einzelne Feld verkleinert. Namen bleiben über verschiedene Starts
auf derselben Karte unverändert.

Alte v1-Belege und bereits gespeicherte Antworten bleiben als unveränderliche
Historie lesbar. Sie sind keine Vorlage für neue Benennungen. Eine Reparatur
eines alten Drafts erzeugt Version 2 mit allen Namen; alte kontrollierte Belege
werden dabei nicht stillschweigend als neue Beweismethode ausgegeben. Ihre
unveränderten Texte bleiben erhalten, die bisherigen kontrollierten Belege
werden bis zu einer neuen Prüfung als freie Prosa mit UNCERTAIN geführt.

## Einzelreparatur und Wiederaufnahme

```js
const request = createFlavorRequest(document, {assetLibrary});
const draft = createFlavorDraft(request);
// Adapter trägt Texte/Belege ein; freie Texte bleiben zunächst UNCERTAIN.
const checkpoint = createFlavorCheckpoint(request, draft);
// JSON.stringify/checkpoint kann ohne laufenden Prozess gespeichert werden.
const {pendingClueIds} = resumeFlavorCheckpoint(request, checkpoint);
const next = repairFlavorClue(request, checkpoint, {
  clueId, expectedRevision: checkpoint.draft.revision, text, evidence,
  // optional: placeRefs: ['stable-object-id']
});
```

Wiederaufnahme berechnet alle Checks neu und weist fehlende, veraltete oder
manipulierte Resultate zurück. inputHash bindet Quelle, Hinweis-ID, vollständigen
Text, Beleg und explizite Ortsreferenzen. Nicht-PASS bleibt in pendingClueIds.
Reparaturen verändern nur den einen Text, seinen Beleg, optional seine vorhandene
Ortsreferenzzuordnung und die Draftrevision. Andere Texte und Source bleiben
unberührt. expectedRevision verhindert Anwendung einer veralteten Reparatur;
atomares Speichern/Compare-and-swap im Batchrunner bleibt F02. Checkpoints
enthalten jeweils den neuesten Stand; ein dauerhaftes Versuchsprotokoll ist
Aufgabe des späteren Runners.

## Vorgesehene Produktionsschnittstellen für F02

1. **Ortsnamensverwaltung:** Gepinnte `objectNames` nach stabiler Objekt-ID aus
   einer kuratierten, versionierten Quelle vollständig bereitstellen, einschließlich Startort.
   Konsistenz, Namenskollisionen und Kanonzugehörigkeit vor Requesterzeugung
   prüfen. Keine Namen aus Motiven erraten; Verwaltung selbst ist nicht gebaut.
2. **GenAI-Generierung:** Request plus explizites versioniertes Welt-/Stilpaket
   zu Draft. Jede Anfrage ist eigenständig; Modell, Promptrevision, Parameter
   und Antwortartefakt im Runner protokollieren. Noch kein Provider oder Prompt.
3. **Einzelhinweisprüfung/Reparatur:** Request, Draft und clueId zu Check.
   Reparatur erhält Originalhinweis und konkreten Befund, liefert nur den
   adressierten Text/Beleg/optionale Referenzen. Freie Texte brauchen einen
   unabhängigen vollständigen Interpretationsschritt mit expliziter Unsicherheit.
4. **Redaktionelle Gesamtprüfung:** Request und kompletter Draft zu separatem
   Review über Weltkanon von *Plötzlich Piratin!*, Stimme, Handlung, Lesbarkeit,
   Widersprüche und rätselrelevante Zusatzbehauptungen in intro/hints/resultTexts.
   F01 prüft diese Texte nur strukturell. Selbst ausschließlich PASS-Hinweise
   erlauben keine automatische Veröffentlichung. Kein Kanonmaterial erfunden.
5. **Batch/Qualitätsreport:** Jobschlüssel aus sourceHash und Vertragsversion,
   pro Rätsel atomarer Checkpoint, IDs/Revisionen je Versuch, Retrybudget und
   expliziter Fehlerstatus. Berichte zählen PASS/FAIL/UNCERTAIN getrennt nach
   Prüfmethode und Umfang; Vertragsfehler, offene Gesamtprüfung und abgebrochene
   Jobs separat. Wiederaufnahme führt nur offene Arbeit weiter. UNCERTAIN darf
   weder Erfolgsquote noch Veröffentlichungsfreigabe erhöhen. Runner, Queue,
   Reportgenerator und Publisher sind noch nicht implementiert.

## Implementierungsbericht, Tests und bekannte Grenzen

Neue Dateien beschränken sich auf Offline-Modul, öffentliche Fixture, gezielte
Vertragstests und diese Dokumentation. PUZZLE-FORMAT erhält lediglich einen Link.
Keine bestehenden Rätseltexte, Schemas, Engine-, Solver-, Generator- oder UI-
Dateien wurden geändert. Regressionstests prüfen Originalvalidierung, Spielview,
Routen, Hinweisprädikate und bestehende logische Fingerprints vor/nach dem Lauf.

Die künstlichen Fälle decken alle sechs Typen in beiden Satzstellungen ab,
Quantorenwechsel, fehlende/zusätzliche Stunden, Ortsverwechslungen,
Distanzänderungen, zusätzliche Aussagen, Negation, unsichere freie Sprache,
Start/Multihex, ungültige Belege, Quellbindung sowie Resume/Reparaturkonflikte.
Sie enthalten keine privaten S04-C-Daten. Der kontrollierte Renderer ist eine
technische Prüfprobe und keine redaktionelle Textproduktion. F02 muss besonders
die vollständige Interpretation freier Prosa und eine davon getrennte
Gesamtprüfung lösen; F01 behauptet hierfür noch keine Automatisierbarkeit.
