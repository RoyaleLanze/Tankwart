import type { Refueling, RefuelingInput } from "../types";
import { decideRetry } from "./retryDecision";

const input: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 40_000,
  pricePerLiterTenthCents: 1749,
  totalCents: 6996,
  odometerKm: 55_120,
  stationName: "Aral",
  stationId: "station-1",
  stationAddress: "Hauptstr. 1, Stuttgart",
  isFullTank: true,
  previousMissed: false,
  note: "Autobahn",
};

const row: Refueling = { ...input, id: "r1", vehicleId: "v1", createdAt: "2026-11-20T10:00:00Z" };
const found = (changes: Partial<Refueling> = {}) => ({
  kind: "found" as const,
  row: { ...row, ...changes },
});

describe("decideRetry", () => {
  it("counts the same row as saved", () => {
    expect(decideRetry(found(), "v1", input)).toBe("saved");
  });

  it("ignores the fields only the row has (id, creation time)", () => {
    const other = found({ id: "other", createdAt: "2030-01-01T00:00:00Z" });
    expect(decideRetry(other, "v1", input)).toBe("saved");
  });

  it("treats a row of another vehicle as different", () => {
    expect(decideRetry(found({ vehicleId: "v2" }), "v1", input)).toBe("differs");
  });

  it.each<[string, Partial<RefuelingInput>]>([
    ["date", { refueledOn: "2026-11-21" }],
    ["volume", { volumeMl: 40_001 }],
    ["price", { pricePerLiterTenthCents: 1750 }],
    ["total", { totalCents: 6997 }],
    ["odometer", { odometerKm: 55_121 }],
    ["station name", { stationName: "Shell" }],
    ["station id", { stationId: null }],
    ["station address", { stationAddress: null }],
    ["full tank flag", { isFullTank: false }],
    ["previous missed flag", { previousMissed: true }],
    ["note", { note: "Stadt" }],
  ])("reports a changed %s as different", (_name, changes) => {
    expect(decideRetry(found(changes), "v1", input)).toBe("differs");
  });

  describe("null fields", () => {
    const sparse: RefuelingInput = { ...input, stationId: null, stationAddress: null, note: null };

    it("matches null against null", () => {
      expect(decideRetry(found(sparse), "v1", sparse)).toBe("saved");
    });

    it("matches an empty note against null in either direction", () => {
      const emptyInput = { ...sparse, note: "" };
      expect(decideRetry(found(sparse), "v1", emptyInput)).toBe("saved");
      expect(decideRetry(found({ ...sparse, note: "" }), "v1", sparse)).toBe("saved");
    });

    it("tells a note from null", () => {
      expect(decideRetry(found(sparse), "v1", { ...sparse, note: "Autobahn" })).toBe("differs");
      expect(decideRetry(found({ ...sparse, note: "Autobahn" }), "v1", sparse)).toBe("differs");
    });

    it("does not treat false as empty", () => {
      const missed = { ...input, previousMissed: true };
      expect(decideRetry(found({ previousMissed: false }), "v1", missed)).toBe("differs");
    });
  });

  it("rejects when the row is not visible", () => {
    expect(decideRetry({ kind: "notFound" }, "v1", input)).toBe("rejected");
  });

  it("reports a failed read as a network problem, never as saved or rejected", () => {
    expect(decideRetry({ kind: "failed" }, "v1", input)).toBe("network");
  });
});
