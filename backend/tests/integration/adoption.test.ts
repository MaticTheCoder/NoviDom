import { beforeEach, describe, expect, it } from "vitest";
import { ADOPTED_REJECTION_REASON, completeAdoption, getAdoptionPreview, listApplicationEvents } from "../../src/services/applications";
import { codeOf, createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

let manager: { id: string };
let animalId: string;

beforeEach(async () => {
  await resetDatabase();
  manager = await createUser("MANAGER");
  animalId = (await createAnimal(manager.id, { status: "RESERVED" })).id;
});

const adopterApp = async (status: Parameters<typeof createApplication>[2], animal = animalId) =>
  createApplication((await createUser("ADOPTER")).id, animal, status);
const statusOf = async (id: string) => (await prisma.application.findUniqueOrThrow({ where: { id } })).status;

describe("completeAdoption (US-07)", () => {
  it("vloga in žival postaneta posvojeni, ostale aktivne vloge zavrnjene z razlogom (AC 3)", async () => {
    const approved = await adopterApp("APPROVED");
    const others = await Promise.all((["SUBMITTED", "IN_REVIEW", "VISIT_SCHEDULED", "VISIT_DONE"] as const).map((s) => adopterApp(s)));
    const closed = await adopterApp("WITHDRAWN");
    const otherAnimal = await adopterApp("SUBMITTED", (await createAnimal(manager.id)).id);

    const { application, rejectedCount } = await completeAdoption({ userId: manager.id }, approved.id);

    expect(application).toMatchObject({ status: "ADOPTED", closedAt: expect.any(Date) });
    expect(rejectedCount).toBe(4);
    expect((await prisma.animal.findUniqueOrThrow({ where: { id: animalId } })).status).toBe("ADOPTED");
    for (const o of others) {
      expect(await prisma.application.findUniqueOrThrow({ where: { id: o.id } })).toMatchObject({
        status: "REJECTED",
        decisionComment: ADOPTED_REJECTION_REASON,
        closedAt: expect.any(Date),
      });
    }
    expect(await statusOf(closed.id)).toBe("WITHDRAWN");
    expect(await statusOf(otherAnimal.id)).toBe("SUBMITTED");
  });

  it("samodejne zavrnitve so v zgodovini zabeležene brez izvajalca (AC 5)", async () => {
    const approved = await adopterApp("APPROVED");
    const other = await adopterApp("IN_REVIEW");
    await completeAdoption({ userId: manager.id }, approved.id);

    expect(await listApplicationEvents(prisma, other.id)).toMatchObject([
      { fromStatus: "IN_REVIEW", toStatus: "REJECTED", actor: null, comment: ADOPTED_REJECTION_REASON },
    ]);
    expect(await listApplicationEvents(prisma, approved.id)).toMatchObject([{ fromStatus: "APPROVED", toStatus: "ADOPTED", actor: { id: manager.id } }]);
  });

  it("dogovorjeni ogledi zavrnjenih vlog se odpovejo", async () => {
    const approved = await adopterApp("APPROVED");
    const other = await adopterApp("VISIT_SCHEDULED");
    const volunteer = await createUser("VOLUNTEER");
    const slot = await prisma.visitSlot.create({
      data: { startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 86400000 + 1800000), volunteerId: volunteer.id },
    });
    const visit = await prisma.visit.create({ data: { applicationId: other.id, slotId: slot.id } });
    await completeAdoption({ userId: manager.id }, approved.id);
    expect((await prisma.visit.findUniqueOrThrow({ where: { id: visit.id } })).outcome).toBe("CANCELLED");
  });

  it.each(["SUBMITTED", "IN_REVIEW", "VISIT_DONE", "REJECTED", "ADOPTED"] as const)("vloge v stanju %s ni mogoče zaključiti (AC 1)", async (status) => {
    const app = await adopterApp(status);
    expect(await codeOf(() => completeAdoption({ userId: manager.id }, app.id))).toBe("ADOPTION_NOT_APPROVED");
  });

  it("zaključi lahko le vodja", async () => {
    const approved = await adopterApp("APPROVED");
    const volunteer = await createUser("VOLUNTEER");
    expect(await codeOf(() => completeAdoption({ userId: volunteer.id }, approved.id))).toBe("FORBIDDEN");
    expect(await statusOf(approved.id)).toBe("APPROVED");
  });

  it("predogled vrne število ostalih aktivnih vlog (AC 2)", async () => {
    const approved = await adopterApp("APPROVED");
    await adopterApp("SUBMITTED");
    await adopterApp("VISIT_DONE");
    await adopterApp("REJECTED");
    expect(await getAdoptionPreview({ userId: manager.id }, approved.id)).toEqual({ status: "APPROVED", otherActiveCount: 2 });
  });
});
