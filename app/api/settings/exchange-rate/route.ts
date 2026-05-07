import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeRateSchema } from "@/lib/validations";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rates = await prisma.exchangeRate.findMany({
    where: { userId },
    orderBy: { effectiveDate: "desc" },
    take: 10,
  });

  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = exchangeRateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { fromCurrency, toCurrency, rate, effectiveDate } = parsed.data;

    const existing = await prisma.exchangeRate.findUnique({
      where: {
        userId_fromCurrency_toCurrency_effectiveDate: {
          userId,
          fromCurrency,
          toCurrency,
          effectiveDate: new Date(effectiveDate),
        },
      },
    });

    if (existing) {
      const updated = await prisma.exchangeRate.update({
        where: { id: existing.id },
        data: { rate },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.exchangeRate.create({
      data: {
        userId,
        fromCurrency,
        toCurrency,
        rate,
        effectiveDate: new Date(effectiveDate),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
