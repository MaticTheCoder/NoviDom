"use server";

import { transitionApplication, transitionInputSchema } from "@novi-dom/backend";
import { revalidatePath } from "next/cache";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

/** Umik vloge s strani posvojitelja (prehod v »umaknjena«). */
export async function withdrawApplicationAction(applicationId: string): Promise<ActionResult> {
  const actor = await requireActor();
  const parsed = transitionInputSchema.safeParse({ applicationId, to: "WITHDRAWN" });
  if (!parsed.success) return { ok: false, error: "Neveljavna vloga." };
  try {
    await transitionApplication(actor, parsed.data);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/moje-vloge", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
