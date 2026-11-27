import { supabase } from "@/lib/supabase";

// Repository for the active vehicle in the profiles table (M2, ADR 0012). The row is created by
// a trigger at sign-up; RLS lets the user read and update only their own row, and only with one
// of their own vehicles. Every function throws the Supabase error; the hooks show a text instead.

/**
 * The stored choice, or null if the user never chose, the vehicle was deleted or the profile
 * row is missing. A missing row must not block the app: the newest vehicle is the fallback.
 */
export async function getActiveVehicleId(): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("active_vehicle_id").maybeSingle();
  if (error) throw error;
  return data?.active_vehicle_id ?? null;
}

/** Stores the choice, so it survives a restart and other devices see it (M2). */
export async function setActiveVehicleId(vehicleId: string): Promise<void> {
  // Reads the stored session, no request. An update needs a filter, RLS alone is not one.
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session) throw new Error("Not signed in");

  // RLS hides foreign rows by returning none, so zero updated rows must not pass as success.
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ active_vehicle_id: vehicleId })
    .eq("id", data.session.user.id)
    .select("id");
  if (error) throw error;
  if (updated.length === 0) throw new Error("Profile not found");
}
