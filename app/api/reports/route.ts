import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const year = searchParams.get("year");

  const currentYear = new Date().getFullYear();
  const filterYear = year ? parseInt(year, 10) : currentYear;

  const revenueWhere: Record<string, unknown> = { userId, year: filterYear };
  if (domainId && domainId !== "global") revenueWhere.domainId = parseInt(domainId, 10);

  const revenues = await prisma.revenueEntry.findMany({
    where: revenueWhere,
    select: { month: true, year: true, amount: true, currency: true, network: true, domainId: true },
  });

  const yearStart = new Date(`${filterYear}-01-01`);
  const yearEnd = new Date(`${filterYear}-12-31`);

  const expenseWhere: Record<string, unknown> = {
    userId,
    date: { gte: yearStart, lte: yearEnd },
  };
  if (domainId === "global") {
    expenseWhere.domainId = null;
  } else if (domainId) {
    expenseWhere.domainId = parseInt(domainId, 10);
  }

  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    select: { date: true, amount: true, currency: true, type: true, domainId: true },
  });

  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { userId, fromCurrency: "USD", toCurrency: "IDR" },
    orderBy: { effectiveDate: "desc" },
  });

  const rate = exchangeRate ? Number(exchangeRate.rate) : 16000;

  const toIDR = (amount: number, currency: string) =>
    currency === "USD" ? amount * rate : amount;

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: filterYear,
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    byNetwork: { CLICKADILLA: 0, CLICKADU: 0, ADSTERRA: 0 },
  }));

  for (const r of revenues) {
    const idx = r.month - 1;
    const amountIDR = toIDR(Number(r.amount), r.currency);
    monthlyData[idx].revenue += amountIDR;
    monthlyData[idx].byNetwork[r.network as keyof typeof monthlyData[0]["byNetwork"]] += amountIDR;
  }

  for (const e of expenses) {
    const month = new Date(e.date).getMonth();
    monthlyData[month].expenses += toIDR(Number(e.amount), e.currency);
  }

  for (const m of monthlyData) {
    m.netProfit = m.revenue - m.expenses;
  }

  return NextResponse.json({ monthlyData, exchangeRate: rate, year: filterYear });
}
