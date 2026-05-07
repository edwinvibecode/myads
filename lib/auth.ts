import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";
import { checkRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        ip: { label: "IP", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const ip = credentials?.ip ?? "unknown";

        const allowed = await checkRateLimit(email, ip);
        if (!allowed) throw new Error("RATE_LIMIT");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await prisma.loginAttempt.create({ data: { email, ip } });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await prisma.loginAttempt.create({ data: { email, ip } });
          return null;
        }

        return { id: String(user.id), email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
};
