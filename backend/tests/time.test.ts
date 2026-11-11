import { describe, expect, it } from "vitest";
import { addDays, shelterDate, shelterTimeToUtc, weekday } from "../src/time";

describe("shelterTimeToUtc", () => {
  it.each([
    ["2026-01-15", "10:00", "2026-01-15T09:00:00.000Z"], // zimski čas, UTC+1
    ["2026-07-15", "10:00", "2026-07-15T08:00:00.000Z"], // poletni čas, UTC+2
  ])("%s %s → %s", (date, time, iso) => {
    expect(shelterTimeToUtc(date, time).toISOString()).toBe(iso);
  });

  it("sobota ob 10:00 ostane ob 10:00 čez prehod na poletni in zimski čas (US-15 AC 5)", () => {
    const local = (d: Date) => new Intl.DateTimeFormat("sl-SI", { timeZone: "Europe/Ljubljana", hour: "2-digit", minute: "2-digit" }).format(d);
    for (const date of ["2026-03-28", "2026-04-04", "2026-10-24", "2026-10-31"]) {
      expect(local(shelterTimeToUtc(date, "10:00"))).toBe("10:00");
    }
  });
});

describe("pomožne funkcije za datume", () => {
  it("shelterDate vrne lokalni datum (pozno zvečer UTC je že naslednji dan)", () => {
    expect(shelterDate(new Date("2026-07-15T22:30:00Z"))).toBe("2026-07-16");
  });

  it("addDays prečka mesec in prehod ure", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("weekday: 0 = nedelja", () => {
    expect(weekday("2026-11-15")).toBe(0);
    expect(weekday("2026-11-14")).toBe(6);
  });
});
