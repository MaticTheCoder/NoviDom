import { beforeEach, describe, expect, it } from "vitest";
import { bookVisit } from "../../src/services/visits";
import { createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

// US-05 AC 5: če dva posvojitelja hkrati potrdita isti termin, uspe natanko eden,
// drugi dobi »Termin je bil pravkar zaseden«. Zaščito zagotavlja delni unikatni indeks
// visit_one_active_per_slot, ker preverjanje »je termin prost« v obeh transakcijah
// hkrati vrne »da«.

const DAY = 24 * 60 * 60 * 1000;
let volunteer: { id: string };
let animalId: string;

beforeEach(async () => {
  await resetDatabase();
  const manager = await createUser("MANAGER");
  volunteer = await createUser("VOLUNTEER");
  animalId = (await createAnimal(manager.id)).id;
});

async function contenders(n: number) {
  return Promise.all(
    Array.from({ length: n }, async () => {
      const adopter = await createUser("ADOPTER");
      const app = await createApplication(adopter.id, animalId, "IN_REVIEW");
      return { userId: adopter.id, applicationId: app.id };
    }),
  );
}

describe("sočasna rezervacija istega termina", () => {
  it.each([2, 5])("%i hkratnih rezervacij: uspe natanko ena, ostale dobijo »pravkar zaseden«", async (n) => {
    const slot = await prisma.visitSlot.create({
      data: { startsAt: new Date(Date.now() + DAY), endsAt: new Date(Date.now() + DAY + 30 * 60000), volunteerId: volunteer.id },
    });
    const people = await contenders(n);

    const results = await Promise.allSettled(people.map((p) => bookVisit({ userId: p.userId }, { applicationId: p.applicationId, slotId: slot.id })));

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(n - 1);
    for (const f of failed) {
      expect(f.reason).toMatchObject({ code: "VISIT_SLOT_TAKEN", message: expect.stringContaining("Termin je bil pravkar zaseden") });
    }

    // Baza: en neodpovedan ogled na terminu, ena vloga v »ogled dogovorjen«, ostale nespremenjene.
    expect(await prisma.visit.count({ where: { slotId: slot.id, outcome: { not: "CANCELLED" } } })).toBe(1);
    const statuses = await prisma.application.groupBy({ by: ["status"], _count: true });
    expect(Object.fromEntries(statuses.map((s) => [s.status, s._count]))).toEqual({ VISIT_SCHEDULED: 1, IN_REVIEW: n - 1 });
    // Zgodovina ima zapis le za uspešno rezervacijo.
    expect(await prisma.applicationEvent.count({ where: { toStatus: "VISIT_SCHEDULED" } })).toBe(1);
  });

  it("hkratni rezervaciji različnih terminov uspeta obe", async () => {
    const [a, b] = await contenders(2);
    const mk = (offset: number) =>
      prisma.visitSlot.create({
        data: { startsAt: new Date(Date.now() + offset), endsAt: new Date(Date.now() + offset + 30 * 60000), volunteerId: volunteer.id },
      });
    const [s1, s2] = await Promise.all([mk(DAY), mk(2 * DAY)]);
    const results = await Promise.allSettled([
      bookVisit({ userId: a.userId }, { applicationId: a.applicationId, slotId: s1.id }),
      bookVisit({ userId: b.userId }, { applicationId: b.applicationId, slotId: s2.id }),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });
});
