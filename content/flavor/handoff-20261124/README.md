# F02-A/2 – Übergabeunterlagen

Stand: 24. November 2026 · Projekt: Sams Gezeitenkarten / Online spiel

Dieses Paket sichert das Ergebnis des Konzeptionschats **F02-A Konzeptentwicklung**. Es enthält das fachliche Soll, ein vollständig lesbares Welt-/Stilpaket v1 als Entwurf und den eigenständig ausführbaren Prüf- und Vorbereitungsauftrag für den bestehenden Workchat. Es ist keine Bestätigung einer bereits geprüften technischen Integration.

## Dateien und Verwendung

| Datei | Zweck |
|---|---|
| [F02-A-2-Konzept.md](F02-A-2-Konzept.md) | Konsolidiertes fachliches Zielkonzept einschließlich Entscheidungsabgleich und offenen Prüfungen |
| [welt-stilpaket-v1/world.md](welt-stilpaket-v1/world.md) | Weltwissen, Namen, Figuren, Institutionen und alle 15 U-Ergänzungen mit Herkunft |
| [welt-stilpaket-v1/style.md](welt-stilpaket-v1/style.md) | Erzählmodell, kreative Freiheit, Humor, Vielfalt und Beispiele |
| [welt-stilpaket-v1/production.md](welt-stilpaket-v1/production.md) | Verbindliche fachliche Grenzen für Produktion, Ausgabe und Herkunft |
| [welt-stilpaket-v1/manifest.json](welt-stilpaket-v1/manifest.json) | Gemeinsame Paketidentität, Version, Dateien und Integritätswerte |
| [Workchat-Uebergabe.md](Workchat-Uebergabe.md) | Vollständiger Auftrag: Repository lesen, Anschluss prüfen, Codex-Auftrag vorbereiten |
| [Quellen-und-Entscheidungsstatus.md](Quellen-und-Entscheidungsstatus.md) | Herkunft, Grenzen der Belege, Abgleich E01–E31, ersetzte Zwischenstände |
| [referenzen/ploetzlich-piratin-stil-und-weltreferenz.md](referenzen/ploetzlich-piratin-stil-und-weltreferenz.md) | Unveränderte Kopie der ursprünglichen Recherche als Referenz |

Für den nächsten Schritt den **Workchat-Uebergabe.md** zusammen mit diesem gesamten Paket in den bestehenden Workchat geben. Der Auftrag ist hier als Datei vorbereitet; es wurde keine Nachricht an einen anderen Chat versandt. Der Workchat soll zunächst ausschließlich prüfen und den Implementierungsauftrag ausarbeiten. Die eigentliche Textproduktion folgt nach der technischen Vorbereitung in einem separaten Produktionschat mit ausschließlich zulässigen Eingaben.

## Maßgeblicher letzter Stand

- Erster realer Pilot: **vier eigenständige Episoden**, je eine zu **C-06, C-02, C-03 und C-11**. Kein zusätzlicher Serienpilot mit denselben Fällen.
- Späterer vollständiger Betatest: **zehn unterschiedliche Einzelgeschichten und eine fünfteilige Geschichte** auf den 15 bestehenden Rätseln. Alle Texte werden vom Projektverantwortlichen vollständig testgelesen.
- Die Textproduktion kennt die ausgestaltete Karte, sämtliche Namen, den öffentlichen rätselspezifischen Startpunkt und alle öffentlichen Hinweise. **Zielroute, geheimes Ziel und internes Lösungswissen bleiben ausgeschlossen.**
- Flavor ist eine Präsentationsschicht mit **strikter 1:1-Zuordnung** der Hinweise. Karte, Rätsel, Reihenfolge, Assets und Namen werden dadurch nicht verändert.
- Welt-, Stil- und Produktionsdatei bilden **ein gemeinsam versioniertes Paket**. Namen und Weltkonzepte bleiben gemeinsam in `world.md`.
- Neue Geschichte zum selben Rätsel = Flavor-Variante; Korrektur derselben Geschichte = Flavor-Revision. Herkunft und ältere Fassungen bleiben nachvollziehbar.
- Importierbarer Draft, semantisch geprüfte Fassung und veröffentlichte Fassung sind unterschiedliche fachliche Zustände.

## Umfang dieser Lieferung

Neu erstellt wurden ausschließlich diese Übergabedateien und ihr Downloadarchiv. Die synchronisierte Quelle unter `sources/` und sämtliche bestehenden Repositorydateien bleiben unverändert. Es fanden keine Repositoryprüfung, Implementierung, Episodenproduktion, Veröffentlichung oder erneute Podcastauswertung statt. Die Prüfung der Artefakte betrifft Vollständigkeit, Verweise, JSON und Integrität dieses Pakets; sie ersetzt keine technische Vertragsprüfung im Workchat.
