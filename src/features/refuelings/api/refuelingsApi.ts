import type { Tables, TablesInsert } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

import type { Refueling, RefuelingInput } from "../types";

// Repository for the refuelings table (ADR 0006). RLS only returns and changes refuelings of
// the signed-in user's vehicles (M14). Every function throws the Supabase error; the hooks and
// logic/saveError.ts turn it into a text.

/** A database row as the app's Refueling. The amounts keep their database units (ADR 0012). */
function toRefueling(row: Tables<"refuelings">): Refueling {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    refueledOn: row.refueled_on,
    volumeMl: row.volume_ml,
    pricePerLiterTenthCents: row.price_per_liter_tenth_cents,
    totalCents: row.total_cents,
    odometerKm: row.odometer_km,
    stationId: row.station_id,
    stationName: row.station_name,
    stationAddress: row.station_address,
    isFullTank: row.is_full_tank,
    previousMissed: row.previous_missed,
    note: row.note,
    createdAt: row.created_at,
  };
}

/** The columns the user sets; the vehicle is fixed when the refueling is created. */
function toRow(input: RefuelingInput): Omit<TablesInsert<"refuelings">, "vehicle_id"> {
  return {
    refueled_on: input.refueledOn,
    volume_ml: input.volumeMl,
    price_per_liter_tenth_cents: input.pricePerLiterTenthCents,
    total_cents: input.totalCents,
    odometer_km: input.odometerKm,
    station_id: input.stationId,
    station_name: input.stationName,
    station_address: input.stationAddress,
    is_full_tank: input.isFullTank,
    previous_missed: input.previousMissed,
    note: input.note,
  };
}

/**
 * All refuelings of one vehicle, newest first as the history shows them (M6). On the same day
 * the higher odometer is the later refueling (ADR 0012).
 */
export async function listRefuelings(vehicleId: string): Promise<Refueling[]> {
  const { data, error } = await supabase
    .from("refuelings")
    .select()
    .eq("vehicle_id", vehicleId)
    .order("refueled_on", { ascending: false })
    .order("odometer_km", { ascending: false });
  if (error) throw error;
  return data.map(toRefueling);
}

/** Saves a new refueling and returns it as stored, with id and creation time. */
export async function createRefueling(
  vehicleId: string,
  input: RefuelingInput,
): Promise<Refueling> {
  const { data, error } = await supabase
    .from("refuelings")
    .insert({ ...toRow(input), vehicle_id: vehicleId })
    .select()
    .single();
  if (error) throw error;
  return toRefueling(data);
}

/** Overwrites every user field of a refueling and returns it as stored. */
export async function updateRefueling(id: string, input: RefuelingInput): Promise<Refueling> {
  const { data, error } = await supabase
    .from("refuelings")
    .update(toRow(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toRefueling(data);
}

export async function deleteRefueling(id: string): Promise<void> {
  const { error } = await supabase.from("refuelings").delete().eq("id", id);
  if (error) throw error;
}
