import { BOOKING_WINDOW_DAYS, listFreeSlots } from "@novi-dom/backend";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Prosti termini se spreminjajo z vsako rezervacijo, zato odgovora ne predpomnimo.
export const dynamic = "force-dynamic";

/**
 * GET /api/termini – prosti termini ogleda v naslednjih 14 dneh (US-05 AC 2, 3).
 * Zasedeni, preklicani in pretekli termini niso vključeni. Dostopno prijavljenim uporabnikom.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Za ogled terminov se prijavite." }, { status: 401 });
  }
  const slots = await listFreeSlots();
  return NextResponse.json(
    { windowDays: BOOKING_WINDOW_DAYS, timeZone: "Europe/Ljubljana", slots },
    { headers: { "Cache-Control": "no-store" } },
  );
}
