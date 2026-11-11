import { prisma } from "../../db";
import type { Prisma } from "../../generated/prisma/client";
import { SHELTER_TIME_ZONE } from "../../time";

/** Koliko dni vnaprej posvojitelj vidi proste termine (US-05 AC 2). */
export const BOOKING_WINDOW_DAYS = 14;

/**
 * Prost termin: ni preklican, začne se v prihodnosti (v oknu 14 dni) in nima
 * neodpovedanega ogleda (US-05 AC 2, 3).
 */
export function freeSlotWhere(now: Date, days = BOOKING_WINDOW_DAYS): Prisma.VisitSlotWhereInput {
  return {
    isCancelled: false,
    startsAt: { gt: now, lte: new Date(now.getTime() + days * 24 * 60 * 60 * 1000) },
    visits: { none: { outcome: { not: "CANCELLED" } } },
  };
}

export type FreeSlot = { id: string; startsAt: string; endsAt: string; date: string; time: string };

const dateFmt = new Intl.DateTimeFormat("en-CA", { timeZone: SHELTER_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("sl-SI", { timeZone: SHELTER_TIME_ZONE, hour: "2-digit", minute: "2-digit" });

/**
 * Prosti termini v naslednjih 14 dneh, razvrščeni po času. Poleg UTC časov vrne še lokalni
 * datum in uro zavetišča. Prostovoljec ni razkrit, ker ga posvojitelj ne izbira.
 */
export async function listFreeSlots(now = new Date()): Promise<FreeSlot[]> {
  const slots = await prisma.visitSlot.findMany({
    where: freeSlotWhere(now),
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true, endsAt: true },
  });
  return slots.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    date: dateFmt.format(s.startsAt),
    time: timeFmt.format(s.startsAt),
  }));
}
