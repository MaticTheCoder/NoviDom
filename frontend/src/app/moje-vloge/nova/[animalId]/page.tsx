import { formatYears, getSubmissionPreview, MAX_ACTIVE_APPLICATIONS } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MatchResult } from "@/components/match-result";
import { buttonVariants } from "@/components/ui/button";
import { ageLabel, HOUSING_LABEL, SEX_LABEL, SPECIES_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = { title: "Oddaja vloge – Novi dom" };

const childrenSummary = (ages: number[]) =>
  ages.length === 0
    ? "brez otrok"
    : ages.length === 1
      ? `otrok, star ${formatYears(ages[0])}`
      : `otroci, stari ${ages.slice(0, -1).join(", ")} in ${formatYears(ages[ages.length - 1])}`;

export default async function SubmitApplicationPage({ params }: { params: Promise<{ animalId: string }> }) {
  const { animalId } = await params;
  const preview = await getSubmissionPreview(await requireActor(), animalId);
  if (preview.kind === "not-found") notFound();

  const path = `/moje-vloge/nova/${animalId}`;
  // Brez vprašalnika ga mora posvojitelj izpolniti pred oddajo (US-02 AC 2).
  if (preview.kind === "household-required") redirect(`/moje-vloge/vprasalnik?nadaljuj=${encodeURIComponent(path)}`);

  const { animal } = preview;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href={`/zivali/${animal.id}`} className="text-sm text-muted-foreground hover:underline">
        ← {animal.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vloga za posvojitev: {animal.name}</h1>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_2fr]">
        <aside className="flex flex-col gap-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {animal.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
              <img src={animal.photos[0].url} alt={animal.name} className="size-full object-cover" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABEL[animal.species]}, {SEX_LABEL[animal.sex]}, približno {ageLabel(animal.birthDateApprox)}
          </p>
        </aside>

        {preview.kind === "blocked" ? (
          <section role="alert" className="flex flex-col gap-3 rounded-xl border p-6">
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
          <div className="flex flex-col gap-8">
            <MatchResult level={preview.match.level} warnings={preview.match.warnings} />

            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium">Vaše gospodinjstvo</h2>
                <Link href={`/moje-vloge/vprasalnik?nadaljuj=${encodeURIComponent(path)}`} className="text-sm underline-offset-4 hover:underline">
                  Uredi vprašalnik
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                {HOUSING_LABEL[preview.household.housingType]}, {preview.household.hasGarden ? "z vrtom" : "brez vrta"},{" "}
                {childrenSummary(preview.household.childrenAges)}
                {preview.household.hasDogs && ", pes"}
                {preview.household.hasCats && ", mačka"}; žival bi bila sama {preview.household.hoursAlonePerDay} h na dan.
              </p>
            </section>

            <SubmitForm animalId={animal.id} requireAcknowledgement={preview.match.level === "MISMATCH"} />
          </div>
        )}
      </div>
    </main>
  );
}
