# S04-C v1 – Versuchsvertrag vor Ergebnissen

Privates Entwicklungsartefakt, enthält später Lösungen und Auswahlgründe.
Phase A/B; **kein Phase-C-Lauf, kein externer Testexport**. Stand 22.11.2026.
Konfiguration: `scripts/config/s04-c-v1.json`. Programm und Vertrag werden vor
Erzeugung committed; Ergebnisse sind ein eigener nachfolgender Commit.

## Basis und Schnittstellenprüfung

Tatsächlicher main: `928dd1a5e5d043c962612b07be998686a025ba7b`.
GitHub #116 ist seit 22.11.2026 07:42:58 UTC gemergt (Head `558eaea`), obwohl
sein alter Beschreibungstext noch „offen“ sagt. Seine 50 geänderten Dateien
betreffen Betatest-Oberfläche, Speicherung und Browser-/Integrationstests;
keine Änderung an `route-experiment.mjs`, `puzzle-experiment.mjs`, Identitäten
oder B2-Weiterverarbeitung. S04-B aus #115 ist integriert. „B1“ bezeichnet hier
sowohl den alten Routenproduzenten als auch die neuere UI-Arbeit; diese sind
zu unterscheiden. Keine vorläufige Schnittstelle wird verwendet. Vor Phase C
aktuellen main und neue B1/B2-Änderungen nochmals prüfen.

Issue #21 samt null Kommentaren am 22.11. gelesen: schon der erste externe Test
braucht ausgearbeitete Namen/Erzähltexte und eine unabhängige Rückübersetzung
jedes Textes gegen Logik; auch Einleitung/Namen auf Zusatzhinweise prüfen.
Neutraler öffentlicher Bestand enthält keine Lösungen, Diagnosen, Gruppen,
Auswahlgründe. Für S04-C gilt ausdrücklich keine technische Schwierigkeitsskala.
Die Issue-Festlegung erlaubt manuelle Redaktion; sie verlangt keine Textpipeline.

## Tatsächliche Vorbefunde und Grenzen

- S03-v1: 20 Ziele, 80 reduzierte/verschiedene Sätze, 24 Diagnosen/705 Zustände,
  5 Finalisten, 4 Karten ausgewählt. 48 Kandidaten unbewertet wegen Diagnosebudget,
  19 LOCAL_REMAINDER, 8 CLUE_COUNT. 80 Neustarts, 5.343 Solverchecks,
  3.759.673 Matches, 9.838.193 Filterauswertungen insgesamt. Alle 20 Suchen enden
  am Neustartbudget; dies ist keine unvollständige Gültigkeitsprüfung der Kandidaten.
- S03-v2: exakt dieselben 80 Quellen, **null** neue Erzeugungen/Suchen; 40 Diagnosen,
  1.096 Zustände, 11 Finalisten, 9 Karten ausgewählt, 32 Kandidaten unbewertet,
  29 LOCAL_REMAINDER. Belegt bessere Diagnoseabdeckung, keinen Generationserfolg.
- B2 zählt unabhängig davon vollständige/unvollständige Routenenumerationen,
  Parameter, Neustarts, Solverchecks, Matches und Routenfilter. Der S02-Lauf mit
  zwei Neustarts je Ziel war ebenfalls restartbegrenzt. Frühere Suchvergleiche
  auf vier alten Zielen testen andere Strategien und teils zehnfache Ressourcen;
  daraus folgt kein kalibrierter Qualitätsvorteil für neue normalisierte Kandidaten.
- 100.000 Parameter reichen für die bisherigen S03-Pools; keine Evidenz für einen
  Parameterengpass. Die Grenzen werden nicht pauschal erhöht. Vollständigkeit
  wird für jedes neue Ziel separat gespeichert. Mehr Ressourcen allein zählen nicht.
- S04-A ist eine Sicht auf bekannte Beweiszustände, keine menschliche Zeitachse.
  Exakte Restwege/Kanten und lokale Domänen sind verschieden. S03-02: 75 exakt
  unterstützte vs. 107 rekombinierte Wege; zusätzliche höherstufige Bindungen fehlen
  im lokalen Modell. Kein zusätzlicher großer S04-A-Diagnoselauf für diesen Vergleich.

## Vier experimentelle Präferenzen, keine Qualitätsgesetze

Alle Beobachtungs-IDs stammen aus `docs/observations/human-playtests.v1.json`;
Quellenqualität und Kennungsunsicherheit (u.a. ten-05) gelten unverändert.

