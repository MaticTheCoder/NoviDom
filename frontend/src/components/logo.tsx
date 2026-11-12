import { cn } from "@/lib/utils";

/**
 * Znak Novi dom: ploščica z ovratnice v obliki hišice s tačko. Ploščica je medeninasta
 * (spomin na ploščico z imenom živali), oblika hiše pomeni novi dom.
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
      <span className="font-heading text-xl font-bold tracking-tight whitespace-nowrap">Novi dom</span>
    </span>
  );
}

/** Medeninasta ploščica z imenom živali, kot na ovratnici (podpis podobe »Smreka in ploščica«). */
export function NameTag({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-l-lg rounded-r-[1.25rem] bg-brass py-1.5 pr-4 pl-2.5 font-heading text-xl font-bold text-brass-foreground shadow-[0_1px_0_rgb(30_42_50/0.25)]",
        className,
      )}
    >
      <span aria-hidden className="size-2 rounded-full bg-background ring-[1.5px] ring-brass-foreground/35 ring-inset" />
      {name}
    </span>
  );
}

/**
 * Fotografija živali z zaobljenimi robovi; z `tag` ji v spodnjem levem kotu
 * visi medeninasta ploščica z imenom.
 */
export function AnimalPhoto({
  src,
  alt,
  tag,
  className,
  imgClassName,
}: {
  src: string | null;
  alt: string;
  tag?: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={cn("relative", tag && "mb-4", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in seeda
        <img src={src} alt={alt} className={cn("block size-full rounded-2xl bg-secondary object-cover", imgClassName)} />
      ) : (
        <div role="img" aria-label={alt} className={cn("size-full rounded-2xl bg-secondary", imgClassName)} />
      )}
      {tag && <NameTag name={tag} className="absolute -bottom-4 left-3.5" />}
    </div>
  );
}
