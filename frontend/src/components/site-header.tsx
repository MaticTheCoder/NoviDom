import { HOME_BY_ROLE, type Role } from "@novi-dom/backend/access";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";

const ROLE_LABEL: Record<Role, string> = {
  MANAGER: "vodja",
  VOLUNTEER: "prostovoljec",
  ADOPTER: "posvojitelj",
};

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold">
          Novi dom
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href={HOME_BY_ROLE[user.role]} className="hover:underline">
              {user.name} <span className="text-muted-foreground">({ROLE_LABEL[user.role]})</span>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Odjava
              </Button>
            </form>
          </div>
        ) : (
          <Link href="/prijava" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Prijava
          </Link>
        )}
      </div>
    </header>
  );
}
