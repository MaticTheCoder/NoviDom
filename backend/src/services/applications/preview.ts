import { prisma } from "../../db";
import { isDomainError, isUuid } from "../../errors";
import { type Actor, requireRole } from "../guard";
import { assessMatch, type MatchWarning } from "../matching";
import { checkSubmissionRules, SubmitErrorCode } from "./submit";
import type { MatchLevel } from "../../generated/prisma/client";
import { getPublicAnimal, type PublicAnimal } from "../animals/public";

export type SubmissionBlock = { code: string; message: string; applicationId?: string };

export type SubmissionPreview =
  | { kind: "not-found" }
  | { kind: "household-required"; animal: PublicAnimal }
  | { kind: "blocked"; animal: PublicAnimal; block: SubmissionBlock }
  | {
      kind: "ready";
      animal: PublicAnimal;
      household: NonNullable<Awaited<ReturnType<typeof prisma.household.findUnique>>>;
      match: { level: MatchLevel; warnings: MatchWarning[] };
    };

/**
 * Podatki za stran za oddajo vloge: ista pravila kot pri oddaji (US-02 AC 2–4) in
 * ocena ujemanja pred oddajo (US-03 AC 1), da posvojitelj vidi rezultat, preden piše.
 */
export async function getSubmissionPreview(actor: Actor, animalId: string): Promise<SubmissionPreview> {
  const adopter = await requireRole(prisma, actor, ["ADOPTER"], "Vlogo za posvojitev lahko odda le posvojitelj.");
  if (!isUuid(animalId)) return { kind: "not-found" };
  const animal = await getPublicAnimal(animalId);
  if (!animal) return { kind: "not-found" };

  try {
    const { household, animal: full } = await checkSubmissionRules(prisma, adopter.id, animalId);
    return { kind: "ready", animal, household, match: assessMatch(household, full) };
  } catch (error) {
    if (!isDomainError(error)) throw error;
    if (error.code === SubmitErrorCode.HouseholdRequired) return { kind: "household-required", animal };
    const details = error.details as { applicationId?: string } | undefined;
    return { kind: "blocked", animal, block: { code: error.code, message: error.message, applicationId: details?.applicationId } };
  }
}
