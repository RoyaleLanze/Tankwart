# 0004 – react-native-paper (Material Design 3)

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Navigation und Bedienelemente müssen den Android-Konventionen entsprechen, Barrierefreiheit ist Pflicht. Die Mockups folgen Material Design 3.

## Optionen

1. **react-native-paper:** fertige M3-Komponenten (Buttons, Chips, TextInput, Snackbar, FAB, Dialog), Theme per Tokens
2. **Eigene Komponenten / NativeWind:** mehr Kontrolle, aber deutlich mehr eigener Code und eigene Verantwortung für die Barrierefreiheit

## Entscheidung

react-native-paper mit eigenem M3-Theme aus `docs/design/tokens.json`.

## Konsequenzen

Weniger eigener UI-Code. Abweichungen von Paper-Komponenten nur, wenn das Mockup es zwingend verlangt.
