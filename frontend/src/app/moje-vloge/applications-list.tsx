import type { listMyApplications } from "@novi-dom/backend";
import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { ArchPhoto } from "@/components/logo";
import { formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Item = Awaited<ReturnType<typeof listMyApplications>>["applications"][number];

/** Seznam vlog posvojitelja (levi stolpec WF-03); izbrana vloga je poudarjena. */
export function ApplicationsList({ applications, selectedId }: { applications: Item[]; selectedId?: string }) {
  return (
    <ul className="flex flex-col gap-2">
      {applications.map((a) => {
        const selected = a.id === selectedId;
        return (
          <li key={a.id}>
            <Link
              href={`/moje-vloge/${a.id}`}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-secondary",
                selected && "border-primary ring-1 ring-primary",
              )}
            >
              <ArchPhoto src={a.animal.coverPhoto} alt="" className="h-16 w-12 shrink-0" imgClassName="rounded-b-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{a.animal.name}</span>
                <span className="block text-sm text-muted-foreground">oddana {formatDate(a.submittedAt)}</span>
              </span>
              <ApplicationStatusBadge status={a.status} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
