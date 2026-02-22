import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ── GET /api/posts/[id] ───────────────────────────────────────────────────────
// Returns a single post by ID, including whether the current user has liked it.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view this post." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const currentUserId = session.user.id;

    const annotatedPost = {
      ...post,
      userHasLiked: Array.isArray(post.likedBy)
        ? post.likedBy.includes(currentUserId)
        : false,
    };

    return NextResponse.json({ post: annotatedPost }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
