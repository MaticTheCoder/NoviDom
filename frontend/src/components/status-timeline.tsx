import type { ApplicationStatus } from "@novi-dom/backend/enums";
import { Check, X } from "lucide-react";
import { APPLICATION_STATUS_LABEL, capitalize } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Redni potek vloge od oddaje do posvojitve (WF-03). */
const STEPS = ["SUBMITTED", "IN_REVIEW", "VISIT_SCHEDULED", "VISIT_DONE", "APPROVED", "ADOPTED"] as const satisfies readonly ApplicationStatus[];

/**
 * Časovnica stanj vloge iz zgodovine (US-04 AC 5, WF-03). Opravljeni koraki so polni,
 * trenutni je poudarjen, prihodnji prazni. Pri zavrnjeni ali umaknjeni vlogi se potek
 * konča z rdečim korakom za tem, ki je bil dosežen zadnji.
 */
export function StatusTimeline({
  status,
  events,
  detail,
}: {
  status: ApplicationStatus;
  events: { toStatus: ApplicationStatus; createdAt: Date }[];
  /** Dodatno besedilo pod koraki (npr. termin ogleda pod »ogled dogovorjen«). */
  detail?: Partial<Record<ApplicationStatus, string>>;
}) {
  const reachedAt = new Map<ApplicationStatus, Date>();
  for (const e of events) reachedAt.set(e.toStatus, e.createdAt);
  const closed = status === "REJECTED" || status === "WITHDRAWN";

  // Zadnji korak rednega poteka, ki ga je vloga dosegla.
  const lastNormal = closed
    ? [...events].reverse().find((e) => (STEPS as readonly string[]).includes(e.toStatus))?.toStatus ?? "SUBMITTED"
    : status;
  const currentIndex = STEPS.indexOf(lastNormal as (typeof STEPS)[number]);

  const steps: { key: ApplicationStatus; state: "done" | "current" | "todo" | "closed" }[] = closed
    ? [...STEPS.slice(0, currentIndex + 1).map((key) => ({ key, state: "done" as const })), { key: status, state: "closed" as const }]
    : STEPS.map((key, i) => ({ key, state: i < currentIndex ? "done" : i === currentIndex ? (status === "ADOPTED" ? "done" : "current") : "todo" }));

  const fmt = new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Ljubljana" });

  return (
    <ol aria-label="Potek vloge" className="flex flex-col gap-0 sm:flex-row">
      {steps.map((step, i) => (
        <li
          key={step.key}
          aria-current={step.state === "current" ? "step" : undefined}
          className="relative flex flex-1 gap-3 pb-4 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center"
        >
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn(
                "absolute top-7 bottom-0 left-[0.8125rem] w-0.5 sm:top-[0.8125rem] sm:right-[-50%] sm:bottom-auto sm:left-[50%] sm:h-0.5 sm:w-auto",
                step.state === "done" ? "bg-primary" : "bg-border",
              )}
            />
          )}
          <span
            className={cn(
              "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2",
              step.state === "done" && "border-primary bg-primary text-primary-foreground",
              step.state === "current" && "border-primary bg-background ring-4 ring-brass/60",
              step.state === "todo" && "border-border bg-background",
              step.state === "closed" && "border-destructive bg-destructive text-white",
            )}
          >
            {step.state === "done" && <Check className="size-4" aria-hidden />}
            {step.state === "current" && <span className="size-2.5 rounded-full bg-primary" />}
            {step.state === "closed" && <X className="size-4" aria-hidden />}
          </span>
          <span className="flex flex-col text-sm leading-tight sm:items-center">
            <span className={cn("font-medium", step.state === "todo" && "text-muted-foreground", step.state === "closed" && "text-destructive")}>
              {capitalize(APPLICATION_STATUS_LABEL[step.key])}
            </span>
            {reachedAt.has(step.key) && step.state !== "todo" && (
              <span className="text-xs text-muted-foreground tabular-nums">{fmt.format(reachedAt.get(step.key)!)}</span>
            )}
            {detail?.[step.key] && <span className="text-xs text-muted-foreground">{detail[step.key]}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
