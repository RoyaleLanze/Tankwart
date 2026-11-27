import { createQueryClient } from "./queryClient";

it("does not retry queries, so an offline error shows up at once", () => {
  expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(false);
});
