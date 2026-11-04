import { z } from "zod";

export const changeAnimalStatusSchema = z.object({
  animalId: z.uuid(),
  status: z.enum(["INTAKE", "AVAILABLE", "RESERVED", "ADOPTED"]),
});

export type ChangeAnimalStatusInput = z.infer<typeof changeAnimalStatusSchema>;