| Präferenz | Menschliche Grundlage | Vorhandenes technisches Signal/Regel | Erwarteter Nutzen | Gegenbeispiel/Grenze |
| --- | --- | --- | --- | --- |
| P1 markierbarer Teilfortschritt | historical-C, ten-06, s03-08; Wunsch nach Ausschlüssen | `qualitySignals.entryStates` nicht leer (Ein-/Zweihinweis-Feldfortschritte) | greifbarer Einstieg | Keine lokale Einzel-/Paarfixierung in positivem S03-08; Eintrag ist weder Entdeckbarkeit noch Etappe |
| P2 begrenzter lokaler Rest | T02/T07: frustrierende Alternativenlast; s03-01 angenehmer Abschluss | unverändertes `lateRejection`: höchstens 2 offene Stunden, je 3 Felder, höchstens 2 lokale Kopplungen | überschaubare Fortsetzungsprüfung | S03-05 positiv trotz 509/301 markierungskompatibler Wege; keine Vollauflösungspflicht, keine Restwegschwelle |
| P3 kombinierte Nutzung | ten-06 Aha; s03-08 Wiederverwendung; historical-A Einhinweisdominanz negativ | `mixedCombinationHours.length > 0` ODER `reusedFieldSteps > 0`; bestehender Frühfilter max. 3 einzelhinweisfixe Stunden bleibt | Gelegenheiten zur Hinweiskombination | Zertifikatteilnahme beweist keine notwendige menschliche Idee; S03-07 und ten-04 positive geometrische Gegenfälle |
| P4 Vielfalt im Pool | V2 nahezu identisch mit V1; Serienfeedback will auch einfache geometrische Fälle | eine Karte insgesamt, max. 2 je bestehender Verlaufssignatur; feste Hashreihenfolge statt Score | Wiederholungen begrenzen, Gegenfälle erhalten | Signaturen sind technische Spuren; verschiedene Signaturen garantieren keine andere Spielerfahrung |

P1–P3 gemeinsam definieren nur den bevorzugten experimentellen Teilpool. Kein
Gesamtscore, keine neue Deduktionsregel. Ähnlich klingende Hinweise oder zwei
Hinweise auf dasselbe Objekt sind keine neuen mathematischen Ausschlüsse.

## Unveränderte Ausschlüsse und Herkunft

Bestehende vollständige Engine-Routenräume, gültige Karten/Belegungen, zulässige
Zielroute, eindeutige Lösung, Zielgleichheit, Irredundanz und Effekt-Deduplikation.
S04-B `count-distance-extremes-1` explizit vor endgültigen Identitäten,
Auslassungsprüfungen und Signalen, erneute Prüfung des normalisierten Satzes mit
**denselben** Solver-/Match-/Filterbudgets. NORMALIZED_REDUNDANT bleibt Ablehnung.
Keine Rückkehr zu fragmentierten Rohsätzen, keine Füllhinweise.

S03-Parameterpolitik `s03-no-multihour-zero-1` bleibt: keine Mehrstunden-CD mit
S0; Einzelstunden-S0 bleibt erlaubt. Baseline mindestens 16 legale Wege und
höchstens 2 geometrisch feste Folgestunden; früh 3–7 finale Hinweise, max. 3
einzelhinweisfixe Folgestunden. Diese bestehenden experimentellen Ausschlüsse
gelten in beiden Armen einschließlich Kontrollfällen. Früh verworfene technisch
korrekte Kandidaten bleiben im privaten Audit, erhalten keine Diagnose/Auswahl.
P1/P2 sind die unveränderten S03-Spätfilter für bevorzugte Fälle. Kontrollfälle
dürfen ihnen absichtlich widersprechen; sie sind keine freigegebenen Finalisten.

Alle Suchausgaben, auch frühe Qualitätsablehnungen, werden unabhängig durch
`verifyCandidates` geprüft. Herkunftsbelege aus `originReceipts` werden getrennt
vom Kandidaten gespeichert; erwarteter Digest stammt bei der Erzeugung aus dem
vertrauenswürdigen In-Memory-Vertrag. Für spätere Prüfung den Digest aus dem
reviewten Ergebniscommit übernehmen, niemals aus untrusted Belegbytes ableiten.
Historische Quellen werden nur zum Ausschluss alter Karten/Varianten gelesen.

## Zwei vorab festgelegte Konfigurationen

A: S03-Suchreferenz mit aktiver S04-B-Normalisierung, 4 Neustarts.
B: identische Suche mit 8 Neustarts. Sonst identische Grenzen: 2.000 Solverchecks,
5 Mio. Matches, 20 Mio. Routenfilter **je Ziel**. Keine andere Strategie, keine
Erhöhung dieser drei Grenzen. Pro Arm 12 Diagnosen/max. 780 Zustände; unverändert
max. 65 Zustände/Diagnose, 250.000 Knoten je Diagnose, unabhängiger Prüfer maximal
1 Mio. Knoten je Kandidat und einmal je Karte/Start für Effektprüfung.

