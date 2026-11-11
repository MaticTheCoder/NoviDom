import { HOME_BY_ROLE, safeCallbackUrl } from "@novi-dom/backend/access";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Prijava – Novi dom" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) redirect(HOME_BY_ROLE[session.user.role]);

  const { callbackUrl } = await searchParams;
  const safe = callbackUrl ? safeCallbackUrl(callbackUrl, "") || undefined : undefined;
  // callbackUrl se ohrani, da se nov posvojitelj po registraciji vrne na profil živali (US-02 AC 1).
  const registerHref = safe ? `/registracija?callbackUrl=${encodeURIComponent(safe)}` : "/registracija";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Prijava</CardTitle>
          <CardDescription>Prijavite se z e-poštnim naslovom in geslom.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm callbackUrl={callbackUrl} />
          <p className="text-center text-sm text-muted-foreground">
            Še nimate računa?{" "}
            <Link href={registerHref} className="text-foreground underline-offset-4 hover:underline">
              Registrirajte se kot posvojitelj
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
