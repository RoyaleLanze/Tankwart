import { formStateOf } from "./saveOutcome";

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
});
