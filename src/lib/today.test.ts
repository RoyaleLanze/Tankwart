import { todayIsoDate } from "./today";

// The bug these tests guard against is todayIsoDate using UTC (toISOString), which is wrong
// between midnight and 01:00/02:00 in Germany. It only shows if the tests do not run in UTC;
// jest.globalSetup.js sets Europe/Berlin.
describe("todayIsoDate", () => {
  it("runs in Europe/Berlin", () => {
    expect(new Date("2026-11-30T23:30:00Z").getHours()).toBe(0);
  });

  it("uses the local calendar day with leading zeros", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("gives the local day just after midnight, when UTC is still the day before", () => {
    // 00:30 CET on 1 Dec is 23:30 UTC on 30 Nov.
    expect(todayIsoDate(new Date("2026-11-30T23:30:00Z"))).toBe("2026-12-01");
  });

  it("crosses the year end in local time", () => {
    expect(todayIsoDate(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(todayIsoDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
  });
});
