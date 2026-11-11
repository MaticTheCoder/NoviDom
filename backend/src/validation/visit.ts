// Zod shema zapisnika ogleda (brez Prisma Clienta, uporabna tudi v brskalniku).
import { z } from "zod";
import { Recommendation } from "../generated/prisma/enums";

export const REPORT_MIN_LENGTH = 20;
/** Koliko časa po oddaji lahko prostovoljec zapisnik še ureja (US-06 AC 4). */
export const REPORT_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export const visitReportSchema = z.object({
  visitId: z.uuid({ error: "Neveljaven ogled." }),
  recommendation: z.enum(Recommendation, { error: "Izberite priporočilo." }),
  text: z
    .string({ error: `Vnesite zapisnik z vsaj ${REPORT_MIN_LENGTH} znaki.` })
    .trim()
    .min(REPORT_MIN_LENGTH, `Zapisnik mora imeti vsaj ${REPORT_MIN_LENGTH} znakov.`)
    .max(5000, "Zapisnik je lahko dolg največ 5000 znakov."),
});

export type VisitReportInput = z.input<typeof visitReportSchema>;
