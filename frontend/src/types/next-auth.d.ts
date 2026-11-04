import type { Role } from "@novi-dom/backend/access";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}

// JWT je deklariran v @auth/core/jwt (next-auth/jwt ga le ponovno izvozi).
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
