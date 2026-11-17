# 0003 – Supabase als Backend

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Daten müssen in der Cloud liegen und serverseitig geschützt sein. Das Backend muss reproduzierbar einzurichten sein. Ein BaaS ist erwünscht.

## Optionen

1. **Supabase:** Postgres (relationale Daten passen zu Fahrzeug → Betankungen), RLS, Storage, Edge Functions, Migrationen und Seeds per CLI, EU-Region
2. **Firebase:** Dokumentenmodell, Security Rules, Auswertungen über Monate sind umständlicher
3. **Convex:** wenig Erfahrung im Team

## Entscheidung

Supabase in der Region EU: Auth (E-Mail/Passwort), Postgres mit RLS, Storage für Belegfotos, Edge Functions. Schema, Policies und Seeds liegen als Migrationen in `supabase/`.

## Konsequenzen

Für lokale Entwicklung und pgTAP-Tests brauchen wir Supabase CLI und Docker. Jede Schemaänderung ist eine Migration, keine Klicks im Dashboard.
