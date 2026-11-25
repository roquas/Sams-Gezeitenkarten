# Archivierter erster F02-A/2-Produktionsauftrag

Dieser bereits ausgeführte Auftrag bleibt mit seinen Hashes unverändert.
Seine historischen technischen Beschreibungen sind keine aktuelle Namensregel.
Neue Aufträge verwenden `flavor-production-2` und vollständige F01-v2-Drafts
mit allen Startortnamen. Die vorhandenen vier Geschichten bleiben unverändert.

**Nur `public/` vollständig an den separaten Produktionschat übergeben.**
`public/prompt.md` ist die exakte Anweisung, `public/index.html` die statische
Kartenübersicht. `public/response-template.json` ist eine auszufüllende Vorlage,
keine erzeugte Geschichte. Ergebnis als unveränderte UTF-8-JSON-Datei zurückgeben.

`local/` ist der ursprüngliche Vertrauensanker mit exakter Exportkopie und
getrennter Herkunftsbindung. Er bleibt beim Bedienenden und wird später beim
Import verwendet. Es wurde keine Antwort importiert und keine Fassung ausgewählt.

Auftrag:
`flavor-order-85bb07ece126d1b5a2af6d98ea55ad5943f6f41f43a6245f835a16e71ba6b4df`.

| Position | Fall | Startname | Hinweise |
| --- | --- | --- | ---: |
| P01 | C-06 | Tangruh | 6 |
| P02 | C-02 | Gelbpunkt | 7 |
| P03 | C-03 | Treibkahn | 6 |
| P04 | C-11 | Nebellicht | 4 |

Vier Kartenbindungen, 13 vollständige Objektnamen, 23 Hinweise.

SHA-256 des exakten Inventars:
`7c601e008606349f13b5dec1d0f2568124a13e1dcb8c5bcc768b0e6923be52e7`.
SHA-256 von `public/order.json`:
`ffb441eb7b9f1e326020cfe230de8ea78a9059f16809f0e34cc9c30b70aeb719`.
Das Inventar verzeichnet sämtliche anderen öffentlichen Dateien; es enthält
keinen Selbsthash. Die lokale `complete.json` bindet zusätzlich Exportkopie und
Herkunftsdatei. Keine dieser Integritätsbindungen ist eine semantische Freigabe.

[Vertrag, CLI und Importanleitung](../../../docs/FLAVOR-PRODUCTION-F02-A-2.md).
