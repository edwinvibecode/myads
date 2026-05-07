import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { domainSchema } from "@/lib/validations";
import { z } from "zod";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

async function getDomain(userId: number, id: number) {
  return prisma.domain.findFirst({ where: { id, userId } });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const domain = await getDomain(userId, id);
  if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = domainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const updated = await prisma.domain.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const domain = await getDomain(userId, id);
  if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });

  try {
    const body = await req.json();
    const schema = z.object({ isArchived: z.boolean() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

    const updated = await prisma.domain.update({
      where: { id },
      data: { isArchived: parsed.data.isArchived },
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

  const domain = await getDomain(userId, id);
  if (!domain) return NextResponse.json({ error: "Domain tidak ditemukan" }, { status: 404 });

  await prisma.domain.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
