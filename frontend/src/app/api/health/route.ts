import { checkDatabase } from "@novi-dom/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkDatabase();
  return Response.json(status, { status: status.database === "ok" ? 200 : 503 });
}
