import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string };
}

export async function getUserId(): Promise<number> {
  const user = await requireAuth();
  return parseInt(user.id, 10);
}
