import { CommonErrorCode, formatYears, getApplicationForManager, isDomainError } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArchPhoto } from "@/components/logo";
import { MatchResult } from "@/components/match-result";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  animalNoun,
  APPLICATION_STATUS_LABEL,
  capitalize,
  formatDateTime,
  HOUSING_LABEL,
  RECOMMENDATION_LABEL,
  STATUS_LABEL,
  VISIT_OUTCOME_LABEL,
} from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { AdoptionDialog } from "./adoption-dialog";
import { TransitionPanel } from "./transition-panel";

export const metadata: Metadata = { title: "Vloga – Upravljanje – Novi dom" };

const RECOMMENDATION_STYLE = {
  RECOMMEND: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  WITH_RESERVATIONS: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  NOT_RECOMMEND: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
} as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `card-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3 rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Podrobnost vloge za vodjo (WF-06): kandidat, žival in ogled v treh okvirjih, dejanja, zgodovina. */
export default async function ManagerApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApplicationForManager(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  const h = app.household;
  const latestVisit = app.visits[0];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <Breadcrumbs items={[{ label: "Vloge", href: "/upravljanje/vloge" }, { label: `${app.adopter.name} → ${app.animal.name}` }]} />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <ArchPhoto src={app.animal.coverPhoto} alt="" className="h-24 w-20 shrink-0" imgClassName="rounded-b-xl" />
        <h1 className="text-3xl sm:text-4xl">
          Vloga: {app.adopter.name} → {app.animal.name}
        </h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Card title="Kandidat">
          <div className="text-sm">
            <p className="font-medium">{app.adopter.name}</p>
            <p>
              <a href={`mailto:${app.adopter.email}`} className="text-primary underline-offset-4 hover:underline">
                {app.adopter.email}
              </a>
              {app.adopter.phone && <span className="text-muted-foreground">, {app.adopter.phone}</span>}
            </p>
            <p className="text-muted-foreground">oddana {formatDateTime(app.submittedAt)}</p>
          </div>
          {h ? (
            <p className="text-sm text-muted-foreground">
              {capitalize(HOUSING_LABEL[h.housingType])} {h.hasGarden ? "z vrtom" : "brez vrta"};{" "}
              {h.childrenAges.length ? `otroci: ${h.childrenAges.map(formatYears).join(", ")}` : "brez otrok"};{" "}
              {[h.hasDogs && "pes", h.hasCats && "mačka"].filter(Boolean).join(" in ") || "brez drugih živali"}; sama{" "}
              {h.hoursAlonePerDay} h na dan
            </p>
          ) : (
            <p className="text-sm text-destructive">Kopija vprašalnika ni berljiva.</p>
          )}
          {h?.experience && <p className="text-sm">{h.experience}</p>}
          <div>
            <h3 className="text-sm font-semibold">Motivacija</h3>
            <p className="mt-1 text-sm whitespace-pre-line">{app.motivation}</p>
          </div>
        </Card>

        <Card title="Žival">
          <div className="flex items-center gap-3">
            <ArchPhoto src={app.animal.coverPhoto} alt="" className="h-20 w-16 shrink-0" imgClassName="rounded-b-xl" />
            <div>
              <Link href={`/upravljanje/zivali/${app.animal.id}`} className="font-medium hover:underline">
                {app.animal.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {animalNoun(app.animal.species, app.animal.sex)}, {STATUS_LABEL[app.animal.status]}
              </p>
            </div>
          </div>
          <MatchResult audience="staff" level={app.matchLevel} warnings={app.matchWarnings} />
          {app.animal.internalNotes && (
            <p className="text-sm">
              <span className="font-semibold">Vedenjske opombe: </span>
              {app.animal.internalNotes}
            </p>
          )}
        </Card>

        <Card title="Ogled">
          {!latestVisit ? (
            <p className="text-sm text-muted-foreground">Ogled še ni bil dogovorjen.</p>
          ) : (
            app.visits.map((v) => (
              <div key={v.id} className="flex flex-col gap-2 text-sm">
                <p className="text-muted-foreground">
                  {formatDateTime(v.slot.startsAt)}, prostovoljec {v.slot.volunteer.name} ({VISIT_OUTCOME_LABEL[v.outcome]})
                </p>
                {v.report ? (
                  <>
                    <Badge className={`h-auto w-full justify-start rounded-md px-3 py-1.5 text-sm ${RECOMMENDATION_STYLE[v.report.recommendation]}`}>
                      {RECOMMENDATION_LABEL[v.report.recommendation]}
                    </Badge>
                    <p className="whitespace-pre-line">{v.report.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.report.author.name}, oddano {formatDateTime(v.report.submittedAt)}
                      {v.report.updatedAt.getTime() - v.report.submittedAt.getTime() > 1000 && `, urejeno ${formatDateTime(v.report.updatedAt)}`}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Zapisnik še ni oddan.</p>
                )}
              </div>
            ))
          )}
        </Card>
      </div>

      <div className="mt-6">
        <TransitionPanel applicationId={app.id} actions={app.actions} otherApproved={app.otherApproved} hasAdoption={!!app.adoptionPreview}>
          {app.adoptionPreview && (
            <AdoptionDialog
              applicationId={app.id}
              animalName={app.animal.name}
              adopterName={app.adopter.name}
              otherActiveCount={app.adoptionPreview.otherActiveCount}
            />
          )}
        </TransitionPanel>
      </div>

      <section aria-labelledby="history" className="mt-6 flex flex-col gap-2 rounded-3xl border bg-card p-5 sm:p-6">
        <h2 id="history" className="text-lg font-semibold">
          Zgodovina
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Sprememba</TableHead>
              <TableHead>Izvajalec</TableHead>
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
                <TableCell>{e.actor ? e.actor.name : "sistem"}</TableCell>
                <TableCell className="whitespace-normal">{e.comment ?? "–"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">Zgodovine ni mogoče urejati ali brisati.</p>
      </section>
    </main>
  );
}
