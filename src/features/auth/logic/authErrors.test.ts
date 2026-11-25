import { authErrorCode } from "./authErrors";

// Plain objects with the same shape as supabase-js errors, so the test needs no backend.
const authError = (code: string) => ({ name: "AuthApiError", status: 400, code });

describe("authErrorCode", () => {
  it.each([
    ["invalid_credentials", "invalidCredentials"],
    ["user_already_exists", "alreadyRegistered"],
    ["email_exists", "alreadyRegistered"],
    ["email_address_invalid", "emailNotAccepted"],
    ["weak_password", "weakPassword"],
    ["over_request_rate_limit", "rateLimited"],
    ["email_not_confirmed", "emailNotConfirmed"],
  ])("maps the Supabase code %p to %p", (supabaseCode, expected) => {
    expect(authErrorCode(authError(supabaseCode))).toBe(expected);
  });

  it("reports a missing network connection", () => {
    const offline = {
      name: "AuthRetryableFetchError",
      status: 0,
      message: "Network request failed",
    };
    expect(authErrorCode(offline)).toBe("network");
  });

  it("treats server errors (5xx) like a missing connection", () => {
    expect(authErrorCode({ name: "AuthRetryableFetchError", status: 503 })).toBe("network");
  });

  it("falls back to unknown for codes we do not handle", () => {
    expect(authErrorCode(authError("user_banned"))).toBe("unknown");
  });

  it("does not use inherited object keys as codes", () => {
    expect(authErrorCode(authError("constructor"))).toBe("unknown");
  });

  it.each([undefined, null, "boom", 42, new Error("boom"), { code: 400 }])(
    "falls back to unknown for %p",
    (error) => {
      expect(authErrorCode(error)).toBe("unknown");
    },
  );
});
