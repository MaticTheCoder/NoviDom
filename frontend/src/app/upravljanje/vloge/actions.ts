"use server";

import { transitionApplication, transitionInputSchema } from "@novi-dom/backend";
import { revalidatePath } from "next/cache";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

export async function transitionAction(applicationId: string, to: string, comment?: string): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = transitionInputSchema.safeParse({ applicationId, to, comment });
  if (!parsed.success) return { ok: false, error: "Neveljavna zahteva." };
  try {
    await transitionApplication(actor, parsed.data);
  } catch (error) {
    return toActionError(error);
  }
  // Prehod lahko spremeni tudi status živali (odobritev → rezervirana), zato osvežimo vse strani.
  revalidatePath("/", "layout");
  return { ok: true };
}
