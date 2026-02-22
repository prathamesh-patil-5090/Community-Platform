import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ── PATCH /api/posts/[id]/like ────────────────────────────────────────────────
// Toggles the current user's like on a post.
// If already liked  → removes like  (returns liked: false)
// If not yet liked  → adds like     (returns liked: true)
//
// Response 200:
//   { liked: boolean; likes: number }
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to like a post." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const userId = session.user.id;

    // Check current like state
    const post = await Post.findById(id).select("likedBy likes").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const alreadyLiked = Array.isArray(post.likedBy)
      ? post.likedBy.includes(userId)
      : false;

    let updatedPost;

    if (alreadyLiked) {
      // Remove like
      updatedPost = await Post.findByIdAndUpdate(
        id,
        {
          $pull: { likedBy: userId },
          $inc: { likes: -1 },
        },
        { new: true, select: "likes likedBy" },
      ).lean();
    } else {
      // Add like
      updatedPost = await Post.findByIdAndUpdate(
        id,
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        },
        { new: true, select: "likes likedBy" },
      ).lean();
    }

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Clamp likes to zero (should never be negative, but be safe)
    const safeLikes = Math.max(0, updatedPost.likes ?? 0);

    return NextResponse.json(
      {
        liked: !alreadyLiked,
        likes: safeLikes,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/posts/[id]/like]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
