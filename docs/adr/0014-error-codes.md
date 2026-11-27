# 0014 – Fehlercodes statt Texte in der Domänenlogik

- **Status:** Accepted
- **Datum:** 2026-11-25
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Validierung aus ADR 0009 liegt als zod-Schema in `src/features/<bereich>/logic/` und meldet Fehler am Feld (M4). Die Meldungen sollen Grenzwerte im deutschen Format nennen („zwischen 0,50 € und 4,00 €“, „mehr als 2.000 km“). Dafür müsste `logic/` die zentrale Formatierung aus `src/lib/format.ts` importieren. Die Domänenlogik soll aber rein sein und weder Sprache noch Darstellung kennen (CLAUDE.md, ADR 0006).

## Optionen

1. **Deutsche Texte im Schema, `logic/` importiert `lib/format`:** Text und Regel stehen an einer Stelle, keine zusätzliche Datei. Dafür hängt die Fachlogik von Sprache und Formatierung ab, und die Tests prüfen ganze deutsche Sätze.
2. **Fehlercodes in `logic/`, Texte im Feature:** Das Schema und die Regeln liefern Codes wie `priceOutOfRange`. Eine Zuordnung `messages.ts` im Feature macht daraus deutsche Texte und formatiert die Grenzwerte. `logic/` kennt weder Sprache noch Formatierung, die Tests prüfen Codes. Dafür gibt es eine Umleitung: Code und Text stehen an zwei Stellen.

## Entscheidung

Wir nehmen Option 2, weil die Domänenlogik so frei von Darstellung bleibt und die Schichtung (ADR 0006) eingehalten wird, bei geringem Mehraufwand.

- Codes sind ein String-Union-Typ in `logic/` (z. B. `RefuelingErrorCode`). zod-Meldungen und die Regelfunktionen geben diese Codes zurück.
- Pro Feature liegt `src/features/<bereich>/messages.ts` mit einer vollständigen Zuordnung `Record<Code, string>`. Der Compiler meldet einen Code ohne Text.
- Hooks und UI zeigen nie den Code, sondern immer den Text aus `messages.ts`.

## Konsequenzen

- `logic/` importiert nichts aus `lib/format` oder anderen Darstellungsmodulen.
- Logik-Tests prüfen Codes und brechen nicht, wenn ein Text umformuliert wird. Die Texte bekommen eigene kleine Tests.
- Im Übergabegespräch erklären können: warum Codes statt Texte (Trennung von Fachlogik und Darstellung) und wo man den angezeigten Text findet.

## Nachtrag 2026-11-27

[ADR 0016](0016-i18n.md) führt Übersetzungsschlüssel ein. Die Logik liefert weiterhin Codes. `messages.ts` bildet sie künftig auf i18n-Schlüssel statt auf feste Texte ab (`Record<Code, Schlüssel>`), die Texte stehen in `src/locales/`. Die Grenzwerte werden als Parameter übergeben und über `lib/format` formatiert.
