import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Skupna .env datoteka je v korenu repozitorija. Next.js je pred tem že naložil
// okolje iz frontend/ in ga hrani v predpomnilniku, zato je potreben forceReload.
loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production", console, true);

const nextConfig: NextConfig = {
  // Domenski paket je objavljen kot TypeScript izvorna koda (ADR-0002).
  transpilePackages: ["@novi-dom/backend"],
};

export default nextConfig;
