# Anforderungen

Quelle: Projektvorstellung vom 05.11.2026. M1–M15 sind die projektspezifischen MUST-HAVEs. Dazu kommen die allgemeinen MUST-HAVEs der Projektbeschreibung (unten).

## Projektspezifische MUST-HAVEs

| Nr. | Thema | Anforderung |
|---|---|---|
| M1 | Fahrzeuge | Fahrzeuge anlegen, bearbeiten, löschen. Pflicht: Name, Kraftstoff (Super E5, Super E10, Diesel), Kilometerstand, Tankgröße. Optional: Marke/Modell, Kennzeichen, Herstellerverbrauch. Löschen fragt nach und entfernt auch die Betankungen. Ohne Fahrzeug führt die App direkt zum Anlegen. |
| M2 | Fahrzeuge | Genau ein Fahrzeug ist aktiv und lässt sich in der Kopfzeile wechseln. Die Wahl wird im Profil gespeichert. Auswertungen und Tankstellensuche beziehen sich auf dieses Fahrzeug und seinen Kraftstoff. |
| M3 | Betankungen | Betankungen erfassen, bearbeiten, löschen: Datum, Liter, Preis, Gesamtbetrag, Kilometerstand, Tankstelle, vollgetankt ja/nein, „vorherige Betankung nicht erfasst“, Notiz, optional Belegfoto mit der Kamera. Von Liter, Preis und Gesamt reichen zwei, den dritten rechnet die App aus. |
| M4 | Betankungen | Validierung vor dem Speichern, Fehler am Feld: Liter > 0 und ≤ Tankgröße × 1,1; Literpreis 0,50–4,00 €; km-Stand > vorherige und < nächste Betankung und ≥ Anfangsstand; Warnung bei > 2.000 km seit der letzten Betankung; Datum nicht in der Zukunft. |
| M5 | Betankungen | Beim Erfassen wird per Standort die nächste Tankstelle (≤ 2 km) mit aktuellem Preis vorgeschlagen. Beides ist änderbar. Gespeichert wird die Tankstelle, nicht die Position. Ohne Standort oder Netz geht die Tankstelle als Freitext. |
| M6 | Betankungen | Verlauf des aktiven Fahrzeugs nach Monat gruppiert, neueste zuerst, mit Anzahl, Liter- und Eurosumme pro Monat. |
| M7 | Verbrauch/Kosten | L/100 km nach der Volltank-Methode: alle Liter nach der letzten Vollbetankung bis einschließlich der aktuellen, geteilt durch die km dazwischen. Die erste Vollbetankung ist nur Startpunkt. Bei weniger als zwei steht ein Hinweis statt eines Werts. Intervalle mit fehlender Betankung werden nicht gewertet. |
| M8 | Verbrauch/Kosten | Home: Ausgaben des laufenden Monats groß, mit Anzahl Betankungen, Litern und Differenz zum Vormonat. Darunter Ø-Verbrauch (12 Monate), km und Ø-Literpreis des Monats. |
| M9 | Tankstellen | Liste im Umkreis des Standorts oder eines gesuchten Orts mit Live-Preis, sortierbar nach Preis/Entfernung. Pro Eintrag: Name, Ort, Entfernung, Preis, geöffnet ja/nein. Kraftstoff vorbelegt und umschaltbar, Umkreis 2/5/10/25 km (Standard 5). Abrufzeit und Quellenangabe Tankerkönig. Abfrage nur auf Nutzeraktion. |
| M10 | Tankstellen | Die günstigste geöffnete Tankstelle ist hervorgehoben, mit der Ersparnis gegenüber der nächsten Tankstelle für 80 % der Tankgröße. |
| M11 | Tankstellen | Detail mit Preisen aller drei Sorten und Öffnungszeiten. „Hier tanken“ öffnet eine Betankung mit Tankstelle und Preis vorausgefüllt. |
| M12 | Auswertung | Jahresdiagramm mit einem Balken pro Monat, umschaltbar km / Ausgaben / Ø-Literpreis / Verbrauch. Höchster und niedrigster Monat markiert, ein Tipp zeigt die Werte des Monats. Summe und Durchschnitt, Jahr wählbar. |
| M13 | Auswertung | Monatsvergleich zweier wählbarer Monate (Standard: laufender gegen Vormonat): Ø-Literpreis, Ausgaben, km, Liter, Ø-Verbrauch, Kosten/km, jeweils mit Differenz. Ersparnis = Differenz der Ø-Literpreise × getankte Liter. Betankungen unter dem Ø-Literpreis ihres Monats sind als Schnäppchen markiert. |
| M14 | Konto | Registrierung und Anmeldung mit E-Mail und Passwort, Abmelden. Die Sitzung bleibt nach einem Neustart erhalten. Jeder sieht und ändert nur eigene Daten, serverseitig per RLS durchgesetzt und mit Tests nachgewiesen. |
| M15 | Robustheit | Ohne Standortfreigabe: Erklärung, manuelle Ortssuche, Weg in die Einstellungen. Bei fehlendem Netz oder nicht erreichbarer Preis-API: Meldung mit „Erneut versuchen“, sonst die zuletzt geladenen Preise mit Abrufzeit. Eine angefangene Betankung übersteht Hintergrund und Prozessende, ein fehlgeschlagenes Speichern verliert keine Eingaben. |

