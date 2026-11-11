import { z } from "zod";
import type { Household } from "../../generated/prisma/client";
import { HousingType } from "../../generated/prisma/enums";

/**
 * Kopija vprašalnika, shranjena v vlogi ob oddaji (ADR-0008). Kasnejše spremembe
 * profila je ne spremenijo, zato vodja vidi podatke, kot so bili ob oddaji.
 */
export const householdSnapshotSchema = z.object({
  housingType: z.enum(HousingType),
  hasGarden: z.boolean(),
  childrenAges: z.array(z.number().int()),
  hasDogs: z.boolean(),
  hasCats: z.boolean(),
  hoursAlonePerDay: z.number().int(),
  experience: z.string(),
  capturedAt: z.iso.datetime(),
});

export type HouseholdSnapshot = z.infer<typeof householdSnapshotSchema>;

export function toHouseholdSnapshot(h: Household, now = new Date()): HouseholdSnapshot {
  return {
    housingType: h.housingType,
    hasGarden: h.hasGarden,
    childrenAges: [...h.childrenAges],
    hasDogs: h.hasDogs,
    hasCats: h.hasCats,
    hoursAlonePerDay: h.hoursAlonePerDay,
    experience: h.experience,
    capturedAt: now.toISOString(),
  };
}

/** Prebere kopijo iz JSON polja vloge; ob neveljavni obliki vrne null. */
export function parseHouseholdSnapshot(json: unknown): HouseholdSnapshot | null {
  const parsed = householdSnapshotSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}
