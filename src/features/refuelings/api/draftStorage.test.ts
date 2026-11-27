import { createDraft } from "../logic/draft";
import type { RefuelingFormValues } from "../logic/formValues";
import { clearDraft, DRAFT_KEY_PREFIX, loadDraft, saveDraft } from "./draftStorage";

const values = (volumeLiters: string): RefuelingFormValues => ({
  refueledOn: "",
  volumeLiters,
  pricePerLiter: "",
  totalEuros: "",
  odometerKm: "",
  stationId: null,
  stationName: "",
  stationAddress: "",
  isFullTank: true,
  previousMissed: false,
  note: "",
});

const store = new Map<string, string>();
const storage = {
  getItem: jest.fn((key: string) => store.get(key) ?? null),
  setItem: jest.fn((key: string, value: string) => void store.set(key, value)),
  removeItem: jest.fn((key: string) => void store.delete(key)),
};
const fail = () => {
  throw new Error("broken");
};

let warn: jest.SpyInstance;
beforeEach(() => {
  store.clear();
  jest.clearAllMocks();
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
});
afterEach(() => warn.mockRestore());

describe("draftStorage", () => {
  it("keeps a draft per user and vehicle; clearing one leaves the others", () => {
    const combos = [
      ["u1", "v1"],
      ["u1", "v2"],
      ["u2", "v1"],
    ] as const;
    combos.forEach(([user, vehicle], i) => saveDraft(user, vehicle, createDraft(values(`${i}`))));
    combos.forEach(([user, vehicle], i) => {
      expect(loadDraft(user, vehicle)?.values.volumeLiters).toBe(`${i}`);
    });
    expect(store.has(`${DRAFT_KEY_PREFIX}u1:v1`)).toBe(true);
    clearDraft("u1", "v1");
    expect(loadDraft("u1", "v1")).toBeNull();
    expect(loadDraft("u1", "v2")).not.toBeNull();
    expect(loadDraft("u2", "v1")).not.toBeNull();
  });

  it("returns null for a damaged stored value", () => {
    store.set(`${DRAFT_KEY_PREFIX}u1:v1`, "{oops");
    expect(loadDraft("u1", "v1")).toBeNull();
  });

  it("returns false and warns when writing fails", () => {
    storage.setItem.mockImplementationOnce(fail);
    expect(saveDraft("u1", "v1", createDraft(values("1")))).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("returns null and warns when reading fails", () => {
    storage.getItem.mockImplementationOnce(fail);
    expect(loadDraft("u1", "v1")).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not throw and warns when clearing fails", () => {
    storage.removeItem.mockImplementationOnce(fail);
    expect(() => clearDraft("u1", "v1")).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
