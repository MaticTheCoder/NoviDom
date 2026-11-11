import { listVolunteerVisits, shelterDate } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { MatchBadge } from "@/components/match-result";
import { Badge } from "@/components/ui/badge";
import { capitalize, formatTime, RECOMMENDATION_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Moji ogledi – Novi dom" };

const dayTitle = (d: Date, today: string) => {
  const label = new Intl.DateTimeFormat("sl-SI", { weekday: "long", day: "numeric", month: "numeric", timeZone: "Europe/Ljubljana" }).format(d);
  return shelterDate(d) === today ? `Danes, ${label}` : capitalize(label);
};

/** Moji ogledi (WF-05 levo): ogledi prostovoljca po dnevih, prilagojeno telefonu. */
export default async function VolunteerVisitsPage() {
  const session = await auth();
  // /ogledi je dostopen tudi vodji (middleware), seznam pa je namenjen prostovoljcem.
  if (session?.user?.role !== "VOLUNTEER") {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Ogledi</h1>
        <p className="mt-2 text-muted-foreground">Seznam ogledov je namenjen prostovoljcem, ki jim je termin dodeljen.</p>
      </main>
    );
  }

  const visits = await listVolunteerVisits(await requireActor());
  const today = shelterDate(new Date());
  const byDay = new Map<string, typeof visits>();
  for (const v of visits) {
    const day = dayTitle(v.slot.startsAt, today);
    byDay.set(day, [...(byDay.get(day) ?? []), v]);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-6 sm:py-10">
      <h1 className="text-2xl font-semibold">Moji ogledi</h1>
      {visits.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Nimate dogovorjenih ogledov.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {[...byDay].map(([day, list]) => (
            <section key={day} className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">{day}</h2>
              <ul className="flex flex-col gap-2">
                {list.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/ogledi/${v.id}`}
                      className={
                        "flex min-h-16 items-start justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-secondary" +
                        (v.needsReport ? " border-l-4 border-l-brass" : "")
                      }
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          <span className="tabular-nums">{formatTime(v.slot.startsAt)}</span> {v.application.animal.name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {v.application.adopter.name}
                          {v.application.adopter.phone && `, ${v.application.adopter.phone}`}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <MatchBadge level={v.application.matchLevel} />
                        {v.report ? (
                          <Badge variant="secondary">{RECOMMENDATION_LABEL[v.report.recommendation]}</Badge>
                        ) : v.needsReport ? (
                          <Badge className="bg-brass text-brass-foreground">čaka zapisnik</Badge>
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
