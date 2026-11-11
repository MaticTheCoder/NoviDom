import { beforeEach, describe, expect, it } from "vitest";
import { listApplicationEvents } from "../../src/services/applications";
import { isReportEditable, reportEditableUntil, submitVisitReport, updateVisitReport } from "../../src/services/visits";
import { codeOf, createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

const HOUR = 60 * 60 * 1000;
const start = new Date("2026-11-20T09:00:00Z");
const afterStart = new Date(start.getTime() + HOUR);
const TEXT = "Kandidat je bil miren, žival se mu je hitro približala.";

let volunteer: { id: string };
let other: { id: string };
let applicationId: string;
let visitId: string;

beforeEach(async () => {
  await resetDatabase();
  const manager = await createUser("MANAGER");
  volunteer = await createUser("VOLUNTEER");
  other = await createUser("VOLUNTEER");
  const adopter = await createUser("ADOPTER");
  const app = await createApplication(adopter.id, (await createAnimal(manager.id)).id, "VISIT_SCHEDULED");
  const slot = await prisma.visitSlot.create({ data: { startsAt: start, endsAt: new Date(start.getTime() + HOUR / 2), volunteerId: volunteer.id } });
  applicationId = app.id;
  visitId = (await prisma.visit.create({ data: { applicationId: app.id, slotId: slot.id } })).id;
});

const valid = () => ({ visitId, recommendation: "RECOMMEND", text: TEXT });
const submit = (userId = volunteer.id, raw: object = valid(), now = afterStart) => submitVisitReport({ userId }, raw, now);

describe("pravice dostopa (US-06 AC 1)", () => {
  it("zapisnik odda prostovoljec, ki mu je termin dodeljen", async () => {
    expect(await submit()).toMatchObject({ visitId, authorId: volunteer.id, recommendation: "RECOMMEND", text: TEXT });
  });

  it("drug prostovoljec ogleda ne vidi (NOT_FOUND)", async () => {
    expect(await codeOf(() => submit(other.id))).toBe("NOT_FOUND");
  });

  it.each(["MANAGER", "ADOPTER"] as const)("%s zapisnika ne more oddati", async (role) => {
    const user = await createUser(role);
    expect(await codeOf(() => submit(user.id))).toBe("FORBIDDEN");
  });

  it("deaktiviran prostovoljec zapisnika ne more oddati", async () => {
    await prisma.user.update({ where: { id: volunteer.id }, data: { isActive: false } });
    expect(await codeOf(() => submit())).toBe("FORBIDDEN");
  });

  it("pred začetkom termina zapisnika ni mogoče oddati; točno ob začetku je mogoče", async () => {
    expect(await codeOf(() => submit(volunteer.id, valid(), new Date(start.getTime() - 1)))).toBe("REPORT_TOO_EARLY");
    expect((await submit(volunteer.id, valid(), start)).visitId).toBe(visitId);
  });
});

describe("validacija (US-06 AC 2)", () => {
  it.each([
    [{ recommendation: undefined }, "recommendation"],
    [{ recommendation: "MOGOCE" }, "recommendation"],
    [{ text: "a".repeat(19) }, "text"],
    [{ text: `   ${"a".repeat(18)}   ` }, "text"],
  ])("%j → napaka pri %s, nič se ne shrani", async (patch, field) => {
    await expect(submit(volunteer.id, { ...valid(), ...patch })).rejects.toMatchObject({
      code: "REPORT_VALIDATION",
      details: { fieldErrors: { [field]: expect.any(String) } },
    });
    expect(await prisma.visitReport.count()).toBe(0);
  });

  it("natanko 20 znakov zadošča", async () => {
    expect((await submit(volunteer.id, { ...valid(), text: "a".repeat(20) })).text).toHaveLength(20);
  });

  it.each(["RECOMMEND", "WITH_RESERVATIONS", "NOT_RECOMMEND"] as const)("sprejme priporočilo %s", async (recommendation) => {
    expect((await submit(volunteer.id, { ...valid(), recommendation })).recommendation).toBe(recommendation);
  });
});

describe("prehod stanja vloge (US-06 AC 3)", () => {
  it("ob oddaji vloga preide v »ogled opravljen«, ogled v DONE, prehod je v zgodovini", async () => {
    await submit();
    expect((await prisma.application.findUniqueOrThrow({ where: { id: applicationId } })).status).toBe("VISIT_DONE");
    expect((await prisma.visit.findUniqueOrThrow({ where: { id: visitId } })).outcome).toBe("DONE");
    expect(await listApplicationEvents(prisma, applicationId)).toMatchObject([
      { fromStatus: "VISIT_SCHEDULED", toStatus: "VISIT_DONE", actor: { id: volunteer.id } },
    ]);
  });

  it("zapisnika ni mogoče oddati dvakrat", async () => {
    await submit();
    expect(await codeOf(() => submit())).toBe("REPORT_ALREADY_SUBMITTED");
  });

  it("odpovedanega ogleda ni mogoče zapisati", async () => {
    await prisma.visit.update({ where: { id: visitId }, data: { outcome: "CANCELLED" } });
    expect(await codeOf(() => submit())).toBe("REPORT_VISIT_NOT_PENDING");
  });

  it("če je vloga medtem umaknjena, se ne shrani nič (transakcija)", async () => {
    await prisma.application.update({ where: { id: applicationId }, data: { status: "WITHDRAWN" } });
    expect(await codeOf(() => submit())).toBe("APPLICATION_TRANSITION_NOT_ALLOWED");
    expect(await prisma.visitReport.count()).toBe(0);
    expect((await prisma.visit.findUniqueOrThrow({ where: { id: visitId } })).outcome).toBe("PENDING");
  });
});

describe("24-urno okno za urejanje (US-06 AC 4)", () => {
  const edit = (now: Date, userId = volunteer.id) =>
    updateVisitReport({ userId }, { ...valid(), recommendation: "WITH_RESERVATIONS", text: `${TEXT} Dopolnitev.` }, now);

  it("urejanje znotraj 24 ur spremeni zapisnik, čas oddaje ostane", async () => {
    const report = await submit();
    const updated = await edit(new Date(afterStart.getTime() + 23 * HOUR));
    expect(updated).toMatchObject({ recommendation: "WITH_RESERVATIONS", submittedAt: report.submittedAt });
  });

  it("točno 24 ur po oddaji je urejanje še mogoče, milisekundo kasneje ne", async () => {
    await submit();
    expect((await edit(new Date(afterStart.getTime() + 24 * HOUR))).recommendation).toBe("WITH_RESERVATIONS");
    expect(await codeOf(() => edit(new Date(afterStart.getTime() + 24 * HOUR + 1)))).toBe("REPORT_LOCKED");
  });

  it("po 24 urah zapisnik ostane nespremenjen", async () => {
    await submit();
    await codeOf(() => edit(new Date(afterStart.getTime() + 48 * HOUR)));
    expect(await prisma.visitReport.findUniqueOrThrow({ where: { visitId } })).toMatchObject({ recommendation: "RECOMMEND", text: TEXT });
  });

  it("drug prostovoljec zapisnika ne more urejati", async () => {
    await submit();
    expect(await codeOf(() => edit(afterStart, other.id))).toBe("NOT_FOUND");
  });

  it("urejanje neoddanega zapisnika ni mogoče", async () => {
    expect(await codeOf(() => edit(afterStart))).toBe("REPORT_NOT_SUBMITTED");
  });

  it("isReportEditable in reportEditableUntil", () => {
    const report = { submittedAt: afterStart };
    expect(reportEditableUntil(report).toISOString()).toBe(new Date(afterStart.getTime() + 24 * HOUR).toISOString());
    expect(isReportEditable(report, new Date(afterStart.getTime() + 24 * HOUR))).toBe(true);
    expect(isReportEditable(report, new Date(afterStart.getTime() + 24 * HOUR + 1))).toBe(false);
  });
});
