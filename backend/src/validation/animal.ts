// Zod sheme za živali. Uvaža le zod in generirane enume (brez Prisma Clienta),
// zato jih lahko uporablja tudi obrazec v brskalniku (@novi-dom/backend/validation).
import { z } from "zod";
import {
  AnimalSize,
  AnimalStatus,
  Compatibility,
  EnergyLevel,
  KidsCompatibility,
  Sex,
  Species,
} from "../generated/prisma/enums";

export const changeAnimalStatusSchema = z.object({
  animalId: z.uuid(),
  status: z.enum(AnimalStatus),
});

export type ChangeAnimalStatusInput = z.infer<typeof changeAnimalStatusSchema>;

const todayIso = () => new Date().toISOString().slice(0, 10);

const pastDate = (required: string) =>
  z.iso
    .date({ error: required })
    .refine((d) => d <= todayIso(), { error: "Datum ne more biti v prihodnosti." });

/**
 * Podatki obrazca za vnos in urejanje živali. Status ni del obrazca: nova žival je
 * vedno »sprejeta« (US-01 AC 1), status pa se spreminja ločeno (changeAnimalStatus).
 * Vedenjske lastnosti so lahko null (»ni vneseno«), glej US-01 AC 2.
 */
export const animalInputSchema = z
  .object({
    name: z.string().trim().min(1, "Vnesite ime.").max(60, "Ime je lahko dolgo največ 60 znakov."),
    species: z.enum(Species, { error: "Izberite vrsto." }),
    sex: z.enum(Sex, { error: "Izberite spol." }),
    birthDateApprox: pastDate("Vnesite ocenjen datum rojstva."),
    intakeDate: pastDate("Vnesite datum sprejema."),
    description: z.string().trim().max(2000, "Opis je lahko dolg največ 2000 znakov."),
    internalNotes: z.string().trim().max(2000, "Opombe so lahko dolge največ 2000 znakov."),

    size: z.enum(AnimalSize).nullable(),
    energyLevel: z.enum(EnergyLevel).nullable(),
    needsGarden: z.boolean().nullable(),
    goodWithKids: z.enum(KidsCompatibility).nullable(),
    goodWithDogs: z.enum(Compatibility).nullable(),
    goodWithCats: z.enum(Compatibility).nullable(),

    isChipped: z.boolean(),
    isVaccinated: z.boolean(),
    isNeutered: z.boolean(),
  })
  .refine((a) => a.intakeDate >= a.birthDateApprox, {
    path: ["intakeDate"],
    error: "Datum sprejema ne more biti pred datumom rojstva.",
  });

export type AnimalInput = z.infer<typeof animalInputSchema>;

/** Omejitve za fotografije živali (preverja jih tudi shramba na strežniku). */
export const PHOTO_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxPerAnimal: 10,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export { ACKNOWLEDGE_WARNINGS_LABEL, MAX_ACTIVE_APPLICATIONS, MOTIVATION_MIN_LENGTH } from "./application";
