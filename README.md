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

Der Seed legt zwei Testnutzer mit Betankungen über rund 12 Monate an (beim Corsa rund 10). Die Zugangsdaten gelten **nur lokal**, der Seed wird nie in die Cloud gespielt (`db push --remote` überträgt nur Migrationen). Deshalb gegen die Cloud **nie** `db reset --remote` oder `db push --remote --include-seed` ausführen, sonst gäbe es dort zwei Konten mit öffentlich bekanntem Passwort.

| E-Mail | Passwort | Fahrzeuge |
|---|---|---|
| `nutzer-a@tankwart.local` | `tankwart-lokal` | Golf (E10, aktiv), Corsa (E5) |
| `nutzer-b@tankwart.local` | `tankwart-lokal` | Passat (Diesel) |

Die Daten sind relativ zum Tag des Resets erzeugt, die letzte Betankung liegt höchstens zwei Tage davor. Ein erneutes `db reset` holt sie also auf den aktuellen Monat.

### Supabase Cloud

Einmalig, im **eigenen Terminal** (interaktiv, nicht über Claude Code):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # Dashboard → Project Settings → General → Project ID
```

Die Datenbank-Befehle der CLI (`db push`, `db reset`, `migration list`) zielen ohne weitere Angabe auf die **lokale** Instanz. Für das verknüpfte Cloud-Projekt braucht es `--remote`. `functions deploy` und `secrets` zielen immer auf die Cloud.

```bash
npx supabase db push --remote --dry-run   # zeigt, welche Migrationen in der Cloud fehlen
npx supabase db push --remote             # spielt sie ein (nur Migrationen, kein Seed)
npx supabase functions deploy prices      # deployt die Edge Function
```

Den Tankerkönig-Key im Dashboard unter Edge Functions → Secrets als `TANKERKOENIG_API_KEY` eintragen. So landet er nicht in der Shell-History. `PRICES_MOCK` bleibt in der Cloud ungesetzt, dann liefert die Function echte Preise.

Für die App gegen die Cloud stehen in `.env` die Projekt-URL und der Publishable Key aus dem Dashboard (Project Settings → API Keys).

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

### Edge Function `prices`

Deno muss nicht installiert sein, es läuft über `npx deno@2`. Die Befehle im Funktionsordner ausführen, damit Deno dessen `deno.json` nutzt:

```bash
cd supabase/functions/prices && npx deno@2 test
```

Lokal im Mock-Modus (feste Beispielpreise, kein Tankerkönig-Key nötig): `cp supabase/functions/.env.example supabase/functions/.env` und darin `PRICES_MOCK=true` lassen, danach `npx supabase start` bzw. `npx supabase functions serve`. Für echte Preise `PRICES_MOCK=false` und `TANKERKOENIG_API_KEY` setzen, in der Cloud nur als Secret (siehe [Supabase Cloud](#supabase-cloud)).

Auch im Mock-Modus lehnt die Function Positionen außerhalb Deutschlands ab (`outsideGermany`). Der Emulator braucht deshalb einen Standort in Deutschland, z. B. Karlsruhe (Reihenfolge Länge, Breite): `adb -s <serial> emu geo fix 8.4037 49.0069`.

## KI-Reflexion

_Folgt zur Abgabe: eingesetzte Tools, typische Einsatzbereiche und pro Person mindestens ein Beispiel mit Commit, bei dem KI-Code korrigiert oder verworfen wurde._

Preisdaten: [Tankerkönig.de](https://www.tankerkoenig.de) / MTS-K, Lizenz CC BY 4.0.
