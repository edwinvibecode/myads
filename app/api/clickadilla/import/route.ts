import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, domainId, date } = await req.json();

  if (!data || !Array.isArray(data) || !domainId) {
    return NextResponse.json({ error: "Data dan domainId wajib diisi" }, { status: 400 });
  }

  try {
    let imported = 0;

    for (const item of data) {
      const money = parseFloat(item.money || 0);
      if (money <= 0) continue;

      const dateObj = new Date(item.date || date);
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      await prisma.revenueEntry.create({
        data: {
          userId,
          domainId: parseInt(domainId, 10),
          network: "CLICKADILLA",
          amount: money,
          currency: "USD",
          month,
          year,
          notes: `Imported: ${item.impressions || 0} impressions, ${item.clicks || 0} clicks`,
        },
      });

      imported++;
    }

    return NextResponse.json({ imported });
  } catch {
    return NextResponse.json({ error: "Gagal import data" }, { status: 500 });
  }
}
