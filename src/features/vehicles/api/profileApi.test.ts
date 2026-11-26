import { getActiveVehicleId, setActiveVehicleId } from "./profileApi";

// Chainable stand-in for the Supabase query builder: every method records its call and returns
// the builder, awaiting it yields the prepared result.
const mockCalls: [string, unknown[]][] = [];
let mockResult: { data: unknown; error: unknown } = { data: null, error: null };
let mockSession: { data: unknown; error: unknown } = { data: { session: null }, error: null };

jest.mock("@/lib/supabase", () => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => resolve(mockResult),
    auth: { getSession: () => Promise.resolve(mockSession) },
  };
  for (const method of ["from", "select", "update", "eq", "maybeSingle"]) {
    builder[method] = (...args: unknown[]) => {
      mockCalls.push([method, args]);
      return builder;
    };
  }
  return { supabase: builder };
});

beforeEach(() => {
  mockCalls.length = 0;
  mockResult = { data: null, error: null };
  mockSession = { data: { session: { user: { id: "u1" } } }, error: null };
});

describe("getActiveVehicleId", () => {
  it("returns the stored id", async () => {
    mockResult = { data: { active_vehicle_id: "v1" }, error: null };
    await expect(getActiveVehicleId()).resolves.toBe("v1");
  });

  it("keeps null as null", async () => {
    mockResult = { data: { active_vehicle_id: null }, error: null };
    await expect(getActiveVehicleId()).resolves.toBeNull();
  });

  it("returns null if the profile row is missing", async () => {
    mockResult = { data: null, error: null };
    await expect(getActiveVehicleId()).resolves.toBeNull();
  });

  it("throws the Supabase error", async () => {
    mockResult = { data: null, error: new Error("offline") };
    await expect(getActiveVehicleId()).rejects.toThrow("offline");
  });
});

describe("setActiveVehicleId", () => {
  it("updates only the row of the signed-in user", async () => {
    mockResult = { data: [{ id: "u1" }], error: null };
    await setActiveVehicleId("v2");
    expect(mockCalls).toContainEqual(["update", [{ active_vehicle_id: "v2" }]]);
    expect(mockCalls).toContainEqual(["eq", ["id", "u1"]]);
  });

  it("throws without a session", async () => {
    mockSession = { data: { session: null }, error: null };
    await expect(setActiveVehicleId("v2")).rejects.toThrow("Not signed in");
  });

  it("throws if reading the session fails", async () => {
    mockSession = { data: { session: null }, error: new Error("storage") };
    await expect(setActiveVehicleId("v2")).rejects.toThrow("storage");
  });

  it("throws the update error", async () => {
    mockResult = { data: null, error: new Error("offline") };
    await expect(setActiveVehicleId("v2")).rejects.toThrow("offline");
  });

  it("throws if no row was updated", async () => {
    mockResult = { data: [], error: null };
    await expect(setActiveVehicleId("v2")).rejects.toThrow("Profile not found");
  });
});
