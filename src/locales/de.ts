// German UI texts, grouped by area. This file is the source of truth for the key types
// (see src/lib/i18n.ts): a key that is not here is a type error.
export const de = {
  common: {
    cancel: "Abbrechen",
    retry: "Erneut versuchen",
    networkError:
      "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.",
  },
  format: {
    fetchedAt: "abgerufen um {{time}}",
    centPerLiter: "{{value}} Cent pro Liter",
    euroAndCentPerLiter: "{{euros}} Euro {{value}} Cent pro Liter",
  },
  auth: {
    fieldErrors: {
      emailMissing: "Gib deine E-Mail-Adresse ein.",
      emailInvalid: "Diese E-Mail-Adresse ist ungültig.",
      passwordMissing: "Gib dein Passwort ein.",
      passwordTooShort: "Das Passwort braucht mindestens {{min}} Zeichen.",
      unknown: "Bitte prüfe deine Eingabe.",
    },
    serverErrors: {
      invalidCredentials: "E-Mail oder Passwort ist falsch.",
      alreadyRegistered: "Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.",
      emailNotAccepted: "Diese E-Mail-Adresse wird nicht akzeptiert.",
      weakPassword: "Das Passwort ist zu schwach. Nutze mindestens {{min}} Zeichen.",
      rateLimited: "Zu viele Versuche. Warte kurz und versuche es dann erneut.",
      emailNotConfirmed: "Bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.",
      unknown: "Das hat nicht geklappt. Versuche es später erneut.",
    },
  },
  vehicles: {
    fuelTypes: { e5: "Super E5", e10: "Super E10", diesel: "Diesel" },
    errors: {
      nameMissing: "Gib einen Namen ein.",
      fuelTypeMissing: "Wähle einen Kraftstoff.",
      odometerMissing: "Gib den Kilometerstand ein.",
      odometerInvalid: "Gib den Kilometerstand als ganze Zahl ohne Punkt ein.",
      tankCapacityMissing: "Gib das Tankvolumen ein.",
      tankCapacityInvalid: "Das Tankvolumen muss eine Zahl größer als 0 sein.",
      consumptionInvalid: "Der Verbrauch muss eine Zahl größer als 0 sein.",
      valueTooLarge: "Der Wert ist zu groß.",
      initialOdometerAboveRefueling:
        "Der Kilometerstand liegt über dem einer vorhandenen Betankung. Gib einen niedrigeren Stand ein.",
      tankCapacityBelowRefueling:
        "Eine vorhandene Betankung passt nicht in dieses Tankvolumen. Gib ein größeres Volumen ein.",
      unknown: "Bitte prüfe deine Eingabe.",
    },
    loadError:
      "Deine Fahrzeuge konnten nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.",
    saveError:
      "Das Fahrzeug konnte nicht gespeichert werden. Prüfe deine Internetverbindung und versuche es erneut.",
    switchError:
      "Das Fahrzeug konnte nicht gewechselt werden. Prüfe deine Internetverbindung und versuche es erneut.",
    deleteError:
      "Das Fahrzeug konnte nicht gelöscht werden. Prüfe deine Internetverbindung und versuche es erneut.",
    deleteTitle: "„{{name}}“ löschen?",
    deleteMessage:
      "Alle Betankungen dieses Fahrzeugs werden mit gelöscht. Das lässt sich nicht rückgängig machen.",
    notFound: "Dieses Fahrzeug gibt es nicht mehr.",
    count_one: "{{count}} Fahrzeug",
    count_other: "{{count}} Fahrzeuge",
  },
  refuelings: {
    errors: {
      dateInvalid: "Bitte ein gültiges Datum angeben.",
      dateInFuture: "Datum darf nicht in der Zukunft liegen.",
      volumeMissing: "Bitte die Liter angeben.",
      volumeNotPositive: "Liter müssen größer als 0 sein.",
      volumeAboveTank: "Mehr Liter als in den Tank passen.",
      priceMissing: "Bitte den Literpreis angeben.",
      priceOutOfRange: "Literpreis muss zwischen {{min}} und {{max}} liegen.",
      totalMissing: "Bitte den Gesamtbetrag angeben.",
      totalNotPositive: "Gesamtbetrag muss größer als 0 sein.",
      odometerMissing: "Bitte den Kilometerstand angeben.",
      valueTooLarge: "Wert ist zu groß.",
      odometerBelowInitial: "Kilometerstand liegt unter dem Anfangsstand des Fahrzeugs.",
      odometerNotAbovePrevious: "Kilometerstand muss höher sein als bei der vorherigen Betankung.",
      odometerNotBelowNext: "Kilometerstand muss niedriger sein als bei der nächsten Betankung.",
      odometerDuplicateSameDay:
        "Am selben Tag gibt es schon eine Betankung mit diesem Kilometerstand.",
      unknown: "Bitte die Eingabe prüfen.",
    },
    warnings: {
      distanceUnusuallyLarge:
        "Mehr als {{distance}} seit der letzten Betankung. Fehlt eine Betankung?",
    },
    loadError:
      "Deine Betankungen konnten nicht geladen werden. Prüfe deine Internetverbindung und versuche es erneut.",
    saveError:
      "Die Betankung konnte nicht gespeichert werden. Prüfe deine Internetverbindung und versuche es erneut.",
    deleteError:
      "Die Betankung konnte nicht gelöscht werden. Prüfe deine Internetverbindung und versuche es erneut.",
  },
  stations: {
    priceSource: "Preisdaten: Tankerkönig.de / MTS-K (CC BY 4.0)",
    errors: {
      generic: "Die Preise konnten nicht geladen werden. Versuche es später erneut.",
      unauthorized: "Deine Anmeldung ist abgelaufen. Melde dich erneut an.",
      outsideGermany:
        "Preise gibt es nur für Tankstellen in Deutschland. Wähle einen Ort in Deutschland.",
      stationNotFound: "Diese Tankstelle wurde nicht gefunden.",
      upstreamUnavailable:
        "Der Preisdienst Tankerkönig ist gerade nicht erreichbar. Versuche es gleich erneut.",
      rateLimited:
        "Du hast gerade viele Preise abgefragt. Warte eine Minute und versuche es dann erneut.",
    },
  },
} as const;
