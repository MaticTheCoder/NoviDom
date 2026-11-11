import { prisma } from "../../db";
import { isUuid } from "../../errors";
import { getActionTransitions } from "../../state-machine";
import { type Actor, requireRole } from "../guard";
import { parseMatchWarnings } from "../matching";
import { activeApplicationWhere } from "./active";
import { listApplicationEvents } from "./events";
import { applicationNotFound } from "./transition";

// Pogled posvojitelja na njegove vloge (US-02 AC 5). Posvojitelj vidi le svoje vloge,
// zapisnika prostovoljca pa nikoli (US-06 AC 5): ta pogled ga namenoma ne vključuje.

const requireAdopter = (actor: Actor) => requireRole(prisma, actor, ["ADOPTER"], "Vloge si lahko ogleda le posvojitelj.");

const animalSummary = {
  select: {
    id: true,
    name: true,
    species: true,
    status: true,
    photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
  },
} as const;

export async function listMyApplications(actor: Actor) {
  const user = await requireAdopter(actor);
  const [applications, activeCount] = await Promise.all([
    prisma.application.findMany({
      where: { adopterId: user.id },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        matchLevel: true,
        submittedAt: true,
        closedAt: true,
        animal: animalSummary,
        events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
    }),
    prisma.application.count({ where: { adopterId: user.id, ...activeApplicationWhere } }),
  ]);
  return {
    activeCount,
    applications: applications.map(({ events, animal, ...a }) => ({
      ...a,
      lastChangeAt: events[0]?.createdAt ?? a.submittedAt,
      animal: { ...animal, coverPhoto: animal.photos[0]?.url ?? null },
    })),
  };
}

export async function getMyApplication(actor: Actor, applicationId: string) {
  const user = await requireAdopter(actor);
  if (!isUuid(applicationId)) throw applicationNotFound();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      adopterId: true,
      status: true,
      motivation: true,
      matchLevel: true,
      matchWarnings: true,
      decisionComment: true,
      submittedAt: true,
      closedAt: true,
      animal: animalSummary,
    },
  });
  // Tuja vloga se prikaže kot neobstoječa.
  if (!application || application.adopterId !== user.id) throw applicationNotFound();

  const { adopterId: _, animal, matchWarnings, ...rest } = application;
  return {
    ...rest,
    matchWarnings: parseMatchWarnings(matchWarnings),
    animal: { ...animal, coverPhoto: animal.photos[0]?.url ?? null },
    events: await listApplicationEvents(prisma, application.id),
    actions: getActionTransitions(application.status, "ADOPTER").filter((t) => t.trigger === "action"),
  };
}
