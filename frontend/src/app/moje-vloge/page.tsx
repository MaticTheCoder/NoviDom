import { listMyApplications, MAX_ACTIVE_APPLICATIONS } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireActor } from "@/lib/session";
import { ApplicationsList } from "./applications-list";

export const metadata: Metadata = { title: "Moje vloge – Novi dom" };

export default async function MyApplicationsPage() {
  const { applications, activeCount } = await listMyApplications(await requireActor());

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Moje vloge{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({activeCount} od {MAX_ACTIVE_APPLICATIONS} aktivnih)
          </span>
        </h1>
        <Link href="/moje-vloge/vprasalnik" className={buttonVariants({ variant: "outline" })}>
          Vprašalnik o gospodinjstvu
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-10 text-center">
          <p className="text-muted-foreground">Še niste oddali nobene vloge.</p>
          <Link href="/" className={buttonVariants()}>
            Poglejte živali, ki iščejo dom
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <ApplicationsList applications={applications} />
          <p className="hidden rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground md:block">
            Izberite vlogo na levi za časovnico in podrobnosti.
          </p>
        </div>
      )}
    </main>
  );
}
