import { listAnimalsForManager } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SPECIES_LABEL, STATUS_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";

export const metadata: Metadata = { title: "Živali – Novi dom" };

export default async function AnimalsPage() {
  const animals = await listAnimalsForManager(await requireActor());

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Živali</h1>
          <p className="text-sm text-muted-foreground">{animals.length} živali v kartoteki</p>
        </div>
        <Link href="/upravljanje/zivali/nova" className={buttonVariants()}>
          Nova žival
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <span className="sr-only">Fotografija</span>
              </TableHead>
              <TableHead>Ime</TableHead>
              <TableHead>Vrsta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lastnosti</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {animals.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  {a.coverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
                    <img src={a.coverPhoto} alt="" className="size-10 rounded-md object-cover" />
                  ) : (
                    <div className="size-10 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/upravljanje/zivali/${a.id}`} className="hover:underline">
                    {a.name}
                  </Link>
                </TableCell>
                <TableCell>{SPECIES_LABEL[a.species]}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "AVAILABLE" ? "default" : "secondary"}>{STATUS_LABEL[a.status]}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {a.missing.length === 0 ? (
                    <span className="text-muted-foreground">izpolnjene</span>
                  ) : (
                    <span className="text-destructive">manjka {a.missing.length} od 6</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
