import { authenticateUser } from "@novi-dom/backend/auth";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export class AccountDeactivatedError extends CredentialsSignin {
  code = "deactivated";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const result = await authenticateUser(parsed.data.email, parsed.data.password);
        if (!result.ok) {
          if (result.reason === "ACCOUNT_DEACTIVATED") throw new AccountDeactivatedError();
          return null;
        }
        return result.user;
      },
    }),
  ],
});
