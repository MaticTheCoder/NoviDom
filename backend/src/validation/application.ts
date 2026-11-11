// Zod sheme za vloge. Brez Prisma Clienta, zato jih lahko uporablja tudi brskalnik.
import { z } from "zod";
import { ApplicationStatus } from "../generated/prisma/enums";

export const transitionInputSchema = z.object({
  applicationId: z.uuid(),
  to: z.enum(ApplicationStatus),
  comment: z.string().trim().max(2000, "Komentar je lahko dolg največ 2000 znakov.").optional(),
});

export type TransitionInput = z.infer<typeof transitionInputSchema>;

export const MAX_ACTIVE_APPLICATIONS = 3;
export const MOTIVATION_MIN_LENGTH = 10;

export const submitApplicationSchema = z.object({
  animalId: z.uuid({ error: "Neveljavna žival." }),
  motivation: z
    .string()
    .trim()
    .min(MOTIVATION_MIN_LENGTH, `Na kratko opišite, zakaj želite posvojiti to žival (vsaj ${MOTIVATION_MIN_LENGTH} znakov).`)
    .max(2000, "Besedilo je lahko dolgo največ 2000 znakov."),
  // Ob oceni Neujemanje mora posvojitelj potrditi, da je seznanjen z opozorili (US-03 AC 5).
  acknowledgeWarnings: z.boolean().default(false),
});

export const ACKNOWLEDGE_WARNINGS_LABEL = "Seznanjen sem z opozorili";

export type SubmitApplicationInput = z.input<typeof submitApplicationSchema>;
