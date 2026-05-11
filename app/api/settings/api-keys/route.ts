import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

// In-memory storage (gunakan localStorage di client atau DB nanti)
const apiKeys: Record<number, Record<string, string>> = {};

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = apiKeys[userId] || {};
  return NextResponse.json(
    Object.entries(keys).map(([provider, apiKey]) => ({
      provider,
      apiKey: apiKey.slice(0, 4) + "****" + apiKey.slice(-4),
    }))
  );
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, apiKey } = await req.json();
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "Provider dan API Key wajib diisi" }, { status: 400 });
  }

  if (!apiKeys[userId]) apiKeys[userId] = {};
  apiKeys[userId][provider] = apiKey;

  return NextResponse.json({ success: true });
}