Neue Karten: freigegebener Release, Seeds 404000…404011, Ziel sechs akzeptierte
Karten, max. zwölf äußere Versuche, **ein** innerer Kartenversuch, keine geografischen
Eignungsfilter. Keine Ersatzkarte bei fehlendem Start, alter/doppelter Karte oder
Baseline-Ablehnung. Sämtliche B1-Starts mit 100.000 Knoten zählen. Für beide Arme
je Karte derselbe erste vollständig gezählte positive Start in B1-Reihenfolge;
kein Ausweichen bei ungeeigneter Baseline. Zielindex aus `randomStream(404,
's04-c-target-1/'+candidateIndex)`, uniform aus dem vollständigen Raum. Gleiche
Zielroute, derselbe Suchseed 404+candidateIndex, derselbe Pool; keine alten Ziele.

Jeder Arm bekommt einen frischen Suchsolver/Cache, gemeinsame vorbereitete
Routenräume/Pools werden als gemeinsame Vorbereitung separat ausgewiesen.
Armfolge A, B. Maximal 24+48 reduzierte Sätze; keine versteckte Nachsuche.
Diagnoseplan vor erster Diagnose je Arm speichern: vorhandener S03-v2-Planer,
Runden nach Kartenindex und neuer Entstehungsordinalzahl, unveränderter Frühfilter.
Alle technisch geprüften Rohkandidaten bleiben erhalten. Undiagnostiziert heißt
unbekannt, nie Qualitätsablehnung. Zustände werden verlustfrei gzip gespeichert;
Hash der unkomprimierten Bytes und Profilhash binden die abgeleiteten Signale.
Watchdog 120 Sekunden für gesamten Worker inklusive neuer Karten, B1, Quellen-
und Kandidatenprüfung; Abbruch ist ungültiges Experiment, kein Retry.

Vergleich: technische/experimentelle Ablehnungen getrennt, unbekannte Prüfungen,
P1/P2/P3 einzeln, vollständige Präferenzfälle, unterschiedliche Karten/Ziele,
Signaturen/Typ- und Formkombinationen, nicht ausgewählte gültige Kandidaten.
Operationskosten und geeignete Karten je 1.000 tatsächliche Solverchecks und je
Mio. Matches/Filter, Diagnosezustände sowie Zeit/CPU/RSS separat. B wird nur
empfohlen, wenn unter derselben Diagnosekapazität mindestens eine zusätzliche
bevorzugte **Karte** erscheint; bei Gleichstand bleibt A. Kein Qualitätsbeweis,
kleine Stichprobe; überlappende Varianten separat, keine Addition beider Arme
als unabhängige Fälle. Fairnesskontrolle: A ist Suchpräfix von B; für die ersten
vier Neustarts werden gleiche Kandidaten erwartet, sofern Budget nicht abbricht.

## Vorab definierte Vergleichsgruppe und Phase-C-Grenze

Für den Pilot höchstens 1 Kontrollkarte und 3 bevorzugte Karten je Arm; kein
öffentlicher Bestand. Nach Diagnose kommen alle früh zulässigen, vollständig
geprüften Fälle mit mindestens einem falschen P1/P2/P3 in den Kontrollrahmen –
**vor** Top-Pool-/Serienauswahl. Sortierschlüssel SHA-256 aus festem Salt und
logischem Variantenfingerprint (unabhängig von Arm-/Programm-ID). Erste passende
Kontrolle reserviert ihre Karte; dann bevorzugte Fälle in derselben Hashordnung,
eine Karte insgesamt, max. zwei je Signatur. Keine zufällige Handwahl, keine
nachträgliche Umbenennung bevorzugter Fälle in Kontrollen. Unbekannte Diagnosen
sind keine negativen Fälle. Auswahlgründe und fehlgeschlagene Präferenzen privat.

Phase C bleibt separater Folgeschritt: nach Empfehlung neuer vorab fixierter
Produktionsvertrag auf stabilem main, grob 12–16 neue Kartenfälle (9–12 bevorzugt,
3–4 vorab gleichartig bestimmte Kontrollen), kein Auffüllen bei geringer Ausbeute.
Pilotfälle nicht stillschweigend als finaler Testpool ausgeben. Ein größerer Lauf
wird hier weder automatisch gestartet noch als autorisiert behandelt. Vor externem
Export Redaktion/Einzeltextprüfung nach #21 und öffentliche Allowlist-Prüfung.
Bestehendes versioniertes Logik-/Präsentationsmodell bleibt unverändert verwendbar.
