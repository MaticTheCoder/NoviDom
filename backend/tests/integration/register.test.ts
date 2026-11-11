import { beforeEach, describe, expect, it } from "vitest";
import { verifyPassword } from "../../src/auth/password";
import { registerAdopter } from "../../src/services/users";
import { codeOf, createUser, prisma, resetDatabase } from "./helpers";

const valid = { name: "Ana Novak", email: "Ana@Example.com ", phone: "", password: "dolgogeslo", passwordConfirm: "dolgogeslo" };

beforeEach(resetDatabase);

describe("registerAdopter", () => {
  it("ustvari aktiven račun z vlogo posvojitelj in zgoščenim geslom", async () => {
    const user = await registerAdopter(valid);
    expect(user).toMatchObject({ email: "ana@example.com", name: "Ana Novak", role: "ADOPTER" });
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored).toMatchObject({ isActive: true, phone: null });
    expect(stored.passwordHash).not.toContain("dolgogeslo");
    expect(await verifyPassword(stored.passwordHash, "dolgogeslo")).toBe(true);
  });

  it("vloge ni mogoče izbrati (role v podatkih se prezre)", async () => {
    const user = await registerAdopter({ ...valid, role: "MANAGER" });
    expect(user.role).toBe("ADOPTER");
  });

  it("zavrne že uporabljen e-poštni naslov ne glede na velike črke", async () => {
    await createUser("VOLUNTEER", { email: "ana@example.com" });
    await expect(registerAdopter(valid)).rejects.toMatchObject({
      code: "USER_EMAIL_TAKEN",
      details: { fieldErrors: { email: expect.any(String) } },
    });
  });

  it.each([
    [{ name: "" }, "name"],
    [{ email: "ni-naslov" }, "email"],
    [{ phone: "abc" }, "phone"],
    [{ password: "kratko", passwordConfirm: "kratko" }, "password"],
    [{ passwordConfirm: "drugacno123" }, "passwordConfirm"],
  ])("neveljavni podatki %j → napaka pri polju %s", async (patch, field) => {
    await expect(registerAdopter({ ...valid, ...patch })).rejects.toMatchObject({
      code: "USER_VALIDATION",
      details: { fieldErrors: { [field]: expect.any(String) } },
    });
    expect(await prisma.user.count()).toBe(0);
  });

  it("sočasni registraciji z istim naslovom: uspe natanko ena", async () => {
    const results = await Promise.allSettled([registerAdopter(valid), registerAdopter(valid)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await codeOf(() => Promise.reject((results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason))).toBe(
      "USER_EMAIL_TAKEN",
    );
  });
});
