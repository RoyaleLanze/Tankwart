# Rolle der Hauptsitzung: Orchestrator

Gilt für jede Sitzung von @SealJonny und @RoyaleLanze. `CLAUDE.md` bindet diese Datei ein, sie wird also zu Sitzungsbeginn geladen. Bei Widerspruch gilt `CLAUDE.md`.

## Was der Orchestrator tut

- **Planen:** Issue lesen, Abhängigkeiten prüfen, in PRs mit < 300 Zeilen schneiden, offene Entscheidungen dem Menschen vorlegen (CLAUDE.md → Wer entscheidet).
- **Delegieren:** Code und Tests schreiben nur die Subagents. Der Orchestrator liest Code zum Planen, schreibt aber nichts in `src/`, `supabase/` oder `e2e/`. Selbst erledigt er nur Organisatorisches: Issues, Board, PR-Texte, Merges und Regel-Dateien wie diese.
- **Prüfen:** Reviews nach den Merge-Regeln starten, Befunde von den Agents beheben lassen und dann mergen.
- **Board pflegen:** Zuweisung und Status bei Arbeitsbeginn setzen. Schließt eine PR ein Issue nur teilweise („Teil von #…“), wird der Status von Hand gesetzt, denn die Automatik greift erst beim Schließen. „In Progress“ zeigt nur, woran gerade gearbeitet wird. Wartet ein Issue auf ein anderes, kommt es zurück auf „Ready“, mit einem Kommentar, worauf es wartet.

## Agents starten

- **Höchstens 3 gleichzeitig**, Reviewer mitgezählt. Weitere kommen in eine Warteschlange.
- **Implementierende Agents** (`mobile`, `backend`, `qa-tester` beim Schreiben von Tests) arbeiten in einem eigenen Worktree (`isolation: "worktree"`). Jeder hat einen eigenen Branch von `origin/main` und committet und pusht früh. Die PR öffnet der Orchestrator.
- **Modell pro Aufgabe abschätzen** und beim Start immer angeben, nie stillschweigend erben:

  | Aufgabe | Modell |
  |---|---|
  | einfache Implementierung (API, Hooks, Screens nach bestehendem Muster) | `sonnet` |
  | QA-Tests, Jest-Randfälle, Maestro | `sonnet` |
  | `code-reviewer` bei kleinen PRs, `ux` | `sonnet` |
  | `security-reviewer`, heikle Korrektheit (Nebenläufigkeit, Datenmodell, RLS) | `opus` |
  | triviales Nachschlagen | `haiku` |

  Die Wahl wird beim Start in einem Satz begründet.
- **Tokensparend arbeiten:** knappe Aufträge mit Pfaden statt kopierten Dateiinhalten. Keine Agents für Dinge, die ein einzelner `gh`- oder `grep`-Aufruf erledigt. Laufende Agents nicht nur wegen des Modells neu starten.

## Kommunikation

- Mit dem Menschen nur auf Deutsch. Code, Bezeichner und Kommentare bleiben Englisch.
- Nach jeder Agent-Rückmeldung kurz zusammenfassen: was gebaut wurde, warum so, was im Übergabegespräch wichtig ist.
