"use client";

import type { FreeSlot } from "@novi-dom/backend";
import { addDays, shelterDate, weekday } from "@novi-dom/backend/time";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { capitalize } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { bookVisitAction } from "./actions";

const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("sl-SI", { ...opts, timeZone: "UTC" });
const dayHead = (date: string) => capitalize(fmt({ weekday: "short" }).format(utc(date)).replace(".", "")) + ` ${fmt({ day: "numeric", month: "numeric" }).format(utc(date))}`;
const longDay = (date: string) => capitalize(fmt({ weekday: "long", day: "numeric", month: "numeric", year: "numeric" }).format(utc(date)));
const weekRange = (start: string) =>
  `${fmt({ day: "numeric", month: "numeric" }).format(utc(start))} – ${fmt({ day: "numeric", month: "long", year: "numeric" }).format(utc(addDays(start, 6)))}`;

/** Ponedeljek tedna, v katerem je datum. */
const mondayOf = (date: string) => addDays(date, -((weekday(date) + 6) % 7));

type Animal = { name: string; coverPhoto: string | null };

/**
 * Tedenski koledar terminov (WF-04, US-05). Prosti termini so gumbi, zasedeni so črtkani
 * in niso izbirni. Ob konfliktu (»Termin je bil pravkar zaseden«) se izbira počisti in
 * koledar osveži (AC 5).
 */
export function SlotPicker({ applicationId, address, animal }: { applicationId: string; address: string; animal: Animal }) {
  const [slots, setSlots] = useState<FreeSlot[] | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [selected, setSelected] = useState<FreeSlot | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [today] = useState(() => shelterDate(new Date()));
  const weeks = useMemo(() => {
    const first = mondayOf(today);
    const last = mondayOf(addDays(today, 14));
    const list: string[] = [];
    for (let w = first; w <= last; w = addDays(w, 7)) list.push(w);
    return list;
  }, [today]);
  const [week, setWeek] = useState(0);

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      const res = await fetch("/api/termini?zasedeni=1", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setSlots((await res.json()).slots);
    } catch {
      setLoadError("Terminov ni bilo mogoče naložiti. Poskusite znova.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Ob prvem nalaganju pokažemo teden s prvim prostim terminom.
  const [jumped, setJumped] = useState(false);
  useEffect(() => {
    if (jumped || !slots) return;
    const firstFree = slots.find((s) => !s.taken);
    if (firstFree) setWeek(Math.max(0, weeks.indexOf(mondayOf(firstFree.date))));
    setJumped(true);
  }, [slots, weeks, jumped]);

  const start = weeks[week];
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const byDay = new Map<string, FreeSlot[]>();
  for (const s of slots ?? []) byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]);

  const confirm = () => {
    if (!selected) return;
    setError(undefined);
    startTransition(async () => {
      const res = await bookVisitAction(applicationId, selected.id);
      setError(res.error);
      setSelected(null);
      await load(); // osvežen koledar
    });
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" disabled={week === 0} onClick={() => setWeek((w) => w - 1)}>
            <ChevronLeft aria-hidden /> <span className="hidden sm:inline">Prejšnji teden</span>
          </Button>
          <p className="text-center font-heading font-semibold" aria-live="polite">
            {weekRange(start)}
          </p>
          <Button type="button" variant="outline" disabled={week === weeks.length - 1} onClick={() => setWeek((w) => w + 1)}>
            <span className="hidden sm:inline">Naslednji teden</span> <ChevronRight aria-hidden />
          </Button>
        </div>

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}

        <div className="grid grid-cols-1 overflow-hidden rounded-xl border bg-card md:grid-cols-7 md:divide-x">
          {days.map((date) => {
            const daySlots = byDay.get(date) ?? [];
            return (
              <section key={date} aria-label={longDay(date)} className="flex flex-col gap-2 border-b p-3 last:border-b-0 md:border-b-0">
                <h2 className="text-sm font-semibold md:text-center">{dayHead(date)}</h2>
                {slots === null ? (
                  <span className="h-9 animate-pulse rounded-lg bg-muted" />
                ) : daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground md:text-center">{date < today ? "—" : "ni terminov"}</p>
                ) : (
                  <div className="flex flex-wrap gap-2 md:flex-col">
                    {daySlots.map((s) =>
                      s.taken ? (
                        <span
                          key={s.id}
                          aria-disabled="true"
                          className="flex min-w-20 flex-col items-center rounded-lg border-2 border-dashed px-2 py-1 text-sm text-muted-foreground tabular-nums"
                        >
                          {s.time}
                          <span className="text-[0.7rem] leading-none">zasedeno</span>
                        </span>
                      ) : (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={selected?.id === s.id}
                          aria-label={`${longDay(s.date)} ob ${s.time}`}
                          onClick={() => setSelected(s)}
                          className={cn(
                            "min-w-20 rounded-lg border-2 px-2 py-1.5 text-sm font-semibold tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
                            selected?.id === s.id ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30 hover:border-primary hover:bg-accent",
                          )}
                        >
                          {s.time}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Prikazani so termini v naslednjih 14 dneh. Časi so v lokalnem času (Ljubljana).</p>
      </div>

      <aside className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:sticky lg:top-4">
        <h2 className="font-heading text-lg font-semibold">Povzetek</h2>
        <div className="flex items-center gap-3">
          {animal.coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
            <img src={animal.coverPhoto} alt="" className="size-14 rounded-lg object-cover" />
          ) : (
            <div className="size-14 rounded-lg bg-muted" />
          )}
          <div>
            <p className="font-medium">{animal.name}</p>
            <p className="text-sm text-muted-foreground">vloga v pregledu</p>
          </div>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Termin</dt>
            <dd className="font-semibold">{selected ? `${longDay(selected.date)}, ${selected.time}–${selected.endTime}` : "Izberite termin v koledarju."}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Lokacija</dt>
            <dd>{address}</dd>
          </div>
        </dl>
        <Button type="button" size="lg" disabled={!selected || pending} onClick={confirm}>
          {pending ? "Rezerviranje …" : "Potrdi rezervacijo"}
        </Button>
      </aside>
    </div>
  );
}
