import { getPublicAnimal } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AnimalTraits } from "@/components/animal-traits";
import { buttonVariants } from "@/components/ui/button";
import { ageLabel, SEX_LABEL, SPECIES_LABEL, STATUS_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const animal = await getPublicAnimal((await params).id);
  return { title: animal ? `${animal.name} – Novi dom` : "Žival – Novi dom" };
}

export default async function AnimalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [animal, session] = await Promise.all([getPublicAnimal(id), auth()]);
  if (!animal) notFound();

  const role = session?.user?.role;
  const profilePath = `/zivali/${animal.id}`;
  const flags = [animal.isChipped && "čipirana", animal.isVaccinated && "cepljena", animal.isNeutered && "sterilizirana / kastrirana"].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Vse živali
      </Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {animal.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe in SVG iz seeda
              <img src={animal.photos[0].url} alt={animal.name} className="size-full object-cover" />
            )}
          </div>
          {animal.photos.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {animal.photos.slice(1).map((p, i) => (
                <li key={p.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- slike iz lokalne shrambe */}
                  <img src={p.url} alt={`${animal.name}, fotografija ${i + 2}`} className="size-full object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{animal.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {SPECIES_LABEL[animal.species]}, {SEX_LABEL[animal.sex]}, približno {ageLabel(animal.birthDateApprox)}
            </p>
          </div>
          <AnimalTraits animal={animal} />
          {flags.length > 0 && <p className="text-sm text-muted-foreground">{flags.join(" · ")}</p>}
          {animal.description && <p className="whitespace-pre-line">{animal.description}</p>}

          <div className="mt-2 border-t pt-4">
            {animal.status !== "AVAILABLE" ? (
              <p className="text-sm text-muted-foreground">Žival je {STATUS_LABEL[animal.status]}, zato vloge trenutno ni mogoče oddati.</p>
            ) : !role ? (
              // Neprijavljen uporabnik se po prijavi vrne na profil živali (US-02 AC 1).
              <Link href={`/prijava?callbackUrl=${encodeURIComponent(profilePath)}`} className={buttonVariants({ size: "lg" })}>
                Oddaj vlogo
              </Link>
            ) : role === "ADOPTER" ? (
              <Link href={`/moje-vloge/nova/${animal.id}`} className={buttonVariants({ size: "lg" })}>
                Oddaj vlogo
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Vlogo za posvojitev lahko odda le posvojitelj.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
