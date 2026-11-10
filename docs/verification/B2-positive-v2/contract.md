# B2 – Deduktionsvertrag V2
## Positive Referenz „mittelschwer“ mit echtem Zählschluss

**Status:** Fachlicher Vertragsentwurf – vor der konkreten Rätselkonstruktion festzuschreiben.

**Ziel:** Ein Rätsel, dessen zentraler Erkenntnismoment darin besteht, einen zunächst mehrdeutigen `countDistanceToPlace`-Hinweis durch Kombination mit anderen Informationen zu entschlüsseln.

Das Rätsel soll ohne das gedankliche Durchspielen vollständiger Routen und ohne zusätzliche GUI-Werkzeuge lösbar sein.

### A – Markierbarer Einstieg

Mindestens ein Hinweis oder eine einfache Kombination erlaubt früh eine konkrete, auf der vorhandenen Oberfläche darstellbare Erkenntnis.

Zulässig sind:
- eine feste Stundenposition,
- der sichere Ausschluss einzelner Felder,
- eine kleine Menge von Alternativen für **dieselbe** Stunde.

Die erste Erkenntnis darf einfach sein. Sie soll dem Spieler einen Einstieg geben, ohne den zentralen Zählschluss bereits vorwegzunehmen.

Nicht ausreichend ist ein Fortschritt, der ausschließlich aus mehreren miteinander gekoppelten alternativen Routensegmenten besteht, die im Kopf behalten werden müssen.

### B – Echter, zunächst unbestimmter Zählhinweis

Mindestens ein `countDistanceToPlace`-Hinweis umfasst mehrere Stunden und verlangt eine Trefferzahl, die weder null noch gleich der Anzahl betrachteter Stunden ist.

Der Hinweis muss echte Mehrdeutigkeit besitzen: Er bestimmt zunächst weder sämtliche Trefferstunden noch unmittelbar die entscheidende Stundenposition.

Die Zielinformation muss eine Kombination aus Stunden, Abstand und Trefferanzahl sein, nicht lediglich ein als Zählhinweis verkleideter Einzelstundenabstand.

Bevorzugt werden räumlich gut nachvollziehbare Bezugsorte, insbesondere einhexige Objekte.

### C – Unabhängige, zunächst ebenfalls nicht entscheidende Information

Mindestens eine weitere Bedingung liefert eine sinnvolle Einschränkung, entscheidet aber den zentralen Schluss nicht allein.

Sie darf beispielsweise aus einer Kurs-, Dreh-, Stundenabstands- oder weiteren Ortsbedingung stammen.

Sie muss nicht schon zu Beginn auswertbar sein. Entscheidend ist, dass ihre Aussage mit den bis dahin gewonnenen, markierbaren Erkenntnissen verständlich wird.

### D – Zentraler Zählschluss

Durch Kombination des Zählhinweises mit mindestens einer weiteren zuvor nicht allein entscheidenden Bedingung ergibt sich ein neuer, konkreter Schluss.

Beispielsweise:
- Eine bestimmte Stunde muss einen der gezählten Abstandstreffer darstellen.
- Eine bestimmte Stunde kann kein Treffer sein.
- Eine Stundenposition oder ein Übergang wird dadurch eindeutig.

**Verpflichtende Eigenschaften:**

1. Der Zählhinweis ist für den Schluss notwendig.
2. Mindestens eine weitere Bedingung ist notwendig.
3. Die Kombination ist stärker als ihre einzelnen Bestandteile.
4. Die Schlussfolgerung lässt sich mit wenigen lokalen Alternativen nachvollziehen.
5. Es ist nicht erforderlich, vollständige Routen zu simulieren oder mehrere alternative Routensegmente gedanklich gekoppelt zu halten.

Eine bloße Reduzierung der Anzahl mathematisch gültiger Gesamtrouten genügt nicht.

### E – Sichtbare Kettenreaktion

Der zentrale Schluss ermöglicht mindestens eine weitere, zuvor nicht mögliche konkrete Deduktion.

Diese Folgeerkenntnis soll mit der vorhandenen Oberfläche markierbar sein.

