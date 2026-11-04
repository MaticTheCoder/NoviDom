import { prisma } from "./db";

export type HealthStatus = { database: "ok" | "error"; error?: string };

export async function checkDatabase(): Promise<HealthStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { database: "ok" };
  } catch (error) {
    return { database: "error", error: error instanceof Error ? error.message : String(error) };
  }
}
