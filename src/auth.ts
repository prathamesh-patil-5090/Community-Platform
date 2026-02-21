import { authConfig } from "@/auth.config";
import connectDB from "@/lib/mongodb";
import {
  generateRefreshToken,
  rotateRefreshToken,
  storeRefreshToken,
  validateRefreshToken,
} from "@/lib/tokens";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase().trim(),
          }).select("+password");

          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password,
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          };
        } catch (error) {
          console.error("[NextAuth] Credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      if (account.provider !== "credentials") {
        try {
          await connectDB();

          const userEmail = user.email ?? undefined;

          const existing = await User.findOne({ email: userEmail });

          if (!existing) {
            await User.create({
              email: userEmail,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              provider: account.provider as "github" | "google",
            });
          } else if (
            existing.provider !== account.provider &&
            existing.provider === "credentials"
          ) {
            existing.provider = account.provider as "github" | "google";
            existing.image = user.image ?? existing.image;
            await existing.save();
          }
        } catch (error) {
          console.error("[NextAuth] signIn callback error:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (user && account) {
        try {
          await connectDB();

          const dbUser = await User.findOne({ email: user.email });
          const userId = dbUser?._id.toString() ?? (user.id as string);

          const refreshToken = generateRefreshToken();
          await storeRefreshToken(userId, refreshToken);

          return {
            ...token,
            userId,
            name: user.name ?? token.name,
            email: user.email ?? token.email,
            picture: user.image ?? token.picture,
            accessTokenExpires: nowSeconds + ACCESS_TOKEN_TTL_SECONDS,
            refreshToken,
            error: undefined,
          };
        } catch (error) {
          console.error("[NextAuth] jwt initial sign-in error:", error);
          return { ...token, error: "SignInError" };
        }
      }

      if (
        token.accessTokenExpires &&
        nowSeconds < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: "RefreshTokenMissing" };
      }

      try {
        const userId = await validateRefreshToken(token.refreshToken as string);

        if (!userId) {
          return { ...token, error: "RefreshTokenExpired" };
        }

        const newRefreshToken = await rotateRefreshToken(
          token.refreshToken as string,
          userId,
        );

        return {
          ...token,
          userId,
          accessTokenExpires: nowSeconds + ACCESS_TOKEN_TTL_SECONDS,
          refreshToken: newRefreshToken,
          error: undefined,
        };
      } catch (error) {
        console.error("[NextAuth] jwt refresh error:", error);
        return { ...token, error: "RefreshTokenExpired" };
      }
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
          name: token.name ?? session.user?.name,
          email: token.email ?? session.user?.email,
          image: token.picture ?? session.user?.image,
        },
        accessTokenExpires: token.accessTokenExpires as number | undefined,
        error: token.error as string | undefined,
      };
    },
  },
});
