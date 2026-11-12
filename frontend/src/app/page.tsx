import { listPublicAnimals } from "@novi-dom/backend";
import Link from "next/link";
import { ArchPhoto } from "@/components/logo";
import { ageLabel, animalNoun } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Katalog se izriše ob vsakem nalaganju, da je nova žival na voljo vidna takoj (US-01 AC 3).
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: undefined, label: "Vsi" },
  { value: "psi", label: "Psi" },
  { value: "macke", label: "Mačke" },
] as const;

const SPECIES_BY_FILTER = { psi: "DOG", macke: "CAT" } as const;

/** Katalog »Okno domov«: sredinski uvod, filter vrste, živali v obokanih oknih. */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ vrsta?: string }> }) {
  const { vrsta } = await searchParams;
  const species = vrsta === "psi" || vrsta === "macke" ? SPECIES_BY_FILTER[vrsta] : undefined;
  const animals = (await listPublicAnimals()).filter((a) => !species || a.species === species);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-8 sm:pt-14">
      <section className="flex flex-col items-center text-center">
        <h1 className="max-w-[15ch] text-4xl leading-[1.04] sm:text-6xl lg:text-7xl">Vsak si zasluži okno, ki gleda domov</h1>
        <p className="mt-5 max-w-[36em] text-lg text-muted-foreground">
          Spoznajte pse in mačke iz zavetišča. Pred vlogo vam pokažemo, kako bi se ujeli z vašim domom.
        </p>
        <nav aria-label="Vrsta živali" className="mt-8 inline-flex gap-1 rounded-full bg-secondary p-1.5">
          {FILTERS.map((f) => {
            const active = f.value === (species ? vrsta : undefined);
            return (
              <Link
                key={f.label}
                href={f.value ? `/?vrsta=${f.value}` : "/"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-5 py-2 text-[0.95rem] transition-colors",
                  active ? "bg-background font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
      </section>

      {animals.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">Trenutno ni živali na voljo.</p>
      ) : (
        <ul className="mt-14 grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <li key={a.id}>
              <Link href={`/zivali/${a.id}`} className="group flex flex-col gap-4 rounded-3xl outline-none">
                <ArchPhoto
                  framed
                  src={a.photos[0]?.url ?? null}
                  alt={a.name}
                  className="transition-transform duration-300 group-hover:-translate-y-1 group-focus-visible:ring-3 group-focus-visible:ring-ring"
                  imgClassName="aspect-[3/4]"
                />
                <span className="text-center">
                  <span className="block font-heading text-3xl font-semibold group-hover:text-primary">{a.name}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {animalNoun(a.species, a.sex)}, {ageLabel(a.birthDateApprox)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
