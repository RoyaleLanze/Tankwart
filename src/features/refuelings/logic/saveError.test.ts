import { isAlreadySaved, isRefuelingGone, saveErrorKind, saveFieldError } from "./saveError";

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

  it("recognizes a German server message that names the primary key", () => {
    const message = "doppelter Schlüsselwert verletzt Unique-Constraint »refuelings_pkey«";
    expect(isAlreadySaved({ code: "23505", message })).toBe(true);
  });

  it("recognizes an error class instance with details, as the Supabase client throws it", () => {
    class PostgrestLikeError extends Error {
      code = "23505";
      details = "Key (id)=(r1) already exists.";
      hint = null;
    }
    expect(isAlreadySaved(new PostgrestLikeError(duplicateId.message))).toBe(true);
  });

  it("ignores the day and odometer constraint, other codes and non-errors", () => {
    expect(isAlreadySaved(duplicateDayOdometer)).toBe(false);
    expect(isAlreadySaved({ ...duplicateId, code: "23514" })).toBe(false);
    expect(isAlreadySaved({ code: "23505" })).toBe(false);
    expect(isAlreadySaved({ message: duplicateId.message })).toBe(false);
    expect(isAlreadySaved(new TypeError("Network request failed"))).toBe(false);
    expect(isAlreadySaved(null)).toBe(false);
  });

  it("ignores a numeric code and a constraint name that is only in details", () => {
    expect(isAlreadySaved({ ...duplicateId, code: 23505 })).toBe(false);
    expect(isAlreadySaved({ code: "23505", message: "conflict", details: "refuelings_pkey" })).toBe(
      false,
    );
  });

  it.each([undefined, "23505", { code: "23505", message: 42 }])("returns false for %p", (error) => {
    expect(isAlreadySaved(error)).toBe(false);
  });

  it.each([
    ["duplicate id", duplicateId],
    ["duplicate day and odometer", duplicateDayOdometer],
    ["check violation", { code: "23514", message: "violates check constraint" }],
    ["network failure", new TypeError("Network request failed")],
    ["no error object", null],
  ])("never fires together with saveFieldError for a %s", (_name, error) => {
    expect(isAlreadySaved(error) && saveFieldError(error) !== null).toBe(false);
  });
});

describe("isRefuelingGone", () => {
  // What `.single()` returns when an update or read matches no row (deleted, or hidden by RLS).
  const noRow = {
    code: "PGRST116",
    details: "The result contains 0 rows",
    hint: null,
    message: "Cannot coerce the result to a single JSON object",
  };

  it("recognizes PGRST116, also on an Error carrying the code", () => {
    expect(isRefuelingGone(noRow)).toBe(true);
    expect(isRefuelingGone(Object.assign(new Error(noRow.message), { code: "PGRST116" }))).toBe(
      true,
    );
  });

  it("is the gone kind, not network and not rejected", () => {
    expect(saveErrorKind(noRow)).toBe("gone");
  });

  it("ignores other PostgREST codes, other errors and non-errors", () => {
    expect(isRefuelingGone({ code: "PGRST303", message: "JWT expired" })).toBe(false);
    expect(isRefuelingGone({ code: "23514", message: "check" })).toBe(false);
    expect(isRefuelingGone({ code: 116 })).toBe(false);
    expect(isRefuelingGone({ message: noRow.message })).toBe(false);
    expect(isRefuelingGone(new TypeError("Network request failed"))).toBe(false);
    expect(isRefuelingGone(null)).toBe(false);
    expect(isRefuelingGone("PGRST116")).toBe(false);
  });
});
