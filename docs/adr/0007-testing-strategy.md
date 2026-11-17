# 0007 – Teststrategie

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Pflicht sind Unit-Tests und UI-/E2E-Tests, reproduzierbar ausführbar. Der Zugriffsschutz muss nachgewiesen werden (M14).

## Entscheidung

| Ebene | Werkzeug | Umfang |
|---|---|---|
| Unit | Jest (jest-expo) | alle Funktionen in `logic/` mit Randfällen |
| Komponenten | React Native Testing Library | nur bei Komponenten mit eigener Logik |
| Datenbank | pgTAP | RLS mit zwei Testnutzern, Storage-Policy |
| Edge Function | Deno test | Cache, Mock-Modus, Fehler |
| E2E | Maestro | die 7 Abläufe aus `docs/requirements.md`, Edge Function im Mock-Modus |

Jest, Lint und Typecheck laufen in GitHub Actions bei jeder PR.

## Konsequenzen

Maestro und pgTAP laufen vorerst lokal (Emulator bzw. Docker). Wie sie ausgeführt werden, steht in der README.
