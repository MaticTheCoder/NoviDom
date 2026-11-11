import { prisma } from "../../db";
import { isUuid } from "../../errors";
import type { ApplicationStatus } from "../../generated/prisma/client";
import { getActionTransitions } from "../../state-machine";
import { type Actor, requireManager } from "../guard";
import { parseMatchWarnings } from "../matching";
import { listApplicationEvents } from "./events";
import { parseHouseholdSnapshot } from "./snapshot";
import { applicationNotFound } from "./transition";

// Pogled vodje na vloge (US-04).

export async function listApplicationsForManager(actor: Actor, filter: { status?: ApplicationStatus } = {}) {
  await requireManager(prisma, actor, "Vloge lahko pregleduje le vodja zavetišča.");
  const applications = await prisma.application.findMany({
    where: filter.status ? { status: filter.status } : {},
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      matchLevel: true,
      submittedAt: true,
      adopter: { select: { name: true } },
      animal: { select: { id: true, name: true, species: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      visits: { where: { report: { isNot: null } }, take: 1, select: { report: { select: { recommendation: true } } } },
    },
  });
  return applications.map(({ events, visits, ...a }) => ({
    ...a,
    lastChangeAt: events[0]?.createdAt ?? a.submittedAt,
    recommendation: visits[0]?.report?.recommendation ?? null,
  }));
}

export async function getApplicationForManager(actor: Actor, applicationId: string) {
  await requireManager(prisma, actor, "Vloge lahko pregleduje le vodja zavetišča.");
  if (!isUuid(applicationId)) throw applicationNotFound();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      adopter: { select: { id: true, name: true, email: true, phone: true } },
      animal: {
        select: {
          id: true,
          name: true,
          species: true,
          status: true,
          internalNotes: true,
          photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });
  if (!application) throw applicationNotFound();

  // Druga odobrena vloga za isto žival (US-04 AC 3): »Odobri« ni mogoč, UI pokaže povezavo nanjo.
  const otherApproved = await prisma.application.findFirst({
    where: { animalId: application.animalId, status: "APPROVED", id: { not: application.id } },
    select: { id: true, adopter: { select: { name: true } } },
  });

  // Ogledi z zapisniki prostovoljcev (US-06 AC 5: vidni vodji, posvojitelju nikoli).
  const visits = await prisma.visit.findMany({
    where: { applicationId: application.id },
    orderBy: { slot: { startsAt: "desc" } },
    select: {
      id: true,
      outcome: true,
      slot: { select: { startsAt: true, volunteer: { select: { name: true } } } },
      report: { select: { recommendation: true, text: true, submittedAt: true, updatedAt: true, author: { select: { name: true } } } },
    },
  });

  return {
    ...application,
    visits,
    animal: { ...application.animal, coverPhoto: application.animal.photos[0]?.url ?? null },
    household: parseHouseholdSnapshot(application.householdSnapshot),
    matchWarnings: parseMatchWarnings(application.matchWarnings),
    events: await listApplicationEvents(prisma, application.id),
    // Gumbi z neposrednim prehodom; zaključek posvojitve ima svoje potrditveno okno (#36).
    actions: getActionTransitions(application.status, "MANAGER").filter((t) => t.trigger === "action"),
    otherApproved,
  };
}
