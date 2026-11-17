# 0010 – Lokale Speicherung (Session, Entwurf)

- **Status:** Proposed
- **Datum:** 2026-11-17
- **Entscheider:** @SealJonny, @RoyaleLanze

## Kontext

Die Supabase-Sitzung muss einen Neustart überstehen (M14). Ein angefangener Betankungsentwurf muss Hintergrund und Prozessende überstehen (M15). Zuletzt geladene Preise sollen bei fehlendem Netz angezeigt werden (M15).

## Optionen

1. **@react-native-async-storage/async-storage:** von Supabase für React Native dokumentiert, Expo-kompatibel, einfache Key-Value-API. Nicht verschlüsselt.
2. **react-native-mmkv:** schneller und synchron, braucht aber einen Development Build
3. **expo-secure-store:** verschlüsselt, aber Größenlimit pro Wert, eher für Tokens

## Empfehlung

Option 1 für Session, Entwurf und Preis-Cache: ein Mechanismus, kein Development Build nötig. Der Entwurf wird beim Tippen entprellt gespeichert und nach erfolgreichem Speichern gelöscht.

## Entscheidung

_offen_
