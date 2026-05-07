import { prisma } from "./prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function checkRateLimit(email: string, ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const [emailAttempts, ipAttempts] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, createdAt: { gte: windowStart } },
    }),
    prisma.loginAttempt.count({
      where: { ip, createdAt: { gte: windowStart } },
    }),
  ]);

  return emailAttempts < MAX_ATTEMPTS && ipAttempts < MAX_ATTEMPTS;
}

export async function cleanupOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - WINDOW_MS);
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
