import { SHELTER } from "@novi-dom/backend";
import { LogoMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-foreground">
          <LogoMark className="h-6 w-5" />
          {SHELTER.name}
        </span>
        <span>{SHELTER.address}</span>
        <span className="sm:ml-auto">Ogledi živali po dogovoru, od ponedeljka do sobote.</span>
      </div>
    </footer>
  );
}
