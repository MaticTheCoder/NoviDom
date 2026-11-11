import { prisma } from "../../db";
import { CommonErrorCode, DomainError } from "../../errors";
import type { Application, Prisma } from "../../generated/prisma/client";
import { MAX_ACTIVE_APPLICATIONS, submitApplicationSchema } from "../../validation/application";
import { requireRole, type Actor } from "../guard";
import { assessMatch } from "../matching";
import { activeApplicationWhere } from "./active";
import { recordApplicationEvent } from "./events";
import { toHouseholdSnapshot } from "./snapshot";
import { isUniqueViolation } from "./transition";

type Tx = Prisma.TransactionClient;

export const SubmitErrorCode = {
  Validation: "APPLICATION_VALIDATION",
  HouseholdRequired: "APPLICATION_HOUSEHOLD_REQUIRED",
  AnimalNotAvailable: "APPLICATION_ANIMAL_NOT_AVAILABLE",
  AlreadyActive: "APPLICATION_ALREADY_ACTIVE",
  TooManyActive: "APPLICATION_TOO_MANY_ACTIVE",
} as const;

export const alreadyActiveError = (applicationId?: string) =>
  new DomainError(SubmitErrorCode.AlreadyActive, "Za to žival že imate aktivno vlogo.", { applicationId });

export const tooManyActiveError = (count: number) =>
  new DomainError(
    SubmitErrorCode.TooManyActive,
    `Imate že ${count} aktivne vloge, kar je največ. Če želite oddati novo, eno od obstoječih vlog umaknite.`,
    { activeCount: count, max: MAX_ACTIVE_APPLICATIONS },
  );

/**
 * Pravila oddaje vloge (US-02 AC 3, 4), skupna za oddajo in predogled strani za oddajo.
 * Vrne vprašalnik posvojitelja in žival, ob kršitvi vrže DomainError.
 */
export async function checkSubmissionRules(tx: Tx | typeof prisma, adopterId: string, animalId: string) {
  const animal = await tx.animal.findUnique({ where: { id: animalId } });
  if (!animal) throw new DomainError(CommonErrorCode.NotFound, "Žival ne obstaja.");
  if (animal.status !== "AVAILABLE") {
    throw new DomainError(SubmitErrorCode.AnimalNotAvailable, "Za to žival trenutno ni mogoče oddati vloge, ker ni na voljo.");
  }

  const active = await tx.application.findMany({
    where: { adopterId, ...activeApplicationWhere },
    select: { id: true, animalId: true },
  });
  const existing = active.find((a) => a.animalId === animalId);
  if (existing) throw alreadyActiveError(existing.id);
  if (active.length >= MAX_ACTIVE_APPLICATIONS) throw tooManyActiveError(active.length);

  const household = await tx.household.findUnique({ where: { userId: adopterId } });
  if (!household) {
    throw new DomainError(SubmitErrorCode.HouseholdRequired, "Pred oddajo vloge izpolnite vprašalnik o gospodinjstvu.");
  }
  return { animal, household };
}

/**
 * Oddaja vloge za posvojitev (US-02, US-03). V eni transakciji preveri pravila, izračuna
 * oceno ujemanja, shrani kopijo vprašalnika in zapiše prvi dogodek v zgodovino.
 */
export async function submitApplication(actor: Actor, raw: unknown): Promise<Application> {
  const parsed = submitApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    throw new DomainError(SubmitErrorCode.Validation, "Podatki vloge niso veljavni.", { fieldErrors });
  }
  const { animalId, motivation } = parsed.data;

  try {
    return await prisma.$transaction(async (tx) => {
      const adopter = await requireRole(tx, actor, ["ADOPTER"], "Vlogo za posvojitev lahko odda le posvojitelj.");
      // Zaklep posvojitelja: sočasni oddaji istega posvojitelja se izvedeta zaporedno,
      // da omejitve 3 aktivnih vlog ni mogoče preseči (docs/03).
      await tx.$executeRaw`SELECT 1 FROM "User" WHERE id = ${adopter.id}::uuid FOR UPDATE`;

      const { animal, household } = await checkSubmissionRules(tx, adopter.id, animalId);
      const match = assessMatch(household, animal);

      const application = await tx.application.create({
        data: {
          adopterId: adopter.id,
          animalId,
          status: "SUBMITTED",
          motivation,
          householdSnapshot: toHouseholdSnapshot(household),
          matchLevel: match.level,
          matchWarnings: match.warnings,
        },
      });
      await recordApplicationEvent(tx, { applicationId: application.id, fromStatus: null, toStatus: "SUBMITTED", actorId: adopter.id });
      return application;
    });
  } catch (error) {
    // Delni unikatni indeks application_one_active_per_adopter_animal (zadnja varovalka).
    if (isUniqueViolation(error)) {
      const existing = await prisma.application.findFirst({
        where: { adopterId: actor.userId, animalId, ...activeApplicationWhere },
        select: { id: true },
      });
      throw alreadyActiveError(existing?.id);
    }
    throw error;
  }
}
