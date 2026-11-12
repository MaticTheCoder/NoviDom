import { CommonErrorCode, formatYears, getVolunteerVisit, isDomainError } from "@novi-dom/backend";
import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalPhoto } from "@/components/logo";
import { MatchBadge } from "@/components/match-result";
import { formatDateTime, formatTime, formatVisitDay, HOUSING_LABEL, RECOMMENDATION_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Ogled – Novi dom" };

/** Podrobnost ogleda in zapisnik (WF-05 desno), zasnovano za telefon. */
export default async function VolunteerVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await getVolunteerVisit(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  const h = visit.household;
  const householdLine = h
    ? [
        `${HOUSING_LABEL[h.housingType]} ${h.hasGarden ? "z vrtom" : "brez vrta"}`,
        h.childrenAges.length ? `otroci: ${h.childrenAges.map(formatYears).join(", ")}` : "brez otrok",
        [h.hasDogs && "pes", h.hasCats && "mačka"].filter(Boolean).join(" in ") || "brez drugih živali",
        `sama ${h.hoursAlonePerDay} h na dan`,
      ]
    : null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
      <Link href="/ogledi" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:underline">
        ‹ Moji ogledi
      </Link>
      <div className="flex items-end gap-4">
        <AnimalPhoto src={visit.animal.coverPhoto} alt={visit.animal.name} className="size-24 shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground">
            {formatVisitDay(visit.startsAt)}, {formatTime(visit.startsAt)}–{formatTime(visit.endsAt)}
          </p>
          <h1 className="text-2xl">
            {visit.animal.name} in {visit.adopter.name.split(" ")[0]}
          </h1>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <section aria-labelledby="candidate" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id="candidate" className="text-base font-semibold">
              Kandidat: {visit.adopter.name}
            </h2>
            <MatchBadge level={visit.matchLevel} />
          </div>
          {visit.adopter.phone && (
            <a href={`tel:${visit.adopter.phone.replace(/\s/g, "")}`} className="text-sm text-primary underline-offset-4 hover:underline">
              {visit.adopter.phone}
            </a>
          )}
          {householdLine ? (
            <p className="text-sm text-muted-foreground">{householdLine.join("; ")}</p>
          ) : (
            <p className="text-sm text-destructive">Kopija vprašalnika ni berljiva.</p>
          )}
          {h?.experience && <p className="text-sm">{h.experience}</p>}
          {visit.matchWarnings.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5 text-sm">
              {visit.matchWarnings.map((w) => (
                <li key={w.rule} className="flex gap-2">
                  <TriangleAlert
                    aria-label={w.severity === "MISMATCH" ? "neujemanje" : "pogojno"}
                    className={w.severity === "MISMATCH" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-amber-600"}
                  />
                  <span>
                    {w.message} <span className="text-muted-foreground">({w.trigger})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="notes" className="flex flex-col gap-2 rounded-xl border bg-card p-4">
          <h2 id="notes" className="text-base font-semibold">
            Interne opombe: {visit.animal.name}
          </h2>
          <p className="text-sm whitespace-pre-line">{visit.animal.internalNotes || "Ni opomb."}</p>
        </section>

        <section aria-labelledby="report" className="flex flex-col gap-3 pt-2">
          <h2 id="report" className="sr-only">
            Zapisnik ogleda
          </h2>
          {visit.canSubmit ? (
            <ReportForm visitId={visit.id} mode="submit" />
          ) : visit.report && visit.canEdit ? (
            <>
              <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                Zapisnik je oddan {formatDateTime(visit.report.submittedAt)}. Urejate ga lahko do {formatDateTime(visit.editableUntil!)}.
              </p>
              <ReportForm visitId={visit.id} mode="update" initial={{ recommendation: visit.report.recommendation, text: visit.report.text }} />
            </>
          ) : visit.report ? (
            // Po 24 urah je zapisnik samo za branje (US-06 AC 4).
            <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-sm">
              <p className="font-semibold">{RECOMMENDATION_LABEL[visit.report.recommendation]}</p>
              <p className="whitespace-pre-line">{visit.report.text}</p>
              <p className="text-xs text-muted-foreground">Oddan {formatDateTime(visit.report.submittedAt)}. Zapisnik je samo za branje.</p>
            </div>
          ) : !visit.started ? (
            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Zapisnik lahko vnesete šele po začetku termina ob {formatTime(visit.startsAt)}.
            </p>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              Ogled ni več dogovorjen, zato zapisnika ni mogoče vnesti.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
