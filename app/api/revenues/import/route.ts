import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvRowSchema } from "@/lib/validations";
import { z } from "zod";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const rowsSchema = z.array(csvRowSchema).min(1).max(500);
    const parsed = rowsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Format CSV tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }

    const domains = await prisma.domain.findMany({ where: { userId } });
    const domainMap = new Map(domains.map((d) => [d.slug, d.id]));

    const errors: string[] = [];
    const inserts: {
      userId: number;
      domainId: number;
      network: "CLICKADILLA" | "CLICKADU" | "ADSTERRA";
      amount: number;
      currency: "USD" | "IDR";
      month: number;
      year: number;
      notes?: string;
    }[] = [];

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i];
      const domainId = domainMap.get(row.domain);
      if (!domainId) {
        errors.push(`Baris ${i + 1}: Domain "${row.domain}" tidak ditemukan`);
        continue;
      }
      inserts.push({
        userId,
        domainId,
        network: row.network,
        amount: row.amount,
        currency: row.currency,
        month: row.month,
        year: row.year,
        notes: row.notes,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Import gagal", details: errors }, { status: 400 });
    }

    await prisma.revenueEntry.createMany({ data: inserts });
    return NextResponse.json({ imported: inserts.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
