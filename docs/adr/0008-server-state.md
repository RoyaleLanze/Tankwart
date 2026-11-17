# 0008 – Server-State und Datenabruf

- **Status:** Proposed
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Fast alle Screens laden Daten aus Supabase und brauchen Lade-, Fehler- und Leerzustände (M15). Nach dem Speichern einer Betankung müssen Home, Verlauf und Statistik aktuell sein.

## Optionen

1. **TanStack Query:** Cache, `isLoading`/`error`, Retry und Invalidierung nach Mutationen sind fertig, ein verbreitetes Pattern. Neue Abhängigkeit mit eigenem Konzept, das man verstehen muss.
2. **Eigene Hooks mit useState/useEffect:** keine Abhängigkeit, aber Cache, Invalidierung und Race Conditions müssten wir selbst bauen. Mehr Code, typische Fehlerquelle.
3. **Globaler Store (Zustand/Redux) für Server-Daten:** dupliziert den Server-State, für unseren Umfang zu viel

## Empfehlung

Option 1. Wenig eigener Code, Lade- und Fehlerzustände sind einheitlich. Für reinen Client-State (aktives Fahrzeug, Filter) genügen React Context bzw. lokaler State.

## Entscheidung

_offen_
