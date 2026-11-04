import { prisma } from "../../db";
import { CommonErrorCode, DomainError } from "../../errors";
import type { Prisma } from "../../generated/prisma/client";
import { deleteStoredPhoto, savePhoto } from "../../storage/photos";
import { type AnimalInput, animalInputSchema, PHOTO_LIMITS } from "../../validation/animal";
import { type Actor, requireManager } from "../guard";
import { getMissingBehaviorAttributes } from "./status";

export const AnimalErrorCode = {
  Validation: "ANIMAL_VALIDATION",
  TooManyPhotos: "ANIMAL_TOO_MANY_PHOTOS",
} as const;

const notFound = () => new DomainError(CommonErrorCode.NotFound, "Žival ne obstaja.");

/** Pretvori podatke obrazca (datumi kot YYYY-MM-DD) v podatke za Prismo. */
function toData(input: AnimalInput) {
  return { ...input, birthDateApprox: new Date(input.birthDateApprox), intakeDate: new Date(input.intakeDate) };
}

function parseInput(raw: unknown): AnimalInput {
  const parsed = animalInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] ??= issue.message;
    }
    throw new DomainError(AnimalErrorCode.Validation, "Podatki obrazca niso veljavni.", { fieldErrors });
  }
  return parsed.data;
}

const withPhotos = { photos: { orderBy: { sortOrder: "asc" } } } satisfies Prisma.AnimalInclude;

/** Seznam vseh živali za vodjo, z naslovno fotografijo in manjkajočimi lastnostmi. */
export async function listAnimalsForManager(actor: Actor) {
  await requireManager(prisma, actor);
  const animals = await prisma.animal.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  return animals.map((a) => ({ ...a, coverPhoto: a.photos[0]?.url ?? null, missing: getMissingBehaviorAttributes(a) }));
}

export async function getAnimalForManager(actor: Actor, animalId: string) {
  await requireManager(prisma, actor);
  const animal = await prisma.animal.findUnique({ where: { id: animalId }, include: withPhotos });
  if (!animal) throw notFound();
  return { ...animal, missing: getMissingBehaviorAttributes(animal) };
}

/** Vnos nove živali; status je vedno INTAKE (US-01 AC 1). */
export async function createAnimal(actor: Actor, raw: unknown) {
  const input = parseInput(raw);
  return prisma.$transaction(async (tx) => {
    const manager = await requireManager(tx, actor);
    return tx.animal.create({ data: { ...toData(input), status: "INTAKE", createdById: manager.id } });
  });
}

/** Urejanje podatkov živali. Status se ne spreminja (za to je changeAnimalStatus). */
export async function updateAnimal(actor: Actor, animalId: string, raw: unknown) {
  const input = parseInput(raw);
  return prisma.$transaction(async (tx) => {
    await requireManager(tx, actor);
    const animal = await tx.animal.findUnique({ where: { id: animalId }, select: { status: true } });
    if (!animal) throw notFound();
    return tx.animal.update({ where: { id: animalId }, data: toData(input) });
  });
}

// ---------------------------------------------------------------------------
// Fotografije
// ---------------------------------------------------------------------------

export type UploadedFile = { name: string; bytes: Uint8Array };

/** Doda fotografije na konec vrstnega reda; prva fotografija živali postane naslovna. */
export async function addAnimalPhotos(actor: Actor, animalId: string, files: UploadedFile[]) {
  await requireManager(prisma, actor);
  const animal = await prisma.animal.findUnique({ where: { id: animalId }, include: { photos: { select: { sortOrder: true } } } });
  if (!animal) throw notFound();
  if (animal.photos.length + files.length > PHOTO_LIMITS.maxPerAnimal) {
    throw new DomainError(
      AnimalErrorCode.TooManyPhotos,
      `Žival ima lahko največ ${PHOTO_LIMITS.maxPerAnimal} fotografij (trenutno ${animal.photos.length}).`,
    );
  }

  // Datoteke najprej shranimo (preverjanje vrste in velikosti), šele nato zapise v bazo.
  const urls: string[] = [];
  try {
    for (const file of files) urls.push(await savePhoto(file.bytes, file.name));
  } catch (error) {
    await Promise.all(urls.map(deleteStoredPhoto));
    throw error;
  }

  const start = Math.max(-1, ...animal.photos.map((p) => p.sortOrder)) + 1;
  try {
    await prisma.animalPhoto.createMany({ data: urls.map((url, i) => ({ animalId, url, sortOrder: start + i })) });
  } catch (error) {
    await Promise.all(urls.map(deleteStoredPhoto));
    throw error;
  }
  return urls;
}

async function findPhoto(photoId: string) {
  const photo = await prisma.animalPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw new DomainError(CommonErrorCode.NotFound, "Fotografija ne obstaja.");
  return photo;
}

/** Ponovno oštevilči vrstni red 0..n-1, pri čemer je `firstId` (če je podan) na prvem mestu. */
async function renumber(tx: Prisma.TransactionClient, animalId: string, firstId?: string) {
  const photos = await tx.animalPhoto.findMany({ where: { animalId }, orderBy: { sortOrder: "asc" }, select: { id: true } });
  const ordered = firstId ? [...photos.filter((p) => p.id === firstId), ...photos.filter((p) => p.id !== firstId)] : photos;
  await Promise.all(ordered.map((p, i) => tx.animalPhoto.update({ where: { id: p.id }, data: { sortOrder: i } })));
}

export async function deleteAnimalPhoto(actor: Actor, photoId: string) {
  await requireManager(prisma, actor);
  const photo = await findPhoto(photoId);
  await prisma.$transaction(async (tx) => {
    await tx.animalPhoto.delete({ where: { id: photo.id } });
    await renumber(tx, photo.animalId);
  });
  await deleteStoredPhoto(photo.url);
  return photo.animalId;
}

export async function setCoverPhoto(actor: Actor, photoId: string) {
  await requireManager(prisma, actor);
  const photo = await findPhoto(photoId);
  await prisma.$transaction((tx) => renumber(tx, photo.animalId, photo.id));
  return photo.animalId;
}
