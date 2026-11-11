// Delo s časom zavetišča. Termini so shranjeni v UTC in prikazani v času Europe/Ljubljana
// (docs/02, F9 in F15), tudi čez prehod na poletni ali zimski čas.

export const SHELTER_TIME_ZONE = "Europe/Ljubljana";

/** Odmik časovnega pasu od UTC v minutah v danem trenutku (npr. +60 pozimi, +120 poleti). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * Lokalni datum in ura v zavetišču → trenutek v UTC.
 * `date` je YYYY-MM-DD, `time` je HH:MM (npr. sobota 10:00 ostane 10:00 tudi po prehodu ure).
 */
export function shelterTimeToUtc(date: string, time: string, timeZone = SHELTER_TIME_ZONE): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Dva koraka zadoščata tudi na dan prehoda ure.
  let result = guess - offsetMinutes(new Date(guess), timeZone) * 60000;
  result = guess - offsetMinutes(new Date(result), timeZone) * 60000;
  return new Date(result);
}

/** Lokalni datum (YYYY-MM-DD) trenutka v zavetišču. */
export function shelterDate(instant: Date, timeZone = SHELTER_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/** Lokalni datum, premaknjen za `days` dni (YYYY-MM-DD). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Dan v tednu lokalnega datuma: 0 = nedelja … 6 = sobota. */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
