import { createDraft, DRAFT_VERSION, parseDraft, serializeDraft } from "./draft";
import type { RefuelingFormValues } from "./formValues";

const VALUES: RefuelingFormValues = {
  refueledOn: "2026-11-20",
  volumeLiters: "42,5",
  pricePerLiter: "",
  totalEuros: "",
  odometerKm: "84000",
  stationId: null,
  stationName: "Aral",
  stationAddress: "",
  isFullTank: true,
  previousMissed: false,
  note: "",
};

describe("parseDraft", () => {
  it("reads back what serializeDraft wrote, half-finished input included", () => {
    const draft = createDraft("v1", VALUES);
    expect(parseDraft(serializeDraft(draft))).toEqual(draft);
  });

  it("returns null for nothing stored, empty text and broken JSON", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("")).toBeNull();
    expect(parseDraft("{")).toBeNull();
  });

  it("returns null for JSON that is not an object", () => {
    expect(parseDraft("null")).toBeNull();
    expect(parseDraft("42")).toBeNull();
    expect(parseDraft("[]")).toBeNull();
  });

  it("returns null for another version", () => {
    const other = { ...createDraft("v1", VALUES), version: DRAFT_VERSION + 1 };
    expect(parseDraft(JSON.stringify(other))).toBeNull();
  });

  it("returns null for missing or wrongly typed fields", () => {
    const { vehicleId: _omit, ...noVehicle } = createDraft("v1", VALUES);
    expect(parseDraft(JSON.stringify(noVehicle))).toBeNull();
    const wrong = createDraft("v1", { ...VALUES, isFullTank: "yes" as unknown as boolean });
    expect(parseDraft(JSON.stringify(wrong))).toBeNull();
  });
});
