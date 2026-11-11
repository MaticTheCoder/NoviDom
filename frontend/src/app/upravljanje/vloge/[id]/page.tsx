import { CommonErrorCode, formatYears, getApplicationForManager, isDomainError } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { MatchResult } from "@/components/match-result";
import {
  APPLICATION_STATUS_LABEL,
  formatDateTime,
  HOUSING_LABEL,
  RECOMMENDATION_LABEL,
  SPECIES_LABEL,
  STATUS_LABEL,
  VISIT_OUTCOME_LABEL,
} from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { TransitionPanel } from "./transition-panel";

export const metadata: Metadata = { title: "Vloga – Upravljanje – Novi dom" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function ManagerApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApplicationForManager(await requireActor(), id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  const h = app.household;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/upravljanje/vloge" className="text-sm text-muted-foreground hover:underline">
        ← Vloge
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {app.adopter.name} → {app.animal.name}
        </h1>
        <ApplicationStatusBadge status={app.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3 rounded-xl border p-4">
            <h2 className="font-medium">Dejanja</h2>
            <TransitionPanel applicationId={app.id} actions={app.actions} otherApproved={app.otherApproved} />
          </section>

          <MatchResult audience="staff" level={app.matchLevel} warnings={app.matchWarnings} title="Ocena ujemanja ob oddaji" />

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Ogledi in zapisnik prostovoljca</h2>
            {app.visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ogled še ni bil dogovorjen.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {app.visits.map((v) => (
                  <li key={v.id} className="flex flex-col gap-2 rounded-xl border p-4 text-sm">
                    <p>
                      <span className="font-medium">{formatDateTime(v.slot.startsAt)}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {v.slot.volunteer.name} · {VISIT_OUTCOME_LABEL[v.outcome]}
                      </span>
                    </p>
                    {v.report ? (
                      <>
                        <p>
                          Priporočilo: <span className="font-medium">{RECOMMENDATION_LABEL[v.report.recommendation]}</span>
                        </p>
                        <p className="whitespace-pre-line">{v.report.text}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.report.author.name}, oddano {formatDateTime(v.report.submittedAt)}
                          {v.report.updatedAt.getTime() - v.report.submittedAt.getTime() > 1000 &&
                            `, urejeno ${formatDateTime(v.report.updatedAt)}`}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Zapisnik še ni oddan.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Kandidat</h2>
            <dl className="flex flex-col gap-1.5">
              <Row label="Ime">{app.adopter.name}</Row>
              <Row label="E-pošta">
                <a href={`mailto:${app.adopter.email}`} className="underline-offset-4 hover:underline">
                  {app.adopter.email}
                </a>
              </Row>
              <Row label="Telefon">{app.adopter.phone ?? "—"}</Row>
              <Row label="Oddana">{formatDateTime(app.submittedAt)}</Row>
            </dl>
            <h3 className="mt-2 text-sm font-medium">Motivacija</h3>
            <p className="text-sm whitespace-pre-line">{app.motivation}</p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Gospodinjstvo ob oddaji</h2>
            {h ? (
              <dl className="flex flex-col gap-1.5">
                <Row label="Bivanje">
                  {HOUSING_LABEL[h.housingType]}, {h.hasGarden ? "z vrtom" : "brez vrta"}
                </Row>
                <Row label="Otroci">{h.childrenAges.length ? h.childrenAges.map(formatYears).join(", ") : "brez otrok"}</Row>
                <Row label="Druge živali">{[h.hasDogs && "pes", h.hasCats && "mačka"].filter(Boolean).join(", ") || "brez"}</Row>
                <Row label="Žival sama">{h.hoursAlonePerDay} h na dan</Row>
                <Row label="Izkušnje">{h.experience || "—"}</Row>
              </dl>
            ) : (
              <p className="text-sm text-destructive">Kopija vprašalnika ni berljiva.</p>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-center gap-3">
              {app.animal.coverPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
                <img src={app.animal.coverPhoto} alt="" className="size-14 rounded-lg object-cover" />
              ) : (
                <div className="size-14 rounded-lg bg-muted" />
              )}
              <div>
                <Link href={`/upravljanje/zivali/${app.animal.id}`} className="font-medium hover:underline">
                  {app.animal.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {SPECIES_LABEL[app.animal.species]} · {STATUS_LABEL[app.animal.status]}
                </p>
              </div>
            </div>
            {app.animal.internalNotes && (
              <p className="text-sm">
                <span className="text-muted-foreground">Vedenjske opombe: </span>
                {app.animal.internalNotes}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Zgodovina</h2>
            <ol className="flex flex-col gap-3 border-l pl-4">
              {app.events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p>
                    {e.fromStatus ? `${APPLICATION_STATUS_LABEL[e.fromStatus]} → ` : ""}
                    <span className="font-medium">{APPLICATION_STATUS_LABEL[e.toStatus]}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {formatDateTime(e.createdAt)} · {e.actor ? e.actor.name : "sistem"}
                  </p>
                  {e.comment && <p className="mt-1 whitespace-pre-line">{e.comment}</p>}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">Zgodovine ni mogoče urejati ali brisati.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
