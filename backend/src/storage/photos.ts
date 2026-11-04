// Lokalna shramba fotografij živali (docs/04: mapa uploads/, kasneje S3).
// Pot do mape poda UPLOAD_DIR (absolutna pot; frontend jo nastavi v next.config.ts).
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DomainError } from "../errors";
import { PHOTO_LIMITS } from "../validation/animal";

export const PUBLIC_PREFIX = "/uploads/";
const ANIMALS_DIR = "animals";

export const PhotoErrorCode = {
  InvalidType: "PHOTO_INVALID_TYPE",
  TooLarge: "PHOTO_TOO_LARGE",
} as const;

type ImageType = { mime: (typeof PHOTO_LIMITS.types)[number]; ext: string };

/** Vrsto slike določi po vsebini (magični bajti), ne po imenu ali MIME tipu odjemalca. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

function uploadRoot(): string {
  const dir = process.env.UPLOAD_DIR;
  if (!dir || !path.isAbsolute(dir)) {
    throw new Error("UPLOAD_DIR mora biti nastavljen na absolutno pot do mape za naložene datoteke.");
  }
  return dir;
}

/** Preveri in shrani sliko; vrne javni URL (npr. /uploads/animals/<uuid>.jpg). */
export async function savePhoto(bytes: Uint8Array, originalName = "datoteka"): Promise<string> {
  if (bytes.byteLength > PHOTO_LIMITS.maxBytes) {
    throw new DomainError(PhotoErrorCode.TooLarge, `Datoteka »${originalName}« je večja od 5 MB.`);
  }
  const type = detectImageType(bytes);
  if (!type) {
    throw new DomainError(PhotoErrorCode.InvalidType, `Datoteka »${originalName}« ni slika JPEG, PNG ali WebP.`);
  }

  const dir = path.join(uploadRoot(), ANIMALS_DIR);
  await mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.${type.ext}`;
  await writeFile(path.join(dir, fileName), bytes, { flag: "wx" });
  return `${PUBLIC_PREFIX}${ANIMALS_DIR}/${fileName}`;
}

/**
 * Pretvori javni URL v pot na disku. Vrne null za URL-je zunaj shrambe
 * (npr. seed slike v public/) in za poskuse izhoda iz mape (../).
 */
export function resolveStoredPath(urlOrRelative: string): string | null {
  const relative = urlOrRelative.startsWith(PUBLIC_PREFIX) ? urlOrRelative.slice(PUBLIC_PREFIX.length) : urlOrRelative;
  if (!relative || relative.includes("\0")) return null;
  const root = uploadRoot();
  const full = path.resolve(root, relative);
  return full.startsWith(root + path.sep) ? full : null;
}

const CONTENT_TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** Prebere shranjeno datoteko za prikaz; null, če ne obstaja ali pot ni dovoljena. */
export async function readStoredPhoto(relative: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const full = resolveStoredPath(relative);
  const contentType = full && CONTENT_TYPES[path.extname(full).toLowerCase()];
  if (!full || !contentType) return null;
  try {
    return { bytes: await readFile(full), contentType };
  } catch {
    return null;
  }
}

/** Izbriše datoteko iz shrambe; URL-je zunaj shrambe (seed slike) prezre. */
export async function deleteStoredPhoto(url: string): Promise<void> {
  if (!url.startsWith(PUBLIC_PREFIX)) return;
  const full = resolveStoredPath(url);
  if (full) await unlink(full).catch(() => undefined);
}
