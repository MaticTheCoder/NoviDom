"use server";

import { submitApplication } from "@novi-dom/backend";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

export type SubmitResult = { ok: false; error: string; code?: string; applicationId?: string; fieldErrors?: Record<string, string> };

export async function submitApplicationAction(
  animalId: string,
  motivation: string,
  acknowledgeWarnings: boolean,
): Promise<SubmitResult> {
  const actor = await requireActor();
  let id: string;
  try {
    id = (await submitApplication(actor, { animalId, motivation, acknowledgeWarnings })).id;
  } catch (error) {
    const result = toActionError(error);
    if (result.ok) throw error;
    const domain = error as { code?: string; details?: { applicationId?: string } };
    return { ...result, code: domain.code, applicationId: domain.details?.applicationId };
  }
  revalidatePath("/moje-vloge", "layout");
  // Po oddaji je posvojitelj preusmerjen na podrobnost vloge (US-02 AC 5).
  redirect(`/moje-vloge/${id}?oddana=1`);
}
