import { HOME_BY_ROLE } from "@novi-dom/backend/access";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Prijava – Novi dom" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) redirect(HOME_BY_ROLE[session.user.role]);

  const { callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Prijava</CardTitle>
          <CardDescription>Prijavite se z e-poštnim naslovom in geslom.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </main>
  );
}
