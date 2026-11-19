## Was und warum

Closes #

## Merge-Kriterien

Siehe `CLAUDE.md` → Merge-Regeln. Nicht zutreffende Punkte mit „entfällt“ markieren.

- [ ] Issue ist dem Menschen der aktuellen Sitzung zugewiesen
- [ ] CI grün (lint, typecheck, Jest)
- [ ] `supabase/` geändert: `npx supabase test db` und Deno-Tests lokal grün (Ausgabe unten)
- [ ] UI geändert: auf dem Emulator geprüft (Screenshot unten)
- [ ] Neue Logik hat Tests (Jest / pgTAP / Deno / Maestro)
- [ ] Diff ≤ ~300 Zeilen ohne Lockfiles und generierte Dateien
- [ ] Ausnahme (ADR, Regeln, Agent-Setup)? → Freigabe durch den anderen Entscheider auf GitHub

### Review-Befunde

| Agent | Befund | behoben / abgelehnt weil … |
|---|---|---|
| `code-reviewer` | | |

## Für das Übergabegespräch

Warum so, welche Alternative, welches Muster, was man erklären können muss.

## Checkliste

- [ ] Lade-, Leer- und Fehlerzustände sind behandelt (falls UI)
- [ ] Keine Secrets, keine Magic Numbers, keine Duplikation
- [ ] Neue Abhängigkeit oder Architekturentscheidung? → ADR verlinkt

## KI-Notiz (optional)

Wo hat KI geholfen, was wurde korrigiert oder verworfen und warum? Wird für die KI-Reflexion in der README gesammelt.
