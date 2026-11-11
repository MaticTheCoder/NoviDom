import { CommonErrorCode, DomainError } from "../errors";
import type { Prisma, Role } from "../generated/prisma/client";

export type Actor = { userId: string };

type Db = Pick<Prisma.TransactionClient, "user">;

/**
 * Raven 2 avtorizacije (ADR-0005): vloga in isActive se pri vsaki operaciji
 * preberejo iz baze, ne iz JWT, da deaktivacija ali sprememba vloge učinkuje takoj.
 */
export async function requireRole(db: Db, actor: Actor, roles: readonly Role[], message: string) {
  const user = await db.user.findUnique({ where: { id: actor.userId }, select: { id: true, role: true, isActive: true } });
  if (!user || !user.isActive || !roles.includes(user.role)) {
    throw new DomainError(CommonErrorCode.Forbidden, message);
  }
  return user;
}

export const requireManager = (db: Db, actor: Actor, message = "To dejanje lahko izvede le vodja zavetišča.") =>
  requireRole(db, actor, ["MANAGER"], message);
