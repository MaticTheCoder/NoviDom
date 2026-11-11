import type { MatchWarning } from "@novi-dom/backend/matching";
import type { MatchLevel } from "@novi-dom/backend/enums";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATCH_LABEL } from "@/lib/labels";

// Barve oznake ujemanja (US-03 AC 1): zelena, rumena, rdeča. Barva ni edini nosilec
// pomena: oznaka ima vedno tudi besedilo in ikono.
const STYLE: Record<MatchLevel, { className: string; Icon: typeof CircleCheck }> = {
  MATCH: { className: "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", Icon: CircleCheck },
  CONDITIONAL: { className: "border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200", Icon: TriangleAlert },
  MISMATCH: { className: "border-red-600/30 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200", Icon: CircleAlert },
};

export function MatchBadge({ level, className }: { level: MatchLevel; className?: string }) {
  const { className: color, Icon } = STYLE[level];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", color, className)}>
      <Icon className="size-3.5" aria-hidden />
      {MATCH_LABEL[level]}
    </span>
  );
}

// Posvojitelju se besedilo obrača nanj, osebju pa opisuje kandidatovo gospodinjstvo.
const SUMMARY: Record<"adopter" | "staff", Record<MatchLevel, string>> = {
  adopter: {
    MATCH: "Vaše gospodinjstvo ustreza potrebam te živali.",
    CONDITIONAL: "Ujemanje je pogojno. Preberite opozorila; vlogo lahko kljub temu oddate.",
    MISMATCH: "Gospodinjstvo ne ustreza vsem potrebam živali. Vlogo lahko oddate, a preberite opozorila.",
  },
  staff: {
    MATCH: "Gospodinjstvo kandidata ustreza potrebam živali.",
    CONDITIONAL: "Ujemanje je pogojno; preverite opozorila.",
    MISMATCH: "Gospodinjstvo kandidata ne ustreza vsem potrebam živali; kandidat je opozorila potrdil ob oddaji.",
  },
};

/** Oznaka ujemanja s povzetkom in seznamom opozoril (vzrok + podatek iz vprašalnika). */
export function MatchResult({
  level,
  warnings,
  title = "Ocena ujemanja",
  audience = "adopter",
}: {
  level: MatchLevel;
  warnings: MatchWarning[];
  title?: string;
  audience?: "adopter" | "staff";
}) {
  const { className: color, Icon } = STYLE[level];
  return (
    <section aria-labelledby="match-title" className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:p-5", color)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="match-title" className="flex items-center gap-2 text-base font-semibold">
          <Icon className="size-5" aria-hidden />
          {title}
        </h2>
        <MatchBadge level={level} className="bg-background/80 px-3 py-1 text-sm" />
      </div>
      <p className="text-sm">{SUMMARY[audience][level]}</p>
      {warnings.length > 0 && (
        <ul className="flex flex-col gap-2">
          {warnings.map((w) => (
            <li key={w.rule} className="rounded-lg bg-background/70 p-3 text-sm text-foreground">
              <p className="flex items-start gap-2 font-medium">
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", w.severity === "MISMATCH" ? "bg-red-600" : "bg-amber-500")}
                  aria-label={w.severity === "MISMATCH" ? "neujemanje" : "pogojno"}
                />
                {w.message}
              </p>
              <p className="mt-1 pl-4 text-muted-foreground">{w.trigger}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
