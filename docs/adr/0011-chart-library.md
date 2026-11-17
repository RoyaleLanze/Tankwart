# 0011 – Diagramm für die Statistik

- **Status:** Accepted
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

Option 1: **react-native-gifted-charts** (Abhängigkeiten: `react-native-svg`, `expo-linear-gradient`). Begründung: Weitere Diagramme sind als NICE-TO-HAVE denkbar, eine Bibliothek verhindert dann eigenen Diagramm-Code an mehreren Stellen. Die Bibliothek ist aktiv gepflegt und kommt ohne Skia aus. Die Empfehlung „eigene Balken“ wurde bewusst verworfen.

## Konsequenzen

- Mit `npx expo install` installieren, damit die Versionen zu SDK 58 passen. Beim Einbau (M12) auf dem Emulator prüfen, ob alles mit der New Architecture läuft.
- Barrierefreiheit gezielt prüfen: Die Werte des ausgewählten Monats stehen zusätzlich als Text unter dem Diagramm (wie im Mockup), damit Screenreader sie lesen können.
- victory-native verworfen: Skia und Reanimated sind für ein Balkendiagramm zu schwer.
