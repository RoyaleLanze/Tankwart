# 0010 – Lokale Speicherung (Session, Entwurf)

- **Status:** Accepted
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Supabase-Sitzung muss einen Neustart überstehen (M14). Ein angefangener Betankungsentwurf muss Hintergrund und Prozessende überstehen (M15). Zuletzt geladene Preise sollen bei fehlendem Netz angezeigt werden (M15).

## Optionen

1. **@react-native-async-storage/async-storage:** von Supabase für React Native dokumentiert, Expo-kompatibel, einfache Key-Value-API. Nicht verschlüsselt.
2. **react-native-mmkv:** schneller und synchron, braucht aber einen Development Build
3. **expo-secure-store:** verschlüsselt, aber Größenlimit pro Wert, eher für Tokens
4. **expo-sqlite/localStorage:** offizielles Expo-Paket, stellt ein synchrones, Web-kompatibles `localStorage` bereit (intern SQLite). Das ist der aktuell in der Expo-Doku (SDK 58) dokumentierte Speicher für die Supabase-Session und läuft in Expo Go.

## Empfehlung

Option 1 für Session, Entwurf und Preis-Cache: ein Mechanismus, kein Development Build nötig. Der Entwurf wird beim Tippen entprellt gespeichert und nach erfolgreichem Speichern gelöscht.

## Entscheidung

Option 4: **expo-sqlite/localStorage** für Supabase-Session, Betankungsentwurf und Preis-Cache. Zuerst war Option 1 (AsyncStorage) gewählt. Nach einem Blick in die aktuelle Expo-Doku (SDK 58) haben wir am selben Tag auf den dort dokumentierten Weg gewechselt: offizielles Expo-Paket statt Community-Abhängigkeit, einfachere synchrone API.

## Konsequenzen

- `import 'expo-sqlite/localStorage/install'` einmalig im Supabase-Client, danach ist `localStorage` global verfügbar.
- Werte sind Strings: Entwurf und Preis-Cache als JSON speichern, beim Lesen validieren.
- Nicht verschlüsselt. Für Session und Entwurf akzeptabel, auf dem Gerät liegen keine Secrets.
- Echte SQLite-Tabellen wären später für Offline (NICE) möglich, ohne neue Abhängigkeit.
