import { listVolunteerVisits } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { MatchBadge } from "@/components/match-result";
import { Badge } from "@/components/ui/badge";
import { formatTime, formatVisitDay, RECOMMENDATION_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Moji ogledi – Novi dom" };

export default async function VolunteerVisitsPage() {
  const session = await auth();
  // /ogledi je dostopen tudi vodji (middleware), seznam pa je namenjen prostovoljcem.
  if (session?.user?.role !== "VOLUNTEER") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Ogledi</h1>
        <p className="mt-2 text-muted-foreground">Seznam ogledov je namenjen prostovoljcem, ki jim je termin dodeljen.</p>
      </main>
    );
  }

  const visits = await listVolunteerVisits(await requireActor());
  const byDay = new Map<string, typeof visits>();
  for (const v of visits) {
    const day = formatVisitDay(v.slot.startsAt);
    byDay.set(day, [...(byDay.get(day) ?? []), v]);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Moji ogledi</h1>
      {visits.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Nimate dogovorjenih ogledov.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {[...byDay].map(([day, list]) => (
            <section key={day} className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">{day}</h2>
              <ul className="flex flex-col gap-2">
                {list.map((v) => (
                  <li key={v.id}>
                    <Link href={`/ogledi/${v.id}`} className="flex min-h-14 items-center gap-3 rounded-xl border p-3 hover:bg-muted">
                      <span className="w-12 text-sm font-medium tabular-nums">{formatTime(v.slot.startsAt)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{v.application.animal.name}</span>
                        <span className="block truncate text-sm text-muted-foreground">{v.application.adopter.name}</span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <MatchBadge level={v.application.matchLevel} />
                        {v.report ? (
                          <Badge variant="secondary">{RECOMMENDATION_LABEL[v.report.recommendation]}</Badge>
                        ) : v.needsReport ? (
                          <Badge variant="destructive">čaka zapisnik</Badge>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
