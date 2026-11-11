import { prisma } from "../../db";
import { CommonErrorCode, DomainError } from "../../errors";
import type { Animal, AnimalStatus, Prisma } from "../../generated/prisma/client";
import { activeApplicationWhere } from "../applications/active";
import { type Actor, requireManager } from "../guard";

// ---------------------------------------------------------------------------
// Pravila spremembe statusa živali (US-01). Čiste funkcije brez dostopa do baze.
// ---------------------------------------------------------------------------

/** Vedenjske lastnosti, ki morajo biti izpolnjene, preden je žival na voljo (US-01 AC 2). */
export const BEHAVIOR_ATTRIBUTES = [
  { field: "size", label: "velikost" },
  { field: "energyLevel", label: "raven energije" },
  { field: "needsGarden", label: "potreba po vrtu" },
  { field: "goodWithKids", label: "primernost za otroke" },
  { field: "goodWithDogs", label: "primernost za pse" },
  { field: "goodWithCats", label: "primernost za mačke" },
] as const satisfies ReadonlyArray<{ field: keyof Animal; label: string }>;

export type BehaviorAttribute = (typeof BEHAVIOR_ATTRIBUTES)[number];
type BehaviorFields = Pick<Animal, BehaviorAttribute["field"]>;

/**
 * Vrne vedenjske lastnosti, ki še niso vnesene. Vrednost UNKNOWN (»neznano«)
 * velja kot izpolnjena, prazna je le vrednost null.
 */
export function getMissingBehaviorAttributes(animal: BehaviorFields): BehaviorAttribute[] {
  return BEHAVIOR_ATTRIBUTES.filter(({ field }) => animal[field] === null);
}

/** Statusa, med katerima vodja lahko ročno preklaplja (US-01 AC 4). */
export const MANUAL_STATUSES = ["INTAKE", "AVAILABLE"] as const satisfies readonly AnimalStatus[];

const isManualStatus = (status: AnimalStatus) => (MANUAL_STATUSES as readonly AnimalStatus[]).includes(status);

export const AnimalStatusErrorCode = {
  StatusNotManual: "ANIMAL_STATUS_NOT_MANUAL",
  MissingBehaviorAttributes: "ANIMAL_MISSING_BEHAVIOR_ATTRIBUTES",
  HasActiveApplications: "ANIMAL_HAS_ACTIVE_APPLICATIONS",
} as const;

/** 1 aktivno vlogo, 2 aktivni vlogi, 3 aktivne vloge, 5 aktivnih vlog (tožilnik). */
export function formatActiveApplications(count: number): string {
  const mod100 = count % 100;
  if (mod100 === 1) return `${count} aktivno vlogo`;
  if (mod100 === 2) return `${count} aktivni vlogi`;
  if (mod100 === 3 || mod100 === 4) return `${count} aktivne vloge`;
  return `${count} aktivnih vlog`;
}

/**
 * Preveri, ali je ročna sprememba statusa dovoljena. Ob kršitvi vrže DomainError.
 *
 * - ročno sta izbirna le statusa INTAKE in AVAILABLE, iz RESERVED/ADOPTED ročna sprememba ni mogoča (AC 4),
 * - v AVAILABLE le, če nobena vedenjska lastnost ni prazna (AC 2),
 * - v INTAKE le, če žival nima aktivnih vlog (AC 5).
 */
export function assertStatusChangeAllowed(
  animal: BehaviorFields & Pick<Animal, "status">,
  target: AnimalStatus,
  activeApplicationCount: number,
): void {
  if (!isManualStatus(target)) {
    throw new DomainError(
      AnimalStatusErrorCode.StatusNotManual,
      "Statusa »rezervirana« in »posvojena« ni mogoče izbrati ročno; žival ju dobi z odobritvijo vloge oziroma zaključkom posvojitve.",
      { from: animal.status, to: target },
    );
  }
  if (!isManualStatus(animal.status)) {
    throw new DomainError(
      AnimalStatusErrorCode.StatusNotManual,
      "Statusa rezervirane ali posvojene živali ni mogoče ročno spremeniti.",
      { from: animal.status, to: target },
    );
  }

  if (target === "AVAILABLE") {
    const missing = getMissingBehaviorAttributes(animal);
    if (missing.length > 0) {
      throw new DomainError(
        AnimalStatusErrorCode.MissingBehaviorAttributes,
        `Žival ni mogoče označiti kot na voljo. Manjkajoče lastnosti: ${missing.map((m) => m.label).join(", ")}.`,
        { missing },
      );
    }
  }

  if (target === "INTAKE" && activeApplicationCount > 0) {
    throw new DomainError(
      AnimalStatusErrorCode.HasActiveApplications,
      `Žival ni mogoče vrniti v status »sprejeta«, ker ima ${formatActiveApplications(activeApplicationCount)}.`,
      { activeApplicationCount },
    );
  }
}

// ---------------------------------------------------------------------------
// Storitev
// ---------------------------------------------------------------------------

type Tx = Prisma.TransactionClient;

/** Število aktivnih vlog za žival (US-01 AC 5). */
function countActiveApplications(tx: Tx, animalId: string): Promise<number> {
  return tx.application.count({ where: { animalId, ...activeApplicationWhere } });
}

/**
 * Ročna sprememba statusa živali (US-01 AC 3–5). Izvede jo lahko le aktiven vodja;
 * vloga in isActive se zaradi varnosti prebereta iz baze, ne iz seje.
 */
export async function changeAnimalStatus(
  actor: Actor,
  input: { animalId: string; status: AnimalStatus },
): Promise<Animal> {
  return prisma.$transaction(async (tx) => {
    await requireManager(tx, actor, "Status živali lahko spremeni le vodja zavetišča.");

    const animal = await tx.animal.findUnique({ where: { id: input.animalId } });
    if (!animal) {
      throw new DomainError(CommonErrorCode.NotFound, "Žival ne obstaja.");
    }
    if (animal.status === input.status) {
      return animal;
    }

    const activeApplicationCount = input.status === "INTAKE" ? await countActiveApplications(tx, animal.id) : 0;
    assertStatusChangeAllowed(animal, input.status, activeApplicationCount);

    return tx.animal.update({ where: { id: animal.id }, data: { status: input.status } });
  });
}
