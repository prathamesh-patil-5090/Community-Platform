import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe NextAuth configuration.
 *
 * This file MUST NOT import any Node.js-only modules (crypto, mongoose, bcryptjs, …)
 * because it is consumed by the Next.js middleware which runs in the Edge Runtime.
 *
 * The full configuration (providers with `authorize`, JWT rotation callbacks, DB access)
 * lives in src/auth.ts which only runs in the Node.js runtime.
 */

const PUBLIC_ROUTES = ["/login", "/register"];

const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon.ico", "/public"];

export const authConfig = {
  providers: [],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }

      if (PUBLIC_ROUTES.includes(pathname)) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      const sessionError = (auth as { error?: string } | null)?.error;
      if (
        sessionError === "RefreshTokenExpired" ||
        sessionError === "RefreshTokenMissing"
      ) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        loginUrl.searchParams.set("error", "SessionExpired");
        return Response.redirect(loginUrl);
      }

      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
