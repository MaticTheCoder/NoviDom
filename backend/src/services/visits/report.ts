import { prisma } from "../../db";
import { CommonErrorCode, DomainError } from "../../errors";
import type { Prisma, VisitReport } from "../../generated/prisma/client";
import { REPORT_EDIT_WINDOW_MS, visitReportSchema } from "../../validation/visit";
import { applyTransition } from "../applications/transition";
import { type Actor, requireRole } from "../guard";

export const ReportErrorCode = {
  Validation: "REPORT_VALIDATION",
  TooEarly: "REPORT_TOO_EARLY",
  AlreadySubmitted: "REPORT_ALREADY_SUBMITTED",
  NotSubmitted: "REPORT_NOT_SUBMITTED",
  Locked: "REPORT_LOCKED",
  VisitNotPending: "REPORT_VISIT_NOT_PENDING",
} as const;

type Tx = Prisma.TransactionClient;

function parse(raw: unknown) {
  const parsed = visitReportSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
    throw new DomainError(ReportErrorCode.Validation, "Zapisnik ni popoln.", { fieldErrors });
  }
  return parsed.data;
}

/** Do kdaj lahko prostovoljec zapisnik še ureja (US-06 AC 4). */
export const reportEditableUntil = (report: Pick<VisitReport, "submittedAt">) =>
  new Date(report.submittedAt.getTime() + REPORT_EDIT_WINDOW_MS);

export const isReportEditable = (report: Pick<VisitReport, "submittedAt">, now = new Date()) =>
  now.getTime() <= reportEditableUntil(report).getTime();

/**
 * Ogled, do katerega ima prostovoljec dostop: le ogled v terminu, ki je dodeljen
 * njemu (US-06 AC 1). Tuj ogled je za prostovoljca neobstoječ.
 */
async function loadOwnVisit(tx: Tx, volunteerId: string, visitId: string) {
  const visit = await tx.visit.findUnique({
    where: { id: visitId },
    include: { slot: true, application: true, report: true },
  });
  if (!visit || visit.slot.volunteerId !== volunteerId) {
    throw new DomainError(CommonErrorCode.NotFound, "Ogled ne obstaja ali vam ni dodeljen.");
  }
  return visit;
}

/**
 * Oddaja zapisnika (US-06 AC 1–3). V eni transakciji shrani zapisnik, ogled označi kot
 * opravljen in vlogo prestavi v »ogled opravljen« (z zapisom v zgodovino).
 */
export async function submitVisitReport(actor: Actor, raw: unknown, now = new Date()): Promise<VisitReport> {
  const input = parse(raw);
  return prisma.$transaction(async (tx) => {
    const volunteer = await requireRole(tx, actor, ["VOLUNTEER"], "Zapisnik ogleda vnese prostovoljec, ki mu je termin dodeljen.");
    const visit = await loadOwnVisit(tx, volunteer.id, input.visitId);

    if (now < visit.slot.startsAt) {
      throw new DomainError(ReportErrorCode.TooEarly, "Zapisnik lahko vnesete šele po začetku termina.", { startsAt: visit.slot.startsAt });
    }
    if (visit.report) throw new DomainError(ReportErrorCode.AlreadySubmitted, "Zapisnik za ta ogled je že oddan.");
    if (visit.outcome !== "PENDING") throw new DomainError(ReportErrorCode.VisitNotPending, "Ta ogled ni več dogovorjen (odpovedan ali zaključen).");

    const report = await tx.visitReport.create({
      data: { visitId: visit.id, authorId: volunteer.id, recommendation: input.recommendation, text: input.text, submittedAt: now },
    });
    await tx.visit.update({ where: { id: visit.id }, data: { outcome: "DONE" } });
    await applyTransition(tx, {
      application: visit.application,
      to: "VISIT_DONE",
      trigger: "visit-report",
      performer: { kind: "user", userId: volunteer.id, role: volunteer.role },
    });
    return report;
  });
}

/** Urejanje zapisnika: le avtor in le 24 ur po oddaji, nato je samo za branje (US-06 AC 4). */
export async function updateVisitReport(actor: Actor, raw: unknown, now = new Date()): Promise<VisitReport> {
  const input = parse(raw);
  return prisma.$transaction(async (tx) => {
    const volunteer = await requireRole(tx, actor, ["VOLUNTEER"], "Zapisnik lahko ureja le prostovoljec, ki ga je oddal.");
    const visit = await loadOwnVisit(tx, volunteer.id, input.visitId);
    if (!visit.report) throw new DomainError(ReportErrorCode.NotSubmitted, "Zapisnik še ni oddan.");
    if (visit.report.authorId !== volunteer.id) throw new DomainError(CommonErrorCode.Forbidden, "Zapisnik lahko ureja le njegov avtor.");
    if (!isReportEditable(visit.report, now)) {
      throw new DomainError(ReportErrorCode.Locked, "Zapisnik je mogoče urejati le 24 ur po oddaji; zdaj je samo za branje.");
    }
    return tx.visitReport.update({ where: { id: visit.report.id }, data: { recommendation: input.recommendation, text: input.text } });
  });
}
