import type { SaveFieldError } from "./saveError";
import { formStateOf, type SaveOutcome } from "./saveOutcome";

describe("formStateOf", () => {
  it("leaves with no error after a save", () => {
    expect(formStateOf({ status: "saved" })).toEqual({ saved: true, error: null });
  });

  it("puts a field error at the field and focuses it", () => {
    const state = formStateOf({
      status: "fieldError",
      error: { field: "odometerKm", code: "odometerDuplicateSameDay" },
    });
    expect(state).toEqual({
      saved: false,
      error: { name: "odometerKm", message: "odometerDuplicateSameDay", shouldFocus: true },
    });
  });

  it("uses the form field name for a unit field, not the database name", () => {
    const state = formStateOf({
      status: "fieldError",
      error: { field: "volumeMl", code: "odometerDuplicateSameDay" },
    });
    expect(state.error?.name).toBe("volumeLiters");
  });

  it("shows a failed save on root without moving the focus", () => {
    expect(formStateOf({ status: "failed", message: "Kein Netz" })).toEqual({
      saved: false,
      error: { name: "root", message: "Kein Netz", shouldFocus: false },
    });
  });

  it("shows differs on root and does not count as saved", () => {
    expect(formStateOf({ status: "differs", message: "Anders gespeichert" })).toEqual({
      saved: false,
      error: { name: "root", message: "Anders gespeichert", shouldFocus: false },
    });
  });

  it.each<[SaveFieldError["field"], string]>([
    ["refueledOn", "refueledOn"],
    ["volumeMl", "volumeLiters"],
    ["pricePerLiterTenthCents", "pricePerLiter"],
    ["totalCents", "totalEuros"],
    ["odometerKm", "odometerKm"],
    ["stationName", "stationName"],
  ])("maps the database field %s to the form field %s and focuses it", (field, formField) => {
    const state = formStateOf({
      status: "fieldError",
      error: { field, code: "valueTooLarge" },
    });
    expect(state.error).toEqual({ name: formField, message: "valueTooLarge", shouldFocus: true });
  });

  it("focuses a field only for a field error and reports saved only for saved", () => {
    const outcomes: SaveOutcome[] = [
      { status: "saved" },
      { status: "fieldError", error: { field: "odometerKm", code: "odometerDuplicateSameDay" } },
      { status: "differs", message: "Anders gespeichert" },
      { status: "failed", message: "Kein Netz" },
    ];
    const states = outcomes.map((outcome) => ({
      status: outcome.status,
      saved: formStateOf(outcome).saved,
      shouldFocus: formStateOf(outcome).error?.shouldFocus ?? false,
    }));
    expect(states).toEqual([
      { status: "saved", saved: true, shouldFocus: false },
      { status: "fieldError", saved: false, shouldFocus: true },
      { status: "differs", saved: false, shouldFocus: false },
      { status: "failed", saved: false, shouldFocus: false },
    ]);
  });
});
