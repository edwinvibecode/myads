import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revenueSchema } from "@/lib/validations";

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
  const network = searchParams.get("network");

  const where: Record<string, unknown> = { userId };
  if (domainId) where.domainId = parseInt(domainId, 10);
  if (month) where.month = parseInt(month, 10);
  if (year) where.year = parseInt(year, 10);
  if (network && ["CLICKADILLA", "CLICKADU", "ADSTERRA"].includes(network)) {
    where.network = network;
  }

  const revenues = await prisma.revenueEntry.findMany({
    where,
    include: { domain: { select: { id: true, name: true, slug: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json(revenues);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = revenueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }

    const domain = await prisma.domain.findFirst({
      where: { id: parsed.data.domainId, userId },
    });
    if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });

    const revenue = await prisma.revenueEntry.create({
      data: { ...parsed.data, userId },
      include: { domain: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(revenue, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
