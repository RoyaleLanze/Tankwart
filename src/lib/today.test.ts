import { todayIsoDate } from "./today";

describe("todayIsoDate", () => {
  it("uses the local calendar day with leading zeros", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("does not move to the next day late in the evening", () => {
    expect(todayIsoDate(new Date(2026, 10, 30, 23, 30))).toBe("2026-11-30");
  });
});
