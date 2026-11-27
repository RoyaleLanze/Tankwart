// German UI texts, grouped by area. This file is the source of truth for the key types
// (see src/lib/i18n.ts): a key that is not here is a type error.
export const de = {
  common: {
    cancel: "Abbrechen",
    retry: "Erneut versuchen",
  },
  refuelingForm: {
    title: "Betankung erfassen",
    date: "Datum",
    dateHint: "Format: JJJJ-MM-TT",
    volume: "Liter",
    pricePerLiter: "Literpreis",
    total: "Gesamtbetrag",
    amountsHint: "Gib zwei der drei Werte ein, den dritten rechnet die App aus.",
    computed: "Wird berechnet: {{value}}",
    odometer: "Kilometerstand",
    station: "Tankstelle",
    note: "Notiz (optional)",
    fullTank: "Vollgetankt",
    previousMissed: "Vorherige Betankung nicht erfasst",
    previousMissedHint: "Dann zählt der Verbrauch für diesen Abschnitt nicht.",
    save: "Speichern",
    loading: "Betankungen werden geladen …",
    noVehicle: "Lege zuerst ein Fahrzeug an, dann kannst du Betankungen erfassen.",
    addVehicle: "Fahrzeug hinzufügen",
    fabLabel: "Betankung erfassen",
  },
} as const;
