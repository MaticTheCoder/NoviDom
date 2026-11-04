import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/auth/password";

describe("hashPassword", () => {
  it("vrne argon2id zgoščeno vrednost, ki ni enaka geslu", async () => {
    const hash = await hashPassword("NoviDom123!");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain("NoviDom123!");
  });

  it("verifyPassword sprejme pravilno in zavrne napačno geslo", async () => {
    const hash = await hashPassword("NoviDom123!");
    await expect(verifyPassword(hash, "NoviDom123!")).resolves.toBe(true);
    await expect(verifyPassword(hash, "napacno")).resolves.toBe(false);
  });
});
