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

  // Typed over every key of RefuelingInput: a field added to the type fails to compile here until
  // it has a changed value, so the comparison in decideRetry cannot skip it unnoticed.
  const changedValue: Record<keyof RefuelingInput, Partial<RefuelingInput>> = {
    refueledOn: { refueledOn: "2026-11-21" },
    volumeMl: { volumeMl: 40_001 },
    pricePerLiterTenthCents: { pricePerLiterTenthCents: 1750 },
    totalCents: { totalCents: 6997 },
    odometerKm: { odometerKm: 55_121 },
    stationName: { stationName: "Shell" },
    stationId: { stationId: "station-2" },
    stationAddress: { stationAddress: "Nebenstr. 2, Ulm" },
    isFullTank: { isFullTank: false },
    previousMissed: { previousMissed: true },
    note: { note: "Stadt" },
  };

  it.each(Object.entries(changedValue))("reports a changed %s as different", (_key, changes) => {
    expect(decideRetry(found(changes), "v1", input)).toBe("differs");
  });

  it.each(["stationId", "stationAddress", "note"] as const)(
    "reports a %s that is set on one side only as different",
    (key) => {
      expect(decideRetry(found({ [key]: null }), "v1", input)).toBe("differs");
      expect(decideRetry(found(), "v1", { ...input, [key]: null })).toBe("differs");
    },
  );

  it("ignores a key in the input that RefuelingInput does not have", () => {
    const withExtra = { ...input, unknownField: "x" } as RefuelingInput;
    expect(decideRetry(found(), "v1", withExtra)).toBe("saved");
  });

  it("ignores a column in the row that RefuelingInput does not have", () => {
    const withExtra = { unknownColumn: 42 } as Partial<Refueling>;
    expect(decideRetry(found(withExtra), "v1", input)).toBe("saved");
  });

  it.each([500, 4000])("counts the price %i against itself as saved", (price) => {
    const priced = { ...input, pricePerLiterTenthCents: price };
    expect(decideRetry(found({ pricePerLiterTenthCents: price }), "v1", priced)).toBe("saved");
  });

  it("compares the date as text, a timestamp is not the same day string", () => {
    const timestamp = found({ refueledOn: "2026-11-20T00:00:00Z" });
    expect(decideRetry(timestamp, "v1", input)).toBe("differs");
    expect(decideRetry(found(), "v1", { ...input, refueledOn: "2026-11-20T00:00:00Z" })).toBe(
      "differs",
    );
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

    it.each(["stationAddress", "note", "stationId"] as const)(
      "matches an empty %s against null in either direction",
      (key) => {
        expect(decideRetry(found(sparse), "v1", { ...sparse, [key]: "" })).toBe("saved");
        expect(decideRetry(found({ ...sparse, [key]: "" }), "v1", sparse)).toBe("saved");
      },
    );

    it.each(["stationAddress", "note", "stationId"] as const)(
      "matches an undefined %s against null in either direction",
      (key) => {
        const undefinedField = { ...sparse, [key]: undefined } as unknown as RefuelingInput;
        expect(decideRetry(found(sparse), "v1", undefinedField)).toBe("saved");
        expect(decideRetry(found(undefinedField), "v1", sparse)).toBe("saved");
      },
    );

    // Pins the current behaviour: only "" counts as blank, whitespace is a value.
    it.each(["stationAddress", "note", "stationId"] as const)(
      "does not treat a whitespace-only %s as null",
      (key) => {
        expect(decideRetry(found(sparse), "v1", { ...sparse, [key]: "  " })).toBe("differs");
        expect(decideRetry(found({ ...sparse, [key]: "  " }), "v1", sparse)).toBe("differs");
      },
    );

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
