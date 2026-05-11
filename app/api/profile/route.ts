import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return parseInt((session.user as { id: string }).id, 10);
}

// GET /api/profile - Get current user profile
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Raw SQL query
  const users = await prisma.$queryRaw`
    SELECT id, email, twoFactorEnabled, createdAt
    FROM User
    WHERE id = ${userId}
  `;

  const user = (users as Array<Record<string, unknown>>)[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    twoFactorEnabled: user.twoFactorEnabled === 1 || user.twoFactorEnabled === true,
    createdAt: user.createdAt,
  });
}

// PATCH /api/profile - Change password
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
  }

  // Get user with raw SQL
  const users = await prisma.$queryRaw`
    SELECT passwordHash FROM User WHERE id = ${userId}
  `;
  const user = (users as Array<Record<string, unknown>>)[0];
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash as string);
  if (!valid) return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.$executeRaw`
    UPDATE User SET passwordHash = ${newHash}, updatedAt = datetime('now') WHERE id = ${userId}
  `;

  return NextResponse.json({ success: true, message: "Password berhasil diubah" });
}

// Simple TOTP implementation
function generateSecret(): string {
  return crypto.randomBytes(20).toString("hex").toUpperCase();
}

function verifyTOTP(token: string, secret: string): boolean {
  // Check current window and +/- 1 window for time drift
  for (let i = -1; i <= 1; i++) {
    const time = Math.floor(Date.now() / 1000 / 30) + i;
    const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
    hmac.update(Buffer.from(time.toString(16).padStart(16, "0"), "hex"));
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24 |
      (hash[offset + 1] & 0xff) << 16 |
      (hash[offset + 2] & 0xff) << 8 |
      (hash[offset + 3] & 0xff)) % 1000000;
    if (code.toString().padStart(6, "0") === token) {
      return true;
    }
  }
  return false;
}

// POST /api/profile - 2FA actions
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json();

  if (action === "setup") {
    const secret = generateSecret();
    
    // Store secret temporarily (not enabled yet, need verification)
    await prisma.$executeRaw`
      UPDATE User SET twoFactorSecret = ${secret}, updatedAt = datetime('now') WHERE id = ${userId}
    `;

    return NextResponse.json({
      secret,
      message: "Simpan secret key ini di authenticator app lalu verifikasi",
    });
  }

  if (action === "verify") {
    const { code } = await req.json();

    // Get secret
    const users = await prisma.$queryRaw`
      SELECT twoFactorSecret FROM User WHERE id = ${userId}
    `;
    const user = (users as Array<Record<string, unknown>>)[0];

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA belum di-setup" }, { status: 400 });
    }

    const valid = verifyTOTP(code, user.twoFactorSecret as string);

    if (!valid) {
      return NextResponse.json({ error: "Kode verifikasi salah" }, { status: 400 });
    }

    // Enable 2FA
    await prisma.$executeRaw`
      UPDATE User SET twoFactorEnabled = 1, updatedAt = datetime('now') WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, message: "2FA berhasil diaktifkan" });
  }

  if (action === "disable") {
    const { code } = await req.json();

    // Get secret and verify
    const users = await prisma.$queryRaw`
      SELECT twoFactorSecret, twoFactorEnabled FROM User WHERE id = ${userId}
    `;
    const user = (users as Array<Record<string, unknown>>)[0];

    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA tidak aktif" }, { status: 400 });
    }

    const valid = verifyTOTP(code, user.twoFactorSecret as string);

    if (!valid) {
      return NextResponse.json({ error: "Kode verifikasi salah" }, { status: 400 });
    }

    // Disable 2FA
    await prisma.$executeRaw`
      UPDATE User SET twoFactorEnabled = 0, twoFactorSecret = NULL, updatedAt = datetime('now') WHERE id = ${userId}
    `;

    return NextResponse.json({ success: true, message: "2FA berhasil dinonaktifkan" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
