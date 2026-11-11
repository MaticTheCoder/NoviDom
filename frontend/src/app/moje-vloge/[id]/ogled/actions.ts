"use server";

import { bookVisit } from "@novi-dom/backend";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

export type BookResult = { ok: false; error: string; code?: string };

export async function bookVisitAction(applicationId: string, slotId: string): Promise<BookResult> {
  const actor = await requireActor();
  try {
    await bookVisit(actor, { applicationId, slotId });
  } catch (error) {
    const result = toActionError(error);
    if (result.ok) throw error;
    return { ok: false, error: result.error, code: (error as { code?: string }).code };
  }
  revalidatePath("/moje-vloge", "layout");
  redirect(`/moje-vloge/${applicationId}?ogled=1`);
}
