// Thin client for the Tankerkönig API (https://creativecommons.tankerkoenig.de).
const BASE_URL = "https://creativecommons.tankerkoenig.de/json";
const TIMEOUT_MS = 8000;

export class UpstreamError extends Error {}
// detail.php answers an unknown station id with ok:false or without a station.
export class StationNotFoundError extends Error {}

export type Fetch = typeof fetch;

// Calls list.php or detail.php and returns the JSON body without the `ok` flag.
export async function callTankerkoenig(
  fetchFn: Fetch,
  apiKey: string,
  endpoint: "list" | "detail",
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({ ...params, apikey: apiKey });
  let response: Response;
  try {
    response = await fetchFn(`${BASE_URL}/${endpoint}.php?${query}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    // Only the error name: Deno puts the full URL, including the API key, into the message.
    throw new UpstreamError(`Tankerkoenig not reachable: ${(cause as Error).name}`);
  }
  if (!response.ok) throw new UpstreamError(`Tankerkoenig HTTP ${response.status}`);
  const body: unknown = await response.json().catch(() => null);
  if (!isRecord(body)) throw new UpstreamError("Tankerkoenig sent no JSON object");
  const { ok, ...data } = body;
  if (endpoint === "detail" && (ok !== true || data.station == null)) {
    throw new StationNotFoundError(`Station ${params.id} not found`);
  }
  if (ok !== true) throw new UpstreamError(`Tankerkoenig error: ${String(data.message)}`);
  const valid = endpoint === "list" ? Array.isArray(data.stations) : isRecord(data.station);
  if (!valid) throw new UpstreamError(`Tankerkoenig ${endpoint} response is malformed`);
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
