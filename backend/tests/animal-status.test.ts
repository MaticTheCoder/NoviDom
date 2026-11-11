import { describe, expect, it } from "vitest";
import { DomainError } from "../src/errors";
import type { AnimalStatus } from "../src/generated/prisma/enums";
import {
  AnimalStatusErrorCode,
  assertStatusChangeAllowed,
  BEHAVIOR_ATTRIBUTES,
  formatActiveApplications,
  getMissingBehaviorAttributes,
} from "../src/services/animals/status";

const complete = {
  size: "MEDIUM",
  energyLevel: "LOW",
  needsGarden: false,
  goodWithKids: "YES",
  goodWithDogs: "NO",
  goodWithCats: "YES",
} as const;

const empty = {
  size: null,
  energyLevel: null,
  needsGarden: null,
  goodWithKids: null,
  goodWithDogs: null,
  goodWithCats: null,
};

const animal = (status: AnimalStatus, attrs: Record<string, unknown> = complete) =>
  ({ ...attrs, status }) as Parameters<typeof assertStatusChangeAllowed>[0];

/** Pokliče funkcijo in vrne kodo vržene DomainError (ali undefined, če ni napake). */
function errorCode(fn: () => void): string | undefined {
  try {
    fn();
    return undefined;
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    return (error as DomainError).code;
  }
}

describe("getMissingBehaviorAttributes", () => {
  it("vrne vse lastnosti, če nobena ni vnesena", () => {
    expect(getMissingBehaviorAttributes(empty).map((m) => m.field)).toEqual(BEHAVIOR_ATTRIBUTES.map((a) => a.field));
  });

  it("vrednost UNKNOWN velja kot izpolnjena (US-01 AC 2)", () => {
    const unknown = { ...complete, goodWithKids: "UNKNOWN", goodWithDogs: "UNKNOWN", goodWithCats: "UNKNOWN" } as const;
    expect(getMissingBehaviorAttributes(unknown)).toEqual([]);
  });

  it("needsGarden = false je izpolnjena vrednost, ne prazna", () => {
    expect(getMissingBehaviorAttributes({ ...complete, needsGarden: false })).toEqual([]);
  });

  it.each(BEHAVIOR_ATTRIBUTES.map((a) => [a.field, a.label]))("prazna lastnost %s se izpiše kot »%s«", (field, label) => {
    expect(getMissingBehaviorAttributes({ ...complete, [field]: null })).toEqual([{ field, label }]);
  });
});

describe("assertStatusChangeAllowed", () => {
  it("dovoli INTAKE → AVAILABLE pri izpolnjenih lastnostih", () => {
    expect(errorCode(() => assertStatusChangeAllowed(animal("INTAKE"), "AVAILABLE", 0))).toBeUndefined();
  });

  it("zavrne INTAKE → AVAILABLE, če manjka lastnost, in navede manjkajoče", () => {
    const a = animal("INTAKE", { ...complete, size: null, goodWithCats: null });
    try {
      assertStatusChangeAllowed(a, "AVAILABLE", 0);
      expect.unreachable();
    } catch (error) {
      const e = error as DomainError<{ missing: { field: string }[] }>;
      expect(e.code).toBe(AnimalStatusErrorCode.MissingBehaviorAttributes);
      expect(e.details?.missing.map((m) => m.field)).toEqual(["size", "goodWithCats"]);
      expect(e.message).toContain("velikost, primernost za mačke");
    }
  });

  it("dovoli AVAILABLE → INTAKE, ko žival nima aktivnih vlog", () => {
    expect(errorCode(() => assertStatusChangeAllowed(animal("AVAILABLE"), "INTAKE", 0))).toBeUndefined();
  });

  it("vrnitev v INTAKE ne zahteva izpolnjenih lastnosti", () => {
    expect(errorCode(() => assertStatusChangeAllowed(animal("AVAILABLE", empty), "INTAKE", 0))).toBeUndefined();
  });

  it.each([
    [1, "1 aktivno vlogo"],
    [2, "2 aktivni vlogi"],
    [3, "3 aktivne vloge"],
  ])("zavrne AVAILABLE → INTAKE pri %i aktivnih vlogah s sporočilom »%s« (US-01 AC 5)", (count, phrase) => {
    try {
      assertStatusChangeAllowed(animal("AVAILABLE"), "INTAKE", count);
      expect.unreachable();
    } catch (error) {
      const e = error as DomainError<{ activeApplicationCount: number }>;
      expect(e.code).toBe(AnimalStatusErrorCode.HasActiveApplications);
      expect(e.details?.activeApplicationCount).toBe(count);
      expect(e.message).toContain(phrase);
    }
  });

  it.each(["RESERVED", "ADOPTED"] as const)("status %s ni ročno izbiren (US-01 AC 4)", (target) => {
    for (const from of ["INTAKE", "AVAILABLE"] as const) {
      expect(errorCode(() => assertStatusChangeAllowed(animal(from), target, 0))).toBe(AnimalStatusErrorCode.StatusNotManual);
    }
  });

  it.each(["RESERVED", "ADOPTED"] as const)("iz statusa %s ročna sprememba ni mogoča", (from) => {
    for (const target of ["INTAKE", "AVAILABLE"] as const) {
      expect(errorCode(() => assertStatusChangeAllowed(animal(from), target, 0))).toBe(AnimalStatusErrorCode.StatusNotManual);
    }
  });
});

describe("formatActiveApplications", () => {
  it.each([
    [1, "1 aktivno vlogo"],
    [2, "2 aktivni vlogi"],
    [3, "3 aktivne vloge"],
    [4, "4 aktivne vloge"],
    [5, "5 aktivnih vlog"],
    [11, "11 aktivnih vlog"],
    [101, "101 aktivno vlogo"],
    [102, "102 aktivni vlogi"],
  ])("%i → %s", (count, expected) => {
    expect(formatActiveApplications(count)).toBe(expected);
  });
});
