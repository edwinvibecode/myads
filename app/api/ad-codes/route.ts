import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { codes, nextCodeId, providers } from "./data";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

let localNextCodeId = nextCodeId;

// GET /api/ad-codes?providerId=1
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json({ error: "providerId wajib diisi" }, { status: 400 });
  }

  const providerCodes = codes.filter((c) => c.providerId === parseInt(providerId, 10));
  return NextResponse.json(providerCodes);
}

// POST /api/ad-codes
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { providerId, name, format, htmlCode } = await req.json();

  if (!providerId || !name || !format || !htmlCode) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  const provider = providers.find((p) => p.id === parseInt(providerId, 10));
  if (!provider || provider.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const code = {
    id: localNextCodeId++,
    providerId: parseInt(providerId, 10),
    name,
    format,
    htmlCode,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  codes.push(code);
  return NextResponse.json(code);
}

// PATCH /api/ad-codes?id=1
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { name, format, htmlCode, isActive } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  const code = codes.find((c) => c.id === parseInt(id, 10));
  if (!code) {
    return NextResponse.json({ error: "Kode iklan tidak ditemukan" }, { status: 404 });
  }

  const provider = providers.find((p) => p.id === code.providerId);
  if (!provider || provider.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  code.name = name;
  code.format = format;
  code.htmlCode = htmlCode;
  code.isActive = isActive;
  code.updatedAt = new Date().toISOString();

  return NextResponse.json(code);
}

// DELETE /api/ad-codes?id=1
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  const codeIdx = codes.findIndex((c) => c.id === parseInt(id, 10));
  if (codeIdx < 0) {
    return NextResponse.json({ error: "Kode iklan tidak ditemukan" }, { status: 404 });
  }

  const provider = providers.find((p) => p.id === codes[codeIdx].providerId);
  if (!provider || provider.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  codes.splice(codeIdx, 1);
  return NextResponse.json({ success: true });
}
