# 0011 – Diagramm für die Statistik

- **Status:** Proposed
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

M12 verlangt ein Balkendiagramm (12 Monate), umschaltbare Kennzahl, Hervorhebung von Höchst- und Tiefstwert und Auswahl per Tipp. Es muss barrierefrei sein (Farbe nicht allein bedeutungstragend).

## Optionen

1. **react-native-gifted-charts:** einfache Balken-API mit onPress, baut auf react-native-svg auf, Expo-kompatibel
2. **victory-native:** mächtig, braucht aber Skia und Reanimated, für einen Balkenchart überdimensioniert
3. **Eigene Balken aus `View`s:** etwa 80 Zeilen, voll erklärbar, Tipp und Accessibility-Labels selbst gemacht, keine Abhängigkeit

## Empfehlung

Option 3, falls nur ein einziges Diagramm geplant bleibt: Ein Balkendiagramm ist einfach genug, und eigener Code lässt sich im Gespräch besser erklären als eine Chart-Bibliothek. Option 1, falls NICE-TO-HAVEs weitere Diagramme bringen.

## Entscheidung

_offen_