## Allgemeine MUST-HAVEs (Projektbeschreibung) → Umsetzung

| Vorgabe | Umsetzung |
|---|---|
| Mobile-First, UI/UX, Plattformkonventionen, Barrierefreiheit | Material Design 3 (react-native-paper), Touch-Ziele ≥ 48 dp, Kontrast ≥ 4,5:1, Farbe nie allein bedeutungstragend |
| Cloud-Speicherung | Fahrzeuge, Betankungen und Profil in Postgres, Belegfotos in Storage |
| Benutzerkonto + serverseitiger Zugriffsschutz | Supabase Auth (M14), RLS auf allen Tabellen, Storage-Policy pro Nutzerordner, pgTAP-Tests mit zwei Testnutzern |
| Native Gerätefunktion | Standort (Suche und Vorschlag, M5/M9), Kamera (Belegfoto, M3) inkl. Umgang mit verweigerter Berechtigung |
| Fehlerbehandlung und Zustände | Lade-, Leer- und Fehlerzustand je Screen, Entwurf bleibt erhalten (M15), Hochformat fest |
| Automatisierte Tests | Jest (Logik), pgTAP (RLS), Deno (Edge Function), Maestro (E2E) |
| Codequalität und Architektur | Schichten UI → Hooks → API, reine Logik getrennt (siehe CLAUDE.md, ADRs) |
| Reproduzierbares Backend | Migrationen, `seed.sql` mit zwei Testnutzern und 12 Monaten Betankungen, Edge Function mit Mock-Modus, Schritte in der README |
| Git + KI-Reflexion | Regelmäßige Commits beider Mitglieder, KI-Reflexion mit Commit-Beispielen in der README |

## E2E-Abläufe (Maestro)

1. Registrieren
2. Betankung mit vorgeschlagener Tankstelle erfassen
3. Ungültige Eingabe wird am Feld abgelehnt
4. Statistik ansehen
5. Tankstellensuche bis „Hier tanken“
6. Entwurf übersteht einen Neustart
7. Verweigerte Standortfreigabe

## Screens → Anforderungen

| Screen | Inhalt | MUST-HAVE |
|---|---|---|
| Anmeldung | Anmelden / Registrieren | M14 |
| Onboarding | Erstes Fahrzeug anlegen | M1 |
| Home | Monatskosten mit Vormonatsvergleich, Ø-Verbrauch, letzte Betankung | M2, M8 |
| Betankung erfassen | 2 von 3 Werten, Tankstellenvorschlag, Belegfoto, Entwurf | M3, M4, M5, M15 |
| Verlauf | Nach Monat gruppiert, Schnäppchen | M6, M13 |
| Eintrag-Details | Ansehen, bearbeiten, löschen, Intervallverbrauch | M3, M7 |
| Statistik | Jahresdiagramm, Summe, Durchschnitt | M12 |
| Monatsvergleich | Zwei Monate, Differenzen, Ersparnis | M13 |
| Tankstellen | Live-Preise, Sortierung, Günstigste | M9, M10 |
| Tankstellen-Detail | Alle Sorten, Öffnungszeiten, „Hier tanken“ | M11 |
| Fahrzeuge | Verwalten, aktives wählen | M1, M2 |
| Einstellungen | Konto, Standortfreigabe, Datenschutz | M14 |

