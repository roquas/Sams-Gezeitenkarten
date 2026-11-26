# Produktionsanweisung · flavor-production-2

Lies order.json, rules.md sowie world/manifest.json, world/world.md,
world/style.md und world/production.md vollständig. Die statischen Karten in
maps/ und die Objekt-/Namentabellen in index.html gehören zu den öffentlichen
Eingaben. Alle Dateihashes stehen in inventory.json. Quellenverweise im Weltpaket
sind Herkunftsangaben, keine Anweisung, weitere Dateien oder Chats nachzuladen.
Nutze ausschließlich dieses Paket. Es enthält keine Zielroute.

Führe das redaktionelle Ziel in order.json aus. Bewahre Reihenfolge, IDs,
Kartennamen, Start, Etappenzahl und sämtliche strukturierten Hinweise unverändert.
Die neutralen technischen Hinweisformulierungen dienen als Referenz, nicht als
alte Geschichte. Alle persistierten Ortsnamen stehen vollständig zur Verfügung, auch der Name
des Startortes. Benenne und referenziere Startorte wie jeden anderen Ort; ihre
Startfunktion verändert oder beschränkt ihren Namen nicht.

Antworte ausschließlich mit einem JSON-Objekt gemäß response.schema.json.
response-template.json enthält alle vorgegebenen Referenzen und Hinweis-IDs.
Ersetze die Platzhalter für Titel, Einleitungsabsätze, Hinweistexte und Metadaten.
Genau ein Eintrag pro Position und genau ein Text pro Hinweis in derselben
Reihenfolge. Kopiere Auftrags-, Positions-, Rätsel-, Karten-, Quell-, Varianten-,
Revisions- und Vorgängerreferenzen exakt. Revisionen werden vorab redaktionell
festgelegt. Gib keine Requests, Manifeste, Namen, Regeln, Logikänderungen, Hilfen,
Auflösungstexte, Prüfbelege, Freigaben oder PASS-Ergebnisse zurück.

Die kompakten Metadaten nennen Erzählform, Themen, verwendete Weltmotive und
neue episodenlokale Erfindungen. Sie sind Modellauskünfte. Neue Erfindungen werden
nicht automatisch in den Weltbestand übernommen.

Bei einem konkreten Produktionsproblem: dieselben Referenzfelder, status
"problem" und problem mit einer konkreten Beschreibung senden; die Felder title,
intro, clues und metadata entfallen dann. Alle anderen Positionen bleiben in der
Antwort enthalten. Ein solcher Auftrag ist unvollständig und wird nicht als
vollständiger Draftbatch angenommen. Rate oder repariere keine Eingaben.
