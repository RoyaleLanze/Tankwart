// Thin client for the Tankerkönig API (https://creativecommons.tankerkoenig.de).
const BASE_URL = "https://creativecommons.tankerkoenig.de/json";
const TIMEOUT_MS = 8000;

export class UpstreamError extends Error {}

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
  const body = await response.json().catch(() => null);
  if (body?.ok !== true) throw new UpstreamError(`Tankerkoenig error: ${body?.message}`);
  const { ok: _ok, ...data } = body;
  return data;
}
