import type { RefuelingInput } from "../types";
import { createRefuelingFormSchema } from "./formSchema";
import { formValuesOf } from "./formValues";
import type { RefuelingContext } from "./rules";

const context: RefuelingContext = {
  today: () => "2026-11-25",
  tankCapacityMl: 80_000,
  initialOdometerKm: 80_000,
  otherRefuelings: [],
};

const stored: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 52_430,
  pricePerLiterTenthCents: 1749,
  totalCents: 9_170,
  odometerKm: 84_230,
  stationName: "Aral",
  stationId: "abc-123",
  stationAddress: "Hauptstr. 1, Stuttgart",
  isFullTank: false,
  previousMissed: true,
  note: "Regen",
};

function roundTrip(row: RefuelingInput, ctx: RefuelingContext = context) {
  return createRefuelingFormSchema(ctx).safeParse(formValuesOf(row)).data;
}

describe("formValuesOf", () => {
  it("writes the amounts as German input text without unit or grouping", () => {
    expect(formValuesOf(stored)).toEqual({
      refueledOn: "2026-11-20",
      volumeLiters: "52,43",
      pricePerLiter: "1,749",
      totalEuros: "91,7",
      odometerKm: "84230",
      stationId: "abc-123",
      stationName: "Aral",
      stationAddress: "Hauptstr. 1, Stuttgart",
      isFullTank: false,
      previousMissed: true,
      note: "Regen",
    });
  });

  it("turns missing optional fields into empty text", () => {
    const values = formValuesOf({ ...stored, stationId: null, stationAddress: null, note: null });
    expect(values).toMatchObject({ stationId: null, stationAddress: "", note: "" });
  });

  it("writes whole liters and euros without decimals", () => {
    const values = formValuesOf({ ...stored, volumeMl: 40_000, totalCents: 7_000 });
    expect(values).toMatchObject({ volumeLiters: "40", totalEuros: "70" });
  });

  it("is undone by the form schema: unchanged values save as the stored ones", () => {
    expect(roundTrip(stored)).toEqual(stored);
  });

  it("keeps null fields null on the way back", () => {
    const withNulls = { ...stored, stationId: null, stationAddress: null, note: null };
    expect(roundTrip(withNulls)).toEqual(withNulls);
  });

  it.each([1, 3, 999, 52_001, 1_234_567])("round-trips %i ml exactly", (volumeMl) => {
    const bigTank = { ...context, tankCapacityMl: 2_000_000 };
    expect(roundTrip({ ...stored, volumeMl, totalCents: 1_000 }, bigTank)?.volumeMl).toBe(volumeMl);
  });
});
