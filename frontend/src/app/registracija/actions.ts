"use server";

import { isDomainError, registerAdopter } from "@novi-dom/backend";
import { safeCallbackUrl } from "@novi-dom/backend/access";
import { signIn } from "@/auth";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: { name: string; email: string; phone: string };
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const get = (k: string) => String(formData.get(k) ?? "");
  const values = { name: get("name"), email: get("email"), phone: get("phone") };
  const password = get("password");
  // Po registraciji se posvojitelj vrne tja, od koder je prišel (npr. profil živali, US-02 AC 1).
  const redirectTo = safeCallbackUrl(get("callbackUrl"), "/moje-vloge");

  let email: string;
  try {
    email = (await registerAdopter({ ...values, password, passwordConfirm: get("passwordConfirm") })).email;
  } catch (error) {
    if (!isDomainError(error)) throw error;
    const details = error.details as { fieldErrors?: Record<string, string> } | undefined;
    return { error: error.message, fieldErrors: details?.fieldErrors, values };
  }

  // Samodejna prijava; signIn ob uspehu vrže NEXT_REDIRECT.
  await signIn("credentials", { email, password, redirectTo });
  return {};
}
