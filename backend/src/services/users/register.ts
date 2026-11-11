import { hashPassword } from "../../auth/password";
import { prisma } from "../../db";
import { DomainError } from "../../errors";
import { registerAdopterSchema } from "../../validation/user";
import { isUniqueViolation } from "../applications/transition";

export const UserErrorCode = {
  Validation: "USER_VALIDATION",
  EmailTaken: "USER_EMAIL_TAKEN",
} as const;

const emailTaken = () =>
  new DomainError(UserErrorCode.EmailTaken, "Račun s tem e-poštnim naslovom že obstaja.", {
    fieldErrors: { email: "Račun s tem e-poštnim naslovom že obstaja. Prijavite se." },
  });

/**
 * Javna registracija (ADR-0005): ustvari se lahko le račun z vlogo posvojitelj,
 * prostovoljce ustvari vodja. Geslo se zgosti z argon2id.
 */
export async function registerAdopter(raw: unknown) {
  const parsed = registerAdopterSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    throw new DomainError(UserErrorCode.Validation, "Podatki obrazca niso veljavni.", { fieldErrors });
  }
  const { name, email, phone, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw emailTaken();

  try {
    return await prisma.user.create({
      data: { name, email, phone, role: "ADOPTER", passwordHash: await hashPassword(password) },
      select: { id: true, email: true, name: true, role: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw emailTaken(); // sočasna registracija z istim naslovom
    throw error;
  }
}
