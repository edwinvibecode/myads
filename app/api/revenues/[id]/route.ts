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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const existing = await prisma.revenueEntry.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = revenueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const domain = await prisma.domain.findFirst({ where: { id: parsed.data.domainId, userId } });
    if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });

    const updated = await prisma.revenueEntry.update({
      where: { id },
      data: parsed.data,
      include: { domain: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const existing = await prisma.revenueEntry.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  await prisma.revenueEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
