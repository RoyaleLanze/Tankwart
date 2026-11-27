# 0017 – Betankungs-IDs im Client erzeugen (expo-crypto)

- **Status:** Accepted
- **Datum:** 2026-11-27
- **Entscheider:** @SealJonny

## Kontext

Die Offline-Erfassung (#107) wird vorgezogen. Eine Betankung, die offline erfasst wurde, schickt die App später als pausierte TanStack-Mutation ab. Geht dabei die Antwort verloren und wird die Anfrage wiederholt, darf keine zweite Zeile entstehen. Das geht am einfachsten, wenn die App die ID der Betankung selbst erzeugt und mitschickt: Ein zweiter Insert mit derselben ID scheitert am Primärschlüssel, statt einen Doppeleintrag anzulegen.

Hermes, die JavaScript-Engine von React Native, hat in Expo SDK 58 weder `crypto.randomUUID` noch `crypto.getRandomValues`. Ohne Paket gibt es also keine sichere UUID.

## Optionen

1. **`expo-crypto` mit `Crypto.randomUUID()`:** offizielles Expo-Paket, mit `npx expo install` passend zum SDK, kryptografischer Zufall aus dem Betriebssystem. Nachteil: neue native Abhängigkeit, die App muss einmal neu gebaut werden.
2. **Eigene UUID-v4-Funktion mit `Math.random`:** kein Paket, etwa 8 Zeilen. Nachteil: kein kryptografischer Zufall, eigener Code für ein gelöstes Problem, im Gespräch schwerer zu begründen.
3. **ID weiter von der Datenbank vergeben lassen:** kein neuer Code. Nachteil: Wiederholte Anfragen bei #107 können Doppeleinträge erzeugen und müssten anders abgefangen werden.

## Entscheidung

Wir nehmen Option 1, `expo-crypto`, weil es die ID-Erzeugung mit echtem Zufall löst, offiziell von Expo gepflegt wird und unserer Regel „Bibliothek vor Eigenbau“ folgt.

## Konsequenzen

- `createRefueling` bekommt die ID vom Aufrufer. Sie wird einmal pro Erfassung erzeugt und bei einem Wiederholungsversuch beibehalten.
- Nach dem Merge muss jeder einmal `npm run android` neu bauen.
- #107 muss einen `23505` auf `refuelings_pkey` als „bereits gespeichert“ behandeln, nicht als Fehler.
- Im Gespräch erklären: Idempotenz durch Client-ID, und warum `Math.random` dafür nicht reicht.
