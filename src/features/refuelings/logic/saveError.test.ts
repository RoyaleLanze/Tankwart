import { saveFieldError } from "./saveError";

// Same shape as the error local Supabase returns for a duplicate insert.
const duplicateDayOdometer = {
  code: "23505",
  details: null,
  hint: null,
  message: 'duplicate key value violates unique constraint "refuelings_vehicle_day_odometer_key"',
};

describe("saveFieldError", () => {
  it("puts a duplicate day and odometer at the odometer field", () => {
    expect(saveFieldError(duplicateDayOdometer)).toEqual({
      field: "odometerKm",
      code: "odometerDuplicateSameDay",
    });
  });

  it("ignores other unique constraints", () => {
    const other = { code: "23505", message: 'violates unique constraint "refuelings_pkey"' };
    expect(saveFieldError(other)).toBeNull();
  });

  it("ignores other errors that name the constraint", () => {
    expect(saveFieldError({ ...duplicateDayOdometer, code: "42501" })).toBeNull();
  });

  it.each([
    null,
    undefined,
    "23505",
    new TypeError("Network request failed"),
    { code: "23505" },
    { code: "23505", message: 42 },
  ])("returns null for %p", (error) => {
    expect(saveFieldError(error)).toBeNull();
  });
});
