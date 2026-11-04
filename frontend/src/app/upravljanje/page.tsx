import type { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Upravljanje zavetišča – Novi dom" };

export default async function Page() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Upravljanje zavetišča</h1>
      <p className="mt-2 text-muted-foreground">
        Pozdravljeni, {session?.user?.name}. Pregled živali in vlog za vodjo zavetišča.
      </p>
    </main>
  );
}
