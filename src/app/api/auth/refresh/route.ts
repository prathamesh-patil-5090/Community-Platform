import connectDB from "@/lib/mongodb";
import { rotateRefreshToken, validateRefreshToken } from "@/lib/tokens";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/refresh
 *
 * Accepts a refresh token in the request body, validates it, rotates it,
 * and returns a new refresh token along with updated user info.
 *
 * This endpoint is useful for headless / mobile clients that manage tokens
 * manually instead of relying on NextAuth's session cookie mechanism.
 *
 * Body: { refreshToken: string }
 *
 * Response (200):
 *   { refreshToken: string; user: { id, email, name, image } }
 *
 * Response (401):
 *   { error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return NextResponse.json(
        { error: "Refresh token is required." },
        { status: 400 },
      );
    }

    const userId = await validateRefreshToken(refreshToken);

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Refresh token is invalid or has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const newRefreshToken = await rotateRefreshToken(refreshToken, userId);

    await connectDB();
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Token refreshed successfully.",
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/refresh]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 },
    );
  }
}
