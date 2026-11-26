import { createRefueling, deleteRefueling, listRefuelings, updateRefueling } from "./refuelingsApi";
import type { RefuelingInput } from "../types";

// Minimal chainable stand-in for the Supabase query builder: every method records its call and
// returns the builder, awaiting it yields the prepared result.
const mockCalls: [string, unknown[]][] = [];
let mockResult: { data: unknown; error: unknown } = { data: null, error: null };

jest.mock("@/lib/supabase", () => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => resolve(mockResult),
  };
  for (const method of ["from", "select", "insert", "update", "delete", "eq", "order", "single"]) {
    builder[method] = (...args: unknown[]) => {
      mockCalls.push([method, args]);
      return builder;
    };
  }
  return { supabase: builder };
});

const input: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 41230,
  pricePerLiterTenthCents: 1749,
  totalCents: 7211,
  odometerKm: 55120,
  stationId: null,
  stationName: "Freie Tankstelle",
  stationAddress: null,
  isFullTank: false,
  previousMissed: true,
  note: null,
};
const row = {
  id: "r1",
  vehicle_id: "v1",
  refueled_on: "2026-11-20",
  volume_ml: 41230,
  price_per_liter_tenth_cents: 1749,
  total_cents: 7211,
  odometer_km: 55120,
  station_id: null,
  station_name: "Freie Tankstelle",
  station_address: null,
  is_full_tank: false,
  previous_missed: true,
  note: null,
  created_at: "2026-11-20T10:00:00Z",
};

const sentRow = (method: string) => mockCalls.find(([name]) => name === method)?.[1][0];

beforeEach(() => {
  mockCalls.length = 0;
  mockResult = { data: row, error: null };
});

describe("refuelingsApi", () => {
  it("keeps every field through row and refueling without swapping amounts", async () => {
    const created = await createRefueling("v1", input);
    const { id, created_at, ...sent } = row;
    expect(sentRow("insert")).toEqual(sent);
    expect(created).toEqual({ ...input, id, vehicleId: "v1", createdAt: created_at });
  });

  it("sends vehicle_id on create but not on update", async () => {
    await createRefueling("v1", input);
    await updateRefueling("r1", input);
    expect(sentRow("insert")).toHaveProperty("vehicle_id", "v1");
    expect(sentRow("update")).not.toHaveProperty("vehicle_id");
  });

  it("lists newest day first, then highest odometer", async () => {
    mockResult = { data: [row], error: null };
    await listRefuelings("v1");
    expect(mockCalls.filter(([name]) => name === "order")).toEqual([
      ["order", ["refueled_on", { ascending: false }]],
      ["order", ["odometer_km", { ascending: false }]],
    ]);
  });

  it("rethrows the original error object", async () => {
    const error = new Error("boom");
    mockResult = { data: null, error };
    await expect(listRefuelings("v1")).rejects.toBe(error);
    await expect(createRefueling("v1", input)).rejects.toBe(error);
    await expect(updateRefueling("r1", input)).rejects.toBe(error);
    await expect(deleteRefueling("r1")).rejects.toBe(error);
  });
});
