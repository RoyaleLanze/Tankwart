# Tankwart

Android-App zum Erfassen von Betankungen (Verbrauch und Kosten pro Monat) und zum Finden der günstigsten Tankstelle in der Nähe. DHBW-Studienprojekt für ein Zweierteam.

- **Stack:** React Native + Expo SDK 58 (Expo Router, TypeScript strict), react-native-paper (Material Design 3), Supabase (EU) mit Auth, Postgres + RLS, Storage und Edge Functions, Spritpreise über die Tankerkönig-API (nur über die Edge Function).
- **Anforderungen:** `docs/requirements.md` (M1–M15 sind verbindlich).
- **Entscheidungen:** `docs/adr/`
- **Design:** `docs/design/` (Mockup-Link, `design-system.md` mit Komponentenregeln, `tokens.json`)
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
src/app/                Expo Router: nur Routen (Screens, Layouts), keine Datenzugriffe
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
- Code, Bezeichner, Kommentare und Entwickler-Fehlermeldungen auf Englisch. UI-Texte auf Deutsch.
- Komponenten < ~150 Zeilen, Funktionen < ~40 Zeilen. Wird es länger: aufteilen.
- **Keine Magic Numbers:** Fachgrenzen aus M4/M10 (0,50–4,00 €/L, Tankgröße × 1,1, 2.000 km, 80 %, 2 km) stehen als benannte Konstanten in `logic/`.
- Keine Duplikation (Formatierung von Preisen, Datum und Liter einmal zentral), keine Boolean-Flag-Parameter, kein Prop-Drilling über mehr als 2 Ebenen, keine God-Components.
- Jeder Screen hat Lade-, Leer- und Fehlerzustand (M15). Fehler werden dem Nutzer verständlich angezeigt, nie still verschluckt.
- Styling nur über das Theme (Tokens aus `docs/design/tokens.json`), keine fest verdrahteten Farben. Touch-Ziele ≥ 48 dp, Kontrast ≥ 4,5:1, Farbe nie als einziger Bedeutungsträger.
- Secrets nie im App-Code oder in Git. Der Tankerkönig-Key liegt nur als Supabase-Secret. Der Anon-Key ist öffentlich und darf in `.env`/`app.config`.

## Emulator: entwickeln und testen

Änderungen an der App werden auf dem Emulator geprüft, nicht nur per Lint und Jest. Das gilt für Menschen und Agents.

- AVDs: `tankwart` (Entwicklung) und `tankwart-e2e` (sauberes Gerät für Maestro bzw. zweiten Testnutzer), beide Pixel 8, Android 36
- Starten: `android emulator start tankwart` (kehrt erst zurück, wenn das Gerät gebootet ist). Liste: `android emulator list`, stoppen: `android emulator stop tankwart`
- App bauen und installieren: `npm run android` (lokaler Gradle-Build, **kein EAS**). Danach reicht `npm start` und in der App neu laden.
- Prüfen: zuerst `android layout -p` (UI-Baum als JSON mit `text`, `content-desc`, `center`, `interactions`), dann `android screen capture -o /tmp/screen.png` und den Screenshot ansehen. Findet `layout` ein Element nicht: `android screen capture --annotate -o …` und `android screen resolve`. Eingaben mit `adb shell input tap|text|swipe|keyevent` auf die `center`-Koordinaten. Laufen beide AVDs, immer `--device=<serial>` angeben (`adb devices`).
- Barrierefreiheit prüfen: `android layout` zeigt fehlende `content-desc` an Icon-Buttons und die `bounds` (Touch-Ziel ≥ 48 dp).
- Supabase lokal ist vom Emulator unter `10.0.2.2:54321` erreichbar.
- Fehlerzustände gezielt auf dem Emulator auslösen: Netz aus (`adb shell svc wifi disable && adb shell svc data disable`), Standort setzen (`adb emu geo fix <lon> <lat>`), Berechtigungen zurücksetzen (`adb shell pm reset-permissions de.dhbw.tankwart`).
- Eine UI-Aufgabe ist erst fertig, wenn sie auf dem Emulator lief und ein Screenshot geprüft wurde.

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

Das offizielle Expo-Plugin (`expo@claude-plugins-official`) wird über `.claude/settings.json` (`enabledPlugins`) für beide aktiviert (Skills `expo:*`, z. B. `expo-router`, `expo-data-fetching`, `expo-upgrade`). Nutzt es für aktuelle API-Details, Setup und SDK-Fragen. **Bei Widersprüchen gelten unsere ADRs.** Ein Beispiel: Das Plugin empfiehlt `@expo/ui` oder NativeTabs, wir nutzen react-native-paper (ADR 0004). Eine Abweichung davon wäre eine neue ADR.

Expo ändert sich mit jedem SDK. Doku immer versioniert lesen (`https://docs.expo.dev/versions/v58.0.0/`) statt aus dem Gedächtnis, Pakete immer mit `npx expo install`.

**Keine EAS-Dienste und nichts Kostenpflichtiges.** Kein EAS Build, Submit, Update, Workflows, Hosting, Observe, Cloud-Simulator oder Sandbox, auch nicht die entsprechenden `eas-*`-Skills und Plugin-Tools. Erlaubt sind nur die kostenlosen Teile: Dokumentation (`read_documentation`, `search_documentation`), die `expo-*`-Wissens-Skills und die lokale Expo CLI (`npx expo start`, `npx expo run:android`, `npx expo install`). Gebaut und getestet wird lokal auf Emulator bzw. Gerät.

## Android-CLI-Plugin

Das offizielle Plugin `android-cli@android-cli-plugin` (Google) ist wie das Expo-Plugin in `.claude/settings.json` eingetragen (Marketplace unter `extraKnownMarketplaces`, aktiviert unter `enabledPlugins`). Es bringt den Skill `android-cli` mit, der Claude und den Subagents `mobile`, `ux` und `qa-tester` die Befehle aus dem Abschnitt Emulator beibringt.

**Einrichten (einmal pro Rechner):**
1. Das `android`-Binary installieren. Das Plugin enthält nur den Skill, nicht das Tool. Linux x86-64: `curl -fsSL https://dl.google.com/android/cli/latest/linux_x86_64/install.sh | bash`, andere Plattformen siehe https://developer.android.com/tools/agents/android-cli
2. Prüfen: `android info` muss das SDK unter `~/Android/Sdk` finden, `android emulator list` muss `tankwart` und `tankwart-e2e` zeigen.
3. Claude Code im Repo starten und die Abfrage zur Installation des Marketplaces bzw. Plugins bestätigen. Falls keine kommt: `/plugin marketplace add android/android-cli-plugin` und `/plugin install android-cli@android-cli-plugin`.

**Nutzen:** `emulator`, `layout`, `screen`, `docs` (offizielle Android-Doku zu Berechtigungen, Standort, Kamera usw.) und `info`.
**Nicht nutzen:** `create`, `build`, `run`, `install` und `preview` (die zielen auf native Gradle- bzw. Compose-Projekte; bei uns baut `npm run android`). Ebenso `signals`, `auth`, `device remote` und `profiler` (Google-Konto bzw. Cloud, siehe keine kostenpflichtigen Dienste). `emulator create|remove`, `sdk install|update|remove` und `skills add` ändern die gemeinsame Umgebung und werden vorher abgesprochen. Journey-Tests des Plugins ersetzen nicht die Maestro-Flows (ADR 0007).

## Lernmaterial des Dozenten

- https://docs.expo.dev/tutorial/introduction/
- https://react.dev/learn
- https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- https://reactnative.directory/
