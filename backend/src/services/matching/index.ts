// Samodejna ocena ujemanja gospodinjstva z živaljo (F3, US-03).
// Čista funkcija brez dostopa do baze; uvaža le tipe, zato jo lahko uporablja tudi UI
// (@novi-dom/backend/matching). Rezultat se ob oddaji shrani v vlogo (ADR-0008).
import type { Animal, Household, MatchLevel } from "../../generated/prisma/client";

/** Najmlajša starost, pri kateri žival z oznako »le za otroke nad 6 let« velja za primerno. */
export const KIDS_MIN_AGE = 6;
/** Več kot toliko ur samote je preveč za žival z visoko ravnjo energije. */
export const MAX_HOURS_ALONE_HIGH_ENERGY = 6;

export type MatchHousehold = Pick<Household, "hasGarden" | "childrenAges" | "hasDogs" | "hasCats" | "hoursAlonePerDay">;
export type MatchAnimal = Pick<Animal, "name" | "goodWithKids" | "needsGarden" | "energyLevel" | "goodWithDogs" | "goodWithCats">;

export type MatchRule = "KIDS" | "GARDEN" | "ALONE_HIGH_ENERGY" | "DOGS" | "CATS";

/** Opozorilo z resnostjo in podatkom, ki ga je sprožil (za navedbo vzroka, US-03 AC 4). */
export type MatchFinding =
  | { rule: "KIDS"; severity: "MISMATCH"; childAge: number; goodWithKids: "NO" | "OVER_6" }
  | { rule: "GARDEN"; severity: "CONDITIONAL" }
  | { rule: "ALONE_HIGH_ENERGY"; severity: "CONDITIONAL"; hoursAlonePerDay: number }
  | { rule: "DOGS"; severity: "CONDITIONAL" }
  | { rule: "CATS"; severity: "CONDITIONAL" };

const RANK: Record<MatchLevel, number> = { MATCH: 0, CONDITIONAL: 1, MISMATCH: 2 };

/** Najslabša raven med opozorili; brez opozoril je ujemanje (US-03 AC 1). */
export function levelOf(findings: readonly { severity: MatchLevel }[]): MatchLevel {
  return findings.reduce<MatchLevel>((worst, f) => (RANK[f.severity] > RANK[worst] ? f.severity : worst), "MATCH");
}

/**
 * Pravila (docs/02 F3, US-03 AC 2–3):
 * - otrok, mlajši od 6 let, in žival »le za otroke nad 6 let« ali neprimerna za otroke → Neujemanje;
 *   žival, neprimerna za otroke, in otrok katerekoli starosti → Neujemanje,
 * - ni vrta in žival potrebuje vrt → Pogojno,
 * - žival bi bila sama več kot 6 ur in ima visoko raven energije → Pogojno,
 * - v gospodinjstvu je pes/mačka in žival se z njimi ne razume → Pogojno.
 * Vrednost »neznano« (UNKNOWN) ali neizpolnjena lastnost ne sproži opozorila.
 */
export function findMatchIssues(household: MatchHousehold, animal: MatchAnimal): MatchFinding[] {
  const findings: MatchFinding[] = [];

  // Pri otrocih je odločilen najmlajši otrok, ki krši pravilo.
  const ages = [...household.childrenAges].sort((a, b) => a - b);
  if (animal.goodWithKids === "NO" && ages.length > 0) {
    findings.push({ rule: "KIDS", severity: "MISMATCH", childAge: ages[0], goodWithKids: "NO" });
  } else if (animal.goodWithKids === "OVER_6") {
    const young = ages.find((age) => age < KIDS_MIN_AGE);
    if (young !== undefined) findings.push({ rule: "KIDS", severity: "MISMATCH", childAge: young, goodWithKids: "OVER_6" });
  }

  if (!household.hasGarden && animal.needsGarden === true) {
    findings.push({ rule: "GARDEN", severity: "CONDITIONAL" });
  }

  if (household.hoursAlonePerDay > MAX_HOURS_ALONE_HIGH_ENERGY && animal.energyLevel === "HIGH") {
    findings.push({ rule: "ALONE_HIGH_ENERGY", severity: "CONDITIONAL", hoursAlonePerDay: household.hoursAlonePerDay });
  }

  if (household.hasDogs && animal.goodWithDogs === "NO") findings.push({ rule: "DOGS", severity: "CONDITIONAL" });
  if (household.hasCats && animal.goodWithCats === "NO") findings.push({ rule: "CATS", severity: "CONDITIONAL" });

  return findings;
}

/** Ocena ujemanja: oznaka Ujemanje / Pogojno / Neujemanje in opozorila. */
export function evaluateMatch(household: MatchHousehold, animal: MatchAnimal): { level: MatchLevel; findings: MatchFinding[] } {
  const findings = findMatchIssues(household, animal);
  return { level: levelOf(findings), findings };
}
