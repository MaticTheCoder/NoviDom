// Del konfiguracije Auth.js, ki je varen za Edge okolje (uporablja ga middleware).
// Ne sme uvažati Prisme ali argon2; ponudnik Credentials je v auth.ts.
import { decideAccess, HOME_BY_ROLE } from "@novi-dom/backend/access";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/prijava" },
  session: { strategy: "jwt" },
  // Aplikacija teče na lastnem strežniku (ne na Vercelu), Host glavo nastavi Next.js.
  trustHost: true,
  providers: [],
  callbacks: {
    // Raven 1 avtorizacije (ADR-0005): dostop do celih področij glede na vlogo.
    authorized({ auth, request: { nextUrl } }) {
      const decision = decideAccess(nextUrl.pathname, auth?.user?.role);
      if (decision.kind === "allow") return true;
      if (decision.kind === "redirect") return Response.redirect(new URL(decision.to, nextUrl));
      const login = new URL("/prijava", nextUrl);
      login.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return Response.redirect(login);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

export { HOME_BY_ROLE };
