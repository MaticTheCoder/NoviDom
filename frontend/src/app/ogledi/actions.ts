"use server";

import { submitVisitReport, updateVisitReport } from "@novi-dom/backend";
import { revalidatePath } from "next/cache";
import { type ActionResult, toActionError } from "@/lib/action-result";
import { requireActor } from "@/lib/session";

export async function saveReportAction(mode: "submit" | "update", values: unknown): Promise<ActionResult> {
  const actor = await requireActor();
  try {
    await (mode === "submit" ? submitVisitReport(actor, values) : updateVisitReport(actor, values));
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/ogledi", "layout");
  revalidatePath("/upravljanje", "layout");
  return { ok: true };
}
