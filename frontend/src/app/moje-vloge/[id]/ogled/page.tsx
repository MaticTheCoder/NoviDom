import { CommonErrorCode, getMyApplication, isDomainError, SHELTER } from "@novi-dom/backend";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { requireActor } from "@/lib/session";
import { SlotPicker } from "./slot-picker";

export const metadata: Metadata = { title: "Rezervacija ogleda – Novi dom" };

/** Rezervacija termina ogleda (WF-04). */
export default async function BookVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getMyApplication(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  // Rezervacija je mogoča le v stanju »v pregledu« (US-05 AC 1).
  if (!app.canBookVisit) redirect(`/moje-vloge/${app.id}`);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Moje vloge", href: "/moje-vloge" }, { label: app.animal.name, href: `/moje-vloge/${app.id}` }, { label: "Rezervacija ogleda" }]}
      />
      <h1 className="mt-2 mb-6 text-2xl font-semibold sm:text-3xl">Izberite termin ogleda</h1>
      <SlotPicker
        applicationId={app.id}
        address={`${SHELTER.name}, ${SHELTER.address}`}
        animal={{ name: app.animal.name, coverPhoto: app.animal.coverPhoto }}
      />
    </main>
  );
}
