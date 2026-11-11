import { prisma } from "../../db";
import { DomainError, isUuid } from "../../errors";
import type { Visit } from "../../generated/prisma/client";
import { SHELTER } from "../../shelter";
import { applicationNotFound, applyTransition, isUniqueViolation } from "../applications/transition";
import { type Actor, requireRole } from "../guard";
import { freeSlotWhere } from "./slots";

export const VisitErrorCode = {
  SlotTaken: "VISIT_SLOT_TAKEN",
  SlotUnavailable: "VISIT_SLOT_UNAVAILABLE",
  NotInReview: "VISIT_APPLICATION_NOT_IN_REVIEW",
} as const;

export const slotTakenError = () => new DomainError(VisitErrorCode.SlotTaken, "Termin je bil pravkar zaseden. Izberite drug termin.");

/**
 * Rezervacija termina ogleda (US-05). V eni transakciji:
 * - vloga mora biti posvojiteljeva in v stanju »v pregledu« (AC 1),
 * - termin mora biti prost in v naslednjih 14 dneh (AC 2),
 * - ustvari se ogled; delni unikatni indeks visit_one_active_per_slot zavrne
 *   sočasno rezervacijo istega termina (AC 5),
 * - vloga preide v »ogled dogovorjen« z zapisom v zgodovino (AC 4).
 */
export async function bookVisit(actor: Actor, input: { applicationId: string; slotId: string }, now = new Date()): Promise<Visit> {
  if (!isUuid(input.applicationId)) throw applicationNotFound();
  if (!isUuid(input.slotId)) throw new DomainError(VisitErrorCode.SlotUnavailable, "Termin ne obstaja.");

  try {
    return await prisma.$transaction(async (tx) => {
      const adopter = await requireRole(tx, actor, ["ADOPTER"], "Ogled lahko rezervira le posvojitelj.");
      const application = await tx.application.findUnique({ where: { id: input.applicationId } });
      if (!application || application.adopterId !== adopter.id) throw applicationNotFound();
      if (application.status !== "IN_REVIEW") {
        throw new DomainError(VisitErrorCode.NotInReview, "Ogled lahko rezervirate le, ko je vloga v stanju »v pregledu«.");
      }

      const slot = await tx.visitSlot.findUnique({
        where: { id: input.slotId },
        select: { id: true, visits: { where: { outcome: { not: "CANCELLED" } }, select: { id: true } } },
      });
      if (!slot) throw new DomainError(VisitErrorCode.SlotUnavailable, "Termin ne obstaja.");
      if (slot.visits.length > 0) throw slotTakenError();
      const free = await tx.visitSlot.count({ where: { id: slot.id, ...freeSlotWhere(now) } });
      if (free === 0) throw new DomainError(VisitErrorCode.SlotUnavailable, "Termin ni več na voljo. Izberite drug termin.");

      // Najprej zasedemo termin: če ga je medtem rezerviral drug posvojitelj, indeks zavrne vstavljanje.
      const visit = await tx.visit.create({ data: { applicationId: application.id, slotId: slot.id } });
      await applyTransition(tx, {
        application,
        to: "VISIT_SCHEDULED",
        trigger: "visit-booking",
        performer: { kind: "user", userId: adopter.id, role: adopter.role },
      });
      return visit;
    });
  } catch (error) {
    // Transakcija je po kršitvi indeksa prekinjena; napako pretvorimo zunaj nje.
    if (isUniqueViolation(error)) throw slotTakenError();
    throw error;
  }
}

/** Dogovorjen ogled vloge z datumom, uro in naslovom zavetišča (US-05 AC 4) ali null. */
export async function getScheduledVisit(applicationId: string) {
  const visit = await prisma.visit.findFirst({
    where: { applicationId, outcome: "PENDING" },
    select: { id: true, slot: { select: { startsAt: true, endsAt: true } } },
  });
  return visit && { id: visit.id, startsAt: visit.slot.startsAt, endsAt: visit.slot.endsAt, address: SHELTER.address, shelterName: SHELTER.name };
}

