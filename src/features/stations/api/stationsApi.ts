import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import { pricesErrorCode, type StationsErrorCode } from "../logic/pricesErrors";
import type { StationList, StationSearch } from "../types";
import { parseStationList } from "./pricesResponse";

// Repository for fuel prices (ADR 0005, 0006): the only place that calls the prices function.
// supabase-js sends the user's token along; the function rejects calls without one.

/** A failed price request with its code; messages.ts has the text for the user (ADR 0014). */
export class StationsError extends Error {
  constructor(
    readonly code: StationsErrorCode,
    options?: ErrorOptions,
  ) {
    super(`Prices request failed: ${code}`, options);
    this.name = "StationsError";
  }
}

/** Stations in the radius with all three prices. Throws a StationsError. */
export async function searchStations({ position, radiusKm }: StationSearch): Promise<StationList> {
  const { data, error } = await supabase.functions.invoke("prices", {
    body: { action: "list", lat: position.lat, lng: position.lng, radiusKm },
  });
  if (error) throw new StationsError(await errorCode(error), { cause: error });
  try {
    return parseStationList(data);
  } catch (cause) {
    throw new StationsError("unknown", { cause });
  }
}

async function errorCode(error: unknown): Promise<StationsErrorCode> {
  if (error instanceof FunctionsFetchError) return "network";
  if (!(error instanceof FunctionsHttpError)) return "unknown";
  // For a non-2xx answer the context is the Response, whose body is { error: code }.
  const response: Response = error.context;
  const body: unknown = await response.json().catch(() => null);
  return pricesErrorCode(body);
}
