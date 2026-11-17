# 0002 – React Native mit Expo

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Freie Technologiewahl, Zielplattform mindestens Android. Der Dozent stellt Lernmaterial zu Expo, React und TypeScript bereit.

## Optionen

1. **React Native + Expo (TypeScript):** Lernmaterial vorhanden, schnelle Iteration, Expo-Module für Kamera und Standort, iOS als Option offen
2. **Android nativ (Kotlin/Compose):** sehr plattformnah, aber eine neue Sprache und kein Material vom Dozenten
3. **Flutter:** eine weitere neue Sprache (Dart)

## Entscheidung

React Native mit Expo, Expo Router (dateibasierte Navigation) und TypeScript im `strict`-Modus. Ziel ist Android, getestet auf Emulator und echtem Gerät.

## Konsequenzen

Wir nutzen Development Builds bzw. Expo Go und die Expo-Module (`expo-location`, `expo-camera`/`expo-image-picker`). Native Ordner (`android/`) werden generiert und nicht versioniert.
