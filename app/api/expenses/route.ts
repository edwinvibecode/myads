import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { userId };
  if (domainId === "global") {
    where.domainId = null;
  } else if (domainId) {
    where.domainId = parseInt(domainId, 10);
  }
  if (type && ["OPERATIONAL", "OTHER"].includes(type)) where.type = type;
  if (month && year) {
    const start = new Date(`${year}-${month.padStart(2, "0")}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.date = { gte: start, lt: end };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { domain: { select: { id: true, name: true, slug: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.domainId) {
      const domain = await prisma.domain.findFirst({ where: { id: parsed.data.domainId, userId } });
      if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        domainId: parsed.data.domainId ?? null,
        type: parsed.data.type,
        category: parsed.data.category,
        description: parsed.data.description ?? "",
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        date: new Date(parsed.data.date),
        isRecurring: parsed.data.isRecurring ?? false,
      },
      include: { domain: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
