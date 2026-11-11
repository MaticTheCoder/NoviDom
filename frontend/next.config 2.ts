import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Skupna .env datoteka je v korenu repozitorija.
loadEnvConfig(path.resolve(__dirname, ".."));

const nextConfig: NextConfig = {
  // Domenski paket je objavljen kot TypeScript izvorna koda (ADR-0002).
  transpilePackages: ["@novi-dom/backend"],
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
