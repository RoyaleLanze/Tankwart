import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import { searchStations, StationsError } from "./stationsApi";

jest.mock("@/lib/supabase", () => ({ supabase: { functions: { invoke: jest.fn() } } }));

const invoke = jest.mocked(supabase.functions.invoke);
const SEARCH = { position: { lat: 49.0069, lng: 8.4037 }, radiusKm: 5 } as const;

function failWith(error: unknown) {
  invoke.mockResolvedValueOnce({ data: null, error });
}

function httpError(status: number, body: string) {
  return new FunctionsHttpError(new Response(body, { status }));
}

async function codeOf(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(StationsError);
  return (error as StationsError).code;
}

describe("searchStations", () => {
  it("sends a list request with the position and radius", async () => {
    invoke.mockResolvedValueOnce({
      data: { stations: [], fetchedAt: "2026-11-26T09:52:00.000Z" },
      error: null,
    });
    await expect(searchStations(SEARCH)).resolves.toEqual({
      stations: [],
      fetchedAt: new Date("2026-11-26T09:52:00.000Z"),
    });
    expect(invoke).toHaveBeenCalledWith("prices", {
      body: { action: "list", lat: 49.0069, lng: 8.4037, radiusKm: 5 },
    });
  });

  it("reads the code from the error body", async () => {
    failWith(httpError(429, JSON.stringify({ error: "rateLimited" })));
    expect(await codeOf(searchStations(SEARCH))).toBe("rateLimited");
  });

  it("falls back to unknown for a body without our code", async () => {
    failWith(httpError(502, "<html>Bad Gateway</html>"));
    expect(await codeOf(searchStations(SEARCH))).toBe("unknown");
  });

  it.each([
    [401, "unauthorized"],
    [429, "rateLimited"],
    [500, "unknown"],
  ])("falls back on status %i if the body has no code", async (status, code) => {
    failWith(httpError(status, "<html>Gateway</html>"));
    expect(await codeOf(searchStations(SEARCH))).toBe(code);
  });

  it("prefers the code of the body over the status", async () => {
    failWith(httpError(401, JSON.stringify({ error: "outsideGermany" })));
    expect(await codeOf(searchStations(SEARCH))).toBe("outsideGermany");
  });

  it("wraps a thrown error of invoke as network", async () => {
    invoke.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect(await codeOf(searchStations(SEARCH))).toBe("network");
  });

  it("reports network if the request did not reach the function", async () => {
    failWith(new FunctionsFetchError(new TypeError("Network request failed")));
    expect(await codeOf(searchStations(SEARCH))).toBe("network");
  });

  it("reports unknown for an answer of the wrong shape", async () => {
    invoke.mockResolvedValueOnce({ data: "not json", error: null });
    expect(await codeOf(searchStations(SEARCH))).toBe("unknown");
  });
});
