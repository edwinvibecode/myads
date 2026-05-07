import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  try {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return NextResponse.json({ error: "Registrasi tidak diizinkan" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
