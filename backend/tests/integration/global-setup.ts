import { execFileSync } from "node:child_process";
import path from "node:path";
import pg from "pg";
import type { TestProject } from "vitest/node";

/** Ustvari testno bazo, če ne obstaja, in nanjo uveljavi vse migracije. */
export default async function setup(project: TestProject) {
  const url = new URL(project.config.env.DATABASE_URL as string);
  const dbName = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/i.test(dbName) || !dbName.endsWith("_test")) {
    throw new Error(`Integracijski testi tečejo le na bazi s končnico _test (dobil: ${dbName}).`);
  }

  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName}"`);
  await client.end();

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: path.resolve(import.meta.dirname, "../.."),
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: "pipe",
  });
}
