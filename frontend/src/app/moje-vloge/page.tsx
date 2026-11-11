import { listMyApplications, MAX_ACTIVE_APPLICATIONS } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { MatchBadge } from "@/components/match-result";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, SPECIES_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Moje vloge – Novi dom" };

export default async function MyApplicationsPage() {
  const { applications, activeCount } = await listMyApplications(await requireActor());

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Moje vloge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aktivne vloge: {activeCount} od največ {MAX_ACTIVE_APPLICATIONS}
          </p>
        </div>
        <Link href="/moje-vloge/vprasalnik" className={buttonVariants({ variant: "outline" })}>
          Vprašalnik o gospodinjstvu
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">Še niste oddali nobene vloge.</p>
          <Link href="/" className={`${buttonVariants()} mt-4`}>
            Poglejte živali, ki iščejo dom
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {applications.map((a) => (
            <li key={a.id}>
              <Link href={`/moje-vloge/${a.id}`} className="flex items-center gap-4 rounded-xl border p-3 hover:bg-muted">
                {a.animal.coverPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
                  <img src={a.animal.coverPhoto} alt="" className="size-14 rounded-lg object-cover" />
                ) : (
                  <div className="size-14 rounded-lg bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {a.animal.name} <span className="font-normal text-muted-foreground">({SPECIES_LABEL[a.animal.species]})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Oddana {formatDate(a.submittedAt)} · zadnja sprememba {formatDate(a.lastChangeAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ApplicationStatusBadge status={a.status} />
                  <MatchBadge level={a.matchLevel} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
