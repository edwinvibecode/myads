import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt((session.user as { id: string }).id, 10);
  const expenses = await prisma.expense.findMany({
    where: { userId },
    select: { category: true },
    distinct: ["category"],
  });

  const categories = expenses.map((e) => e.category).filter(Boolean);
  return NextResponse.json(categories);
}
