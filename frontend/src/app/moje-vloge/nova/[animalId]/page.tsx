import { formatYears, getSubmissionPreview, MAX_ACTIVE_APPLICATIONS } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnimalTraits } from "@/components/animal-traits";
import { AnimalPhoto } from "@/components/logo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MatchResult } from "@/components/match-result";
import { buttonVariants } from "@/components/ui/button";
import { ageLabel, HOUSING_LABEL, SEX_LABEL, SPECIES_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = { title: "Oddaja vloge – Novi dom" };

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const children = (ages: number[]) => (ages.length === 0 ? "brez otrok" : ages.map(formatYears).join(", "));

/** Oddaja vloge z oceno ujemanja (WF-02): žival levo, ocena, gospodinjstvo in motivacija desno. */
export default async function SubmitApplicationPage({ params }: { params: Promise<{ animalId: string }> }) {
  const { animalId } = await params;
  const preview = await getSubmissionPreview(await requireActor(), animalId);
  if (preview.kind === "not-found") notFound();

  const path = `/moje-vloge/nova/${animalId}`;
  // Brez vprašalnika ga mora posvojitelj izpolniti pred oddajo (US-02 AC 2).
  if (preview.kind === "household-required") redirect(`/moje-vloge/vprasalnik?nadaljuj=${encodeURIComponent(path)}`);

  const { animal } = preview;
  const profile = `/zivali/${animal.id}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Živali", href: "/" }, { label: animal.name, href: profile }, { label: "Oddaja vloge" }]} />
      <h1 className="mt-2 text-3xl sm:text-4xl">Vloga za posvojitev: {animal.name}</h1>

      <div className="mt-6 grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <aside className="flex flex-col gap-4">
          <AnimalPhoto src={animal.photos[0]?.url ?? null} alt={animal.name} tag={animal.name} imgClassName="aspect-[4/5]" />
          <div>
            <h2 className="sr-only">{animal.name}</h2>
            <p className="text-sm text-muted-foreground">
              {SPECIES_LABEL[animal.species]}, {SEX_LABEL[animal.sex]}, približno {ageLabel(animal.birthDateApprox)}
            </p>
          </div>
          <AnimalTraits animal={animal} />
        </aside>

        {preview.kind === "blocked" ? (
          <section role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
            <p className="font-medium">{preview.block.message}</p>
            {preview.block.applicationId && (
              <Link href={`/moje-vloge/${preview.block.applicationId}`} className={buttonVariants({ variant: "outline" })}>
                Odpri obstoječo vlogo
              </Link>
            )}
            {preview.block.code === "APPLICATION_TOO_MANY_ACTIVE" && (
              <p className="text-sm text-muted-foreground">
                Hkrati imate lahko največ {MAX_ACTIVE_APPLICATIONS} aktivne vloge.{" "}
                <Link href="/moje-vloge" className="underline">
                  Moje vloge
                </Link>
              </p>
            )}
          </section>
        ) : (
          <div className="flex flex-col gap-4">
            <MatchResult level={preview.match.level} warnings={preview.match.warnings} />

            <section aria-labelledby="household-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="household-title" className="text-base font-semibold">
                  Vaše gospodinjstvo
                </h2>
                <Link
                  href={`/moje-vloge/vprasalnik?nadaljuj=${encodeURIComponent(path)}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Uredi vprašalnik
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                <Fact
                  label="Bivanje"
                  value={`${HOUSING_LABEL[preview.household.housingType]}, ${preview.household.hasGarden ? "z vrtom" : "brez vrta"}`}
                />
                <Fact label="Otroci" value={children(preview.household.childrenAges)} />
                <Fact
                  label="Druge živali"
                  value={[preview.household.hasDogs && "pes", preview.household.hasCats && "mačka"].filter(Boolean).join(", ") || "ne"}
                />
                <Fact label="Žival sama" value={`${preview.household.hoursAlonePerDay} h na dan`} />
              </dl>
            </section>

            <SubmitForm animalId={animal.id} cancelHref={profile} requireAcknowledgement={preview.match.level === "MISMATCH"} />
          </div>
        )}
      </div>
    </main>
  );
}
