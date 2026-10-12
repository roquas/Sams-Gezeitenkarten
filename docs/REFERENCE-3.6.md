# Unveränderter Referenzstand 3.6 – Provenienz

**Status:** Archivierungsmanifest; das Binärarchiv selbst ist **noch nicht** im GitHub-Repository. Keine Behauptung, dass 3.6 hier bereits lauffähig eingecheckt ist.

## Originalartefakt

- Dateiname: `gezeitenkarten_3_6_abstaende.zip`
- SHA-256: `749162e3cdbc3ba79558b9fbb798bf5f5899a76015eb12a020f742884566ba69`
- ZIP-Inhalt: `gezeitenkarten_3_6/index.html`, `gezeitenkarten_3_6/README.md`, 12 Grafikdateien in `assets/`
- Umfang: 14 Dateien; ZIP etwa 2,22 MB
- Falltitel: „Der verschwundene Kompass“
- Kein Framework, keine externen Dienste laut Original-README.
- **Noch ausstehend:** Archiv unverändert im privaten Repository ablegen, dort SHA-256 prüfen und auf Desktop/Mobil starten. Vorher Bildrechte beachten.

## Dokumentierter Prüfstand aus der Original-README

519 zulässige Routen ab Delta/Blau gegen sieben Hinweise geprüft; genau eine Lösung; sechs von sieben Hinweisen für Eindeutigkeit notwendig. JavaScript-Syntax mit Node.js geprüft. **Kein automatisierter Browsertest**. Diese Angaben sind eine *historische Aussage der README*, kein von uns neu ausgeführter Test.

## Ist-Daten aus der Original-HTML

- 5×5 Felder, Spalten A–E, Zeilen 1–5
- Gesperrtes Land: `B3`, `C3` (Tesoro) und `E2` (Klippen)
- Start: `D4` (Delta/Blau)
- Hinterlegte Lösung: `D4 → E3 → D2 → C2 → B2 → B1 → A1`
- Riff Alpha/Violett ist befahrbar.
- Regeln siehe [Regelspezifikation](RULES-3.6.md).

## Umgang mit Änderungen

Der Referenzstand bleibt unverändert. Korrekturen erfolgen in separaten Entwicklungsversionen; Abweichungen zwischen Ist-Code und gewünschter Regel sind zu dokumentieren.
