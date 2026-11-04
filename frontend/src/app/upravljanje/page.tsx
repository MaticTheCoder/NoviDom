import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";

export const metadata: Metadata = { title: "Upravljanje zavetišča – Novi dom" };

export default async function Page() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Upravljanje zavetišča</h1>
      <p className="mt-2 text-muted-foreground">Pozdravljeni, {session?.user?.name}.</p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        <li>
          <Link href="/upravljanje/zivali" className="block rounded-xl border p-4 hover:bg-muted">
            <span className="font-medium">Živali</span>
            <span className="mt-1 block text-sm text-muted-foreground">Vnos in urejanje živali ter fotografij.</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
