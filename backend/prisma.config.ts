import path from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// .env je v korenu repozitorija (skupen za frontend in backend).
config({ path: path.resolve(import.meta.dirname, "../.env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
