import { createDraft, DRAFT_VERSION, hasUserInput, parseDraft, serializeDraft } from "./draft";
import type { RefuelingFormValues } from "./formValues";

const VALUES: RefuelingFormValues = {
  refueledOn: "2026-11-20",
  volumeLiters: "42,5",
  pricePerLiter: "",
  totalEuros: "",
  odometerKm: "84000",
  stationId: "abc",
  stationName: "Aral",
  stationAddress: "",
  isFullTank: true,
  previousMissed: false,
  note: "",
};
const DRAFT = createDraft(VALUES);
const raw = (change: object) => JSON.stringify({ ...DRAFT, ...change });

describe("parseDraft", () => {
  it("reads back what serializeDraft wrote, station id and half-finished input included", () => {
    expect(parseDraft(serializeDraft(DRAFT))).toEqual(DRAFT);
  });

  it.each([
    ["nothing stored", null],
    ["broken JSON", "{"],
    ["null", "null"],
    ["another version", raw({ version: DRAFT_VERSION + 1 })],
    ["version as text", raw({ version: String(DRAFT_VERSION) })],
    ["no version", JSON.stringify({ values: VALUES })],
    ["null values", raw({ values: null })],
    ["null in a required field", raw({ values: { ...VALUES, volumeLiters: null } })],
    ["a missing field", raw({ values: { ...VALUES, note: undefined } })],
    ["a wrongly typed field", raw({ values: { ...VALUES, isFullTank: "yes" } })],
  ])("returns null for %s", (_name, text) => {
    expect(parseDraft(text)).toBeNull();
  });

  it("drops extra fields", () => {
    const parsed = parseDraft(raw({ extra: 1, values: { ...VALUES, other: "x" } }));
    expect(parsed).toEqual(DRAFT);
  });
});

describe("hasUserInput", () => {
  const EMPTY = { ...VALUES, volumeLiters: "", odometerKm: "", stationName: "" };

  it("is false for values the form starts with, spaces included", () => {
    expect(hasUserInput({ ...EMPTY, note: "  " })).toBe(false);
  });

  it.each(["volumeLiters", "pricePerLiter", "totalEuros", "odometerKm", "stationName", "note"])(
    "is true when %s has text",
    (field) => expect(hasUserInput({ ...EMPTY, [field]: "1" })).toBe(true),
  );
});
