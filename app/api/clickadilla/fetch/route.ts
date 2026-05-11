import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date1, date2, apiKey, fields = "date,impressions,clicks,money", groupBy } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API Key ClickAdilla belum diatur" }, { status: 400 });
  }

  if (!date1 || !date2) {
    return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
  }

  try {
    const url = new URL("https://publishers.clickadilla.com/backend/api/public/stats");
    url.searchParams.set("token", apiKey);
    url.searchParams.set("date1", date1);
    url.searchParams.set("date2", date2);
    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", "500");
    url.searchParams.set("offset", "0");
    url.searchParams.set("orderBy", "-date");
    if (groupBy) url.searchParams.set("groupBy", groupBy);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `ClickAdilla API error: ${res.status} - ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data dari ClickAdilla" }, { status: 500 });
  }
}
