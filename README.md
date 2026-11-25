# Tankwart

Android-App zum Erfassen von Betankungen, mit Verbrauch und Kosten pro Monat und der günstigsten Tankstelle in der Nähe. DHBW-Studienprojekt von @SealJonny und @RoyaleLanze.

**Stack:** React Native + Expo (TypeScript), react-native-paper, Supabase (Auth, Postgres + RLS, Storage, Edge Functions), Tankerkönig-API.

- Anforderungen: [`docs/requirements.md`](docs/requirements.md)
- Architekturentscheidungen: [`docs/adr/`](docs/adr/)
- Design und Mockups: [`docs/design/`](docs/design/)

## Setup

### Voraussetzungen

- Node.js 24, Docker (für die lokale Supabase-Instanz)
- Android Studio mit Emulator bzw. ein Android-Gerät mit USB-Debugging

### App

```bash
npm install
cp .env.example .env      # Werte eintragen, siehe unten
npm run android           # lokaler Build und Start auf dem Emulator
```

Danach reicht für die tägliche Arbeit `npm start`.

### Supabase lokal

Die Supabase CLI ist als devDependency installiert und wird über `npx supabase` aufgerufen.

```bash
npx supabase start        # startet Postgres, Auth, Storage usw. in Docker, wendet Migrationen und Seeds an
npx supabase status       # zeigt URLs und Keys
npx supabase stop         # beendet die Instanz
```

In `.env` den `PUBLISHABLE_KEY` aus `npx supabase status` eintragen. Der Android-Emulator erreicht den Rechner unter `10.0.2.2` (bereits in `.env.example` gesetzt). Studio (Datenbank-UI) läuft unter http://127.0.0.1:54323.

Datenbank neu aufsetzen (löscht alle lokalen Daten, spielt Migrationen und `supabase/seed.sql` neu ein):

```bash
npx supabase db reset
```

Der Seed legt zwei Testnutzer mit je rund 12 Monaten Betankungen an. Die Zugangsdaten gelten **nur lokal**, der Seed wird nie in die Cloud gespielt (`db push` überträgt nur Migrationen). Deshalb gegen die Cloud **nie** `db reset --linked` oder `db push --include-seed` ausführen, sonst gäbe es dort zwei Konten mit öffentlich bekanntem Passwort.

| E-Mail | Passwort | Fahrzeuge |
|---|---|---|
| `nutzer-a@tankwart.local` | `tankwart-lokal` | Golf (E10, aktiv), Corsa (E5) |
| `nutzer-b@tankwart.local` | `tankwart-lokal` | Passat (Diesel) |

Die Daten enden immer am Tag des Resets, ein erneutes `db reset` holt sie also auf den aktuellen Monat.

### Supabase Cloud

Einmalig, im **eigenen Terminal** (interaktiv, nicht über Claude Code):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # Dashboard → Project Settings → General → Project ID
```

Migrationen in die Cloud spielen: `npx supabase db push`. Für die App gegen die Cloud stehen in `.env` die Projekt-URL und der Publishable Key aus dem Dashboard (Project Settings → API Keys).

## Tests

```bash
npm run lint
npm run typecheck
npm test
```

Datenbank-Tests (pgTAP, RLS mit zwei Testnutzern) gegen die laufende lokale Instanz:

```bash
npx supabase test db      # führt supabase/tests/*.sql aus, jede Datei in einer Transaktion mit Rollback
```

Die E2E-Tests (Maestro) folgen mit den jeweiligen Features.

## KI-Reflexion

_Folgt zur Abgabe: eingesetzte Tools, typische Einsatzbereiche und pro Person mindestens ein Beispiel mit Commit, bei dem KI-Code korrigiert oder verworfen wurde._

Preisdaten: [Tankerkönig.de](https://www.tankerkoenig.de) / MTS-K, Lizenz CC BY 4.0.
