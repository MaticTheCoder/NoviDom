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
        "rounded-md px-2 py-1 text-sm whitespace-nowrap transition-colors hover:bg-secondary",
        active ? "font-semibold text-foreground underline decoration-brass decoration-2 underline-offset-[6px]" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
