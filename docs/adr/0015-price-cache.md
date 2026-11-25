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

## Ergänzung 25.11.2026: Rate-Limit pro Nutzer (#75)

### Kontext

Alle Nutzer teilen sich einen Tankerkönig-Key. Jede neue Koordinate oder Station ist ein Cache-Fehltreffer und löst einen echten Abruf aus. Ein einzelner Nutzer (oder ein Skript mit seinem Token) könnte so viele Abrufe erzeugen, dass Tankerkönig den Key sperrt und die Preise für alle ausfallen (Security-Befund aus PR #70).

### Optionen

1. **Festes Minutenfenster (Empfehlung):** eine Zeile je Nutzer und Minute in `price_rate_limit`, hochgezählt von einer SQL-Funktion. Einfach zu verstehen und zu testen. An einer Minutengrenze sind kurz bis zu doppelt so viele Abrufe möglich.
2. **Gleitendes Fenster:** genauer, braucht aber einen Zeitstempel je Abruf oder eine Gewichtung zweier Fenster. Mehr Code und Zeilen für wenig Nutzen.
3. **Kein Limit:** kein Aufwand, aber der gemeinsame Key bleibt ungeschützt.

### Entscheidung

Wir nehmen Option 1 mit **10 echten Abrufen pro Nutzer und Minute** (`RATE_LIMIT_PER_MINUTE`), gewählt von @SealJonny. Wer darüber liegt, bekommt HTTP 429 mit dem Fehlercode `rateLimited` (ADR 0014) und dem Header `Retry-After` (Sekunden bis zum nächsten Fenster). Liegt für die Anfrage ein abgelaufener Cache-Eintrag vor, liefert die Function stattdessen diesen mit seinem `fetchedAt`, weil alte Preise besser sind als keine.

### Konsequenzen

- Tabelle `price_rate_limit (user_id, window_start, count)` mit Fremdschlüssel auf `auth.users` (`on delete cascade`). Geschützt wie `price_cache`: RLS ohne Policy, `revoke all` für `anon` und `authenticated`. Die Funktion `hit_price_rate_limit` zählt atomar (`insert … on conflict do update`) und darf nur von der Service Role ausgeführt werden. Beim Zählen löscht sie die älteren Fenster des aufrufenden Nutzers, damit die Tabelle klein bleibt. Fremde Zeilen fasst sie nicht an. pgTAP-Tests weisen das nach.
- Gezählt wird nur direkt vor einem echten Abruf bei Tankerkönig. Cache-Treffer und der Mock-Modus zählen nicht, normales Suchen und Wechseln der Sorte stößt also kaum an das Limit.
- Fail-open: Fällt der Zähler aus (Datenbankfehler), loggt die Function den Fehler und ruft Tankerkönig trotzdem ab, wie beim Cache. In dieser Zeit ist der Key nicht geschützt. Wir nehmen das in Kauf, weil ein Ausfall des Zählers sonst alle Preise sperren würde.
- Im Übergabegespräch erklären können: warum nur Cache-Fehltreffer zählen, warum das Hochzählen in einer SQL-Anweisung atomar ist (parallele Aufrufe verlieren keine Zählung) und warum fail-open.
