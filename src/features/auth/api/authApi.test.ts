import type { AuthChangeEvent } from "@supabase/supabase-js";

import { loadSession, subscribeToSessionChanges } from "./authApi";

let mockGetSession: { data: unknown; error: unknown } = { data: { session: null }, error: null };
let mockListener: ((event: AuthChangeEvent, session: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve(mockGetSession),
      onAuthStateChange: (listener: (event: AuthChangeEvent, session: unknown) => void) => {
        mockListener = listener;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  },
}));

const session = { access_token: "token", refresh_token: "refresh" };

describe("loadSession", () => {
  it("returns the stored session", async () => {
    mockGetSession = { data: { session }, error: null };
    await expect(loadSession()).resolves.toBe(session);
  });

  it("returns null when nobody is signed in", async () => {
    mockGetSession = { data: { session: null }, error: null };
    await expect(loadSession()).resolves.toBeNull();
  });

  it("throws the error of a failed renewal instead of reporting signed out", async () => {
    const networkError = { name: "AuthRetryableFetchError", status: 0 };
    mockGetSession = { data: { session: null }, error: networkError };
    await expect(loadSession()).rejects.toBe(networkError);
  });
});

describe("subscribeToSessionChanges", () => {
  it("skips INITIAL_SESSION, which reports a session not renewed offline as null", () => {
    const onChange = jest.fn();
    subscribeToSessionChanges(onChange);
    mockListener?.("INITIAL_SESSION", null);
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each<[AuthChangeEvent, unknown]>([
    ["SIGNED_IN", session],
    ["TOKEN_REFRESHED", session],
    ["SIGNED_OUT", null],
  ])("passes on %s", (event, eventSession) => {
    const onChange = jest.fn();
    subscribeToSessionChanges(onChange);
    mockListener?.(event, eventSession);
    expect(onChange).toHaveBeenCalledWith(eventSession);
  });

  it("returns a function that ends the subscription", () => {
    subscribeToSessionChanges(jest.fn())();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
