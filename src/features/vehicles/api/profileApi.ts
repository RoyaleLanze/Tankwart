import { supabase } from "@/lib/supabase";

// Repository for the active vehicle in the profiles table (M2, ADR 0012). The row is created by
// a trigger at sign-up; RLS lets the user read and update only their own row, and only with one
// of their own vehicles. Every function throws the Supabase error; the hooks show a text instead.

/** The stored choice, or null if the user never chose or the vehicle was deleted. */
export async function getActiveVehicleId(): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("active_vehicle_id").single();
  if (error) throw error;
  return data.active_vehicle_id;
}

/** Stores the choice, so it survives a restart and other devices see it (M2). */
export async function setActiveVehicleId(vehicleId: string): Promise<void> {
  // Reads the stored session, no request. An update needs a filter, RLS alone is not one.
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session) throw new Error("Not signed in");

  const { error } = await supabase
    .from("profiles")
    .update({ active_vehicle_id: vehicleId })
    .eq("id", data.session.user.id);
  if (error) throw error;
}
