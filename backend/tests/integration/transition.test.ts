import { beforeEach, describe, expect, it } from "vitest";
import { listApplicationEvents, transitionApplication } from "../../src/services/applications";
import { codeOf, createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

let manager: { id: string };
let adopter: { id: string };
let other: { id: string };
let animal: { id: string };

beforeEach(async () => {
  await resetDatabase();
  manager = await createUser("MANAGER");
  adopter = await createUser("ADOPTER");
  other = await createUser("ADOPTER");
  animal = await createAnimal(manager.id);
});

const asManager = () => ({ userId: manager.id });
const animalStatus = async () => (await prisma.animal.findUniqueOrThrow({ where: { id: animal.id } })).status;

describe("transitionApplication", () => {
  it("vodja prevzame vlogo v pregled; prehod se zabeleži z izvajalcem (US-04 AC 5)", async () => {
    const app = await createApplication(adopter.id, animal.id);
    const result = await transitionApplication(asManager(), { applicationId: app.id, to: "IN_REVIEW" });
    expect(result.status).toBe("IN_REVIEW");
    const events = await listApplicationEvents(prisma, app.id);
    expect(events).toMatchObject([{ fromStatus: "SUBMITTED", toStatus: "IN_REVIEW", actor: { id: manager.id } }]);
  });

  it("nedovoljen prehod ne spremeni ničesar", async () => {
    const app = await createApplication(adopter.id, animal.id, "IN_REVIEW");
    expect(await codeOf(() => transitionApplication(asManager(), { applicationId: app.id, to: "APPROVED" }))).toBe(
      "APPLICATION_TRANSITION_NOT_ALLOWED",
    );
    expect((await prisma.application.findUniqueOrThrow({ where: { id: app.id } })).status).toBe("IN_REVIEW");
    expect(await prisma.applicationEvent.count()).toBe(0);
  });

  it("posvojitelj ne more prevzeti vloge v pregled", async () => {
    const app = await createApplication(adopter.id, animal.id);
    expect(await codeOf(() => transitionApplication({ userId: adopter.id }, { applicationId: app.id, to: "IN_REVIEW" }))).toBe(
      "APPLICATION_TRANSITION_NOT_ALLOWED",
    );
  });

  it("prostovoljec ne more izvajati prehodov z gumbi", async () => {
    const volunteer = await createUser("VOLUNTEER");
    const app = await createApplication(adopter.id, animal.id);
    expect(await codeOf(() => transitionApplication({ userId: volunteer.id }, { applicationId: app.id, to: "IN_REVIEW" }))).toBe(
      "FORBIDDEN",
    );
  });

  it("deaktiviran vodja ne more izvesti prehoda", async () => {
    await prisma.user.update({ where: { id: manager.id }, data: { isActive: false } });
    const app = await createApplication(adopter.id, animal.id);
    expect(await codeOf(() => transitionApplication(asManager(), { applicationId: app.id, to: "IN_REVIEW" }))).toBe("FORBIDDEN");
  });

  describe("zavrnitev (US-04 AC 4)", () => {
    it("brez komentarja z vsaj 10 znaki ni mogoča", async () => {
      const app = await createApplication(adopter.id, animal.id);
      for (const comment of [undefined, "", "prekratko", "         x"]) {
        expect(await codeOf(() => transitionApplication(asManager(), { applicationId: app.id, to: "REJECTED", comment }))).toBe(
          "APPLICATION_COMMENT_REQUIRED",
        );
      }
    });

    it("s komentarjem zapre vlogo in shrani utemeljitev", async () => {
      const app = await createApplication(adopter.id, animal.id, "IN_REVIEW");
      const comment = "Gospodinjstvo nima dovolj prostora.";
      const result = await transitionApplication(asManager(), { applicationId: app.id, to: "REJECTED", comment });
      expect(result).toMatchObject({ status: "REJECTED", decisionComment: comment });
      expect(result.closedAt).toBeInstanceOf(Date);
      expect(await listApplicationEvents(prisma, app.id)).toMatchObject([{ toStatus: "REJECTED", comment }]);
    });
  });

  describe("odobritev (US-04 AC 2, 3)", () => {
    it("iz »ogled opravljen« odobri vlogo in rezervira žival", async () => {
      const app = await createApplication(adopter.id, animal.id, "VISIT_DONE");
      await transitionApplication(asManager(), { applicationId: app.id, to: "APPROVED" });
      expect(await animalStatus()).toBe("RESERVED");
    });

    it("druge vloge za isto žival ni mogoče odobriti; napaka vsebuje odobreno vlogo", async () => {
      const first = await createApplication(adopter.id, animal.id, "VISIT_DONE");
      const second = await createApplication(other.id, animal.id, "VISIT_DONE");
      await transitionApplication(asManager(), { applicationId: first.id, to: "APPROVED" });
      await expect(transitionApplication(asManager(), { applicationId: second.id, to: "APPROVED" })).rejects.toMatchObject({
        code: "APPLICATION_ANOTHER_APPROVED",
        details: { approvedApplicationId: first.id },
      });
      expect((await prisma.application.findUniqueOrThrow({ where: { id: second.id } })).status).toBe("VISIT_DONE");
    });

    it("sočasni odobritvi dveh vlog: uspe natanko ena", async () => {
      const a = await createApplication(adopter.id, animal.id, "VISIT_DONE");
      const b = await createApplication(other.id, animal.id, "VISIT_DONE");
      const results = await Promise.allSettled([
        transitionApplication(asManager(), { applicationId: a.id, to: "APPROVED" }),
        transitionApplication(asManager(), { applicationId: b.id, to: "APPROVED" }),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
      expect(rejected.reason).toMatchObject({ code: "APPLICATION_ANOTHER_APPROVED" });
      expect(await prisma.application.count({ where: { status: "APPROVED" } })).toBe(1);
    });

    it("umik odobritve vrne vlogo v »ogled opravljen« in žival v »na voljo«", async () => {
      const app = await createApplication(adopter.id, animal.id, "VISIT_DONE");
      await transitionApplication(asManager(), { applicationId: app.id, to: "APPROVED", comment: "Primeren kandidat." });
      const result = await transitionApplication(asManager(), {
        applicationId: app.id,
        to: "VISIT_DONE",
        comment: "Kandidat se je premislil o terminu.",
      });
      expect(result).toMatchObject({ status: "VISIT_DONE", decisionComment: null, closedAt: null });
      expect(await animalStatus()).toBe("AVAILABLE");
    });
  });

  describe("umik vloge s strani posvojitelja", () => {
    it("lastnik umakne svojo vlogo", async () => {
      const app = await createApplication(adopter.id, animal.id, "IN_REVIEW");
      const result = await transitionApplication({ userId: adopter.id }, { applicationId: app.id, to: "WITHDRAWN" });
      expect(result.status).toBe("WITHDRAWN");
      expect(result.closedAt).toBeInstanceOf(Date);
    });

    it("tuje vloge ne vidi in ne more umakniti", async () => {
      const app = await createApplication(adopter.id, animal.id);
      expect(await codeOf(() => transitionApplication({ userId: other.id }, { applicationId: app.id, to: "WITHDRAWN" }))).toBe(
        "NOT_FOUND",
      );
    });

    it("umik odobrene vloge sprosti žival", async () => {
      const app = await createApplication(adopter.id, animal.id, "VISIT_DONE");
      await transitionApplication(asManager(), { applicationId: app.id, to: "APPROVED" });
      await transitionApplication({ userId: adopter.id }, { applicationId: app.id, to: "WITHDRAWN" });
      expect(await animalStatus()).toBe("AVAILABLE");
    });
  });

  it("zgodovine ni mogoče urejati ali brisati (US-04 AC 5)", async () => {
    const app = await createApplication(adopter.id, animal.id);
    await transitionApplication(asManager(), { applicationId: app.id, to: "IN_REVIEW" });
    await expect(prisma.applicationEvent.updateMany({ data: { comment: "spremenjeno" } })).rejects.toThrow();
    await expect(prisma.applicationEvent.deleteMany()).rejects.toThrow();
    expect(await prisma.applicationEvent.count()).toBe(1);
  });
});