Idealerweise werden danach weitere Hinweise nutzbar, deren Bedeutung vorher unklar war.

Die Kettenreaktion darf auch kurze einfache Schritte enthalten. Nicht jeder Schritt muss ein neuer Aha-Moment sein.

### F – Vollständiger, praktikabler Lösungsverlauf

Die restliche Route muss durch nachvollziehbare lokale Schlussfolgerungen bestimmbar sein.

Dabei unterscheiden wir zwei Eigenschaften:

**Technisch:**
- eindeutige vollständige Lösung,
- sämtliche Festlegungen durch gültige lokale Regeln erklärbar,
- keine versteckte Verwendung der Zielroute oder vollständiger Solver-Ergebnisse.

**Spielerisch:**
- ein sinnvoller Einstieg existiert,
- der Spieler kann zunächst unhandliche Hinweise zurückstellen,
- mindestens ein nachvollziehbarer Weg führt zum zentralen Zählschluss,
- die erforderlichen Zwischenergebnisse können mit der bestehenden Oberfläche festgehalten werden,
- längere gedankliche Routensimulation ist nicht nötig.

Ein technisch gültiger Begründungsgraph allein beweist die spielerische Erfüllung nicht.

---

## Konstruktions- und Prüfbedingungen

**Rätselumfang**
- Sechs Etappen im bestehenden B2-Modell.
- Vorzugsweise fünf bis sieben Hinweise, ohne starre Obergrenze, falls ein zusätzlicher Hinweis die Verständlichkeit wesentlich verbessert.
- Bestehende Motive und Platzierungsverträge; „Hex ist gleich Hex“ bleibt erhalten.
- Keine Erweiterung der Spieloberfläche.

**Methodik**
- Diesen Vertrag vor der konkreten Konstruktion festschreiben.
- Eine gezielte Erstkonstruktion und höchstens zwei begründete Überarbeitungen.
- Kein unbeschränkter Suchlauf, um nachträglich ein passendes Beispiel zu finden.
- Eindeutigkeit, Legalität und Irredundanz prüfen. Falls ein logisch redundanter Hinweis für die menschliche Verständlichkeit wesentlich erscheint, den Zielkonflikt offenlegen statt ihn stillschweigend zu entfernen.

**Deduktionsnachweise**
- Den zentralen Schluss und seine notwendigen Abhängigkeiten identifizieren.
- Relevante Teilhinweissätze und Weglassungszustände prüfen.
- Den Begründungsgraphen mit dem nach PR #105 abgesicherten Testprüfer validieren.
- Nachweisen, dass der Zählschluss tatsächlich aus den lokalen Voraussetzungen folgt.
- Prüfen, ob eine vorherige, auf der GUI markierbare Erkenntnis den Einstieg ermöglicht.
- Technische und spielerische Qualitätsaussagen getrennt dokumentieren.

**Umgang mit Grenzen**
- Falls der gewünschte Schluss zwar menschlich nachvollziehbar ist, der bestehende Deduktionsapparat ihn aber nicht erklären kann: nicht durch einen globalen Solverbeweis als lokale Deduktion ersetzen.
- Eine mögliche fehlende lokale Regel separat dokumentieren.
- Keine automatische Erweiterung der Engine nur zur Erfüllung dieses Beispiels.
- Wenn der Vertrag innerhalb des begrenzten Konstruktionsbudgets nicht erfüllt werden kann, das Ergebnis offen berichten statt die Anforderungen nachträglich umzudeuten.

**Spieltest**
- Zunächst lösungsfrei spielen lassen.
- Tatsächlichen Einstieg, Reihenfolge der Schlüsse, Stillstände, verwendete Markierungen und gedankliche Alternativen erfassen.
- Erst anschließend mit dem technischen Begründungsgraphen vergleichen.

**Erfolgskriterium:** Ein mathematisch eindeutiges, lokal vollständig erklärbares Rätsel, bei dem ein menschlicher Spieler einen zunächst unbestimmten Zählhinweis durch Kombination anderer Erkenntnisse sinnvoll entschlüsseln kann.