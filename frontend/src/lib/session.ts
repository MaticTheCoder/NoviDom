import type { Actor } from "@novi-dom/backend";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Izvajalec za klice storitev. Vlogo preveri storitev sama (iz baze). */
export async function requireActor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) redirect("/prijava");
  return { userId: session.user.id };
}
