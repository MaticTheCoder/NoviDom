import type { ApplicationStatus, Prisma } from "../../generated/prisma/client";

// Revizijska sled prehodov vloge (ADR-0007). Modul namenoma ponuja le zapis in branje;
// urejanje in brisanje prepreči tudi sprožilec v bazi (US-04 AC 5).

type Db = Pick<Prisma.TransactionClient, "applicationEvent">;

export type ApplicationEventInput = {
  applicationId: string;
  fromStatus: ApplicationStatus | null; // null ob oddaji
  toStatus: ApplicationStatus;
  actorId: string | null; // null = sistemska sprememba
  comment?: string | null;
};

/** Zapiše prehod; klicati ga je treba v isti transakciji kot spremembo stanja. */
export function recordApplicationEvent(db: Db, event: ApplicationEventInput) {
  return db.applicationEvent.create({
    data: { ...event, comment: event.comment?.trim() || null },
  });
}

/** Zgodovina vloge od najstarejšega dogodka naprej, z imenom izvajalca. */
export function listApplicationEvents(db: Db, applicationId: string) {
  return db.applicationEvent.findMany({
    where: { applicationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
      createdAt: true,
      actor: { select: { id: true, name: true, role: true } },
    },
  });
}

export type ApplicationEventView = Awaited<ReturnType<typeof listApplicationEvents>>[number];
