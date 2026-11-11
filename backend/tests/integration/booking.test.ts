import { beforeEach, describe, expect, it } from "vitest";
import { listApplicationEvents } from "../../src/services/applications";
import { bookVisit, getScheduledVisit, listFreeSlots } from "../../src/services/visits";
import { codeOf, createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;
let volunteer: { id: string };
let adopter: { id: string };
let animalId: string;

const slot = (inMs = DAY, data: { isCancelled?: boolean } = {}) =>
  prisma.visitSlot.create({
    data: { startsAt: new Date(Date.now() + inMs), endsAt: new Date(Date.now() + inMs + 30 * 60000), volunteerId: volunteer.id, ...data },
  });

beforeEach(async () => {
  await resetDatabase();
  const manager = await createUser("MANAGER");
  volunteer = await createUser("VOLUNTEER");
  adopter = await createUser("ADOPTER");
  animalId = (await createAnimal(manager.id)).id;
});

describe("bookVisit", () => {
  it("rezervira termin, vloga preide v »ogled dogovorjen« (US-05 AC 4)", async () => {
    const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
    const s = await slot();
    const visit = await bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: s.id });

    expect(visit).toMatchObject({ applicationId: app.id, slotId: s.id, outcome: "PENDING" });
    expect((await prisma.application.findUniqueOrThrow({ where: { id: app.id } })).status).toBe("VISIT_SCHEDULED");
    expect(await listApplicationEvents(prisma, app.id)).toMatchObject([{ fromStatus: "IN_REVIEW", toStatus: "VISIT_SCHEDULED", actor: { id: adopter.id } }]);
    expect(await getScheduledVisit(app.id)).toMatchObject({ startsAt: s.startsAt, address: expect.any(String) });
  });

  it("rezerviran termin drugim ni več prikazan med prostimi (AC 3)", async () => {
    const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
    const s = await slot();
    await bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: s.id });
    expect(await listFreeSlots()).toEqual([]);
  });

  it.each(["SUBMITTED", "VISIT_SCHEDULED", "VISIT_DONE", "APPROVED", "WITHDRAWN"] as const)(
    "pri vlogi v stanju %s rezervacija ni mogoča (AC 1)",
    async (status) => {
      const app = await createApplication(adopter.id, animalId, status);
      expect(await codeOf(async () => bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: (await slot()).id }))).toBe(
        "VISIT_APPLICATION_NOT_IN_REVIEW",
      );
      expect(await prisma.visit.count()).toBe(0);
    },
  );

  it("zaseden termin vrne »Termin je bil pravkar zaseden« (AC 5)", async () => {
    const other = await createUser("ADOPTER");
    const s = await slot();
    await bookVisit({ userId: other.id }, { applicationId: (await createApplication(other.id, animalId, "IN_REVIEW")).id, slotId: s.id });
    const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
    await expect(bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: s.id })).rejects.toMatchObject({
      code: "VISIT_SLOT_TAKEN",
      message: "Termin je bil pravkar zaseden. Izberite drug termin.",
    });
    expect((await prisma.application.findUniqueOrThrow({ where: { id: app.id } })).status).toBe("IN_REVIEW");
  });

  it.each([
    ["preklican", () => slot(DAY, { isCancelled: true })],
    ["pretekel", () => slot(-DAY)],
    ["izven 14 dni", () => slot(20 * DAY)],
  ])("%s termin ni na voljo (AC 2)", async (_, make) => {
    const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
    const s = await make();
    expect(await codeOf(() => bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: s.id }))).toBe("VISIT_SLOT_UNAVAILABLE");
  });

  it("posvojitelj ne more rezervirati za tujo vlogo", async () => {
    const other = await createUser("ADOPTER");
    const app = await createApplication(other.id, animalId, "IN_REVIEW");
    expect(await codeOf(async () => bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: (await slot()).id }))).toBe("NOT_FOUND");
  });

  it("po odpovedi ogleda je termin spet mogoče rezervirati", async () => {
    const other = await createUser("ADOPTER");
    const s = await slot();
    const first = await bookVisit({ userId: other.id }, { applicationId: (await createApplication(other.id, animalId, "IN_REVIEW")).id, slotId: s.id });
    await prisma.visit.update({ where: { id: first.id }, data: { outcome: "CANCELLED" } });
    const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
    expect((await bookVisit({ userId: adopter.id }, { applicationId: app.id, slotId: s.id })).outcome).toBe("PENDING");
  });
});
