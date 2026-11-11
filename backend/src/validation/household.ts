// Zod shema vprašalnika o gospodinjstvu (brez Prisma Clienta, uporabna tudi v brskalniku).
import { z } from "zod";
import { HousingType } from "../generated/prisma/enums";

export const MAX_CHILDREN = 10;

export const householdInputSchema = z.object({
  housingType: z.enum(HousingType, { error: "Izberite tip bivanja." }),
  hasGarden: z.boolean({ error: "Označite, ali imate vrt." }),
  childrenAges: z
    .array(
      z
        .number({ error: "Vnesite starost otroka." })
        .int("Starost vnesite v celih letih.")
        .min(0, "Starost ne more biti negativna.")
        .max(17, "Vnesite le otroke, mlajše od 18 let."),
    )
    .max(MAX_CHILDREN, `Vnesete lahko največ ${MAX_CHILDREN} otrok.`),
  hasDogs: z.boolean(),
  hasCats: z.boolean(),
  hoursAlonePerDay: z
    .number({ error: "Vnesite število ur." })
    .int("Vnesite celo število ur.")
    .min(0, "Število ur ne more biti negativno.")
    .max(24, "Dan ima največ 24 ur."),
  experience: z.string().trim().max(2000, "Besedilo je lahko dolgo največ 2000 znakov."),
});

export type HouseholdInput = z.infer<typeof householdInputSchema>;
