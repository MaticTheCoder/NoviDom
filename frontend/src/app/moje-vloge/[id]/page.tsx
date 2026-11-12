import { CommonErrorCode, getMyApplication, isDomainError, listMyApplications, MAX_ACTIVE_APPLICATIONS } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalPhoto } from "@/components/logo";
import { MatchBadge, MatchResult } from "@/components/match-result";
import { StatusTimeline } from "@/components/status-timeline";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_STATUS_LABEL, capitalize, formatDate, formatDateTime, formatTime, formatVisitDay } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { ApplicationsList } from "../applications-list";
import { WithdrawButton } from "./withdraw-button";

export const metadata: Metadata = { title: "Vloga – Novi dom" };

/** Posvojitelj ne vidi imen osebja; pomembno je, ali je spremembo naredil sam, zavetišče ali sistem. */
function actorLabel(actor: { role: string } | null) {
  if (!actor) return "sistem";
  return actor.role === "ADOPTER" ? "vi" : "zavetišče";
}

const shortDay = (d: Date) =>
  new Intl.DateTimeFormat("sl-SI", { weekday: "short", day: "numeric", month: "numeric", timeZone: "Europe/Ljubljana" }).format(d);

/** Moje vloge s časovnico (WF-03): seznam levo, izbrana vloga desno. Na telefonu le podrobnost. */
export default async function MyApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oddana?: string; ogled?: string }>;
}) {
  const [{ id }, { oddana, ogled }, actor] = await Promise.all([params, searchParams, requireActor()]);
  const [app, { applications, activeCount }] = await Promise.all([
    getMyApplication(actor, id).catch((error) => {
      if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
      throw error;
    }),
    listMyApplications(actor),
  ]);
  const canWithdraw = app.actions.some((t) => t.to === "WITHDRAWN");
  const visit = app.scheduledVisit;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <Link href="/moje-vloge" className="text-sm text-muted-foreground hover:underline md:hidden">
        ← Moje vloge
      </Link>
      <h1 className="hidden text-3xl font-semibold md:block">
        Moje vloge{" "}
        <span className="text-base font-normal text-muted-foreground">
          ({activeCount} od {MAX_ACTIVE_APPLICATIONS} aktivnih)
        </span>
      </h1>

      <div className="mt-4 grid grid-cols-1 items-start gap-6 md:mt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
        <div className="hidden md:block">
          <ApplicationsList applications={applications} selectedId={app.id} />
        </div>

        <article aria-labelledby="application-title" className="flex min-w-0 flex-col gap-6 rounded-xl border bg-card p-4 sm:p-6">
          {(oddana || ogled) && (
            <p role="status" className="rounded-lg bg-accent px-4 py-3 text-sm text-accent-foreground">
              {oddana ? "Vloga je oddana. Zavetišče jo bo pregledalo; spremembe stanja boste videli tukaj." : "Ogled je rezerviran."}
            </p>
          )}

          <header className="flex items-center gap-4">
            <AnimalPhoto src={app.animal.coverPhoto} alt="" className="size-16 shrink-0 sm:size-20" />
            <div className="flex flex-col gap-1">
              <h2 id="application-title" className="text-xl font-semibold sm:text-2xl">
                Vloga za posvojitev: {app.animal.name}
              </h2>
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <MatchBadge level={app.matchLevel} />
                oddana {formatDate(app.submittedAt)}
              </p>
            </div>
          </header>

          <StatusTimeline
            status={app.status}
            events={app.events}
            detail={visit ? { VISIT_SCHEDULED: `${shortDay(visit.startsAt)} ob ${formatTime(visit.startsAt)}` } : undefined}
          />

          {app.status === "REJECTED" && app.decisionComment && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="font-medium">Utemeljitev zavrnitve</h3>
              <p className="mt-1 text-sm whitespace-pre-line">{app.decisionComment}</p>
            </section>
          )}

          {visit && (
            <section className="rounded-lg bg-secondary p-4">
              <h3 className="font-medium">Dogovorjen ogled</h3>
              <p className="mt-1">
                {formatVisitDay(visit.startsAt)} ob {formatTime(visit.startsAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                {visit.shelterName}, {visit.address}
              </p>
            </section>
          )}

          {app.canBookVisit && (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary p-4">
              <p className="text-sm">Vloga je v pregledu. Izberite termin za ogled živali v zavetišču.</p>
              <Link href={`/moje-vloge/${app.id}/ogled`} className={buttonVariants()}>
                Rezerviraj ogled
              </Link>
            </section>
          )}

          {canWithdraw && (
            <div className="flex justify-end">
              <WithdrawButton applicationId={app.id} animalName={app.animal.name} />
            </div>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="font-heading text-lg font-semibold">Zgodovina</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Sprememba</TableHead>
                  <TableHead className="hidden sm:table-cell">Kdo</TableHead>
                  <TableHead>Komentar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...app.events].reverse().map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="tabular-nums">{formatDateTime(e.createdAt)}</TableCell>
                    <TableCell className="whitespace-normal">
                      {e.fromStatus
                        ? `${capitalize(APPLICATION_STATUS_LABEL[e.fromStatus])} → ${APPLICATION_STATUS_LABEL[e.toStatus]}`
                        : capitalize(APPLICATION_STATUS_LABEL[e.toStatus])}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{actorLabel(e.actor)}</TableCell>
                    <TableCell className="whitespace-normal">{e.comment ?? "–"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <details className="group rounded-lg border p-4">
            <summary className="cursor-pointer font-medium">Ocena ujemanja in motivacija ob oddaji</summary>
            <div className="mt-4 flex flex-col gap-4">
              <MatchResult title="Ocena ujemanja ob oddaji" level={app.matchLevel} warnings={app.matchWarnings} />
              <div>
                <h4 className="text-sm font-medium">Motivacija</h4>
                <p className="mt-1 text-sm whitespace-pre-line">{app.motivation}</p>
              </div>
            </div>
          </details>
        </article>
      </div>
    </main>
  );
}
