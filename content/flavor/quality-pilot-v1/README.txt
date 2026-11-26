F02-B PR 1: historischer erster Blindauftrag, keine Prüfergebnisse

Reader-Job: job-80e2e387-1553-4711-b0be-0cbe59c0cc14
Öffentlich transportierbar: ausschließlich local/jobs/job-80e2e387-1553-4711-b0be-0cbe59c0cc14/public/
Privat/lokal: binding.json, complete.json und der übrige Store. Das ganze Repository, dieses Verzeichnis oder das Konzeptionspaket NICHT an den Reader weitergeben.

Die öffentliche Payload enthält die vier tatsächlichen unveränderten importierten Spielerfassungen, insgesamt 23 Hinweise, vollständige Namen, Karten/Bilder, Regeln, den versionierten öffentlichen Welt-/Stilrahmen und ausdrücklich leeren Serienkontext. Keine Originalhinweise, Pilotfallzuordnung, Produzentenmetadaten, Findings oder erwarteten Ergebnisse.

Kein realer Reader-/Reviewer-Lauf wurde ausgeführt. Es gibt keine importierten Qualitätsantworten, Vergleiche, Qualifikationen oder Auswahl. F01 bleibt UNCERTAIN. Die dokumentierte rekonstruierte Produktionsantwort ist keine Kenntnis exakter Produzentenbytes/Modell/Zeit und keine semantische Freigabe.

Für einen aktuellen Blindlauf:
Die Korrektur der itemweisen Aktualitätsprüfung ändert den gebundenen Methodenstand. Diesen ursprünglichen Auftrag und alte ZIPs deshalb ausschließlich als Historie behalten. Einen neuen Auftrag mit dem aktuellen Code erzeugen:
node scripts/flavor-quality.mjs prepare-pilot --production-store PROD --quality-store QUALITY --out PUBLIC
PROD, QUALITY und PUBLIC müssen explizite getrennte lokale Zielordner sein. Der neue Produktionsstore übernimmt unverändert die echten versiegelten Pilotbytes. Nur PUBLIC gesammelt in einen frischen separaten Chat ohne Repository-/Projektquellen geben und prompt.txt befolgen lassen.
Echte Antwortbytes an die tatsächlich ausgegebene neue Job-ID binden. compare, review-export, separater frischer Gesamtprüfungschat, review-import und inspect folgen gemäß docs/F02-B-PR1.md. Alte Jobs/Antworten nicht umetikettieren oder als aktuelle Evidenz übernehmen.

Die ausführbare Methode ist in job.json gebunden. Bei Implementierungs-/Methodenänderungen bleibt dieser Auftrag historisch erhalten, ist aber nicht automatisch auf die neue Methode anwendbar. Ein neuer Methodenstand braucht einen neuen Export. Kein Merge, keine Reparatur, Auswahl oder Veröffentlichung durch diesen Store.
