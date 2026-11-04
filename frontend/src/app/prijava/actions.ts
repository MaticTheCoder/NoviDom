"use server";

import { safeCallbackUrl } from "@novi-dom/backend/access";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // Brez callbackUrl gre uporabnik na /po-prijavi, ki ga preusmeri na začetno stran njegove vloge.
  const redirectTo = safeCallbackUrl(String(formData.get("callbackUrl") ?? ""), "/po-prijavi");

  try {
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return {
        email,
        error: error.code === "deactivated" ? "Račun je deaktiviran." : "Napačen e-poštni naslov ali geslo.",
      };
    }
    if (error instanceof AuthError) {
      return { email, error: "Prijava trenutno ni mogoča. Poskusite znova." };
    }
    throw error; // NEXT_REDIRECT ob uspešni prijavi
  }
}
