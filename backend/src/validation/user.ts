// Zod sheme za uporabniške račune (brez Prisma Clienta, uporabne tudi v brskalniku).
import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;

export const registerAdopterSchema = z
  .object({
    name: z.string().trim().min(2, "Vnesite ime in priimek.").max(100, "Ime je lahko dolgo največ 100 znakov."),
    email: z.string().trim().toLowerCase().pipe(z.email("Vnesite veljaven e-poštni naslov.")),
    phone: z
      .string()
      .trim()
      .max(30, "Telefonska številka je predolga.")
      .refine((v) => v === "" || /^[+0-9 ()/-]{6,}$/.test(v), "Vnesite veljavno telefonsko številko.")
      .transform((v) => v || null),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Geslo mora imeti vsaj ${PASSWORD_MIN_LENGTH} znakov.`)
      .max(200, "Geslo je predolgo."),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, { path: ["passwordConfirm"], error: "Gesli se ne ujemata." });

export type RegisterAdopterInput = z.input<typeof registerAdopterSchema>;
