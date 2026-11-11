import { prisma } from "../../db";
import { CommonErrorCode, DomainError } from "../../errors";
import type { Application, ApplicationStatus, Prisma, Role } from "../../generated/prisma/client";
import {
  checkTransition,
  isFinalStatus,
  type TransitionActor,
  type TransitionDefinition,
  type TransitionTrigger,
} from "../../state-machine";
import { type Actor, requireRole } from "../guard";
import { recordApplicationEvent } from "./events";

type Tx = Prisma.TransactionClient;

export const ApplicationErrorCode = {
  TransitionNotAllowed: "APPLICATION_TRANSITION_NOT_ALLOWED",
  CommentRequired: "APPLICATION_COMMENT_REQUIRED",
  AnotherApproved: "APPLICATION_ANOTHER_APPROVED",
  StatusChanged: "APPLICATION_STATUS_CHANGED",
} as const;

export const applicationNotFound = () => new DomainError(CommonErrorCode.NotFound, "Vloga ne obstaja.");

/** Izvajalec prehoda: preverjen uporabnik (vloga iz baze) ali sistem. */
export type TransitionPerformer = { kind: "user"; userId: string; role: Role } | { kind: "system" };

const performerActor = (p: TransitionPerformer): TransitionActor => (p.kind === "system" ? "SYSTEM" : p.role);

/**
 * Preveri in izvede en prehod vloge v podani transakciji (ADR-0006, ADR-0007):
 * tabela prehodov (stanje, izvajalec, komentar), pogoji (lastništvo, ena odobrena vloga),
 * sprememba stanja z optimističnim zaklepanjem, posledica na živali in zapis v zgodovino.
 *
 * Vse operacije, ki spremenijo stanje vloge (gumbi, rezervacija, zapisnik, posvojitev),
 * morajo iti skozi to funkcijo, da nobena ne zaobide revizijske sledi.
 */
export async function applyTransition(
  tx: Tx,
  input: {
    application: Pick<Application, "id" | "status" | "adopterId" | "animalId">;
    to: ApplicationStatus;
    trigger: TransitionTrigger;
    performer: TransitionPerformer;
    comment?: string | null;
  },
): Promise<{ application: Application; transition: TransitionDefinition }> {
  const { application, to, trigger, performer } = input;
  const comment = input.comment?.trim() || null;

  const check = checkTransition({ from: application.status, to, actor: performerActor(performer), trigger, comment });
  if (!check.ok) {
    if (check.reason === "COMMENT_REQUIRED") {
      throw new DomainError(
        ApplicationErrorCode.CommentRequired,
        `Komentar mora imeti vsaj ${check.transition?.minCommentLength} znakov.`,
        { fieldErrors: { comment: `Vnesite komentar z vsaj ${check.transition?.minCommentLength} znaki.` } },
      );
    }
    throw new DomainError(ApplicationErrorCode.TransitionNotAllowed, "Tega prehoda iz trenutnega stanja vloge ni mogoče izvesti.", {
      from: application.status,
      to,
    });
  }
  const transition = check.transition;

  if (transition.guards?.includes("OWNER") && (performer.kind !== "user" || performer.userId !== application.adopterId)) {
    throw new DomainError(CommonErrorCode.Forbidden, "Vlogo lahko spremeni le posvojitelj, ki jo je oddal.");
  }

  if (transition.guards?.includes("NO_OTHER_APPROVED")) {
    const approved = await tx.application.findFirst({
      where: { animalId: application.animalId, status: "APPROVED", id: { not: application.id } },
      select: { id: true },
    });
    if (approved) throw anotherApproved(approved.id);
  }

  // Optimistično zaklepanje: prehod uspe le, če se stanje medtem ni spremenilo.
  // Komentar odločitve se shrani ob odobritvi ali zavrnitvi in pobriše ob umiku odobritve.
  const decision =
    to === "APPROVED" || to === "REJECTED" ? { decisionComment: comment } : application.status === "APPROVED" ? { decisionComment: null } : {};
  let updated: Prisma.BatchPayload;
  try {
    updated = await tx.application.updateMany({
      where: { id: application.id, status: application.status },
      data: { status: to, closedAt: isFinalStatus(to) ? new Date() : null, ...decision },
    });
  } catch (error) {
    // Delni unikatni indeks application_one_approved_per_animal ob sočasni odobritvi.
    // Transakcija je po napaki prekinjena, zato druge odobrene vloge tu ne iščemo več.
    if (to === "APPROVED" && isUniqueViolation(error)) throw anotherApproved();
    throw error;
  }
  if (updated.count === 0) {
    throw new DomainError(ApplicationErrorCode.StatusChanged, "Stanje vloge se je medtem spremenilo. Osvežite stran.");
  }

  if (transition.animalStatus) {
    await tx.animal.update({ where: { id: application.animalId }, data: { status: transition.animalStatus } });
  }

  await recordApplicationEvent(tx, {
    applicationId: application.id,
    fromStatus: application.status,
    toStatus: to,
    actorId: performer.kind === "user" ? performer.userId : null,
    comment,
  });

  return { application: await tx.application.findUniqueOrThrow({ where: { id: application.id } }), transition };
}

function anotherApproved(approvedApplicationId?: string) {
  return new DomainError(
    ApplicationErrorCode.AnotherApproved,
    "Za to žival je že odobrena druga vloga. Najprej umaknite tisto odobritev.",
    { approvedApplicationId },
  );
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as { code?: string; cause?: { code?: string; originalCode?: string } };
  return e.code === "P2002" || e.cause?.code === "23505" || e.cause?.originalCode === "23505";
}

/**
 * Prehod vloge z gumbom (sprožilec `action`): prevzem v pregled, odobritev, zavrnitev,
 * umik odobritve in umik vloge. Vloga izvajalca se prebere iz baze (ADR-0005).
 */
export async function transitionApplication(
  actor: Actor,
  input: { applicationId: string; to: ApplicationStatus; comment?: string | null },
): Promise<Application> {
  return prisma.$transaction(async (tx) => {
    const user = await requireRole(tx, actor, ["MANAGER", "ADOPTER"], "Tega dejanja ne morete izvesti.");
    const application = await tx.application.findUnique({ where: { id: input.applicationId } });
    // Posvojitelju tuje vloge ne razkrijemo (enako kot neobstoječa).
    if (!application || (user.role === "ADOPTER" && application.adopterId !== user.id)) throw applicationNotFound();

    const { application: result } = await applyTransition(tx, {
      application,
      to: input.to,
      trigger: "action",
      performer: { kind: "user", userId: user.id, role: user.role },
      comment: input.comment,
    });
    return result;
  });
}
