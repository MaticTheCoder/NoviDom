import { CommonErrorCode, getMyApplication, isDomainError } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { APPLICATION_STATUS_LABEL, formatDateTime, MATCH_LABEL, SPECIES_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { WithdrawButton } from "./withdraw-button";

export const metadata: Metadata = { title: "Vloga – Novi dom" };

/** Posvojitelj ne vidi imen osebja; pomembno je, ali je spremembo naredil sam, zavetišče ali sistem. */
function actorLabel(actor: { role: string } | null) {
  if (!actor) return "sistem";
  return actor.role === "ADOPTER" ? "vi" : "zavetišče";
}

export default async function MyApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oddana?: string }>;
}) {
  const [{ id }, { oddana }, actor] = await Promise.all([params, searchParams, requireActor()]);
  const app = await getMyApplication(actor, id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });
  const canWithdraw = app.actions.some((t) => t.to === "WITHDRAWN");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/moje-vloge" className="text-sm text-muted-foreground hover:underline">
        ← Moje vloge
      </Link>

      {oddana && (
        <p role="status" className="mt-4 rounded-lg border bg-muted px-4 py-3 text-sm">
          Vloga je oddana. Zavetišče jo bo pregledalo; spremembe stanja boste videli tukaj.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {app.animal.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
          <img src={app.animal.coverPhoto} alt="" className="size-20 rounded-xl object-cover" />
        ) : (
          <div className="size-20 rounded-xl bg-muted" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Vloga za žival {app.animal.name}</h1>
          <p className="text-sm text-muted-foreground">
            {SPECIES_LABEL[app.animal.species]} · oddana {formatDateTime(app.submittedAt)}
          </p>
        </div>
        <ApplicationStatusBadge status={app.status} />
      </div>

      {app.status === "REJECTED" && app.decisionComment && (
        <section className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="font-medium">Utemeljitev zavrnitve</h2>
          <p className="mt-1 text-sm whitespace-pre-line">{app.decisionComment}</p>
        </section>
      )}

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="text-lg font-medium">Ocena ujemanja ob oddaji: {MATCH_LABEL[app.matchLevel]}</h2>
        {app.matchWarnings.length > 0 && (
          <ul className="list-disc pl-5 text-sm">
            {app.matchWarnings.map((w) => (
              <li key={w.rule}>
                {w.message} <span className="text-muted-foreground">({w.trigger})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-2">
        <h2 className="text-lg font-medium">Motivacija</h2>
        <p className="text-sm whitespace-pre-line">{app.motivation}</p>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-lg font-medium">Zgodovina</h2>
        <ol className="flex flex-col gap-3 border-l pl-4">
          {app.events.map((e) => (
            <li key={e.id} className="text-sm">
              <p>
                <span className="font-medium">{APPLICATION_STATUS_LABEL[e.toStatus]}</span>{" "}
                <span className="text-muted-foreground">
                  · {formatDateTime(e.createdAt)} · {actorLabel(e.actor)}
                </span>
              </p>
              {e.comment && <p className="mt-1 whitespace-pre-line text-muted-foreground">{e.comment}</p>}
            </li>
          ))}
        </ol>
      </section>

      {canWithdraw && (
        <section className="mt-10 flex flex-col gap-2 border-t pt-6">
          <h2 className="text-lg font-medium">Umik vloge</h2>
          <p className="text-sm text-muted-foreground">Vlogo lahko umaknete kadarkoli pred zaključkom posvojitve.</p>
          <WithdrawButton applicationId={app.id} animalName={app.animal.name} />
        </section>
      )}
    </main>
  );
}
