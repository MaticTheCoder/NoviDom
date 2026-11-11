import { CommonErrorCode, getMyApplication, isDomainError, SHELTER } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/lib/session";
import { SlotPicker } from "./slot-picker";

export const metadata: Metadata = { title: "Rezervacija ogleda – Novi dom" };

export default async function BookVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getMyApplication(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  // Rezervacija je mogoča le v stanju »v pregledu« (US-05 AC 1).
  if (!app.canBookVisit) redirect(`/moje-vloge/${app.id}`);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href={`/moje-vloge/${app.id}`} className="text-sm text-muted-foreground hover:underline">
        ← Vloga za žival {app.animal.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Rezervacija ogleda: {app.animal.name}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Izberite prost termin v naslednjih 14 dneh. Ogled traja približno 30 minut.</p>
      <SlotPicker applicationId={app.id} address={`${SHELTER.name}, ${SHELTER.address}`} />
    </main>
  );
}
