import { hash, verify } from "@node-rs/argon2";

// Gesla so zgoščena z argon2id (ADR-0005); privzeti parametri knjižnice
// ustrezajo priporočilom OWASP.
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}
