import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { domainSchema } from "@/lib/validations";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domains = await prisma.domain.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(domains);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = domainSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, slug } = parsed.data;

    const existing = await prisma.domain.findUnique({ where: { userId_slug: { userId, slug } } });
    if (existing) {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
    }

    const domain = await prisma.domain.create({ data: { userId, name, slug } });
    return NextResponse.json(domain, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
