import { beforeEach, describe, expect, it } from "vitest";
import { listFreeSlots } from "../../src/services/visits";
import { createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const now = new Date("2026-11-11T12:00:00Z");

let volunteer: { id: string };
const slot = (startOffsetMs: number, data: { isCancelled?: boolean } = {}) =>
  prisma.visitSlot.create({
    data: { startsAt: new Date(now.getTime() + startOffsetMs), endsAt: new Date(now.getTime() + startOffsetMs + HOUR / 2), volunteerId: volunteer.id, ...data },
  });

beforeEach(async () => {
  await resetDatabase();
  volunteer = await createUser("VOLUNTEER");
});

describe("listFreeSlots (US-05 AC 2, 3)", () => {
  it("vrne le proste prihodnje termine v naslednjih 14 dneh, razvrščene po času", async () => {
    const later = await slot(3 * DAY);
    const soon = await slot(2 * HOUR);
    await slot(-HOUR); // pretekel
    await slot(15 * DAY); // izven okna
    await slot(DAY, { isCancelled: true }); // preklican
    expect((await listFreeSlots(now)).map((s) => s.id)).toEqual([soon.id, later.id]);
  });

  it("vključi termin točno 14 dni vnaprej", async () => {
    const edge = await slot(14 * DAY);
    expect((await listFreeSlots(now)).map((s) => s.id)).toEqual([edge.id]);
  });

  it("zaseden termin ni prikazan, po odpovedi ogleda je spet prost", async () => {
    const manager = await createUser("MANAGER");
    const adopter = await createUser("ADOPTER");
    const app = await createApplication(adopter.id, (await createAnimal(manager.id)).id, "VISIT_SCHEDULED");
    const s = await slot(DAY);
    const visit = await prisma.visit.create({ data: { applicationId: app.id, slotId: s.id } });
    expect(await listFreeSlots(now)).toEqual([]);
    await prisma.visit.update({ where: { id: visit.id }, data: { outcome: "CANCELLED" } });
    expect((await listFreeSlots(now)).map((x) => x.id)).toEqual([s.id]);
  });

  it("vrne lokalni datum in uro zavetišča", async () => {
    await slot(DAY); // 2026-11-12T12:00Z = 13:00 v Ljubljani
    expect(await listFreeSlots(now)).toMatchObject([{ date: "2026-11-12", time: "13:00", startsAt: "2026-11-12T12:00:00.000Z" }]);
  });
});
