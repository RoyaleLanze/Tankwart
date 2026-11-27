import { saveErrorKind, saveFieldError } from "./saveError";

// Same shape as the error local Supabase returns for a duplicate insert.
const duplicateDayOdometer = {
  code: "23505",
  details: null,
  hint: null,
  message: 'duplicate key value violates unique constraint "refuelings_vehicle_day_odometer_key"',
};

const odometerError = { field: "odometerKm", code: "odometerDuplicateSameDay" };
const realisticDetails =
  "Key (vehicle_id, refueled_on, odometer_km)=(v1, 2026-11-20, 55120) already exists.";

describe("saveFieldError", () => {
  it("puts a duplicate day and odometer at the odometer field", () => {
    expect(saveFieldError(duplicateDayOdometer)).toEqual(odometerError);
  });

  it("maps an error class instance, as the Supabase client throws it", () => {
    class PostgrestLikeError extends Error {
      code = "23505";
      details = realisticDetails;
      hint = null;
    }
    expect(saveFieldError(new PostgrestLikeError(duplicateDayOdometer.message))).toEqual(
      odometerError,
    );
  });

  it("maps a native Error that carries code and constraint name", () => {
    const error = Object.assign(new Error(duplicateDayOdometer.message), { code: "23505" });
    expect(saveFieldError(error)).toEqual(odometerError);
  });

  it("maps the realistic details text next to the constraint message", () => {
    expect(saveFieldError({ ...duplicateDayOdometer, details: realisticDetails })).toEqual(
      odometerError,
    );
  });

  it("maps a German server message that names the constraint", () => {
    const message =
      "doppelter Schlüsselwert verletzt Unique-Constraint »refuelings_vehicle_day_odometer_key«";
    expect(saveFieldError({ code: "23505", message })).toEqual(odometerError);
  });

  it("ignores a constraint name that is only in details", () => {
    const error = {
      code: "23505",
      message: "conflict",
      details: "refuelings_vehicle_day_odometer_key",
    };
    expect(saveFieldError(error)).toBeNull();
  });

  it("ignores a numeric code and a check violation", () => {
    expect(saveFieldError({ ...duplicateDayOdometer, code: 23505 })).toBeNull();
    expect(saveFieldError({ ...duplicateDayOdometer, code: "23514" })).toBeNull();
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

describe("saveErrorKind", () => {
  it.each([
    ["check violation", { code: "23514", message: "violates check constraint" }],
    ["numeric overflow", { code: "22003", message: "integer out of range" }],
    ["unique violation", duplicateDayOdometer],
    ["row level security", { code: "42501", message: "permission denied" }],
    ["PostgREST code", { code: "PGRST116", message: "JSON object requested" }],
    ["Error with code", Object.assign(new Error("rejected"), { code: "23514" })],
  ])("treats %s as rejected by the server", (_name, error) => {
    expect(saveErrorKind(error)).toBe("rejected");
  });

  it.each([
    // What postgrest-js returns when fetch fails (React Native wording).
    [
      "failed fetch as postgrest-js reports it",
      { message: "TypeError: Network request failed", details: "", hint: "", code: "" },
    ],
    ["aborted request", { message: "AbortError: aborted", details: "", hint: "", code: "" }],
    ["thrown TypeError", new TypeError("Network request failed")],
    ["non-JSON error body such as a proxy page", { message: "<html>Bad Gateway</html>" }],
    ["numeric code", { code: 23514, message: "x" }],
    ["null code", { code: null, message: "x" }],
    ["null", null],
    ["undefined", undefined],
    ["string", "23514"],
  ])("treats %s as network", (_name, error) => {
    expect(saveErrorKind(error)).toBe("network");
  });
});
