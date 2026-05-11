import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil dari revenue entries dengan network CLICKADILLA
  const where: Record<string, unknown> = { userId, network: "CLICKADILLA" };
  
  const revenues = await prisma.revenueEntry.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  // Transform ke format stats
  const stats = revenues.map((r) => ({
    date: new Date(r.year, r.month - 1, 1),
    money: parseFloat(String(r.amount)),
    notes: r.notes,
  }));

  return NextResponse.json(stats);
}
