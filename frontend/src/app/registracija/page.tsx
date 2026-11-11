import { HOME_BY_ROLE, safeCallbackUrl } from "@novi-dom/backend/access";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Registracija – Novi dom" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) redirect(HOME_BY_ROLE[session.user.role]);

  const { callbackUrl } = await searchParams;
  const safe = callbackUrl ? safeCallbackUrl(callbackUrl, "") || undefined : undefined;
  const loginHref = safe ? `/prijava?callbackUrl=${encodeURIComponent(safe)}` : "/prijava";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Registracija posvojitelja</CardTitle>
          <CardDescription>Ustvarite račun, da lahko oddate vlogo za posvojitev.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm callbackUrl={safe} />
          <p className="text-center text-sm text-muted-foreground">
            Že imate račun?{" "}
            <Link href={loginHref} className="text-foreground underline-offset-4 hover:underline">
              Prijavite se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
