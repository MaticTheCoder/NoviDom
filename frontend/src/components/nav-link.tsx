"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Povezava v glavi; trenutno področje je označeno (aria-current). */
export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "px-1 py-1 text-[0.95rem] whitespace-nowrap transition-colors hover:text-foreground",
        active ? "border-b-2 border-brass font-semibold text-foreground" : "border-b-2 border-transparent text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
