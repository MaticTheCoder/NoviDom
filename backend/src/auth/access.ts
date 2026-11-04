// Pravila dostopa do področij aplikacije glede na vlogo (ADR-0005, raven 1).
// Modul ne sme uvažati Prisme ali Node.js API-jev, ker ga uporablja Next.js
// middleware, ki teče v Edge okolju.
import type { Role } from "../generated/prisma/enums";

export type { Role };

const PROTECTED_AREAS: ReadonlyArray<{ prefix: string; roles: readonly Role[] }> = [
  { prefix: "/upravljanje", roles: ["MANAGER"] },
  { prefix: "/ogledi", roles: ["VOLUNTEER", "MANAGER"] },
  { prefix: "/moje-vloge", roles: ["ADOPTER"] },
];

/** Začetna stran po prijavi in ob poskusu dostopa do področja druge vloge (US-11 AC 5). */
export const HOME_BY_ROLE: Record<Role, string> = {
  MANAGER: "/upravljanje",
  VOLUNTEER: "/ogledi",
  ADOPTER: "/moje-vloge",
};

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Vloge, ki imajo dostop do poti, ali null, če je pot javna. */
export function requiredRoles(pathname: string): readonly Role[] | null {
  return PROTECTED_AREAS.find((area) => matches(pathname, area.prefix))?.roles ?? null;
}

export type AccessDecision = { kind: "allow" } | { kind: "login" } | { kind: "redirect"; to: string };

export function decideAccess(pathname: string, role: Role | null | undefined): AccessDecision {
  const roles = requiredRoles(pathname);
  if (!roles) return { kind: "allow" };
  if (!role) return { kind: "login" };
  if (roles.includes(role)) return { kind: "allow" };
  return { kind: "redirect", to: HOME_BY_ROLE[role] };
}

/**
 * Vrne varen naslov za preusmeritev po prijavi: dovoljena je le relativna pot
 * znotraj aplikacije, sicer fallback (prepreči odprto preusmeritev na tujo domeno).
 */
export function safeCallbackUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return fallback;
  return url;
}
