# Tankwart

Android-App zum Erfassen von Betankungen (Verbrauch und Kosten pro Monat) und zum Finden der günstigsten Tankstelle in der Nähe. DHBW-Studienprojekt für ein Zweierteam.

- **Stack:** React Native + Expo (Expo Router, TypeScript strict), react-native-paper (Material Design 3), Supabase (EU) mit Auth, Postgres + RLS, Storage und Edge Functions, Spritpreise über die Tankerkönig-API (nur über die Edge Function).
- **Anforderungen:** `docs/requirements.md` (M1–M15 sind verbindlich).
- **Entscheidungen:** `docs/adr/`
- **Design:** `docs/design/` (Tokens, Mockup-Link)
- **Abgabe:** 20.12.2026. Übergabegespräch davor.

## Wer entscheidet

Es gibt genau zwei Entscheider: **@SealJonny** und **@RoyaleLanze**. Claude und die Subagents schlagen vor, sie entscheiden nicht.

- Architektur, neue Abhängigkeiten, Datenmodell, Scope-Änderungen: als ADR mit Status `Proposed` anlegen (`docs/adr/`, Vorlage `0000-template.md`) und die Optionen mit Empfehlung darlegen. Erst nach Zustimmung umsetzen und den Status auf `Accepted` setzen.
- Unklar, ob etwas eine wichtige Entscheidung ist? Dann ist es eine. Nachfragen.

## Oberste Regel: Code bleibt überschaubar

Beide Teammitglieder müssen im Übergabegespräch die Architektur und ihren Code erklären können. Reines Vibe Coding ist laut Projektbeschreibung unzulässig. Deshalb:

- **Klein bleiben.** Zielgröße für die ganze App: wenige tausend Zeilen. Eine PR ≈ ein Issue, möglichst < 300 Zeilen Diff ohne Lockfiles und generierte Dateien.
- **Nur bauen, was ein Issue verlangt.** Keine Abstraktion auf Vorrat, keine Features „für später“, keine NICE-TO-HAVEs vor den MUST-HAVEs.
- **Bibliothek vor Eigenbau**, aber jede neue Abhängigkeit ist eine Entscheidung (ADR oder Absprache). Vorher auf https://reactnative.directory/ prüfen (gepflegt, Expo-kompatibel).
- **Erklären statt nur liefern.** Nach jeder Umsetzung kurz erklären: warum so, welche Alternative, was man im Gespräch wissen muss. Bei lehrreichen Stellen anbieten, dass ein Mensch sie selbst schreibt.
- Keine großen generierten Codeblöcke ohne Erklärung, kein auskommentierter Code, keine TODO-Friedhöfe.

## Architektur

Schichten mit klarer Abhängigkeitsrichtung: **UI → Hooks → API/Repository → Supabase**. Die Domänenlogik ist rein und hängt von nichts ab.

```
app/                    Expo Router: nur Screens und Layouts, keine Datenzugriffe
src/components/         wiederverwendbare, präsentationale UI-Komponenten
src/features/<bereich>/ vehicles | refuelings | stations | stats | auth
  logic/                reine TypeScript-Funktionen (Berechnung, Validierung), ohne React und ohne IO
  api/                  einziger Ort mit Supabase-/Edge-Function-Aufrufen für diesen Bereich
  hooks/                verbinden api + logic mit der UI (Laden, Fehler, Cache)
  types.ts
src/lib/                Supabase-Client, Theme, gemeinsame Helfer
supabase/               migrations/, functions/, tests/ (pgTAP), seed.sql
e2e/                    Maestro-Flows
```

Muster, die wir bewusst nutzen (im Gespräch erklärbar):
- **MVVM-artig:** Screen = View, Feature-Hook = ViewModel, `api/` = Repository, `logic/` = Model/Domäne.
- **Repository-Pattern:** Screens und Komponenten importieren nie `supabase` direkt.
- **Container/Presentational:** Screens holen die Daten über Hooks, Komponenten bekommen Props und sind ohne Backend testbar.
- **Single Source of Truth:** Server-Daten liegen im Daten-Cache (siehe ADR), nicht dupliziert in lokalem State.

