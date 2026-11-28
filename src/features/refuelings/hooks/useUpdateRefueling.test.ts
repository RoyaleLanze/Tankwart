import { updateRefueling } from "../api/refuelingsApi";
import { SAVE_ERROR_TEXT, SAVE_REJECTED_TEXT } from "../messages";
import type { Refueling, RefuelingInput } from "../types";
import { useUpdateRefueling } from "./useUpdateRefueling";

// Factory mocks: automocking would load the Supabase client. The hook only calls
// useInvalidateRefuelings (mocked here), so it can run without a React renderer.
jest.mock("../api/refuelingsApi", () => ({ updateRefueling: jest.fn() }));
const mockInvalidate = jest.fn();
jest.mock("./useRefuelings", () => ({ useInvalidateRefuelings: () => mockInvalidate }));
const updateMock = jest.mocked(updateRefueling);

const input: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 41230,
  pricePerLiterTenthCents: 1749,
  totalCents: 7211,
  odometerKm: 55120,
  stationId: null,
  stationName: "Aral",
  stationAddress: null,
  isFullTank: true,
  previousMissed: false,
  note: null,
};
const stored: Refueling = { ...input, id: "r1", vehicleId: "v1", createdAt: "2026-11-20" };

describe("useUpdateRefueling", () => {
  // The hook calls no React hook except the mocked one, so it is a plain factory here.
  const createSave = useUpdateRefueling;
  const save = () => createSave("v1", "r1")(input);

  beforeEach(() => {
    updateMock.mockReset();
    mockInvalidate.mockReset();
  });

  it("saves the input under the id and loads the list once", async () => {
    updateMock.mockResolvedValue(stored);
    await expect(save()).resolves.toEqual({ status: "saved" });
    expect(updateMock).toHaveBeenCalledWith("r1", input);
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("reports a refueling that is gone and loads the list once, so it disappears", async () => {
    updateMock.mockRejectedValue({ code: "PGRST116", message: "0 rows" });
    const outcome = await save();
    expect(outcome).toMatchObject({ status: "failed" });
    expect(outcome).toHaveProperty("message", expect.stringContaining("gibt es nicht mehr"));
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
  });

  it("reports a network failure and does not load the list", async () => {
    updateMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(save()).resolves.toEqual({ status: "failed", message: SAVE_ERROR_TEXT });
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  it("reports rejected data and does not load the list", async () => {
    updateMock.mockRejectedValue({ code: "23514", message: "check" });
    await expect(save()).resolves.toEqual({ status: "failed", message: SAVE_REJECTED_TEXT });
    expect(mockInvalidate).not.toHaveBeenCalled();
  });

  it("puts a duplicate day and odometer at the odometer field, without loading the list", async () => {
    updateMock.mockRejectedValue({
      code: "23505",
      message:
        'duplicate key value violates unique constraint "refuelings_vehicle_day_odometer_key"',
    });
    await expect(save()).resolves.toEqual({
      status: "fieldError",
      error: { field: "odometerKm", code: "odometerDuplicateSameDay" },
    });
    expect(mockInvalidate).not.toHaveBeenCalled();
  });
});
