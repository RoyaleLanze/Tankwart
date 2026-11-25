# 0015 – Preis-Cache in Postgres

- **Status:** Accepted
- **Datum:** 2026-11-25
- **Entscheider:** @SealJonny

## Kontext

ADR 0005 legt fest, dass die Edge Function `prices` die Antworten von Tankerkönig „kurz in Postgres cacht“. Offen ist, wie dieser Cache aussieht. Tankerkönig bittet darum, dieselben Daten nicht öfter als alle 5 Minuten abzufragen, und Abfragen sind nur auf Nutzeraktion erlaubt (M9). Die App braucht zu jedem Ergebnis die Abrufzeit (M9, M15).

## Optionen

1. **Tabelle `price_cache` (Empfehlung):** eine Zeile je Anfrage (`cache_key text` als Primärschlüssel, `payload jsonb`, `fetched_at timestamptz`). Überlebt Kaltstarts der Function und gilt für alle Nutzer gemeinsam. Dafür kommt eine Tabelle dazu, die vor App-Nutzern geschützt werden muss.
2. **Nur im Speicher der Function:** kein Schema, aber bei jedem Kaltstart und für jede Instanz leer. Widerspricht ADR 0005.
3. **Kein Cache:** am einfachsten, aber jede Suche geht direkt an Tankerkönig, und wiederholte Abfragen innerhalb von 5 Minuten sind nicht ausgeschlossen.

## Entscheidung

Wir nehmen Option 1, weil sie ADR 0005 umsetzt, Tankerkönig entlastet und mit einer kleinen Tabelle auskommt.

## Konsequenzen

- RLS ist aktiviert, aber ohne Policy, und `anon` sowie `authenticated` sind alle Rechte entzogen (`revoke all`). Nur die Function greift mit der Service Role zu. So kann kein Nutzer den Cache lesen oder mit falschen Preisen füllen. Ein pgTAP-Test weist das nach.
- Zeilen werden je Schlüssel überschrieben (Upsert). Bei jedem Schreiben löscht die Function außerdem alle Einträge, die älter als die TTL sind, damit die Tabelle nicht wächst.
- Umkreissuchen sind nur innerhalb Deutschlands erlaubt (`GERMANY_BOUNDS`, Breite 47,2–55,1, Länge 5,8–15,1), weil Tankerkönig nur Deutschland abdeckt. Andere Positionen lehnt die Function mit `outsideGermany` ab. Das begrenzt auch die Zahl möglicher Cache-Schlüssel.
- TTL 5 Minuten (`CACHE_TTL_MS`). Koordinaten werden auf 3 Nachkommastellen gerundet (etwa 100 m), damit nahe Anfragen sich einen Eintrag teilen. Der Aufruf an Tankerkönig bricht nach 8 s ab.
- Tankerkönig misst die Entfernungen vom gerundeten Punkt aus, sie können also um bis zu etwa 70 m abweichen. Das nehmen wir für den Cache in Kauf. Braucht die 2-km-Regel (M5) es genauer, kann die App die Entfernung aus der echten Position neu berechnen.
- Im Übergabegespräch erklären können: warum RLS ohne Policy die Tabelle sperrt (nur die Service Role umgeht RLS) und warum gerundet wird (mehr Cache-Treffer, weniger Abfragen).