## Code-Regeln und Code Smells

- TypeScript `strict`, kein `any`, keine `@ts-ignore`. Supabase-Typen werden aus dem Schema generiert.
- Code und Bezeichner auf Englisch, UI-Texte auf Deutsch.
- Komponenten < ~150 Zeilen, Funktionen < ~40 Zeilen. Wird es länger: aufteilen.
- **Keine Magic Numbers:** Fachgrenzen aus M4/M10 (0,50–4,00 €/L, Tankgröße × 1,1, 2.000 km, 80 %, 2 km) stehen als benannte Konstanten in `logic/`.
- Keine Duplikation (Formatierung von Preisen, Datum und Liter einmal zentral), keine Boolean-Flag-Parameter, kein Prop-Drilling über mehr als 2 Ebenen, keine God-Components.
- Jeder Screen hat Lade-, Leer- und Fehlerzustand (M15). Fehler werden dem Nutzer verständlich angezeigt, nie still verschluckt.
- Styling nur über das Theme (Tokens aus `docs/design/tokens.json`), keine fest verdrahteten Farben. Touch-Ziele ≥ 48 dp, Kontrast ≥ 4,5:1, Farbe nie als einziger Bedeutungsträger.
- Secrets nie im App-Code oder in Git. Der Tankerkönig-Key liegt nur als Supabase-Secret. Der Anon-Key ist öffentlich und darf in `.env`/`app.config`.

## Tests

- **Jest:** jede Funktion in `logic/` (Verbrauch nach Volltank-Methode, Validierung, Statistik, Ersparnis) mit Randfällen.
- **pgTAP:** RLS mit zwei Testnutzern. Nutzer A darf Daten von B weder lesen noch schreiben.
- **Deno-Tests:** Edge Function (Cache, Mock-Modus, Fehlerfälle).
- **Maestro:** die sieben E2E-Abläufe aus `docs/requirements.md`.
- Neue Logik kommt mit Tests in derselben PR.

## Workflow

1. Jede Arbeit hat ein GitHub-Issue auf dem Board. Branch: `feat/<issue>-kurz`, `fix/…`, `chore/…`, `docs/…`
2. **Commits:** klein und häufig, Nachricht einzeilig und kurz im Conventional-Commits-Stil (`feat: add fuel consumption calc`). **Kein** `Co-Authored-By`-Trailer.
3. **PR** mit `Closes #<nr>` und ausgefüllter Vorlage. Ein Mensch reviewt jede PR. Merge per Merge-Commit (kein Squash), damit die einzelnen Schritte in der Historie sichtbar bleiben.
4. Vor einer PR müssen `npm run lint`, `npm run typecheck` und `npm test` grün sein.
5. Lehrreiche KI-Korrekturen (Code verworfen oder korrigiert) in der PR unter „KI-Notiz“ festhalten. Daraus entsteht die KI-Reflexion in der README.

## Subagents (`.claude/agents/`)

| Agent | Einsatz |
|---|---|
| `backend` | Migrationen, RLS, Storage-Policies, Edge Function, Seeds, pgTAP |
| `mobile` | Screens, Hooks, `logic/`, Jest |
| `ux` | Review gegen Mockups, Material 3, Barrierefreiheit (nur lesend) |
| `qa-tester` | Testfälle, Jest-Randfälle, Maestro-Flows, Fehlerzustände |
| `security-reviewer` | RLS, Secrets, Berechtigungen, Datenfluss (nur lesend) |

## Expo-Plugin

Das offizielle Expo-Plugin ist in `.claude/settings.json` aktiviert (Skills `expo:*`, z. B. `expo-router`, `expo-data-fetching`, `expo-upgrade`). Nutzt es für aktuelle API-Details, Setup und SDK-Fragen. **Bei Widersprüchen gelten unsere ADRs.** Ein Beispiel: Das Plugin empfiehlt `@expo/ui` oder NativeTabs, wir nutzen react-native-paper (ADR 0004). Eine Abweichung davon wäre eine neue ADR.

## Lernmaterial des Dozenten

- https://docs.expo.dev/tutorial/introduction/
- https://react.dev/learn
- https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- https://reactnative.directory/
