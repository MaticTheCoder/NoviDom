import { prisma } from "../db";
import type { Role } from "../generated/prisma/enums";
import { hashPassword, verifyPassword } from "./password";

export type AuthenticatedUser = { id: string; email: string; name: string; role: Role };

export type AuthenticationResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "ACCOUNT_DEACTIVATED" };

// Zgoščena vrednost za primerjavo, ko uporabnik ne obstaja, da odzivni čas ne
// razkrije, ali je e-poštni naslov registriran.
let dummyHash: Promise<string> | undefined;

export async function authenticateUser(email: string, password: string): Promise<AuthenticationResult> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true },
  });

  if (!user) {
    dummyHash ??= hashPassword("dummy-password-for-timing");
    await verifyPassword(await dummyHash, password);
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    return { ok: false, reason: "INVALID_CREDENTIALS" };
  }

  // Deaktiviranemu računu se razkrije razlog šele po pravilnem geslu (US-14 AC 1).
  if (!user.isActive) {
    return { ok: false, reason: "ACCOUNT_DEACTIVATED" };
  }

  return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
