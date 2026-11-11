import { beforeEach, describe, expect, it } from "vitest";
import { listApplicationEvents, parseHouseholdSnapshot, submitApplication } from "../../src/services/applications";
import { saveMyHousehold } from "../../src/services/households";
import { parseMatchWarnings } from "../../src/services/matching";
import { codeOf, createAnimal, createApplication, createUser, prisma, resetDatabase } from "./helpers";

const HOUSEHOLD = {
  housingType: "APARTMENT",
  hasGarden: false,
  childrenAges: [4],
  hasDogs: false,
  hasCats: false,
  hoursAlonePerDay: 5,
  experience: "Prvi pes.",
};
const MOTIVATION = "Imamo veliko časa za sprehode.";

let manager: { id: string };
let adopter: { id: string };

beforeEach(async () => {
  await resetDatabase();
  manager = await createUser("MANAGER");
  adopter = await createUser("ADOPTER");
  await saveMyHousehold({ userId: adopter.id }, HOUSEHOLD);
});

const submit = (animalId: string, userId = adopter.id, motivation = MOTIVATION) => submitApplication({ userId }, { animalId, motivation });

describe("submitApplication", () => {
  it("odda vlogo v stanju »oddana« s kopijo vprašalnika in prvim dogodkom (US-02 AC 5)", async () => {
    const animal = await createAnimal(manager.id);
    const app = await submit(animal.id);

    expect(app).toMatchObject({ status: "SUBMITTED", adopterId: adopter.id, animalId: animal.id, motivation: MOTIVATION, closedAt: null });
    expect(parseHouseholdSnapshot(app.householdSnapshot)).toMatchObject({ housingType: "APARTMENT", childrenAges: [4], hoursAlonePerDay: 5 });
    expect(await listApplicationEvents(prisma, app.id)).toMatchObject([
      { fromStatus: null, toStatus: "SUBMITTED", actor: { id: adopter.id } },
    ]);
  });

  it("kasnejša sprememba vprašalnika ne spremeni oddane vloge (ADR-0008)", async () => {
    const app = await submit((await createAnimal(manager.id)).id);
    await saveMyHousehold({ userId: adopter.id }, { ...HOUSEHOLD, childrenAges: [], hasGarden: true });
    const stored = await prisma.application.findUniqueOrThrow({ where: { id: app.id } });
    expect(parseHouseholdSnapshot(stored.householdSnapshot)).toMatchObject({ childrenAges: [4], hasGarden: false });
  });

  it("izračuna in shrani oceno ujemanja z opozorili (US-03)", async () => {
    const animal = await createAnimal(manager.id, { name: "Rex", goodWithKids: "OVER_6", needsGarden: true });
    const app = await submit(animal.id);
    expect(app.matchLevel).toBe("MISMATCH");
    expect(parseMatchWarnings(app.matchWarnings).map((w) => w.trigger)).toEqual(["V gospodinjstvu: otrok, star 4 leta", "Bivanje: brez vrta"]);
  });

  it("brez opozoril je ocena Ujemanje", async () => {
    const app = await submit((await createAnimal(manager.id)).id);
    expect(app).toMatchObject({ matchLevel: "MATCH", matchWarnings: [] });
  });

  describe("status živali", () => {
    it.each(["INTAKE", "RESERVED", "ADOPTED"] as const)("za žival s statusom %s vloge ni mogoče oddati", async (status) => {
      const animal = await createAnimal(manager.id, { status });
      expect(await codeOf(() => submit(animal.id))).toBe("APPLICATION_ANIMAL_NOT_AVAILABLE");
      expect(await prisma.application.count()).toBe(0);
    });

    it("neobstoječa žival → NOT_FOUND", async () => {
      expect(await codeOf(() => submit("00000000-0000-4000-8000-000000000000"))).toBe("NOT_FOUND");
    });
  });

  describe("podvojena aktivna vloga (US-02 AC 3)", () => {
    it("druga vloga za isto žival ni oddana; napaka vsebuje obstoječo vlogo", async () => {
      const animal = await createAnimal(manager.id);
      const first = await submit(animal.id);
      await expect(submit(animal.id)).rejects.toMatchObject({
        code: "APPLICATION_ALREADY_ACTIVE",
        message: "Za to žival že imate aktivno vlogo.",
        details: { applicationId: first.id },
      });
      expect(await prisma.application.count()).toBe(1);
    });

    it.each(["IN_REVIEW", "VISIT_SCHEDULED", "VISIT_DONE", "APPROVED"] as const)("velja tudi, če je obstoječa vloga v stanju %s", async (status) => {
      const animal = await createAnimal(manager.id);
      await createApplication(adopter.id, animal.id, status);
      expect(await codeOf(() => submit(animal.id))).toBe("APPLICATION_ALREADY_ACTIVE");
    });

    it.each(["WITHDRAWN", "REJECTED"] as const)("po zaprti vlogi (%s) je nova vloga za isto žival mogoča", async (status) => {
      const animal = await createAnimal(manager.id);
      await createApplication(adopter.id, animal.id, status);
      expect((await submit(animal.id)).status).toBe("SUBMITTED");
    });

    it("vloga drugega posvojitelja za isto žival ne ovira oddaje", async () => {
      const animal = await createAnimal(manager.id);
      const other = await createUser("ADOPTER");
      await createApplication(other.id, animal.id);
      expect((await submit(animal.id)).status).toBe("SUBMITTED");
    });
  });

  describe("največ 3 aktivne vloge (US-02 AC 4)", () => {
    it("četrta aktivna vloga ni oddana; sporočilo navaja, da je treba eno umakniti", async () => {
      for (let i = 0; i < 3; i++) await submit((await createAnimal(manager.id, { name: `Žival ${i}` })).id);
      const fourth = await createAnimal(manager.id, { name: "Četrta" });
      await expect(submit(fourth.id)).rejects.toMatchObject({
        code: "APPLICATION_TOO_MANY_ACTIVE",
        message: expect.stringContaining("umaknite"),
        details: { activeCount: 3, max: 3 },
      });
    });

    it("zaprte vloge se ne štejejo", async () => {
      for (const status of ["WITHDRAWN", "REJECTED", "ADOPTED"] as const) {
        await createApplication(adopter.id, (await createAnimal(manager.id)).id, status);
      }
      await createApplication(adopter.id, (await createAnimal(manager.id)).id, "IN_REVIEW");
      await createApplication(adopter.id, (await createAnimal(manager.id)).id, "APPROVED");
      expect((await submit((await createAnimal(manager.id)).id)).status).toBe("SUBMITTED");
    });

    it("sočasne oddaje ne presežejo omejitve", async () => {
      await createApplication(adopter.id, (await createAnimal(manager.id)).id);
      await createApplication(adopter.id, (await createAnimal(manager.id)).id);
      const animals = await Promise.all([0, 1, 2].map((i) => createAnimal(manager.id, { name: `S${i}` })));
      const results = await Promise.allSettled(animals.map((a) => submit(a.id)));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await prisma.application.count({ where: { adopterId: adopter.id } })).toBe(3);
    });
  });

  it("sočasna dvojna oddaja za isto žival ustvari le eno vlogo", async () => {
    const animal = await createAnimal(manager.id);
    const results = await Promise.allSettled([submit(animal.id), submit(animal.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason).toMatchObject({
      code: "APPLICATION_ALREADY_ACTIVE",
    });
  });

  it("brez vprašalnika vloge ni mogoče oddati (US-02 AC 2)", async () => {
    const newcomer = await createUser("ADOPTER");
    expect(await codeOf(async () => submit((await createAnimal(manager.id)).id, newcomer.id))).toBe("APPLICATION_HOUSEHOLD_REQUIRED");
  });

  it("vlogo odda le posvojitelj", async () => {
    const volunteer = await createUser("VOLUNTEER");
    expect(await codeOf(async () => submit((await createAnimal(manager.id)).id, volunteer.id))).toBe("FORBIDDEN");
  });

  it("motivacija je obvezna", async () => {
    await expect(submit((await createAnimal(manager.id)).id, adopter.id, "   ")).rejects.toMatchObject({
      code: "APPLICATION_VALIDATION",
      details: { fieldErrors: { motivation: expect.any(String) } },
    });
  });
});
