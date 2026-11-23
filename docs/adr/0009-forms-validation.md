# 0009 – Formulare und Validierung

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Formulare für Betankung und Fahrzeug brauchen Fehler am Feld (M4). Die Regeln hängen vom Kontext ab (vorherige und nächste Betankung, Tankgröße). „2 von 3 Werten“ berechnet den dritten (M3). Eingaben dürfen nicht verloren gehen (M15).

## Optionen

1. **react-hook-form + zod:** Schema als einzige Quelle für Typen und Regeln, ohne UI per Jest testbar. Zwei neue Abhängigkeiten.
2. **Reine Validierungsfunktion + useState:** keine Abhängigkeit, `validateRefueling(input, context)` gibt Feldfehler zurück. Formular-State, Touched-State usw. bauen wir selbst.
3. **Formik:** weniger aktiv gepflegt, kein Vorteil gegenüber Option 1

## Empfehlung

Option 1, wobei die kontextabhängigen Regeln (km-Stand, Tankgröße) als reine Funktionen in `logic/` liegen und im Schema verwendet werden. So sind die M4-Regeln an einer Stelle und getestet.

## Entscheidung

Option 1: **react-hook-form + zod**. Die zod-Schemas liegen in `src/features/<bereich>/logic/` und sind dort per Jest getestet. Kontextabhängige Regeln (km-Stand, Tankgröße) sind reine Funktionen, die das Schema verwendet.

## Nachtrag

- 21.11.2026 (#7): Für die Verbindung von react-hook-form und zod kommt der offizielle Adapter `@hookform/resolvers` (`zodResolver`) dazu. Abgesprochen mit @RoyaleLanze, eingeführt mit #7.
