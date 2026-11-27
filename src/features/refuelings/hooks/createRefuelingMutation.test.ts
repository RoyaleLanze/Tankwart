import { MutationObserver, QueryClient } from "@tanstack/react-query";

import { createRefueling } from "../api/refuelingsApi";
import type { Refueling, RefuelingInput } from "../types";
import {
  CREATE_REFUELING_MUTATION_KEY,
  type CreateRefuelingVariables,
  registerCreateRefuelingDefaults,
} from "./createRefuelingMutation";
import { refuelingsKey } from "./useRefuelings";

// Factory mock: automocking would load the module and with it the Supabase client.
jest.mock("../api/refuelingsApi", () => ({ createRefueling: jest.fn() }));
const createMock = jest.mocked(createRefueling);

const input: RefuelingInput = {
  refueledOn: "2026-11-20",
  volumeMl: 41230,
  pricePerLiterTenthCents: 1749,
  totalCents: 7211,
  odometerKm: 55120,
  stationId: null,
  stationName: "Aral",
  stationAddress: null,
  isFullTank: true,
  previousMissed: false,
  note: null,
};
const variables: CreateRefuelingVariables = { id: "r-uuid", vehicleId: "v1", input };
const stored: Refueling = { ...input, id: "r-uuid", vehicleId: "v1", createdAt: "2026-11-20" };

/** Runs the mutation the way useMutation does: by key only, without a mutationFn of its own. */
function run(queryClient: QueryClient) {
  return new MutationObserver<Refueling, Error, CreateRefuelingVariables>(queryClient, {
    mutationKey: CREATE_REFUELING_MUTATION_KEY,
  }).mutate(variables);
}

describe("registerCreateRefuelingDefaults", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    createMock.mockReset();
    queryClient = new QueryClient();
    registerCreateRefuelingDefaults(queryClient);
  });

  it("saves with the id, vehicle and input from the variables", async () => {
    createMock.mockResolvedValue(stored);
    await expect(run(queryClient)).resolves.toBe(stored);
    expect(createMock).toHaveBeenCalledWith("r-uuid", "v1", input);
  });

  it("loads that vehicle's list again after saving, and no other", async () => {
    createMock.mockResolvedValue(stored);
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    await run(queryClient);
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: refuelingsKey("v1") });
  });

  it("keeps the error and does not invalidate when saving fails", async () => {
    const error = { code: "23514", message: "check" };
    createMock.mockRejectedValue(error);
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    await expect(run(queryClient)).rejects.toBe(error);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
