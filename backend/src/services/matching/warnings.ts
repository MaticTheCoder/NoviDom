// Besedila opozoril ocene ujemanja (US-03 AC 2, 4). Vsako opozorilo navede ime živali,
// razlog in podatek iz vprašalnika, ki ga je sprožil. Shranijo se v Application.matchWarnings.
import { z } from "zod";
import type { MatchLevel } from "../../generated/prisma/enums";
import { evaluateMatch, type MatchAnimal, type MatchFinding, type MatchHousehold } from "./rules";

export type MatchWarning = {
  rule: MatchFinding["rule"];
  severity: Exclude<MatchLevel, "MATCH">;
  /** Razlog z imenom živali, npr. »Žival Rex je primerna le za otroke, starejše od 6 let.« */
  message: string;
  /** Podatek iz vprašalnika, ki je sprožil opozorilo, npr. »V gospodinjstvu: otrok, star 4 leta«. */
  trigger: string;
};

/** Shema za branje shranjenih opozoril iz JSON polja vloge. */
export const matchWarningSchema = z.object({
  rule: z.enum(["KIDS", "GARDEN", "ALONE_HIGH_ENERGY", "DOGS", "CATS"]),
  severity: z.enum(["CONDITIONAL", "MISMATCH"]),
  message: z.string(),
  trigger: z.string(),
});

/** Prebere opozorila iz JSON polja; neveljavne zapise izpusti. */
export function parseMatchWarnings(json: unknown): MatchWarning[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((w) => {
    const parsed = matchWarningSchema.safeParse(w);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Sklanjanje: 1 leto, 2 leti, 3 leta, 4 leta, 5 let (imenovalnik po »star«). */
export function formatYears(n: number): string {
  const mod = n % 100;
  if (mod === 1) return `${n} leto`;
  if (mod === 2) return `${n} leti`;
  if (mod === 3 || mod === 4) return `${n} leta`;
  return `${n} let`;
}

/** Sklanjanje: 1 uro, 2 uri, 3 ure, 4 ure, 5 ur (tožilnik). */
export function formatHours(n: number): string {
  const mod = n % 100;
  if (mod === 1) return `${n} uro`;
  if (mod === 2) return `${n} uri`;
  if (mod === 3 || mod === 4) return `${n} ure`;
  return `${n} ur`;
}

const childAge = (age: number) => (age === 0 ? "otrok, mlajši od 1 leta" : `otrok, star ${formatYears(age)}`);

export function describeFinding(finding: MatchFinding, animalName: string): MatchWarning {
  const animal = `Žival ${animalName}`;
  switch (finding.rule) {
    case "KIDS":
      return {
        rule: finding.rule,
        severity: finding.severity,
        message:
          finding.goodWithKids === "OVER_6"
            ? `${animal} je primerna le za otroke, starejše od 6 let.`
            : `${animal} ni primerna za življenje z otroki.`,
        trigger: `V gospodinjstvu: ${childAge(finding.childAge)}`,
      };
    case "GARDEN":
      return { rule: finding.rule, severity: finding.severity, message: `${animal} potrebuje vrt.`, trigger: "Bivanje: brez vrta" };
    case "ALONE_HIGH_ENERGY":
      return {
        rule: finding.rule,
        severity: finding.severity,
        message: `${animal} ima visoko raven energije in ne sme biti dnevno sama več kot 6 ur.`,
        trigger: `Žival bi bila sama ${formatHours(finding.hoursAlonePerDay)} na dan`,
      };
    case "DOGS":
      return { rule: finding.rule, severity: finding.severity, message: `${animal} se ne razume s psi.`, trigger: "V gospodinjstvu: pes" };
    case "CATS":
      return { rule: finding.rule, severity: finding.severity, message: `${animal} se ne razume z mačkami.`, trigger: "V gospodinjstvu: mačka" };
  }
}

/** Ocena ujemanja z besedili opozoril; to se prikaže na strani za oddajo in shrani v vlogo. */
export function assessMatch(household: MatchHousehold, animal: MatchAnimal): { level: MatchLevel; warnings: MatchWarning[] } {
  const { level, findings } = evaluateMatch(household, animal);
  return { level, warnings: findings.map((f) => describeFinding(f, animal.name)) };
}