## NICE-TO-HAVEs (erst nach allen MUST-HAVEs)

Planung vom 26.11.2026 (Entscheidungen @SealJonny). Jedes NICE hat ein Issue, die Reihenfolge ergibt sich aus den Meilensteinen.

**Vorgezogen**, weil sie die Architektur betreffen und später teurer würden:
- **i18n-Fundament** (#97, Woche 2): Ab dann nutzen alle UI-Texte Schlüssel statt fester deutscher Texte. Die englischen Texte selbst kommen in #59 (Woche 5).
- **Offline-Erfassung** (#107, Woche 4): nur neue Betankungen, über pausierte TanStack-Mutationen mit Persistenz (ADR folgt). Bearbeiten und Löschen brauchen weiter Netz.
- **Konto löschen** (#99, Woche 4): Edge Function mit Service-Role. Sie löscht auch die Belegfotos unter `receipts/<uid>/`.

**Woche 5:**
1. Ersparnis inklusive Umweg (Anfahrtskosten, Sortierung „Ersparnis“, einstellbare Tankmenge), #100. In den Mockups: Sortier-Chip „Ersparnis“, Karte „Kosten mit Anfahrt“
2. Favoriten-Tankstellen, Navigation, Abstand zum günstigsten Preis, #102
3. Home: Karte „Günstig tanken in der Nähe“ (lädt keine Preise von selbst), Prognose der Monatsausgaben, #101
4. Verbrauch gegen Herstellerangabe, Filter im Verlauf, #103
5. Texterkennung auf dem Belegfoto, auf dem Gerät mit ML Kit (keine Cloud-OCR), #106
6. Passwort zurücksetzen und ändern, #104
7. CSV-Export (Download-Icon im Monatsvergleich), #105
8. Englische Texte, #59

**Schon umgesetzt:** Dunkelmodus (ADR 0013).

**Auswirkungen auf MUST-Issues** (stehen als Hinweis im jeweiligen Issue):
- #12: Die Mutation zum Erfassen bekommt einen festen `mutationKey`, die ID der Betankung erzeugt der Client (für #107).
- #13: Belegfotos nur unter `receipts/<uid>/`, beim Löschen oder Ersetzen wird das Storage-Objekt mitgelöscht (für #99).
- #14: Der Entwurf wird gelöscht, sobald die Mutation angenommen ist, auch wenn sie noch auf Netz wartet (für #107).
- #17, #18: so bauen, dass der Umweg aus #100 später dazukommen kann.
- #23: Home lädt nie automatisch Preise (für #101).

Bewusst nicht geplant:
- Preisalarm, weil Tankerkönig Abfragen nur auf Nutzeraktion erlaubt.
- Kartenansicht mit Preis-Markern: Google Maps braucht auf Android einen API-Key mit Abrechnungskonto (widerspricht „nichts Kostenpflichtiges“), MapLibre wäre eine neue native Abhängigkeit für ein NICE.
- iOS: wird vor der Abgabe nicht umgesetzt und ist ohne Mac nicht testbar (#108).

## Entscheidungen aus dem Mockup-Abgleich (17.11.2026)

Bei Widerspruch zum Mockup gilt diese Liste.

- **Onboarding, Tankgröße:** Pflichtfeld (M1). Wird für M4 und M10 gebraucht. Das Mockup zeigt „optional“, das ist überholt.
- **Onboarding, Schritte:** nur ein Schritt (erstes Fahrzeug), die Anzeige „Schritt 1 von 2“ entfällt. Berechtigungen werden im Kontext abgefragt (Standort beim ersten Öffnen der Tankstellen bzw. beim Erfassen, Kamera beim Belegfoto) und nicht vorab im Onboarding.
- **Kraftstoffe:** nur Super E5, Super E10 und Diesel, die Sorten von Tankerkönig.
- **Tankstellen, Umkreis:** Standard 5 km nach M9 (im Mockup ist 10 km gewählt).
