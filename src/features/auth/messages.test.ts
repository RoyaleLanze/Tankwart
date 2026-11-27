import { authFieldErrorText, authServerErrorText, UNKNOWN_FIELD_ERROR_TEXT } from "./messages";

describe("authFieldErrorText", () => {
  it("returns German text for a code", () => {
    expect(authFieldErrorText("emailMissing")).toBe("Gib deine E-Mail-Adresse ein.");
  });

  it("names the minimum password length from the constant", () => {
    expect(authFieldErrorText("passwordTooShort")).toBe(
      "Das Passwort braucht mindestens 8 Zeichen.",
    );
  });

  it.each(["Invalid input: expected string", "toString", ""])(
    "never shows an unknown message like %j to the user",
    (message) => {
      expect(authFieldErrorText(message)).toBe(UNKNOWN_FIELD_ERROR_TEXT);
    },
  );
});

describe("authServerErrorText", () => {
  it("does not say which of email or password was wrong", () => {
    expect(authServerErrorText("invalidCredentials")).toBe("E-Mail oder Passwort ist falsch.");
  });

  it("asks to check the connection when the server is unreachable", () => {
    expect(authServerErrorText("network")).toBe(
      "Keine Verbindung zum Server. Prüfe deine Internetverbindung und versuche es erneut.",
    );
  });

  it("names the minimum length for a weak password", () => {
    expect(authServerErrorText("weakPassword")).toBe(
      "Das Passwort ist zu schwach. Nutze mindestens 8 Zeichen.",
    );
  });
});
