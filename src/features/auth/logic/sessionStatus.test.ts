import { sessionStatus } from "./sessionStatus";

// Same name and fields as the errors supabase-js returns from getSession().
const networkError = { name: "AuthRetryableFetchError", status: 0, message: "Network failed" };
const serverDownError = { name: "AuthRetryableFetchError", status: 503, message: "HTTP 503" };
const invalidRefreshToken = {
  name: "AuthApiError",
  status: 400,
  code: "refresh_token_not_found",
  message: "Invalid Refresh Token: Refresh Token Not Found",
};
const session = { access_token: "token", refresh_token: "refresh" };

describe("sessionStatus", () => {
  it("is signed in with a session", () => {
    expect(sessionStatus(session)).toBe("signedIn");
  });

  it("is signed out without a session and without an error", () => {
    expect(sessionStatus(null)).toBe("signedOut");
    expect(sessionStatus(null, null)).toBe("signedOut");
  });

  it("is unreachable when the expired session could not be renewed offline", () => {
    expect(sessionStatus(null, networkError)).toBe("unreachable");
  });

  it("is unreachable when the server answers with a 5xx", () => {
    expect(sessionStatus(null, serverDownError)).toBe("unreachable");
  });

  it("is signed out when the server rejected the refresh token", () => {
    expect(sessionStatus(null, invalidRefreshToken)).toBe("signedOut");
  });

  it("is signed out after an error it does not know, so the user can sign in again", () => {
    expect(sessionStatus(null, new TypeError("boom"))).toBe("signedOut");
    expect(sessionStatus(null, "AuthRetryableFetchError")).toBe("signedOut");
    expect(sessionStatus(null, undefined)).toBe("signedOut");
  });

  it("prefers a session over an error, because the session is usable", () => {
    expect(sessionStatus(session, networkError)).toBe("signedIn");
  });
});
