import { listApplicationsForManager } from "@novi-dom/backend";
import { ApplicationStatus } from "@novi-dom/backend/enums";
import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/application-status-badge";
import { MatchBadge } from "@/components/match-result";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_STATUS_LABEL, formatDate } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Vloge – Upravljanje – Novi dom" };

const STATUSES = Object.values(ApplicationStatus);

export default async function ManagerApplicationsPage({ searchParams }: { searchParams: Promise<{ stanje?: string }> }) {
  const { stanje } = await searchParams;
  const status = STATUSES.find((s) => s === stanje);
  const applications = await listApplicationsForManager(await requireActor(), { status });

  const filterLink = (value: string | undefined, label: string) => (
    <Link
      key={label}
      href={value ? `/upravljanje/vloge?stanje=${value}` : "/upravljanje/vloge"}
      className={cn("rounded-full border px-3 py-1 text-sm", value === status ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      aria-current={value === status ? "page" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Vloge</h1>
      <nav aria-label="Filter po stanju" className="mt-4 flex flex-wrap gap-2">
        {filterLink(undefined, "vse")}
        {STATUSES.map((s) => filterLink(s, APPLICATION_STATUS_LABEL[s]))}
      </nav>

      {applications.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Ni vlog{status ? ` v stanju »${APPLICATION_STATUS_LABEL[status]}«` : ""}.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kandidat</TableHead>
                <TableHead>Žival</TableHead>
                <TableHead>Ujemanje</TableHead>
                <TableHead>Stanje</TableHead>
                <TableHead>Oddana</TableHead>
                <TableHead>Zadnja sprememba</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/upravljanje/vloge/${a.id}`} className="hover:underline">
                      {a.adopter.name}
                    </Link>
                  </TableCell>
                  <TableCell>{a.animal.name}</TableCell>
                  <TableCell>
                    <MatchBadge level={a.matchLevel} />
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>{formatDate(a.submittedAt)}</TableCell>
                  <TableCell>{formatDate(a.lastChangeAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
