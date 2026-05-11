import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { providers, codes, nextProviderId } from "../data";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

let localNextProviderId = nextProviderId;

// GET /api/ad-codes/providers?domainId=1
export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  if (!domainId) {
    return NextResponse.json({ error: "domainId wajib diisi" }, { status: 400 });
  }

  const domainProviders = providers
    .filter((p) => p.userId === userId && p.domainId === parseInt(domainId, 10))
    .map((p) => ({
      ...p,
      codes: codes.filter((c) => c.providerId === p.id),
    }));

  return NextResponse.json(domainProviders);
}

// POST /api/ad-codes/providers
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domainId, name } = await req.json();

  if (!domainId || !name) {
    return NextResponse.json({ error: "domainId dan name wajib diisi" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const provider = {
    id: localNextProviderId++,
    userId,
    domainId: parseInt(domainId, 10),
    name,
    createdAt: now,
    updatedAt: now,
  };

  providers.push(provider);
  return NextResponse.json(provider);
}

// DELETE /api/ad-codes/providers?id=1
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  const providerId = parseInt(id, 10);
  // Delete codes first
  const codeIndex = codes.findIndex((c) => c.providerId === providerId);
  if (codeIndex >= 0) codes.splice(codeIndex, 1);

  // Delete provider
  const idx = providers.findIndex((p) => p.id === providerId && p.userId === userId);
  if (idx >= 0) providers.splice(idx, 1);

  return NextResponse.json({ success: true });
}
