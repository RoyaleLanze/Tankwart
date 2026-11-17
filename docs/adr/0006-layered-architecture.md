# 0006 – Schichtenarchitektur

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Der Dozent verlangt eine klare Trennung von UI, Anwendungslogik und Datenzugriff (MVVM oder vergleichbar), keine Duplikation und erkennbare Best Practices.

## Entscheidung

Feature-Ordner unter `src/features/<bereich>/` mit den Schichten
- `logic/`: reine Funktionen (Model/Domäne), ohne React und ohne IO
- `api/`: Repository, der einzige Ort mit Supabase-Aufrufen
- `hooks/`: ViewModel, verbindet api und logic, liefert Daten, Lade- und Fehlerzustand
- Screens in `app/` (View) und präsentationale Komponenten in `src/components/`

Die Abhängigkeitsrichtung ist nur `app → hooks → api/logic`.

## Konsequenzen

Die Fachlogik (Verbrauch, Validierung, Statistik) ist ohne Backend per Jest testbar. Screens bleiben dünn. Für jedes Feature gibt es dieselbe Struktur, die man im Gespräch an einem Beispiel erklären kann.
