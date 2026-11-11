import { prisma } from "../../db";
import { DomainError } from "../../errors";
import type { Household } from "../../generated/prisma/client";
import { type HouseholdInput, householdInputSchema } from "../../validation/household";
import { type Actor, requireRole } from "../guard";

export const HouseholdErrorCode = { Validation: "HOUSEHOLD_VALIDATION" } as const;

const requireAdopter = (actor: Actor) =>
  requireRole(prisma, actor, ["ADOPTER"], "Vprašalnik o gospodinjstvu izpolni posvojitelj.");

/** Vprašalnik prijavljenega posvojitelja ali null, če ga še ni izpolnil (US-02 AC 2). */
export async function getMyHousehold(actor: Actor): Promise<Household | null> {
  const user = await requireAdopter(actor);
  return prisma.household.findUnique({ where: { userId: user.id } });
}

export function parseHouseholdInput(raw: unknown): HouseholdInput {
  const parsed = householdInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    throw new DomainError(HouseholdErrorCode.Validation, "Podatki vprašalnika niso veljavni.", { fieldErrors });
  }
  return parsed.data;
}

/**
 * Shrani (ustvari ali posodobi) vprašalnik posvojitelja. Že oddanih vlog to ne spremeni,
 * ker hranijo svojo kopijo vprašalnika (ADR-0008).
 */
export async function saveMyHousehold(actor: Actor, raw: unknown): Promise<Household> {
  const input = parseHouseholdInput(raw);
  const user = await requireAdopter(actor);
  const childrenAges = [...input.childrenAges].sort((a, b) => a - b);
  const data = { ...input, childrenAges };
  return prisma.household.upsert({ where: { userId: user.id }, create: { ...data, userId: user.id }, update: data });
}
