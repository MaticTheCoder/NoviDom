import { getMyHousehold } from "@novi-dom/backend";
import { safeCallbackUrl } from "@novi-dom/backend/access";
import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/session";
import { HouseholdForm } from "./household-form";

export const metadata: Metadata = { title: "Vprašalnik o gospodinjstvu – Novi dom" };

export default async function HouseholdPage({ searchParams }: { searchParams: Promise<{ nadaljuj?: string }> }) {
  const [{ nadaljuj }, actor] = await Promise.all([searchParams, requireActor()]);
  const household = await getMyHousehold(actor);
  const next = nadaljuj ? safeCallbackUrl(nadaljuj, "") || undefined : undefined;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/moje-vloge" className="text-sm text-muted-foreground hover:underline">
        ← Moje vloge
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vprašalnik o gospodinjstvu</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        {household
          ? "Podatki se uporabijo pri vseh novih vlogah. Že oddane vloge ohranijo podatke, kot so bili ob oddaji."
          : "Pred prvo vlogo izpolnite vprašalnik. Na podlagi odgovorov vam pokažemo, kako se vaše gospodinjstvo ujema z izbrano živaljo."}
      </p>
      <HouseholdForm
        household={
          household && {
            housingType: household.housingType,
            hasGarden: household.hasGarden,
            childrenAges: household.childrenAges,
            hasDogs: household.hasDogs,
            hasCats: household.hasCats,
            hoursAlonePerDay: household.hoursAlonePerDay,
            experience: household.experience,
          }
        }
        next={next}
      />
    </main>
  );
}
