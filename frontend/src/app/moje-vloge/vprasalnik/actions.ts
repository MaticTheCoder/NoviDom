"use server";

import { saveMyHousehold } from "@novi-dom/backend";
import { safeCallbackUrl } from "@novi-dom/backend/access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

export async function saveHouseholdAction(values: unknown, next?: string): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    await saveMyHousehold(actor, values);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/moje-vloge", "layout");
  // Iz oddaje vloge se posvojitelj po izpolnitvi vrne nazaj (US-02 AC 2).
  if (next) redirect(safeCallbackUrl(next, "/moje-vloge"));
  return { ok: true };
}
