import type { RefuelingFields } from "./logic/schema";

/**
 * What the user enters when adding or editing a refueling: the fields the schema validates
 * (M4) plus station, full tank flag and note. Amounts are whole numbers in database units
 * (ADR 0012): ml, tenths of a cent per liter, cents, km.
 */
export type RefuelingInput = RefuelingFields & {
  /** Tankerkönig station id; null when the station was typed in as free text (M5). */
  stationId: string | null;
  stationName: string;
  stationAddress: string | null;
  isFullTank: boolean;
  previousMissed: boolean;
  note: string | null;
};

/** A stored refueling. Fits the inputs of the consumption and statistics logic as it is. */
export type Refueling = RefuelingInput & {
  id: string;
  vehicleId: string;
  createdAt: string;
};
