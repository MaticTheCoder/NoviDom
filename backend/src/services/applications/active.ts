import type { Prisma } from "../../generated/prisma/client";
import { ACTIVE_STATUSES } from "../../state-machine";

/**
 * Aktivna stanja vloge (docs/02-funkcionalnosti-in-obseg.md). Enak seznam uporablja
 * delni unikatni indeks application_one_active_per_adopter_animal v migraciji.
 */
export const ACTIVE_APPLICATION_STATUSES = ACTIVE_STATUSES;

export const activeApplicationWhere = { status: { in: [...ACTIVE_STATUSES] } } satisfies Prisma.ApplicationWhereInput;
