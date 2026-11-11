import type { ApplicationStatus, Prisma } from "../../generated/prisma/client";

/**
 * Aktivna stanja vloge (docs/02-funkcionalnosti-in-obseg.md). Enak seznam uporablja
 * delni unikatni indeks application_one_active_per_adopter_animal v migraciji.
 */
export const ACTIVE_APPLICATION_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "VISIT_SCHEDULED",
  "VISIT_DONE",
  "APPROVED",
] as const satisfies readonly ApplicationStatus[];

export const isActiveApplicationStatus = (status: ApplicationStatus) =>
  (ACTIVE_APPLICATION_STATUSES as readonly ApplicationStatus[]).includes(status);

export const activeApplicationWhere = { status: { in: [...ACTIVE_APPLICATION_STATUSES] } } satisfies Prisma.ApplicationWhereInput;
