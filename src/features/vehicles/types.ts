import type { Database } from "@/lib/database.types";

/** Super E5, Super E10 or Diesel (M1), the sorts Tankerkönig reports. */
export type FuelType = Database["public"]["Enums"]["fuel_type"];

/** A vehicle as the app uses it. Amounts are whole numbers in the database units (ADR 0012). */
export type Vehicle = {
  id: string;
  name: string;
  fuelType: FuelType;
  /** Odometer when the vehicle was added; the current one comes from the latest refueling. */
  initialOdometerKm: number;
  tankCapacityMl: number;
  makeModel: string | null;
  licensePlate: string | null;
  manufacturerConsumptionMlPer100Km: number | null;
  createdAt: string;
};

/** What the user enters when adding or editing a vehicle. */
export type VehicleInput = Omit<Vehicle, "id" | "createdAt">;
