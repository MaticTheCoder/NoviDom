import { HOME_BY_ROLE } from "@novi-dom/backend/access";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Po prijavi brez callbackUrl uporabnika preusmeri na začetno stran njegove vloge.
export default async function AfterLoginPage() {
  const session = await auth();
  redirect(session?.user ? HOME_BY_ROLE[session.user.role] : "/prijava");
}
