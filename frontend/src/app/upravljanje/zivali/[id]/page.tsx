import { CommonErrorCode, getAnimalForManager, isDomainError } from "@novi-dom/backend";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/labels";
import { requireActor } from "@/lib/session";
import { updateAnimalAction } from "../actions";
import { AnimalForm } from "../animal-form";
import { PhotoManager } from "../photo-manager";

export const metadata: Metadata = { title: "Urejanje živali – Novi dom" };

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditAnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ustvarjena?: string }>;
}) {
  const [{ id }, { ustvarjena }] = await Promise.all([params, searchParams]);
  const actor = await requireActor();
  const animal = await getAnimalForManager(actor, id).catch((error) => {
    if (isDomainError(error) && error.code === CommonErrorCode.NotFound) notFound();
    throw error;
  });

  const { name, species, sex, description, internalNotes, size, energyLevel, needsGarden } = animal;
  const { goodWithKids, goodWithDogs, goodWithCats, isChipped, isVaccinated, isNeutered } = animal;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/upravljanje/zivali" className="text-sm text-muted-foreground hover:underline">
        ← Živali
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{animal.name}</h1>
        <Badge variant={animal.status === "AVAILABLE" ? "default" : "secondary"}>{STATUS_LABEL[animal.status]}</Badge>
      </div>

      {ustvarjena && (
        <p role="status" className="mb-6 rounded-lg border bg-muted px-4 py-3 text-sm">
          Žival je shranjena s statusom »sprejeta«. Dodajte še fotografije.
        </p>
      )}

      <section className="mb-10 flex flex-col gap-3">
        <h2 className="text-lg font-medium">Fotografije</h2>
        <PhotoManager animalId={animal.id} animalName={animal.name} photos={animal.photos} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Podatki</h2>
        <AnimalForm
          submitLabel="Shrani spremembe"
          onSubmit={updateAnimalAction.bind(null, animal.id)}
          defaultValues={{
            name, species, sex, description, internalNotes, size, energyLevel, needsGarden,
            goodWithKids, goodWithDogs, goodWithCats, isChipped, isVaccinated, isNeutered,
            birthDateApprox: isoDate(animal.birthDateApprox),
            intakeDate: isoDate(animal.intakeDate),
          }}
        />
      </section>
    </main>
  );
}
