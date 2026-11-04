import { describe, expect, it } from "vitest";
import { decideAccess, requiredRoles, safeCallbackUrl } from "../src/auth/access";

describe("requiredRoles", () => {
  it("javne poti nimajo omejitev", () => {
    expect(requiredRoles("/")).toBeNull();
    expect(requiredRoles("/zivali/123")).toBeNull();
    expect(requiredRoles("/prijava")).toBeNull();
  });

  it("ujema celoten segment poti, ne le predpone niza", () => {
    expect(requiredRoles("/upravljanje")).toEqual(["MANAGER"]);
    expect(requiredRoles("/upravljanje/zivali/1")).toEqual(["MANAGER"]);
    expect(requiredRoles("/upravljanjexyz")).toBeNull();
  });
});

describe("decideAccess", () => {
  it("neprijavljenega uporabnika na zaščiteni poti pošlje na prijavo", () => {
    expect(decideAccess("/moje-vloge", null)).toEqual({ kind: "login" });
    expect(decideAccess("/ogledi/5", undefined)).toEqual({ kind: "login" });
  });

  it.each([
    ["/upravljanje", "MANAGER"],
    ["/ogledi", "VOLUNTEER"],
    ["/ogledi", "MANAGER"],
    ["/moje-vloge/abc", "ADOPTER"],
  ] as const)("%s je dostopen vlogi %s", (path, role) => {
    expect(decideAccess(path, role)).toEqual({ kind: "allow" });
  });

  it.each([
    ["/upravljanje", "VOLUNTEER", "/ogledi"],
    ["/upravljanje", "ADOPTER", "/moje-vloge"],
    ["/ogledi", "ADOPTER", "/moje-vloge"],
    ["/moje-vloge", "MANAGER", "/upravljanje"],
  ] as const)("%s za vlogo %s preusmeri na %s", (path, role, to) => {
    expect(decideAccess(path, role)).toEqual({ kind: "redirect", to });
  });
});

describe("safeCallbackUrl", () => {
  it("dovoli relativne poti znotraj aplikacije", () => {
    expect(safeCallbackUrl("/zivali/1?x=2", "/")).toBe("/zivali/1?x=2");
  });

  it.each(["https://zlonamerno.si", "//zlonamerno.si", "/\\zlonamerno.si", "javascript:alert(1)", "", null, undefined])(
    "zavrne %s",
    (url) => {
      expect(safeCallbackUrl(url, "/moje-vloge")).toBe("/moje-vloge");
    },
  );
});
