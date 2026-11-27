import { isAlreadySaved, saveErrorKind, saveFieldError } from "./saveError";

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
    ["integrity violation (23)", { code: "23514", message: "violates check constraint" }],
    ["data exception (22)", { code: "22003", message: "integer out of range" }],
    ["Error carrying a code", Object.assign(new Error("rejected"), { code: "23514" })],
  ])("treats %s as rejected data", (_name, error) => {
    expect(saveErrorKind(error)).toBe("rejected");
  });

  it.each([
    // What postgrest-js returns when fetch fails (React Native wording).
    [
      "failed fetch as postgrest-js reports it",
      { message: "TypeError: Network request failed", details: "", hint: "", code: "" },
    ],
    ["PostgREST JWT error (PGRST303)", { code: "PGRST303", message: "JWT expired" }],
    ["statement timeout (57014)", { code: "57014", message: "canceling statement" }],
    ["connection failure (08006)", { code: "08006", message: "connection failure" }],
    ["thrown TypeError", new TypeError("Network request failed")],
    ["Error without code", new Error("x")],
    ["non-JSON error body such as a proxy page", { message: "<html>Bad Gateway</html>" }],
    ["numeric code", { code: 23514, message: "x" }],
    ["null", null],
  ])("treats %s as network", (_name, error) => {
    expect(saveErrorKind(error)).toBe("network");
  });

  // A repeated insert with the same id hits refuelings_pkey. Without a row to find (see
  // isAlreadySaved) it stays a rejection.
  it("reports a duplicate id as rejected data, with no field error", () => {
    const duplicateId = { code: "23505", message: 'violates unique constraint "refuelings_pkey"' };
    expect(saveFieldError(duplicateId)).toBeNull();
    expect(saveErrorKind(duplicateId)).toBe("rejected");
  });
});

describe("isAlreadySaved", () => {
  const duplicateId = {
    code: "23505",
    message: 'duplicate key value violates unique constraint "refuelings_pkey"',
  };

  it("recognizes a duplicate id", () => {
    expect(isAlreadySaved(duplicateId)).toBe(true);
    expect(isAlreadySaved(Object.assign(new Error(duplicateId.message), { code: "23505" }))).toBe(
      true,
    );
  });

  it("ignores the day and odometer constraint, other codes and non-errors", () => {
    expect(isAlreadySaved(duplicateDayOdometer)).toBe(false);
    expect(isAlreadySaved({ ...duplicateId, code: "23514" })).toBe(false);
    expect(isAlreadySaved({ code: "23505" })).toBe(false);
    expect(isAlreadySaved({ message: duplicateId.message })).toBe(false);
    expect(isAlreadySaved(new TypeError("Network request failed"))).toBe(false);
    expect(isAlreadySaved(null)).toBe(false);
  });
});
