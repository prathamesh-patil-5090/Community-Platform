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

const ADMIN_PREFIX = "/admin-panel";

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
    /**
     * session callback — runs in the Edge Runtime for the middleware.
     *
     * Maps custom JWT fields (userId, role) onto the session.user object so
     * that `auth.user.role` is available inside the `authorized` callback below.
     *
     * This intentionally mirrors the session callback in src/auth.ts; keeping
     * them in sync ensures the middleware always sees the same shape as the
     * rest of the app.
     */
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: (token.userId as string | undefined) ?? session.user?.id ?? "",
          role: (token.role as string | undefined) ?? "user",
        },
      };
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Allow public prefixes (static assets, auth API, etc.)
      if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }

      // Allow public routes; redirect logged-in users away from login/register
      if (PUBLIC_ROUTES.includes(pathname)) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Handle expired/missing refresh tokens
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

      // Redirect unauthenticated users to login
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      // ── Admin route protection ──────────────────────────────────────────
      // Protect /admin-panel and all sub-routes — only users with role "admin"
      // in their JWT/session may access these pages. Non-admins are redirected
      // to the homepage.
      if (pathname.startsWith(ADMIN_PREFIX)) {
        const userRole = (auth?.user as { role?: string } | undefined)?.role;
        if (userRole !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      // Also protect admin API routes from non-admin users
      if (pathname.startsWith("/api/admin")) {
        const userRole = (auth?.user as { role?: string } | undefined)?.role;
        if (userRole !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
