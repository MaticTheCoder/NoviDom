import type { Role } from "@novi-dom/backend/access";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { Button, buttonVariants } from "@/components/ui/button";

const ROLE_LABEL: Record<Role, string> = {
  MANAGER: "vodja",
  VOLUNTEER: "prostovoljec",
  ADOPTER: "posvojitelj",
};

/** Povezave glede na vlogo; »Živali« (katalog) je vidna vsem. */
const NAV: Record<Role | "GUEST", { href: string; label: string; exact?: boolean }[]> = {
  GUEST: [{ href: "/", label: "Živali", exact: true }],
  ADOPTER: [
    { href: "/", label: "Živali", exact: true },
    { href: "/moje-vloge", label: "Moje vloge" },
  ],
  VOLUNTEER: [
    { href: "/", label: "Živali", exact: true },
    { href: "/ogledi", label: "Moji ogledi" },
  ],
  MANAGER: [
    { href: "/upravljanje/vloge", label: "Vloge" },
    { href: "/upravljanje/zivali", label: "Kartoteka" },
    { href: "/", label: "Katalog", exact: true },
  ],
};

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const nav = NAV[user?.role ?? "GUEST"];

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-8">
        <Link href={user?.role === "MANAGER" ? "/upravljanje" : "/"} className="rounded-md" aria-label="Novi dom, domov">
          <Logo />
        </Link>
        <nav aria-label="Glavna navigacija" className="order-3 flex w-full gap-6 overflow-x-auto sm:order-none sm:w-auto">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href} exact={item.exact}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-right leading-tight md:block">
                {user.name}
                <span className="block text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
              </span>
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
            </>
          ) : (
            <>
              <Link href="/prijava" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Prijava
              </Link>
              <Link href="/registracija" className={buttonVariants({ size: "sm" })}>
                Ustvari račun
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
