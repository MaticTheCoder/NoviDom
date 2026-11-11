import { prisma } from "../../src/db";
import type { ApplicationStatus, Prisma, Role } from "../../src/generated/prisma/client";

export { prisma };

/** Izprazni vse tabele (TRUNCATE ne sproži sprožilca revizijske sledi). */
export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}

let seq = 0;

export function createUser(role: Role, data: Partial<Prisma.UserCreateInput> = {}) {
  seq += 1;
  return prisma.user.create({
    data: { email: `${role.toLowerCase()}${seq}@test.si`, name: `${role} ${seq}`, passwordHash: "x", role, ...data },
  });
}

export function createAnimal(createdById: string, data: Partial<Prisma.AnimalUncheckedCreateInput> = {}) {
  return prisma.animal.create({
    data: {
      name: "Rex",
      species: "DOG",
      sex: "MALE",
      birthDateApprox: new Date("2021-01-01"),
      size: "MEDIUM",
      energyLevel: "MEDIUM",
      needsGarden: false,
      goodWithKids: "YES",
      goodWithDogs: "YES",
      goodWithCats: "YES",
      status: "AVAILABLE",
      createdById,
      ...data,
    },
  });
}

export function createApplication(
  adopterId: string,
  animalId: string,
  status: ApplicationStatus = "SUBMITTED",
  data: Partial<Prisma.ApplicationUncheckedCreateInput> = {},
) {
  return prisma.application.create({
    data: { adopterId, animalId, status, motivation: "Želim posvojiti.", householdSnapshot: {}, matchLevel: "MATCH", ...data },
  });
}

/** Pokliče funkcijo in vrne kodo napake DomainError (ali "OK"). */
export async function codeOf(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    return "OK";
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (!code) throw error;
    return code;
  }
}
