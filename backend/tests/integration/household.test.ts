import { beforeEach, describe, expect, it } from "vitest";
import { getMyHousehold, saveMyHousehold } from "../../src/services/households";
import { codeOf, createUser, prisma, resetDatabase } from "./helpers";

const valid = {
  housingType: "HOUSE",
  hasGarden: true,
  childrenAges: [8, 3],
  hasDogs: true,
  hasCats: false,
  hoursAlonePerDay: 4,
  experience: "  Odraščal s psi.  ",
};

let adopter: { id: string };
beforeEach(async () => {
  await resetDatabase();
  adopter = await createUser("ADOPTER");
});

describe("vprašalnik o gospodinjstvu", () => {
  it("posvojitelj brez vprašalnika dobi null", async () => {
    expect(await getMyHousehold({ userId: adopter.id })).toBeNull();
  });

  it("shrani vprašalnik in ga ob naslednjem branju vrne (vnaprej izpolnjen, US-02 AC 2)", async () => {
    await saveMyHousehold({ userId: adopter.id }, valid);
    expect(await getMyHousehold({ userId: adopter.id })).toMatchObject({
      housingType: "HOUSE",
      childrenAges: [3, 8],
      experience: "Odraščal s psi.",
    });
  });

  it("ponovno shranjevanje posodobi isti vprašalnik", async () => {
    await saveMyHousehold({ userId: adopter.id }, valid);
    await saveMyHousehold({ userId: adopter.id }, { ...valid, childrenAges: [], hoursAlonePerDay: 9 });
    expect(await prisma.household.count()).toBe(1);
    expect(await getMyHousehold({ userId: adopter.id })).toMatchObject({ childrenAges: [], hoursAlonePerDay: 9 });
  });

  it.each([
    [{ housingType: undefined }, "housingType"],
    [{ hasGarden: undefined }, "hasGarden"],
    [{ childrenAges: [4, 18] }, "childrenAges.1"],
    [{ childrenAges: [2.5] }, "childrenAges.0"],
    [{ hoursAlonePerDay: 25 }, "hoursAlonePerDay"],
  ])("neveljavni podatki %j → napaka pri %s", async (patch, field) => {
    await expect(saveMyHousehold({ userId: adopter.id }, { ...valid, ...patch })).rejects.toMatchObject({
      code: "HOUSEHOLD_VALIDATION",
      details: { fieldErrors: { [field]: expect.any(String) } },
    });
  });

  it("vprašalnik izpolni le posvojitelj", async () => {
    const volunteer = await createUser("VOLUNTEER");
    expect(await codeOf(() => saveMyHousehold({ userId: volunteer.id }, valid))).toBe("FORBIDDEN");
  });
});
