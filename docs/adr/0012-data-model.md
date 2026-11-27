# 0012 – Datenmodell

- **Status:** Accepted
- **Datum:** 2026-11-19
- **Entscheider:** @SealJonny

## Kontext

Issue #6 legt die Tabellen `profiles`, `vehicles` und `refuelings` an (M1, M2, M3, M14). Anforderungen und Mockups lassen dabei offen, wie Tankstelle, Datum, Beträge, Kilometerstand und aktives Fahrzeug gespeichert werden und welche Regeln die Datenbank selbst prüft.

## Optionen und Empfehlung je Frage

| Frage | Optionen | Empfehlung |
|---|---|---|
| Tankstelle an der Betankung (M5) | Spalten in `refuelings` · eigene Tabelle `stations` · nur Freitext | Spalten: `station_id` (Tankerkönig-UUID, optional), `station_name` (Pflicht), `station_address` (optional). Der Name bleibt erhalten, auch wenn die Station später verschwindet. Ohne Netz wird nur `station_name` als Freitext gespeichert. |
| Datum | `date` · `timestamptz` | `date`. Reicht für die Monate und für M4, ohne Zeitzonenprobleme. Am selben Tag ergibt sich die Reihenfolge aus dem km-Stand. |
| Liter, Preis, Gesamt (M3) | alle drei · alle drei mit Konsistenz-CHECK · zwei plus berechnete Spalte | Alle drei speichern. Die App rechnet den fehlenden Wert in `logic/` aus. Kein Konsistenz-CHECK, weil Belege oft um 1 Cent abweichen. |
| Zahlenformat | `numeric` · Ganzzahlen in kleinster Einheit | Ganzzahlen mit der Einheit im Spaltennamen: `volume_ml`, `price_per_liter_tenth_cents` (1,74⁹ € = 1749), `total_cents`, `odometer_km`, `tank_capacity_ml`, `manufacturer_consumption_ml_per_100km`. Exakt, ohne Float-Fehler. Umgerechnet wird nur zentral in `logic/` (#38). |
| Fachregeln in der DB (M4) | einfache CHECKs · zusätzlich Trigger · nur App | Einzeilige Regeln als CHECK (Literpreis 0,50–4,00 €, Liter > 0, km ≥ 0, Tankgröße > 0). Regeln über mehrere Zeilen (km zwischen den Nachbarbetankungen, Liter ≤ Tankgröße × 1,1, Datum nicht in der Zukunft, Warnung ab 2.000 km) prüft nur die App. |
| Kilometerstand am Fahrzeug (M1) | fester Anfangsstand · laufend aktualisiert | Fester Anfangsstand `initial_odometer_km`. Der aktuelle Stand ist der km-Stand der letzten Betankung und wird nicht doppelt gespeichert. |
| Kraftstoff | Postgres-Enum · `text` + CHECK | Enum `fuel_type` mit `e5`, `e10`, `diesel` (wie die Tankerkönig-Felder). Die generierten TS-Typen enthalten den Union-Typ. |
| Profil anlegen | Trigger bei Registrierung · Insert aus der App | Trigger auf `auth.users` (Supabase-Standardmuster). Jeder Nutzer hat garantiert ein Profil. |
| Aktives Fahrzeug gelöscht (M2) | `SET NULL`, App wählt neu · Trigger wählt neu · Nutzer wählt | `ON DELETE SET NULL`. Die App macht das zuletzt angelegte verbleibende Fahrzeug aktiv oder führt ins Onboarding. |
| Eigentum der Betankungen (M14) | über das Fahrzeug (`EXISTS`) · eigene `user_id` mit zusammengesetztem Fremdschlüssel | Über das Fahrzeug. Keine doppelte Spalte, die Policy prüft, ob das Fahrzeug dem Nutzer gehört. |
| Belegfoto (M3) | Spalte jetzt · mit #13 | Spalte, Bucket und Storage-Policy kommen zusammen in #13. |
| Monatssummen, Verbrauch, Statistik (M6–M8, M12, M13) | in der App (`logic/`) · SQL-Views | In der App als reine Funktionen mit Jest-Tests. Die Datenmengen sind klein (wenige hundert Betankungen pro Fahrzeug), die Domänenlogik bleibt an einem Ort. |

## Entscheidung

Alle Empfehlungen aus der Tabelle, gewählt von @SealJonny am 19.11.2026.

## Konsequenzen

- RLS: `profiles` und `vehicles` über `user_id = auth.uid()` (bei `profiles` ist das die `id`). `refuelings` hat keine eigene `user_id`, die Policy prüft, ob das Fahrzeug dem Nutzer gehört. Dieselbe Prüfung gilt für das aktive Fahrzeug im Profil. Wird ein Fahrzeug gelöscht, werden seine Betankungen mitgelöscht (M1).
- Die App muss die Ganzzahlen beim Anzeigen und Eingeben umrechnen. Das passiert an genau einer Stelle (#38).
- Im Übergabegespräch erklären können: warum Ganzzahlen statt Float, warum die km-Regeln in der App und nicht per Trigger liegen, wie die RLS-Policy für `refuelings` über das Fahrzeug funktioniert.

## Ergänzung 25.11.2026: Eindeutiger km-Stand pro Tag (#61)

**Kontext:** Am selben Tag ergibt sich die Reihenfolge der Betankungen aus dem km-Stand. Haben zwei Betankungen eines Fahrzeugs denselben Tag und denselben km-Stand, ist die Reihenfolge nicht eindeutig. Die Verbrauchsberechnung (#21) ordnet dann die Liter einer Teilbetankung womöglich dem falschen Intervall zu. Bisher lehnt nur die App so einen Eintrag ab (`odometerDuplicateSameDay`).

**Optionen:** Unique-Constraint `(vehicle_id, refueled_on, odometer_km)` · nur App-Validierung.

**Entscheidung:** Unique-Constraint, gewählt von @SealJonny am 25.11.2026. Er ersetzt den Index `(vehicle_id, refueled_on)`, weil der Unique-Index mit denselben Spalten beginnt.

**Konsequenzen:** Auch Seeds und andere Clients können keine mehrdeutige Reihenfolge mehr anlegen. Der Fehler `23505` (Constraint `refuelings_vehicle_day_odometer_key`) wird im API-Modul der Betankungen (#12) auf den vorhandenen Code `odometerDuplicateSameDay` abgebildet, damit der Nutzer denselben Text sieht wie bei der App-Prüfung. Die Migration scheitert bewusst, falls eine Datenbank schon solche Duplikate enthält. Vor `db push` in die Cloud deshalb prüfen: `select vehicle_id, refueled_on, odometer_km from refuelings group by 1, 2, 3 having count(*) > 1;` muss leer sein.

## Ergänzung 25.11.2026: Fahrzeug bearbeiten bei vorhandenen Betankungen (#9)

**Kontext:** Beim Bearbeiten eines Fahrzeugs lassen sich Anfangs-km-Stand und Tankvolumen ändern. Steigt der Anfangsstand über den km-Stand der ersten Betankung oder sinkt das Tankvolumen unter die größte getankte Menge ÷ 1,1, verstoßen vorhandene Betankungen gegen M4. Gespeichert bleiben sie, aber wer sie später bearbeitet, bekommt `odometerBelowInitial` bzw. `volumeAboveTank`. Gefunden vom `qa-tester` im Review von #69.

**Optionen:**

1. Hinnehmen, festhalten und die Prüfung später ergänzen, sobald es die Betankungs-API aus #12 gibt.
2. Das Fahrzeugformular prüft gleich gegen den kleinsten km-Stand und die größte Literzahl der Betankungen. Dafür liest die Fahrzeug-API die Tabelle `refuelings`, was sich mit #12 überschneidet.
3. Anfangsstand und Tankvolumen sperren, sobald es Betankungen gibt.

**Entscheidung:** Option 1, gewählt von @RoyaleLanze am 25.11.2026. #9 bleibt klein, und die Fahrzeug-API greift nicht in den Bereich von #12. Die Prüfung kommt mit #78.

**Konsequenzen:** Bis #78 kann ein bearbeitetes Fahrzeug alte Betankungen „ungültig“ machen. Die Daten gehen dabei nicht verloren, und auch die Verbrauchsberechnung ist nicht betroffen, weil sie nur die Betankungen nutzt. Der Fehler zeigt sich erst beim Bearbeiten einer solchen Betankung, und der Nutzer kann ihn beheben, indem er das Fahrzeug korrigiert.
