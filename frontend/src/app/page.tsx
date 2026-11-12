import { listPublicAnimals } from "@novi-dom/backend";
import Link from "next/link";
import { AnimalTraits } from "@/components/animal-traits";
import { AnimalPhoto } from "@/components/logo";
import { ageLabel, animalNoun } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Katalog se izriše ob vsakem nalaganju, da je nova žival na voljo vidna takoj (US-01 AC 3).
export const dynamic = "force-dynamic";

const FILTERS = [
  { value: undefined, label: "Vse živali" },
  { value: "psi", label: "Psi" },
  { value: "macke", label: "Mačke" },
] as const;

const SPECIES_BY_FILTER = { psi: "DOG", macke: "CAT" } as const;

/** Katalog »Smreka in ploščica«: uvod, filter vrste, živali z medeninasto ploščico z imenom. */
export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ vrsta?: string }> }) {
  const { vrsta } = await searchParams;
  const species = vrsta === "psi" || vrsta === "macke" ? SPECIES_BY_FILTER[vrsta] : undefined;
  const all = await listPublicAnimals();
  const animals = all.filter((a) => !species || a.species === species);
  const count = (s?: "DOG" | "CAT") => all.filter((a) => !s || a.species === s).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-8 sm:pt-14">
      <section className="grid items-end gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <div>
          <h1 className="text-4xl leading-[1.02] sm:text-6xl">Psi in mačke, ki čakajo na svoj novi dom</h1>
          <p className="mt-4 max-w-[34em] text-lg text-muted-foreground">
            Pred oddajo vloge vidite, kako se vaše gospodinjstvo ujema z izbrano živaljo. Ogled rezervirate sami, brez klicanja.
          </p>
        </div>
        <nav aria-label="Vrsta živali" className="flex flex-col gap-3 rounded-2xl bg-secondary p-5">
          <p className="font-semibold">Pokaži</p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = f.value === (species ? vrsta : undefined);
              const n = count(f.value ? SPECIES_BY_FILTER[f.value] : undefined);
              return (
                <Link
                  key={f.label}
                  href={f.value ? `/?vrsta=${f.value}` : "/"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full border-[1.5px] px-4 py-1.5 text-sm transition-colors",
                    active ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-input bg-card hover:border-primary",
                  )}
                >
                  {f.label} ({n})
                </Link>
              );
            })}
          </div>
        </nav>
      </section>

      {animals.length === 0 ? (
        <p className="mt-16 text-muted-foreground">Trenutno ni živali na voljo.</p>
      ) : (
        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {animals.map((a) => (
            <li key={a.id}>
              <Link href={`/zivali/${a.id}`} className="group flex flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring">
                <AnimalPhoto
                  src={a.photos[0]?.url ?? null}
                  alt={a.name}
                  tag={a.name}
                  className="transition-transform duration-300 group-hover:-translate-y-0.5"
                  imgClassName="aspect-[4/5]"
                />
                <span className="flex flex-col gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">
                    {animalNoun(a.species, a.sex)}, {ageLabel(a.birthDateApprox)}
                  </span>
                  <AnimalTraits animal={a} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
