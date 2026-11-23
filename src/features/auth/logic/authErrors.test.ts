import { authErrorMessage, NETWORK_ERROR_MESSAGE, UNKNOWN_ERROR_MESSAGE } from "./authErrors";

// Plain objects with the same shape as supabase-js errors, so the test needs no backend.
const authError = (code: string) => ({ name: "AuthApiError", status: 400, code });

describe("authErrorMessage", () => {
  it("explains wrong credentials without saying which field was wrong", () => {
    expect(authErrorMessage(authError("invalid_credentials"))).toBe(
      "E-Mail oder Passwort ist falsch.",
    );
  });

  it.each(["user_already_exists", "email_exists"])("points to signing in for %p", (code) => {
    expect(authErrorMessage(authError(code))).toBe(
      "Zu dieser E-Mail gibt es schon ein Konto. Melde dich an.",
    );
  });

  it("mentions the minimum length for a weak password", () => {
    expect(authErrorMessage(authError("weak_password"))).toContain("mindestens 8 Zeichen");
  });

  it("asks to confirm the email when the project still requires it", () => {
    expect(authErrorMessage(authError("email_not_confirmed"))).toBe(
      "Bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.",
    );
  });

  it("explains rate limiting", () => {
    expect(authErrorMessage(authError("over_request_rate_limit"))).toContain("Zu viele Versuche");
  });

  it("reports a missing network connection", () => {
    const offline = {
      name: "AuthRetryableFetchError",
      status: 0,
      message: "Network request failed",
    };
    expect(authErrorMessage(offline)).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("treats server errors (5xx) like a missing connection", () => {
    expect(authErrorMessage({ name: "AuthRetryableFetchError", status: 503 })).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(authErrorMessage(authError("user_banned"))).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it("does not use inherited object keys as messages", () => {
    expect(authErrorMessage(authError("constructor"))).toBe(UNKNOWN_ERROR_MESSAGE);
  });

  it.each([undefined, null, "boom", 42, new Error("boom"), { code: 400 }])(
    "falls back to a generic message for %p",
    (error) => {
      expect(authErrorMessage(error)).toBe(UNKNOWN_ERROR_MESSAGE);
    },
  );
});
