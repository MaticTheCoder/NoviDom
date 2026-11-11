// Zod sheme za vloge. Brez Prisma Clienta, zato jih lahko uporablja tudi brskalnik.
import { z } from "zod";
import { ApplicationStatus } from "../generated/prisma/enums";

export const transitionInputSchema = z.object({
  applicationId: z.uuid(),
  to: z.enum(ApplicationStatus),
  comment: z.string().trim().max(2000, "Komentar je lahko dolg največ 2000 znakov.").optional(),
});

export type TransitionInput = z.infer<typeof transitionInputSchema>;
