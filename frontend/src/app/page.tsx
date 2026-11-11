import { listPublicAnimals } from "@novi-dom/backend";
import Link from "next/link";
import { AnimalTraits } from "@/components/animal-traits";
import { ageLabel, SEX_LABEL, SPECIES_LABEL } from "@/lib/labels";

// Katalog se izriše ob vsakem nalaganju, da je nova žival na voljo vidna takoj (US-01 AC 3).
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const animals = await listPublicAnimals();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Živali, ki iščejo dom</h1>
      <p className="mt-2 text-muted-foreground">Psi in mačke iz zavetišča, pripravljeni na posvojitev.</p>

      {animals.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Trenutno ni živali na voljo.</p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <li key={a.id}>
              <Link href={`/zivali/${a.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border hover:bg-muted/50">
                <div className="aspect-[4/3] bg-muted">
                  {a.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
                    <img src={a.photos[0].url} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-lg font-medium group-hover:underline">{a.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {SPECIES_LABEL[a.species]}, {SEX_LABEL[a.sex]}, {ageLabel(a.birthDateApprox)}
                  </p>
                  <AnimalTraits animal={a} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
