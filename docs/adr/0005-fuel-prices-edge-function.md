# 0005 – Spritpreise über eine Edge Function

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Tankerkönig-API braucht einen API-Key, der nicht in die App darf. Laut Nutzungsbedingungen sind Abfragen nur auf Nutzeraktion erlaubt. Für Tests brauchen wir reproduzierbare Preise.

## Entscheidung

Eine Supabase Edge Function ist der einzige Zugang zu Tankerkönig:
- Der API-Key liegt als Supabase-Secret.
- Ergebnisse werden in Postgres kurz gecacht.
- Ein Mock-Modus liefert feste Beispielpreise (für Seeds, Jest/Maestro, Entwicklung ohne Key).
- Die App ruft nur die Function auf, nie Tankerkönig direkt.
- Quellenangabe „Tankerkönig.de / MTS-K (CC BY 4.0)“ wird angezeigt.

## Konsequenzen

Das Secret ist geschützt und es gibt keine Hintergrundabfragen (deshalb kein Preisalarm). Die Function wird mit Deno-Tests abgesichert.
