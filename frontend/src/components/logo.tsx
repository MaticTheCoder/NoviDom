import { cn } from "@/lib/utils";

/** Znak Novi dom: obokano okno (pogled domov). Enaka oblika je pri fotografijah živali. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 34" aria-hidden className={cn("h-8 w-7 shrink-0", className)}>
      <path d="M2 32V15a13 13 0 0 1 26 0v17Z" fill="var(--secondary)" stroke="var(--primary)" strokeWidth="2.5" />
      <path d="M15 3v29M2 19h26" stroke="var(--primary)" strokeWidth="2" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-heading text-[1.4rem] font-semibold whitespace-nowrap">Novi dom</span>
    </span>
  );
}

// Obok: eliptičen zgornji polmer (50 % širine × 40 % višine). Z »rounded-t-full« bi brskalnik
// sorazmerno pomanjšal vse polmere (vsota presega širino) in spodnji robovi ne bi bili zaobljeni.
const ARCH = "rounded-tl-[50%_40%] rounded-tr-[50%_40%]";

/**
 * Fotografija živali v obliki obokanega okna (podpis podobe »Okno domov«).
 * `framed` doda svetlo lila okvir okoli loka.
 */
export function ArchPhoto({
  src,
  alt,
  className,
  imgClassName,
  framed = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  framed?: boolean;
}) {
  const img = src ? (
    // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in seeda
    <img src={src} alt={alt} className={cn("block size-full rounded-b-2xl object-cover", ARCH, imgClassName)} />
  ) : (
    <div role="img" aria-label={alt} className={cn("size-full rounded-b-2xl bg-secondary", ARCH, imgClassName)} />
  );
  return framed ? <div className={cn("rounded-b-3xl bg-secondary p-2.5", ARCH, className)}>{img}</div> : <div className={className}>{img}</div>;
}
