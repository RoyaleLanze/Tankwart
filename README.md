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

Die Datenbank-Tests (`npx supabase test db`) und die E2E-Tests (Maestro) folgen mit den jeweiligen Features.

### Edge Function `prices`

Deno muss nicht installiert sein, es läuft über `npx deno@2`. Die Befehle im Funktionsordner ausführen, damit Deno dessen `deno.json` nutzt:

```bash
cd supabase/functions/prices && npx deno@2 test
```

Lokal im Mock-Modus (feste Beispielpreise, kein Tankerkönig-Key nötig): `cp supabase/functions/.env.example supabase/functions/.env` und darin `PRICES_MOCK=true` lassen, danach `npx supabase start` bzw. `npx supabase functions serve`. Für echte Preise `PRICES_MOCK=false` und `TANKERKOENIG_API_KEY` setzen, in der Cloud nur als Secret: `npx supabase secrets set TANKERKOENIG_API_KEY=…`.

Auch im Mock-Modus lehnt die Function Positionen außerhalb Deutschlands ab (`outsideGermany`). Der Emulator braucht deshalb einen Standort in Deutschland, z. B. Karlsruhe (Reihenfolge Länge, Breite): `adb -s <serial> emu geo fix 8.4037 49.0069`.

## KI-Reflexion

_Folgt zur Abgabe: eingesetzte Tools, typische Einsatzbereiche und pro Person mindestens ein Beispiel mit Commit, bei dem KI-Code korrigiert oder verworfen wurde._

Preisdaten: [Tankerkönig.de](https://www.tankerkoenig.de) / MTS-K, Lizenz CC BY 4.0.
