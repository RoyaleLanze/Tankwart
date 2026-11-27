import { createDraft } from "../logic/draft";
import type { RefuelingFormValues } from "../logic/formValues";
import { clearDraft, DRAFT_KEY_PREFIX, loadDraft, saveDraft } from "./draftStorage";

const VALUES: RefuelingFormValues = {
  refueledOn: "",
  volumeLiters: "10",
  pricePerLiter: "",
  totalEuros: "",
  odometerKm: "",
  stationId: null,
  stationName: "",
  stationAddress: "",
  isFullTank: true,
  previousMissed: false,
  note: "",
};

const store = new Map<string, string>();
const storage = {
  getItem: jest.fn((key: string) => store.get(key) ?? null),
  setItem: jest.fn((key: string, value: string) => void store.set(key, value)),
  removeItem: jest.fn((key: string) => void store.delete(key)),
};

beforeEach(() => {
  store.clear();
  jest.clearAllMocks();
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
});

describe("draftStorage", () => {
  it("saves, loads and clears per user", () => {
    const draft = createDraft("v1", VALUES);
    expect(saveDraft("u1", draft)).toBe(true);
    expect(store.has(`${DRAFT_KEY_PREFIX}u1`)).toBe(true);
    expect(loadDraft("u1")).toEqual(draft);
    expect(loadDraft("u2")).toBeNull();
    clearDraft("u1");
    expect(loadDraft("u1")).toBeNull();
  });

  it("does not throw when the storage fails", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const fail = () => {
      throw new Error("full");
    };
    storage.setItem.mockImplementationOnce(fail);
    storage.getItem.mockImplementationOnce(fail);
    storage.removeItem.mockImplementationOnce(fail);
    expect(saveDraft("u1", createDraft("v1", VALUES))).toBe(false);
    expect(loadDraft("u1")).toBeNull();
    expect(() => clearDraft("u1")).not.toThrow();
  });
});
