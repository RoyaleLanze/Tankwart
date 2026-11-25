// Run with: deno test supabase/functions/prices
import { deepStrictEqual, equal, ok } from "node:assert/strict";
import { CACHE_TTL_MS, type CacheEntry, createHandler, type Deps } from "./handler.ts";

const NOW = new Date("2026-11-25T12:00:00Z");
const STATION_ID = "00000000-0000-4000-8000-000000000001";
const LIST = { action: "list", lat: 48.78321, lng: 9.18079, radiusKm: 5 };

function setup(
  overrides: Partial<Deps> = {},
  upstream = () => Response.json({ ok: true, stations: [] }),
) {
  const store = new Map<string, CacheEntry>();
  const calls: string[] = [];
  const deps: Deps = {
    isAuthenticated: () => Promise.resolve(true),
    cache: {
      read: (key) => Promise.resolve(store.get(key) ?? null),
      write: (key, entry) => Promise.resolve(void store.set(key, entry)),
    },
    fetch: (url) => {
      calls.push(String(url));
      return Promise.resolve(upstream());
    },
    apiKey: "test-key",
    mock: false,
    now: () => NOW,
    ...overrides,
  };
  return { handle: createHandler(deps), store, calls };
}

const post = (body: unknown) =>
  new Request("http://local/prices", { method: "POST", body: JSON.stringify(body) });

Deno.test("rejects requests without a signed-in user", async () => {
  const { handle, calls } = setup({ isAuthenticated: () => Promise.resolve(false) });
  const res = await handle(post(LIST));
  equal(res.status, 401);
  deepStrictEqual(await res.json(), { error: "unauthorized" });
  equal(calls.length, 0);
});

Deno.test("rejects non-POST requests", async () => {
  const { handle } = setup();
  equal((await handle(new Request("http://local/prices"))).status, 405);
});

Deno.test("rejects invalid input", async () => {
  const { handle, calls } = setup();
  const invalid = [
    null,
    { action: "unknown" },
    { ...LIST, radiusKm: 3 },
    { ...LIST, lat: 91 },
    { ...LIST, lng: "9.18" },
    { action: "detail", stationId: "not-a-uuid" },
  ];
  for (const body of invalid) {
    const res = await handle(post(body));
    equal(res.status, 400, JSON.stringify(body));
    deepStrictEqual(await res.json(), { error: "invalidInput" });
  }
  equal(calls.length, 0);
});

Deno.test("mock mode works without an API key and never calls Tankerkoenig", async () => {
  const { handle, calls } = setup({ mock: true, apiKey: undefined });
  const small = await (await handle(post({ ...LIST, radiusKm: 2 }))).json();
  const large = await (await handle(post(LIST))).json();
  equal(small.stations.length, 2);
  equal(large.stations.length, 3);
  equal(large.fetchedAt, NOW.toISOString());
  equal(calls.length, 0);
});

Deno.test("mock detail has opening times, unknown station is 404", async () => {
  const { handle } = setup({ mock: true, apiKey: undefined });
  const detail = await (await handle(post({ action: "detail", stationId: STATION_ID }))).json();
  equal(detail.station.id, STATION_ID);
  ok(detail.station.openingTimes.length > 0);
  const missing = await handle(post({ action: "detail", stationId: crypto.randomUUID() }));
  equal(missing.status, 404);
});

Deno.test("without mock mode a missing API key is a server error", async () => {
  const { handle } = setup({ apiKey: undefined });
  const res = await handle(post(LIST));
  equal(res.status, 500);
  deepStrictEqual(await res.json(), { error: "missingApiKey" });
});

Deno.test("fetches all fuels with rounded coordinates and caches the result", async () => {
  const { handle, store, calls } = setup();
  const res = await handle(post(LIST));
  equal(res.status, 200);
  deepStrictEqual(await res.json(), { stations: [], fetchedAt: NOW.toISOString() });
  const url = new URL(calls[0]);
  equal(url.searchParams.get("lat"), "48.783");
  equal(url.searchParams.get("type"), "all");
  equal(url.searchParams.get("apikey"), "test-key");
  ok(store.has("list:48.783:9.181:5"));
});

Deno.test("serves a fresh cache entry without calling Tankerkoenig", async () => {
  const fetchedAt = new Date(NOW.getTime() - CACHE_TTL_MS + 1000);
  const { handle, store, calls } = setup();
  store.set("list:48.783:9.181:5", { payload: { stations: ["cached"] }, fetchedAt });
  const body = await (await handle(post(LIST))).json();
  deepStrictEqual(body, { stations: ["cached"], fetchedAt: fetchedAt.toISOString() });
  equal(calls.length, 0);
});

Deno.test("refetches an expired cache entry", async () => {
  const fetchedAt = new Date(NOW.getTime() - CACHE_TTL_MS);
  const { handle, store, calls } = setup();
  store.set("list:48.783:9.181:5", { payload: { stations: ["old"] }, fetchedAt });
  const body = await (await handle(post(LIST))).json();
  deepStrictEqual(body.stations, []);
  equal(calls.length, 1);
  equal(store.get("list:48.783:9.181:5")?.fetchedAt, NOW);
});

Deno.test("upstream failures become 502 and are not cached", async () => {
  const failures = [
    () => new Response("down", { status: 503 }),
    () => Response.json({ ok: false, message: "apikey nicht angegeben" }),
    () => new Response("not json"),
    () => {
      throw new TypeError("error sending request for url (https://...&apikey=test-key)");
    },
  ];
  for (const upstream of failures) {
    const { handle, store } = setup({}, upstream);
    const res = await handle(post({ action: "detail", stationId: STATION_ID }));
    equal(res.status, 502);
    deepStrictEqual(await res.json(), { error: "upstreamUnavailable" });
    equal(store.size, 0);
  }
});
