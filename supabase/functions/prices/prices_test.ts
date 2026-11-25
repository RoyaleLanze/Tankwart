// Run with: deno test supabase/functions/prices
import { deepStrictEqual, equal, ok } from "node:assert/strict";
import {
  CACHE_TTL_MS,
  type CacheEntry,
  createHandler,
  type Deps,
  RATE_LIMIT_PER_MINUTE,
} from "./handler.ts";

const NOW = new Date("2026-11-25T12:00:30Z");
const USER_ID = "aaaaaaaa-0000-0000-0000-000000000000";
const STATION_ID = "00000000-0000-4000-8000-000000000001";
const LIST = { action: "list", lat: 48.78321, lng: 9.18079, radiusKm: 5 };

function setup(
  overrides: Partial<Deps> = {},
  upstream = () => Response.json({ ok: true, stations: [] }),
) {
  const store = new Map<string, CacheEntry>();
  const calls: string[] = [];
  const hits = new Map<string, number>();
  const deps: Deps = {
    getUserId: () => Promise.resolve(USER_ID),
    rateLimiter: {
      hit: (userId, windowStart) => {
        const key = `${userId}:${windowStart.toISOString()}`;
        hits.set(key, (hits.get(key) ?? 0) + 1);
        return Promise.resolve(hits.get(key) ?? 0);
      },
    },
    cache: {
      read: (key) => Promise.resolve(store.get(key) ?? null),
      write: (key, entry) => Promise.resolve(void store.set(key, entry)),
      deleteOlderThan: (cutoff) => {
        for (const [key, entry] of store) if (entry.fetchedAt < cutoff) store.delete(key);
        return Promise.resolve();
      },
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
  return { handle: createHandler(deps), store, calls, hits };
}

// Distinct positions, so every request is a cache miss.
const listAt = (i: number) => ({ ...LIST, lat: 48 + i * 0.01 });

const post = (body: unknown) =>
  new Request("http://local/prices", { method: "POST", body: JSON.stringify(body) });

Deno.test("rejects requests without a signed-in user", async () => {
  const { handle, calls } = setup({ getUserId: () => Promise.resolve(null) });
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

Deno.test("rejects positions outside Germany, also in mock mode", async () => {
  const { handle, calls } = setup({ mock: true });
  for (const position of [
    { lat: 48.85, lng: 2.35 },
    { lat: 55.2, lng: 9.18 },
  ]) {
    const res = await handle(post({ ...LIST, ...position }));
    equal(res.status, 400);
    deepStrictEqual(await res.json(), { error: "outsideGermany" });
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
  equal(typeof detail.station.lat, "number");
  equal(typeof detail.station.lng, "number");
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
  const detail = { action: "detail", stationId: STATION_ID };
  const failures: [unknown, () => Response][] = [
    [detail, () => new Response("down", { status: 503 })],
    [LIST, () => Response.json({ ok: false, message: "apikey nicht angegeben" })],
    [detail, () => new Response("not json")],
    [LIST, () => Response.json({ ok: true, stations: "none" })],
    [detail, () => Response.json({ ok: true, station: "none" })],
    [
      detail,
      () => {
        throw new TypeError("error sending request for url (https://...&apikey=test-key)");
      },
    ],
  ];
  for (const [body, upstream] of failures) {
    const { handle, store } = setup({}, upstream);
    const res = await handle(post(body));
    equal(res.status, 502);
    deepStrictEqual(await res.json(), { error: "upstreamUnavailable" });
    equal(store.size, 0);
  }
});

Deno.test("unknown station in real mode is 404 and not cached", async () => {
  const answers = [
    () => Response.json({ ok: false, message: "parameter error" }),
    () => Response.json({ ok: true }),
  ];
  for (const upstream of answers) {
    const { handle, store } = setup({}, upstream);
    const res = await handle(post({ action: "detail", stationId: STATION_ID }));
    equal(res.status, 404);
    deepStrictEqual(await res.json(), { error: "stationNotFound" });
    equal(store.size, 0);
  }
});

Deno.test("a failing cache does not block prices", async () => {
  const fail = () => Promise.reject(new Error("db down"));
  const cache = { read: fail, write: fail, deleteOlderThan: fail };
  const { handle, calls } = setup({ cache });
  const errors: unknown[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => void errors.push(args);
  try {
    const res = await handle(post(LIST));
    equal(res.status, 200);
    deepStrictEqual(await res.json(), { stations: [], fetchedAt: NOW.toISOString() });
  } finally {
    console.error = originalError;
  }
  equal(calls.length, 1);
  equal(errors.length, 3);
});

Deno.test("writing a new entry deletes expired entries of other keys", async () => {
  const { handle, store } = setup();
  const expired = new Date(NOW.getTime() - CACHE_TTL_MS - 1);
  const fresh = new Date(NOW.getTime() - 1000);
  store.set("list:50.000:8.000:5", { payload: {}, fetchedAt: expired });
  store.set("list:51.000:7.000:5", { payload: {}, fetchedAt: fresh });
  await handle(post(LIST));
  deepStrictEqual([...store.keys()].sort(), ["list:48.783:9.181:5", "list:51.000:7.000:5"]);
});

// Uses up the limit with distinct positions, so every call is a real Tankerkoenig call.
async function useUpLimit(handle: (req: Request) => Promise<Response>) {
  for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
    equal((await handle(post(listAt(i)))).status, 200);
  }
}

Deno.test("allows the limit of real calls per minute and rejects the next one", async () => {
  const { handle, calls, hits } = setup();
  await useUpLimit(handle);
  const res = await handle(post(listAt(RATE_LIMIT_PER_MINUTE)));
  equal(res.status, 429);
  equal(res.headers.get("Retry-After"), "30");
  deepStrictEqual(await res.json(), { error: "rateLimited" });
  equal(calls.length, RATE_LIMIT_PER_MINUTE);
  deepStrictEqual([...hits.keys()], [`${USER_ID}:2026-11-25T12:00:00.000Z`]);
});

Deno.test("the limit resets exactly at the next full minute", async () => {
  let now = new Date("2026-11-25T12:00:00.000Z");
  const { handle, hits } = setup({ now: () => now });
  await useUpLimit(handle);
  now = new Date("2026-11-25T12:00:59.999Z");
  const limited = await handle(post(listAt(RATE_LIMIT_PER_MINUTE)));
  equal(limited.status, 429);
  equal(limited.headers.get("Retry-After"), "1");
  now = new Date("2026-11-25T12:01:00.000Z");
  equal((await handle(post(listAt(RATE_LIMIT_PER_MINUTE + 1)))).status, 200);
  equal(hits.get(`${USER_ID}:2026-11-25T12:01:00.000Z`), 1);
});

Deno.test("detail cache misses count against the same limit", async () => {
  const detailAt = (i: number) => ({ action: "detail", stationId: STATION_ID.slice(0, -1) + i });
  const { handle } = setup({}, () => Response.json({ ok: true, stations: [], station: {} }));
  for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
    equal((await handle(post(i % 2 === 0 ? listAt(i) : detailAt(i)))).status, 200);
  }
  equal((await handle(post(detailAt(0)))).status, 429);
});

Deno.test("over the limit an expired cache entry is served instead of 429", async () => {
  const fetchedAt = new Date(NOW.getTime() - CACHE_TTL_MS);
  const { handle, store, calls } = setup();
  await useUpLimit(handle);
  store.set("list:48.783:9.181:5", { payload: { stations: ["old"] }, fetchedAt });
  const res = await handle(post(LIST));
  equal(res.status, 200);
  deepStrictEqual(await res.json(), { stations: ["old"], fetchedAt: fetchedAt.toISOString() });
  equal(calls.length, RATE_LIMIT_PER_MINUTE);
});

Deno.test("after a 429 a fresh cache entry is still served", async () => {
  const { handle } = setup();
  await useUpLimit(handle);
  equal((await handle(post(listAt(RATE_LIMIT_PER_MINUTE)))).status, 429);
  equal((await handle(post(listAt(0)))).status, 200);
});

Deno.test("the limit is per user", async () => {
  let user = USER_ID;
  const { handle } = setup({ getUserId: () => Promise.resolve(user) });
  await useUpLimit(handle);
  equal((await handle(post(listAt(RATE_LIMIT_PER_MINUTE)))).status, 429);
  user = "bbbbbbbb-0000-0000-0000-000000000000";
  equal((await handle(post(listAt(RATE_LIMIT_PER_MINUTE)))).status, 200);
});

Deno.test("rejected requests do not count against the limit", async () => {
  const cases: [Partial<Deps>, unknown, number][] = [
    [{ getUserId: () => Promise.resolve(null) }, LIST, 401],
    [{}, { ...LIST, radiusKm: 3 }, 400],
    [{}, { ...LIST, lat: 48.85, lng: 2.35 }, 400],
    [{ apiKey: undefined }, LIST, 500],
  ];
  for (const [overrides, body, status] of cases) {
    const { handle, hits } = setup(overrides);
    equal((await handle(post(body))).status, status);
    equal(hits.size, 0);
  }
});

Deno.test("cache hits and mock mode do not count against the limit", async () => {
  const { handle, hits } = setup();
  await handle(post(LIST));
  for (let i = 0; i < RATE_LIMIT_PER_MINUTE + 1; i++) {
    equal((await handle(post(LIST))).status, 200);
  }
  deepStrictEqual([...hits.values()], [1]);
  const mock = setup({ mock: true });
  await mock.handle(post(LIST));
  equal(mock.hits.size, 0);
});

Deno.test("a failing rate limiter does not block prices", async () => {
  const rateLimiter = { hit: () => Promise.reject(new Error("db down")) };
  const { handle, calls } = setup({ rateLimiter });
  const errors: unknown[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => void errors.push(args);
  try {
    for (let i = 0; i <= RATE_LIMIT_PER_MINUTE; i++) {
      equal((await handle(post(listAt(i)))).status, 200);
    }
  } finally {
    console.error = originalError;
  }
  equal(calls.length, RATE_LIMIT_PER_MINUTE + 1);
  equal(errors.length, RATE_LIMIT_PER_MINUTE + 1);
});
