# Privater Deduktionsvertrag – vor Kartenentwurf

Ausgangspunkt: main a8f8cbf97005b3ad888d8443fb40e3118781f717, nach PR #103.
Dieser Vertrag wird vor der Erstkonstruktion festgeschrieben. Keine konkreten
Felder, Zielroute oder Hinweisparameter stehen zu diesem Zeitpunkt fest.

- **A:** Start, Nachbarschaft und eine kurze frühe Bedingung lassen zwei bis drei
  unterscheidbare Anfangsstücke. Träger: Kursfilter und Vorgänger-/Nachfolgerstützung.
- **B:** Eine späte Kurs- oder Drehungsbeziehung schränkt unabhängig vom gelösten
  Anfang Übergänge ein. Träger: Kursfilter oder Zwei-Kanten-Drehung.
- **C:** Ein kurzer Ortsabstand schränkt eine Stunde unabhängig ein. Bevorzugt
  einhexiger Bezugsort. Träger: direkte Stundenbedingung, gegebenenfalls Zählgrenzen.
- **D:** Mindestens zwei Stränge verlieren gemeinsam die letzte Stützung einer
  Alternative und bestimmen einen vorher offenen Übergang. Bevorzugt direkte
  Nachbarschaft oder geometrische Paarstützung als Verbindung. Die beteiligten
  Stränge allein dürfen diesen Übergang nicht bestimmen.
- **E:** Die Festlegung aus D ermöglicht eine weitere Feld-/Übergangsfestlegung
  oder einen wirksamen Zählausschluss. Träger: Nachbarschaft, Zählgrenzen oder
  Wiederbesuchsverbot nach Singleton. Die Abhängigkeit wird gesondert geprüft.
- **F:** Alle verbleibenden Stunden und Übergänge werden durch kurze Anwendungen
  der unveränderten lokalen Regeln bestimmt. Keine Prüfung kompletter Routen
  als menschliche Begründung.

A–C dürfen überlappen. Eine Kette soll aus wenigen vor Ort nachvollziehbaren
Operationen bestehen; drei vollständige Teilrätsel sind nicht gefordert.
Die konkrete Umsetzung wird gegen diesen Vertrag geprüft und nicht nachträglich
als vorab geplantes Drehbuch ausgegeben. Technische lokale Auflösbarkeit ist
keine vorweggenommene menschliche Qualitätsbewertung.

Budget: eine Erstkonstruktion, höchstens zwei gezielte Überarbeitungen, genau ein
ausgeliefertes Rätsel. Keine Generator-/Hinweissuche. Bei Scheitern: ausdrücklich
kleinere Referenz mit zwei Strängen, Kombination und Kettenreaktion dokumentieren.
Private Dateien werden nicht ins Web-/ZIP-Paket übernommen.
