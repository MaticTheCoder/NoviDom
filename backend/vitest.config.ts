import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: path.resolve(import.meta.dirname, "../.env"), quiet: true });

/**
 * Integracijski testi tečejo na ločeni bazi (privzeto <ime baze>_test na istem strežniku),
 * da ne pobrišejo razvojnih podatkov. Nastaviš jo lahko s TEST_DATABASE_URL.
 */
function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const url = new URL(process.env.DATABASE_URL ?? "postgresql://novidom:novidom@localhost:5432/novidom");
  url.pathname = `${url.pathname.replace(/^\//, "")}_test`;
  return url.toString();
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["tests/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          env: { DATABASE_URL: testDatabaseUrl() },
          globalSetup: ["tests/integration/global-setup.ts"],
          // Testi si delijo eno bazo in jo praznijo, zato tečejo zaporedno.
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
