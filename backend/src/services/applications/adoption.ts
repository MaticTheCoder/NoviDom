import { prisma } from "../../db";
import { DomainError, isUuid } from "../../errors";
import type { Application } from "../../generated/prisma/client";
import { type Actor, requireManager } from "../guard";
import { activeApplicationWhere } from "./active";
import { applicationNotFound, applyTransition } from "./transition";

/** Razlog samodejne zavrnitve ostalih vlog (US-07 AC 3). */
export const ADOPTED_REJECTION_REASON = "Žival je posvojena";

export const AdoptionErrorCode = { NotApproved: "ADOPTION_NOT_APPROVED" } as const;

/** Ostale aktivne vloge za isto žival, ki bodo ob zaključku samodejno zavrnjene. */
const othersWhere = (application: Pick<Application, "id" | "animalId">) => ({
  animalId: application.animalId,
  id: { not: application.id },
  ...activeApplicationWhere,
});

/** Podatki za potrditveno okno: število ostalih aktivnih vlog (US-07 AC 2). */
export async function getAdoptionPreview(actor: Actor, applicationId: string) {
  await requireManager(prisma, actor);
  if (!isUuid(applicationId)) throw applicationNotFound();
  const application = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, animalId: true, status: true } });
  if (!application) throw applicationNotFound();
  return { status: application.status, otherActiveCount: await prisma.application.count({ where: othersWhere(application) }) };
}

/**
 * Zaključek posvojitve (US-07 AC 3–5) v eni transakciji (docs/03):
 * - vloga odobrena → posvojena, žival → posvojena (posledica iz tabele prehodov),
 * - vse ostale aktivne vloge za isto žival → zavrnjena z razlogom »Žival je posvojena«,
 *   zabeleženo kot sistemska sprememba (brez izvajalca),
 * - njihovi dogovorjeni ogledi se odpovejo.
 * Če katerakoli sprememba ne uspe, se ne izvede nobena (AC 4).
 */
export async function completeAdoption(actor: Actor, applicationId: string): Promise<{ application: Application; rejectedCount: number }> {
  if (!isUuid(applicationId)) throw applicationNotFound();
  return prisma.$transaction(async (tx) => {
    const manager = await requireManager(tx, actor, "Posvojitev lahko zaključi le vodja zavetišča.");
    const application = await tx.application.findUnique({ where: { id: applicationId } });
    if (!application) throw applicationNotFound();
    if (application.status !== "APPROVED") {
      throw new DomainError(AdoptionErrorCode.NotApproved, "Posvojitev je mogoče zaključiti le pri odobreni vlogi.");
    }

    // Zaklep živali: sočasna sprememba vlog iste živali počaka na konec transakcije.
    await tx.$executeRaw`SELECT 1 FROM "Animal" WHERE id = ${application.animalId}::uuid FOR UPDATE`;

    const { application: adopted } = await applyTransition(tx, {
      application,
      to: "ADOPTED",
      trigger: "adoption",
      performer: { kind: "user", userId: manager.id, role: manager.role },
    });

    const others = await tx.application.findMany({ where: othersWhere(application), orderBy: { submittedAt: "asc" } });
    for (const other of others) {
      await applyTransition(tx, {
        application: other,
        to: "REJECTED",
        trigger: "auto-reject",
        performer: { kind: "system" },
        comment: ADOPTED_REJECTION_REASON,
      });
    }
    if (others.length > 0) {
      await tx.visit.updateMany({ where: { applicationId: { in: others.map((o) => o.id) }, outcome: "PENDING" }, data: { outcome: "CANCELLED" } });
    }

    return { application: adopted, rejectedCount: others.length };
  });
}
