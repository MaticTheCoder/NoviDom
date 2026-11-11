import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { completeAdoption } from "../../src/services/applications";
import { createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

// US-07 AC 4: če katerakoli sprememba ob zaključku posvojitve ne uspe, se ne izvede nobena
// (žival ne ostane »posvojena« ob odprtih vlogah). Napako simuliramo s sprožilcem v bazi,
// ki zavrne posodobitev izbrane vloge, ko so prejšnje spremembe v transakciji že izvedene.

async function failWhenRejecting(applicationId: string) {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION test_fail_adoption() RETURNS trigger AS $$
    BEGIN
      IF NEW.id = '${applicationId}'::uuid AND NEW.status = 'REJECTED' THEN
        RAISE EXCEPTION 'simulirana napaka pri zavrnitvi vloge';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql`);
  await prisma.$executeRawUnsafe(
    `CREATE TRIGGER test_fail_adoption BEFORE UPDATE ON "Application" FOR EACH ROW EXECUTE FUNCTION test_fail_adoption()`,
  );
}

async function snapshot(animalId: string) {
  return {
    animal: (await prisma.animal.findUniqueOrThrow({ where: { id: animalId } })).status,
    applications: (await prisma.application.findMany({ orderBy: { submittedAt: "asc" }, select: { id: true, status: true, decisionComment: true, closedAt: true } })),
    events: await prisma.applicationEvent.count(),
    visits: (await prisma.visit.findMany({ select: { id: true, outcome: true } })),
  };
}

let manager: { id: string };
let animalId: string;

beforeEach(async () => {
  await resetDatabase();
  manager = await createUser("MANAGER");
  animalId = (await createAnimal(manager.id, { status: "RESERVED" })).id;
});

afterEach(async () => {
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_fail_adoption ON "Application"`);
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS test_fail_adoption()`);
});

const app = async (status: Parameters<typeof createApplication>[2], offsetMs: number) =>
  createApplication((await createUser("ADOPTER")).id, animalId, status, { submittedAt: new Date(Date.now() - offsetMs) });

describe("atomarnost zaključka posvojitve (US-07 AC 4)", () => {
  it("napaka pri zadnji samodejni zavrnitvi razveljavi vse: vlogo, žival, ostale zavrnitve, zgodovino in ogled", async () => {
    const approved = await app("APPROVED", 50_000);
    await app("SUBMITTED", 40_000);
    const scheduled = await app("VISIT_SCHEDULED", 30_000);
    const last = await app("IN_REVIEW", 20_000); // zavrne se zadnja (razvrščeno po času oddaje)
    const volunteer = await createUser("VOLUNTEER");
    const slot = await prisma.visitSlot.create({
      data: { startsAt: new Date(Date.now() + 86_400_000), endsAt: new Date(Date.now() + 88_200_000), volunteerId: volunteer.id },
    });
    await prisma.visit.create({ data: { applicationId: scheduled.id, slotId: slot.id } });

    const before = await snapshot(animalId);
    await failWhenRejecting(last.id);

    await expect(completeAdoption({ userId: manager.id }, approved.id)).rejects.toThrow(/simulirana napaka/);

    const after = await snapshot(animalId);
    expect(after).toEqual(before);
    expect(after.animal).toBe("RESERVED"); // žival ni ostala »posvojena«
    expect(after.applications.find((a) => a.id === approved.id)?.status).toBe("APPROVED");
    expect(after.applications.filter((a) => a.status === "REJECTED")).toEqual([]);
    expect(after.events).toBe(0);
  });

  it("po odpravi napake zaključek uspe v celoti", async () => {
    const approved = await app("APPROVED", 30_000);
    const other = await app("SUBMITTED", 20_000);
    await failWhenRejecting(other.id);
    await expect(completeAdoption({ userId: manager.id }, approved.id)).rejects.toThrow();

    await prisma.$executeRawUnsafe(`DROP TRIGGER test_fail_adoption ON "Application"`);
    const { rejectedCount } = await completeAdoption({ userId: manager.id }, approved.id);
    expect(rejectedCount).toBe(1);
    expect((await prisma.animal.findUniqueOrThrow({ where: { id: animalId } })).status).toBe("ADOPTED");
  });
});
