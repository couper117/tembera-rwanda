import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearRateLimit } from "@/lib/rate-limit-core";
import type { Role } from "@prisma/client";

/**
 * Auth.js, configured for one thing: an email-and-password account table that
 * this application owns.
 *
 * Three decisions worth knowing, because each keeps the blast radius small:
 *
 * 1. `User.id` stays `Int`. The Prisma adapter is usually shown with string
 *    cuids, but it does not require them — so every existing signature
 *    (`getSavedPlaceIds(userId: number)`) and every foreign key survives
 *    untouched. The only friction is that Auth.js types `session.user.id` as a
 *    string, so `lib/auth.ts` does one `Number(...)` on the way out.
 *
 * 2. JWT sessions, not database sessions. The Credentials provider requires
 *    it, and it avoids a database round trip on every request in a serverless
 *    deployment. Revocation is not lost: the token carries `tokenVersion` and
 *    `lib/auth.ts` compares it against the row on every read, so bumping that
 *    column signs every existing token out.
 *
 * 3. The adapter is mounted anyway, even though nothing writes Session rows.
 *    It owns VerificationToken, which password reset and email verification
 *    need, and having Account present means an OAuth provider can be added
 *    later without a migration.
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      handle: string;
      /// The version the token was issued at. lib/auth.ts compares it against
      /// the database row so a bump revokes every token already handed out.
      tokenVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    handle: string;
    tokenVersion: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid: number;
    role: Role;
    handle: string;
    tokenVersion: number;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always compare, even when the account does not exist — see
        // timingSafeDummyHash below.
        const hash = user?.passwordHash ?? timingSafeDummyHash();
        const ok = await bcrypt.compare(password, hash);
        if (!user || !ok) return null;

        // Signing in successfully forgives the failed guesses before it, so a
        // person who mistypes twice and then gets it right is not left one
        // attempt from being locked out. Only the per-email counter is cleared
        // — the per-address one still limits a script working through a list.
        clearRateLimit(`login:email:${email}`);

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          handle: user.handle,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id);
        token.role = user.role;
        token.handle = user.handle;
        token.tokenVersion = user.tokenVersion;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.uid);
      session.user.role = token.role;
      session.user.handle = token.handle;
      session.user.tokenVersion = token.tokenVersion;
      return session;
    },
  },
});

/**
 * A real bcrypt hash of a value nobody can supply, so a sign-in attempt for an
 * address that does not exist burns the same ~100ms as a wrong password.
 * Without it, response time tells an attacker which addresses are registered.
 *
 * Computed on first use rather than at module load: hashing costs about as
 * much as it protects, and making every cold start pay for it — including the
 * overwhelming majority of requests that never touch sign-in — is not a trade
 * worth making.
 */
let dummyHash: string | undefined;
function timingSafeDummyHash(): string {
  return (dummyHash ??= bcrypt.hashSync("tembera-nonexistent-account", 10));
}
