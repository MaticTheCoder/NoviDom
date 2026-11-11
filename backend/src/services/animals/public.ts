import { prisma } from "../../db";
import { isUuid } from "../../errors";
import type { Prisma } from "../../generated/prisma/client";

// Javni pogled na živali (obiskovalci in posvojitelji). Interne vedenjske opombe
// (internalNotes) so vidne le osebju, zato jih ta pogled nikoli ne vrne.
const publicSelect = {
  id: true,
  name: true,
  species: true,
  sex: true,
  birthDateApprox: true,
  description: true,
  size: true,
  energyLevel: true,
  needsGarden: true,
  goodWithKids: true,
  goodWithDogs: true,
  goodWithCats: true,
  isChipped: true,
  isVaccinated: true,
  isNeutered: true,
  status: true,
  photos: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true } },
} satisfies Prisma.AnimalSelect;

export type PublicAnimal = Prisma.AnimalGetPayload<{ select: typeof publicSelect }>;

/** Katalog: samo živali s statusom »na voljo« (US-01 AC 1, 3). */
export function listPublicAnimals(): Promise<PublicAnimal[]> {
  return prisma.animal.findMany({ where: { status: "AVAILABLE" }, orderBy: [{ intakeDate: "asc" }, { name: "asc" }], select: publicSelect });
}

/**
 * Profil živali. Sprejete (še ne objavljene) živali niso javne; rezervirane in posvojene
 * so prikazane brez možnosti oddaje vloge (gumb je le pri »na voljo«, US-02 AC 1).
 */
export async function getPublicAnimal(animalId: string): Promise<PublicAnimal | null> {
  if (!isUuid(animalId)) return null;
  const animal = await prisma.animal.findUnique({ where: { id: animalId }, select: publicSelect });
  return animal && animal.status !== "INTAKE" ? animal : null;
}
