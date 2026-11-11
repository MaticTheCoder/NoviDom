import { beforeEach, describe, expect, it } from "vitest";
import { getApplicationForManager, getMyApplication, listMyApplications } from "../../src/services/applications";
import { submitVisitReport } from "../../src/services/visits";
import { createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

// US-06 AC 5: zapisnik je viden vodji na podrobnosti vloge, posvojitelj pa ga nikoli ne vidi.
const SECRET = "Kandidat je bil do živali grob, ne priporočam.";
let manager: { id: string };
let adopter: { id: string };
let applicationId: string;

beforeEach(async () => {
  await resetDatabase();
  manager = await createUser("MANAGER");
  adopter = await createUser("ADOPTER");
  const volunteer = await createUser("VOLUNTEER", { name: "Luka Prostovoljec" });
  const app = await createApplication(adopter.id, (await createAnimal(manager.id)).id, "VISIT_SCHEDULED");
  applicationId = app.id;
  const startsAt = new Date(Date.now() - 60 * 60 * 1000);
  const slot = await prisma.visitSlot.create({ data: { startsAt, endsAt: new Date(startsAt.getTime() + 30 * 60000), volunteerId: volunteer.id } });
  const visit = await prisma.visit.create({ data: { applicationId: app.id, slotId: slot.id } });
  await submitVisitReport({ userId: volunteer.id }, { visitId: visit.id, recommendation: "NOT_RECOMMEND", text: SECRET });
});

describe("vidnost zapisnika (US-06 AC 5)", () => {
  it("vodja vidi zapisnik, priporočilo in avtorja na podrobnosti vloge", async () => {
    const app = await getApplicationForManager({ userId: manager.id }, applicationId);
    expect(app.visits).toMatchObject([
      { outcome: "DONE", report: { recommendation: "NOT_RECOMMEND", text: SECRET, author: { name: "Luka Prostovoljec" } } },
    ]);
  });

  it("posvojitelj zapisnika ne dobi niti na podrobnosti niti v seznamu", async () => {
    const detail = await getMyApplication({ userId: adopter.id }, applicationId);
    const list = await listMyApplications({ userId: adopter.id });
    for (const payload of [detail, list]) {
      const json = JSON.stringify(payload);
      expect(json).not.toContain(SECRET);
      expect(json).not.toContain("NOT_RECOMMEND");
      expect(json).not.toContain("Luka Prostovoljec");
    }
    expect(detail).not.toHaveProperty("visits");
    expect(detail).not.toHaveProperty("report");
  });

  it("posvojitelj ne more poklicati pogleda za vodjo", async () => {
    await expect(getApplicationForManager({ userId: adopter.id }, applicationId)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
