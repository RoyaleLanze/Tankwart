// Request handling for the prices function: auth, input validation, mock mode, cache, errors.
// All IO is injected, so the Deno tests run without network, database or API key.
import { mockDetail, mockList } from "./mock.ts";
import { callTankerkoenig, type Fetch, UpstreamError } from "./tankerkoenig.ts";

export const RADIUS_OPTIONS_KM = [2, 5, 10, 25];
// Tankerkönig asks clients not to request the same data more often than every 5 minutes.
export const CACHE_TTL_MS = 5 * 60 * 1000;
// About 100 m; nearby requests share one cache entry.
const COORDINATE_DECIMALS = 3;
// Tankerkönig only covers Germany; this bounding box keeps the cache key space small.
export const GERMANY_BOUNDS = { minLat: 47.2, maxLat: 55.1, minLng: 5.8, maxLng: 15.1 };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PricesRequest =
  | { action: "list"; lat: number; lng: number; radiusKm: number }
  | { action: "detail"; stationId: string };

// Returned as { error: code }; the app maps codes to German texts (ADR 0014).
export type PricesErrorCode =
  | "methodNotAllowed"
  | "unauthorized"
  | "invalidInput"
  | "outsideGermany"
  | "stationNotFound"
  | "missingApiKey"
  | "upstreamUnavailable"
  | "internalError";

export type CacheEntry = { payload: Record<string, unknown>; fetchedAt: Date };

export interface PriceCache {
  read(key: string): Promise<CacheEntry | null>;
  write(key: string, entry: CacheEntry): Promise<void>;
  deleteOlderThan(cutoff: Date): Promise<void>;
}

export type Deps = {
  isAuthenticated: (req: Request) => Promise<boolean>;
  cache: PriceCache;
  fetch: Fetch;
  apiKey: string | undefined;
  mock: boolean;
  now: () => Date;
};

export function createHandler(deps: Deps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method !== "POST") return errorResponse(405, "methodNotAllowed");
    if (!(await deps.isAuthenticated(req))) return errorResponse(401, "unauthorized");
    const input = parseRequest(await req.json().catch(() => null));
    if (!input) return errorResponse(400, "invalidInput");
    if (input.action === "list" && !isInGermany(input.lat, input.lng)) {
      return errorResponse(400, "outsideGermany");
    }
    if (deps.mock) return mockResponse(input, deps.now());
    if (!deps.apiKey) return errorResponse(500, "missingApiKey");
    try {
      const { payload, fetchedAt } = await loadWithCache(deps, deps.apiKey, input);
      return jsonResponse(200, { ...payload, fetchedAt: fetchedAt.toISOString() });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      if (error instanceof UpstreamError) return errorResponse(502, "upstreamUnavailable");
      return errorResponse(500, "internalError");
    }
  };
}

function parseRequest(body: unknown): PricesRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const { action, lat, lng, radiusKm, stationId } = body as Record<string, unknown>;
  if (action === "list") {
    if (!isNumberInRange(lat, -90, 90) || !isNumberInRange(lng, -180, 180)) return null;
    if (typeof radiusKm !== "number" || !RADIUS_OPTIONS_KM.includes(radiusKm)) return null;
    return { action, lat, lng, radiusKm };
  }
  if (action === "detail" && typeof stationId === "string" && UUID_PATTERN.test(stationId)) {
    return { action, stationId: stationId.toLowerCase() };
  }
  return null;
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && value >= min && value <= max;
}

function isInGermany(lat: number, lng: number): boolean {
  const { minLat, maxLat, minLng, maxLng } = GERMANY_BOUNDS;
  return isNumberInRange(lat, minLat, maxLat) && isNumberInRange(lng, minLng, maxLng);
}

function mockResponse(input: PricesRequest, now: Date): Response {
  const payload =
    input.action === "list"
      ? mockList(input.lat, input.lng, input.radiusKm)
      : mockDetail(input.stationId);
  if (!payload) return errorResponse(404, "stationNotFound");
  return jsonResponse(200, { ...payload, fetchedAt: now.toISOString() });
}

async function loadWithCache(deps: Deps, apiKey: string, input: PricesRequest) {
  const { key, endpoint, params } = toUpstreamRequest(input);
  const now = deps.now();
  const cached = await deps.cache.read(key);
  if (cached && now.getTime() - cached.fetchedAt.getTime() < CACHE_TTL_MS) return cached;
  const entry = {
    payload: await callTankerkoenig(deps.fetch, apiKey, endpoint, params),
    fetchedAt: now,
  };
  await deps.cache.write(key, entry);
  // Housekeeping: expired entries of other keys are never read again.
  await deps.cache.deleteOlderThan(new Date(now.getTime() - CACHE_TTL_MS));
  return entry;
}

function toUpstreamRequest(input: PricesRequest) {
  if (input.action === "detail") {
    const params = { id: input.stationId };
    return { key: `detail:${input.stationId}`, endpoint: "detail" as const, params };
  }
  const lat = input.lat.toFixed(COORDINATE_DECIMALS);
  const lng = input.lng.toFixed(COORDINATE_DECIMALS);
  const rad = String(input.radiusKm);
  // type=all returns E5, E10 and Diesel at once, so switching the fuel needs no new request.
  const params = { lat, lng, rad, type: "all", sort: "dist" };
  return { key: `list:${lat}:${lng}:${rad}`, endpoint: "list" as const, params };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, error: PricesErrorCode): Response {
  return jsonResponse(status, { error });
}
