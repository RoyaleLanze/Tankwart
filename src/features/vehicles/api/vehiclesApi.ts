import type { Tables, TablesInsert } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

import type { Vehicle, VehicleInput } from "../types";

// Repository for the vehicles table (ADR 0006). RLS returns and changes only the signed-in
// user's rows (M14). Every function throws the Supabase error; the hooks show a text instead.

/** A database row as the app's Vehicle. The amounts keep their database units (ADR 0012). */
function toVehicle(row: Tables<"vehicles">): Vehicle {
  return {
    id: row.id,
    name: row.name,
    fuelType: row.fuel_type,
    initialOdometerKm: row.initial_odometer_km,
    tankCapacityMl: row.tank_capacity_ml,
    makeModel: row.make_model,
    licensePlate: row.license_plate,
    manufacturerConsumptionMlPer100Km: row.manufacturer_consumption_ml_per_100km,
    createdAt: row.created_at,
  };
}

/** Only the columns the user sets, so id, user_id and created_at can never be sent. */
type VehicleRow = Omit<TablesInsert<"vehicles">, "id" | "user_id" | "created_at">;

/** The columns the user sets. user_id is filled in by the database (default auth.uid()). */
function toRow(input: VehicleInput): VehicleRow {
  return {
    name: input.name,
    fuel_type: input.fuelType,
    initial_odometer_km: input.initialOdometerKm,
    tank_capacity_ml: input.tankCapacityMl,
    make_model: input.makeModel,
    license_plate: input.licensePlate,
    manufacturer_consumption_ml_per_100km: input.manufacturerConsumptionMlPer100Km,
  };
}

/** All vehicles of the signed-in user, oldest first; the id keeps the order stable on ties. */
export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from("vehicles").select().order("created_at").order("id");
  if (error) throw error;
  return data.map(toVehicle);
}

/** Saves a new vehicle and returns it as stored, with id and creation time. */
export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase.from("vehicles").insert(toRow(input)).select().single();
  if (error) throw error;
  return toVehicle(data);
}

/**
 * Replaces the user's values of a vehicle and returns it as stored. A vehicle that is gone or
 * belongs to someone else matches no row, so `single()` fails and the error is thrown.
 */
export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(toRow(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toVehicle(data);
}
