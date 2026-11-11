"use client";

import type { FreeSlot } from "@novi-dom/backend";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { capitalize } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { bookVisitAction } from "./actions";

const dayLabel = (date: string) =>
  capitalize(new Intl.DateTimeFormat("sl-SI", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)));

/**
 * Izbira prostega termina (US-05). Seznam se naloži z /api/termini; ob konfliktu
 * (»Termin je bil pravkar zaseden«) se izbira počisti in seznam osveži (AC 5).
 */
export function SlotPicker({ applicationId, address }: { applicationId: string; address: string }) {
  const [slots, setSlots] = useState<FreeSlot[] | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [selected, setSelected] = useState<FreeSlot | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      const res = await fetch("/api/termini", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setSlots((await res.json()).slots);
    } catch {
      setLoadError("Prostih terminov ni bilo mogoče naložiti. Poskusite znova.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byDate = new Map<string, FreeSlot[]>();
  for (const s of slots ?? []) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);

  const confirm = () => {
    if (!selected) return;
    setError(undefined);
    startTransition(async () => {
      const res = await bookVisitAction(applicationId, selected.id);
      setError(res.error);
      setSelected(null);
      await load(); // osvežen seznam prostih terminov
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {slots === null && !loadError && <p className="text-sm text-muted-foreground">Nalaganje terminov …</p>}
        {slots?.length === 0 && <p className="text-sm text-muted-foreground">V naslednjih 14 dneh ni prostih terminov. Preverite znova kasneje.</p>}
        {[...byDate].map(([date, daySlots]) => (
          <section key={date} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">{dayLabel(date)}</h2>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={selected?.id === s.id}
                  onClick={() => setSelected(s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm tabular-nums transition-colors",
                    selected?.id === s.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="flex h-fit flex-col gap-3 rounded-xl border p-4 md:sticky md:top-4">
        <h2 className="font-medium">Izbrani termin</h2>
        {selected ? (
          <p className="text-sm">
            {dayLabel(selected.date)} ob {selected.time}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Izberite termin na levi.</p>
        )}
        <p className="text-sm text-muted-foreground">Lokacija: {address}</p>
        <Button type="button" disabled={!selected || pending} onClick={confirm}>
          {pending ? "Rezerviranje …" : "Potrdi rezervacijo"}
        </Button>
      </aside>
    </div>
  );
}
