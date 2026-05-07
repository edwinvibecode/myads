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
  const now = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);

  const exchangeRate = await prisma.exchangeRate.findFirst({
    where: { userId, fromCurrency: "USD", toCurrency: "IDR" },
    orderBy: { effectiveDate: "desc" },
  });
  const rate = exchangeRate ? Number(exchangeRate.rate) : 16000;
  const toIDR = (amount: number, currency: string) =>
    currency === "USD" ? amount * rate : amount;

  const revenueWhere: Record<string, unknown> = { userId, month, year };
  if (domainId && domainId !== "global") revenueWhere.domainId = parseInt(domainId, 10);

  const monthStart = new Date(`${year}-${String(month).padStart(2, "0")}-01`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const expenseWhere: Record<string, unknown> = {
    userId,
    date: { gte: monthStart, lt: monthEnd },
  };
  if (domainId === "global") {
    expenseWhere.domainId = null;
  } else if (domainId) {
    expenseWhere.domainId = parseInt(domainId, 10);
  }

  const [revenues, expenses, domains] = await Promise.all([
    prisma.revenueEntry.findMany({
      where: revenueWhere,
      include: { domain: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.expense.findMany({
      where: expenseWhere,
      include: { domain: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.domain.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = revenues.reduce((sum, r) => sum + toIDR(Number(r.amount), r.currency), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + toIDR(Number(e.amount), e.currency), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const byNetwork = revenues.reduce(
    (acc, r) => {
      const key = r.network;
      acc[key] = (acc[key] ?? 0) + toIDR(Number(r.amount), r.currency);
      return acc;
    },
    {} as Record<string, number>
  );

  const byDomain = revenues.reduce(
    (acc, r) => {
      const key = r.domain.name;
      acc[key] = (acc[key] ?? 0) + toIDR(Number(r.amount), r.currency);
      return acc;
    },
    {} as Record<string, number>
  );

  const trendWhere: Record<string, unknown> = { userId };
  if (domainId && domainId !== "global") trendWhere.domainId = parseInt(domainId, 10);

  const trendRevenues = await prisma.revenueEntry.findMany({
    where: { ...trendWhere, year: { gte: year - 1 } },
    select: { month: true, year: true, amount: true, currency: true },
  });

  const trendMap = new Map<string, number>();
  for (const r of trendRevenues) {
    const key = `${r.year}-${r.month}`;
    trendMap.set(key, (trendMap.get(key) ?? 0) + toIDR(Number(r.amount), r.currency));
  }

  const trend = Array.from({ length: 12 }, (_, i) => {
    const m = month - 11 + i;
    const adjustedMonth = ((m - 1 + 120) % 12) + 1;
    const adjustedYear = year + Math.floor((m - 1) / 12);
    const key = `${adjustedYear}-${adjustedMonth}`;
    return {
      month: adjustedMonth,
      year: adjustedYear,
      revenue: trendMap.get(key) ?? 0,
    };
  });

  return NextResponse.json({
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    byNetwork,
    byDomain,
    trend,
    domains,
    exchangeRate: rate,
    month,
    year,
  });
}
