import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteStoredPhoto, detectImageType, readStoredPhoto, resolveStoredPath, savePhoto } from "../src/storage/photos";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

let dir: string;
beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "novidom-uploads-"));
  process.env.UPLOAD_DIR = dir;
});
afterAll(() => rm(dir, { recursive: true, force: true }));

describe("detectImageType", () => {
  it("prepozna JPEG, PNG in WebP po vsebini", () => {
    expect(detectImageType(JPEG)?.mime).toBe("image/jpeg");
    expect(detectImageType(PNG)?.mime).toBe("image/png");
    expect(detectImageType(WEBP)?.mime).toBe("image/webp");
  });

  it("zavrne druge datoteke, tudi SVG in HTML", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<html>"))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe("resolveStoredPath", () => {
  it("dovoli poti znotraj UPLOAD_DIR", () => {
    expect(resolveStoredPath("/uploads/animals/a.jpg")).toBe(path.join(dir, "animals", "a.jpg"));
  });

  it.each(["/uploads/../.env", "../../etc/passwd", "/uploads/animals/../../x", "", "/uploads/a\0.jpg"])("zavrne %j", (p) => {
    expect(resolveStoredPath(p)).toBeNull();
  });
});

describe("savePhoto / readStoredPhoto / deleteStoredPhoto", () => {
  it("shrani sliko z naključnim imenom, jo prebere in izbriše", async () => {
    const url = await savePhoto(PNG, "rex.png");
    expect(url).toMatch(/^\/uploads\/animals\/[0-9a-f-]{36}\.png$/);
    expect(await readFile(resolveStoredPath(url)!)).toEqual(Buffer.from(PNG));

    const stored = await readStoredPhoto(url.slice("/uploads/".length));
    expect(stored?.contentType).toBe("image/png");

    await deleteStoredPhoto(url);
    expect(await readStoredPhoto(url.slice("/uploads/".length))).toBeNull();
  });

  it("zavrne neslikovne in prevelike datoteke", async () => {
    await expect(savePhoto(new TextEncoder().encode("hello"), "a.jpg")).rejects.toMatchObject({ code: "PHOTO_INVALID_TYPE" });
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(JPEG);
    await expect(savePhoto(big, "velika.jpg")).rejects.toMatchObject({ code: "PHOTO_TOO_LARGE" });
  });

  it("deleteStoredPhoto ne briše datotek zunaj shrambe (seed slike)", async () => {
    await expect(deleteStoredPhoto("/animals/pes.svg")).resolves.toBeUndefined();
  });
});
