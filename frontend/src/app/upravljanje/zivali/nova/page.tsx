import type { Metadata } from "next";
import Link from "next/link";
import { createAnimalAction } from "../actions";
import { AnimalForm, EMPTY_ANIMAL } from "../animal-form";

export const metadata: Metadata = { title: "Nova žival – Novi dom" };

export default function NewAnimalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/upravljanje/zivali" className="text-sm text-muted-foreground hover:underline">
        ← Živali
      </Link>
      <h1 className="mt-2 mb-1 text-2xl font-semibold tracking-tight">Nova žival</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Nova žival dobi status »sprejeta« in se v javnem katalogu ne prikaže, dokler je ne označite kot na voljo.
      </p>
      <AnimalForm defaultValues={EMPTY_ANIMAL} submitLabel="Shrani žival" onSubmit={createAnimalAction} />
    </main>
  );
}
