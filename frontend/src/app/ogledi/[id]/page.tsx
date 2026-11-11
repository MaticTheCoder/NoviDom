import { CommonErrorCode, formatYears, getVolunteerVisit, isDomainError } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchResult } from "@/components/match-result";
import { formatDateTime, formatTime, formatVisitDay, HOUSING_LABEL, RECOMMENDATION_LABEL, SPECIES_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Ogled – Novi dom" };

export default async function VolunteerVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await getVolunteerVisit(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  const h = visit.household;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Link href="/ogledi" className="text-sm text-muted-foreground hover:underline">
        ← Moji ogledi
      </Link>
      <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
        {visit.adopter.name} · {visit.animal.name}
      </h1>
      <p className="text-sm text-muted-foreground">
        {formatVisitDay(visit.startsAt)}, {formatTime(visit.startsAt)}–{formatTime(visit.endsAt)}
        {visit.adopter.phone && ` · tel. ${visit.adopter.phone}`}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <h2 className="font-medium">Gospodinjstvo kandidata</h2>
          {h ? (
            <ul className="flex flex-col gap-1 text-sm">
              <li>
                {HOUSING_LABEL[h.housingType]}, {h.hasGarden ? "z vrtom" : "brez vrta"}
              </li>
              <li>{h.childrenAges.length ? `Otroci: ${h.childrenAges.map(formatYears).join(", ")}` : "Brez otrok"}</li>
              <li>Druge živali: {[h.hasDogs && "pes", h.hasCats && "mačka"].filter(Boolean).join(", ") || "ne"}</li>
              <li>Žival bi bila sama {h.hoursAlonePerDay} h na dan</li>
              {h.experience && <li className="text-muted-foreground">{h.experience}</li>}
            </ul>
          ) : (
            <p className="text-sm text-destructive">Kopija vprašalnika ni berljiva.</p>
          )}
        </section>

        <MatchResult audience="staff" level={visit.matchLevel} warnings={visit.matchWarnings} title="Ocena ujemanja" />

        <section className="flex flex-col gap-2 rounded-xl border p-4">
          <h2 className="font-medium">
            {visit.animal.name} ({SPECIES_LABEL[visit.animal.species]}): interne opombe
          </h2>
          <p className="text-sm whitespace-pre-line">{visit.animal.internalNotes || "Ni opomb."}</p>
        </section>

        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="text-lg font-medium">Zapisnik ogleda</h2>
          {visit.canSubmit ? (
            <ReportForm visitId={visit.id} mode="submit" />
          ) : visit.report && visit.canEdit ? (
            <>
              <p className="text-sm text-muted-foreground">
                Oddan {formatDateTime(visit.report.submittedAt)}. Urejate ga lahko do {formatDateTime(visit.editableUntil!)}.
              </p>
              <ReportForm visitId={visit.id} mode="update" initial={{ recommendation: visit.report.recommendation, text: visit.report.text }} />
            </>
          ) : visit.report ? (
            // Po 24 urah je zapisnik samo za branje (US-06 AC 4).
            <div className="flex flex-col gap-2 text-sm">
              <p>
                <span className="font-medium">{RECOMMENDATION_LABEL[visit.report.recommendation]}</span>
                <span className="text-muted-foreground"> · oddan {formatDateTime(visit.report.submittedAt)} · samo za branje</span>
              </p>
              <p className="whitespace-pre-line">{visit.report.text}</p>
            </div>
          ) : !visit.started ? (
            <p className="text-sm text-muted-foreground">Zapisnik lahko vnesete šele po začetku termina ({formatTime(visit.startsAt)}).</p>
          ) : (
            <p className="text-sm text-muted-foreground">Ogled ni več dogovorjen, zato zapisnika ni mogoče vnesti.</p>
          )}
        </section>
      </div>
    </main>
  );
}
