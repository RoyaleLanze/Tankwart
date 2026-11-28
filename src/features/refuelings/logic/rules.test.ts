import { distanceWarning, odometerError, withoutRefueling, type RefuelingContext } from "./rules";

const FORM_ID = "11111111-1111-4111-8111-111111111111";
const saved = { id: FORM_ID, refueledOn: "2026-11-20", odometerKm: 84_500 };
const other = {
  id: "22222222-2222-4222-8222-222222222222",
  refueledOn: "2026-11-10",
  odometerKm: 84_000,
};

type Row = { id: string; refueledOn: string; odometerKm: number };

function contextWith(refuelings: readonly Row[]): RefuelingContext {
  return {
    today: () => "2026-11-25",
    tankCapacityMl: 50_000,
    initialOdometerKm: 80_000,
    otherRefuelings: withoutRefueling(refuelings, FORM_ID),
  };
}

describe("withoutRefueling", () => {
  it("drops the row with the given id and keeps the others", () => {
    expect(withoutRefueling([saved, other], FORM_ID)).toEqual([other]);
  });

  it("returns everything if no row has the id", () => {
    expect(withoutRefueling([other], FORM_ID)).toEqual([other]);
  });

  it("returns an empty list for an empty list", () => {
    expect(withoutRefueling([], FORM_ID)).toEqual([]);
  });

  it("drops every row that has the id", () => {
    const duplicate = { ...saved, odometerKm: 90_000 };
    expect(withoutRefueling([saved, other, duplicate], FORM_ID)).toEqual([other]);
  });

  it("does not mutate the input and keeps the order", () => {
    const third = { ...other, id: "33333333-3333-4333-8333-333333333333" };
    const input = [other, saved, third];
    const result = withoutRefueling(input, FORM_ID);
    expect(input).toEqual([other, saved, third]);
    expect(result).toEqual([other, third]);
  });

  it("keeps the same objects, including extra fields", () => {
    const withExtra = { ...other, stationName: "Aral" };
    const rows: (Row & { stationName?: string })[] = [saved, withExtra];
    const [kept] = withoutRefueling(rows, FORM_ID);
    expect(kept).toBe(withExtra);
    expect(kept.stationName).toBe("Aral");
  });
});

describe("retry after a lost save response", () => {
  it("does not report the already saved row (same day, same odometer) as duplicate", () => {
    const context = contextWith([saved, other]);
    expect(odometerError(saved.odometerKm, saved.refueledOn, context)).toBeNull();
  });

  it("does not report the saved row as neighbour (earlier date, same odometer)", () => {
    const context = contextWith([saved, other]);
    expect(odometerError(saved.odometerKm, "2026-11-21", context)).toBeNull();
  });

  it("still rejects the same reading from a different row on the same day", () => {
    const clash = { ...other, refueledOn: saved.refueledOn, odometerKm: saved.odometerKm };
    const context = contextWith([clash]);
    expect(odometerError(saved.odometerKm, saved.refueledOn, context)).toBe(
      "odometerDuplicateSameDay",
    );
  });

  it("does not report the saved row as neighbour (new date earlier, same odometer)", () => {
    const context = contextWith([saved, other]);
    expect(odometerError(saved.odometerKm, "2026-11-19", context)).toBeNull();
  });

  it("would report the saved row as duplicate if it were not removed from the context", () => {
    const context: RefuelingContext = { ...contextWith([]), otherRefuelings: [saved, other] };
    expect(odometerError(saved.odometerKm, saved.refueledOn, context)).toBe(
      "odometerDuplicateSameDay",
    );
  });

  it("keeps the error when a different row clashes next to the saved row", () => {
    const clash = {
      id: "44444444-4444-4444-8444-444444444444",
      refueledOn: saved.refueledOn,
      odometerKm: saved.odometerKm,
    };
    const context = contextWith([saved, clash, other]);
    expect(odometerError(saved.odometerKm, saved.refueledOn, context)).toBe(
      "odometerDuplicateSameDay",
    );
  });
});

describe("editing a refueling in the history", () => {
  const a = { id: "a", refueledOn: "2026-10-01", odometerKm: 80_500 };
  const b = { id: "b", refueledOn: "2026-10-10", odometerKm: 81_000 };
  const c = { id: "c", refueledOn: "2026-10-20", odometerKm: 81_500 };

  /** Context for editing the row with this id: all others, without the edited one. */
  function editing(id: string): RefuelingContext {
    return contextWith([a, b, c].map((row) => ({ ...row, id: row.id === id ? FORM_ID : row.id })));
  }

  it("allows the middle row an odometer between its neighbours", () => {
    expect(odometerError(81_200, b.refueledOn, editing("b"))).toBeNull();
  });

  it("allows the middle row to keep its own odometer", () => {
    expect(odometerError(b.odometerKm, b.refueledOn, editing("b"))).toBeNull();
  });

  it("rejects a date after the next row if the odometer stays", () => {
    expect(odometerError(b.odometerKm, "2026-10-21", editing("b"))).toBe(
      "odometerNotAbovePrevious",
    );
  });

  it("rejects an odometer that is not above the previous row", () => {
    expect(odometerError(a.odometerKm, b.refueledOn, editing("b"))).toBe(
      "odometerNotAbovePrevious",
    );
  });

  it("rejects an odometer that is not below the next row", () => {
    expect(odometerError(c.odometerKm, b.refueledOn, editing("b"))).toBe("odometerNotBelowNext");
  });

  it("checks the oldest row against the initial odometer, not against a previous row", () => {
    const context = editing("a");
    expect(odometerError(79_999, a.refueledOn, context)).toBe("odometerBelowInitial");
    expect(odometerError(80_000, a.refueledOn, context)).toBeNull();
  });

  it("gives the oldest row no distance warning, as it has no lower row", () => {
    expect(distanceWarning(80_000, editing("a"))).toBeNull();
  });

  it("measures the distance against the next lower other row at exactly 2,000 km", () => {
    // Editing c: the lower rows are a and b, the next lower one is b (81,000).
    expect(distanceWarning(83_000, editing("c"))).toBeNull();
    expect(distanceWarning(83_001, editing("c"))).toBe("distanceUnusuallyLarge");
  });

  it("does not measure against the edited row's own stored odometer", () => {
    // c is stored at 81,500; against that, 83,001 would be only 1,501 km away and not warn.
    expect(distanceWarning(83_001, editing("c"))).toBe("distanceUnusuallyLarge");
  });
});
