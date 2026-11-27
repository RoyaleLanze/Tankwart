// German UI texts, grouped by area. This file is the source of truth for the key types
// (see src/lib/i18n.ts): a key that is not here is a type error.
export const de = {
  common: {
    cancel: "Abbrechen",
    retry: "Erneut versuchen",
  },
  auth: {
    sessionUnreachable:
      "Keine Verbindung zum Server. Du bist weiter angemeldet. Prüfe deine Internetverbindung und versuche es erneut.",
  },
} as const;
