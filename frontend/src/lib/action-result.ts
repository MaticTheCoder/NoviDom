import { isDomainError } from "@novi-dom/backend";

export type ActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Pretvori napako storitve v rezultat za UI; nepričakovane napake vrže naprej. */
export function toActionError(error: unknown): ActionResult {
  if (isDomainError(error)) {
    const details = error.details as { fieldErrors?: Record<string, string> } | undefined;
    return { ok: false, error: error.message, fieldErrors: details?.fieldErrors };
  }
  throw error;
}
