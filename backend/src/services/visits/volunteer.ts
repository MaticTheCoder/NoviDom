import { prisma } from "../../db";
import { CommonErrorCode, DomainError, isUuid } from "../../errors";
import { parseHouseholdSnapshot } from "../applications/snapshot";
import { type Actor, requireRole } from "../guard";
import { parseMatchWarnings } from "../matching";
import { isReportEditable, reportEditableUntil } from "./report";

// Pogled prostovoljca na ogledi v njegovih terminih (US-06, WF-05).

const requireVolunteer = (actor: Actor) => requireRole(prisma, actor, ["VOLUNTEER"], "Ogledi so namenjeni prostovoljcem.");

/** Ogledi v terminih prostovoljca: prihodnji in tisti iz zadnjih 7 dni (za zapisnik). */
export async function listVolunteerVisits(actor: Actor, now = new Date()) {
  const volunteer = await requireVolunteer(actor);
  const visits = await prisma.visit.findMany({
    where: {
      slot: { volunteerId: volunteer.id, startsAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
      outcome: { in: ["PENDING", "DONE"] },
    },
    orderBy: { slot: { startsAt: "asc" } },
    select: {
      id: true,
      outcome: true,
      slot: { select: { startsAt: true, endsAt: true } },
      report: { select: { recommendation: true } },
      application: {
        select: { matchLevel: true, adopter: { select: { name: true, phone: true } }, animal: { select: { name: true, species: true } } },
      },
    },
  });
  return visits.map((v) => ({ ...v, needsReport: v.outcome === "PENDING" && !v.report && now >= v.slot.startsAt }));
}

/**
 * Podrobnost ogleda za prostovoljca: gospodinjstvo kandidata, opozorila, interne opombe
 * o živali in zapisnik. Dostop ima le prostovoljec, ki mu je termin dodeljen (US-06 AC 1).
 */
export async function getVolunteerVisit(actor: Actor, visitId: string, now = new Date()) {
  const volunteer = await requireVolunteer(actor);
  const notFound = new DomainError(CommonErrorCode.NotFound, "Ogled ne obstaja ali vam ni dodeljen.");
  if (!isUuid(visitId)) throw notFound;
  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: {
      id: true,
      outcome: true,
      slot: { select: { startsAt: true, endsAt: true, volunteerId: true } },
      report: true,
      application: {
        select: {
          id: true,
          status: true,
          motivation: true,
          matchLevel: true,
          matchWarnings: true,
          householdSnapshot: true,
          adopter: { select: { name: true, phone: true } },
          animal: { select: { name: true, species: true, internalNotes: true, photos: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
        },
      },
    },
  });
  if (!visit || visit.slot.volunteerId !== volunteer.id) throw notFound;

  const { application, report } = visit;
  const started = now >= visit.slot.startsAt;
  return {
    id: visit.id,
    outcome: visit.outcome,
    startsAt: visit.slot.startsAt,
    endsAt: visit.slot.endsAt,
    adopter: application.adopter,
    motivation: application.motivation,
    matchLevel: application.matchLevel,
    matchWarnings: parseMatchWarnings(application.matchWarnings),
    household: parseHouseholdSnapshot(application.householdSnapshot),
    animal: { ...application.animal, coverPhoto: application.animal.photos[0]?.url ?? null },
    report,
    started,
    /** Zapisnik je mogoče oddati: termin se je začel, ogled je dogovorjen in zapisnika še ni. */
    canSubmit: started && visit.outcome === "PENDING" && !report && application.status === "VISIT_SCHEDULED",
    canEdit: !!report && report.authorId === volunteer.id && isReportEditable(report, now),
    editableUntil: report ? reportEditableUntil(report) : null,
  };
}
