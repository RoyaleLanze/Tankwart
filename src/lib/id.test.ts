import { newId } from "./id";

const mockRandomUUID = jest.fn();
jest.mock("expo-crypto", () => ({ randomUUID: () => mockRandomUUID() }));

describe("newId", () => {
  it("returns what expo-crypto generates, one new value per call", () => {
    mockRandomUUID.mockReturnValueOnce("id-1").mockReturnValueOnce("id-2");
    expect([newId(), newId()]).toEqual(["id-1", "id-2"]);
  });
});
