import type { Vehicle } from "../types";

/**
 * The vehicle the app works with (M2). The profile stores the user's choice. If there is none
 * yet, or the chosen vehicle was deleted (ON DELETE SET NULL), the most recently added vehicle
 * is active (ADR 0012). Undefined only without any vehicle.
 */
export function pickActiveVehicle(
  vehicles: readonly Vehicle[],
  activeVehicleId: string | null,
): Vehicle | undefined {
  const chosen = vehicles.find((vehicle) => vehicle.id === activeVehicleId);
  if (chosen) return chosen;
  // ISO timestamps compare correctly as strings; on a tie the later one in the list wins.
  return vehicles.reduce<Vehicle | undefined>(
    (latest, vehicle) => (!latest || vehicle.createdAt >= latest.createdAt ? vehicle : latest),
    undefined,
  );
}
