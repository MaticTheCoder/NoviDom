import { cn } from "@/lib/utils";

/**
 * Znak Novi dom: ploščica z ovratnice v obliki hišice, s tačko. Ploščica je medeninasta
 * (spomin na ploščico z imenom in naslovom živali), oblika hiše pomeni novi dom.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <circle cx="16" cy="4.6" r="2.9" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-foreground/70" />
      <path d="M16 7.2 27.2 15.4V26a3.2 3.2 0 0 1-3.2 3.2H8A3.2 3.2 0 0 1 4.8 26V15.4Z" fill="var(--brass)" stroke="var(--brass)" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="16" cy="12.3" r="1.5" fill="var(--background)" />
      <g fill="var(--brass-foreground)">
        <ellipse cx="16" cy="23.4" rx="3.5" ry="2.7" />
        <circle cx="11.9" cy="19.6" r="1.35" />
        <circle cx="14.6" cy="17.7" r="1.35" />
        <circle cx="17.4" cy="17.7" r="1.35" />
        <circle cx="20.1" cy="19.6" r="1.35" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg font-semibold tracking-tight whitespace-nowrap">Novi dom</span>
    </span>
  );
}
