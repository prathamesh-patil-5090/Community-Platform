import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ── POST /api/posts/[id]/comments ─────────────────────────────────────────────
// Adds a comment to a post. Requires an authenticated session.
//
// Body (JSON):
//   text   string   required  (max 2000 chars)
//
// Response 201:
//   { comment: { id, text, authorId, authorName, authorImage, createdAt }; commentsCount: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to comment." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment text is required." },
        { status: 400 },
      );
    }

    if (text.trim().length > 2000) {
      return NextResponse.json(
        { error: "Comment cannot exceed 2000 characters." },
        { status: 400 },
      );
    }

    await connectDB();

    const newComment = {
      text: text.trim(),
      authorId: session.user.id,
      authorName: session.user.name ?? session.user.email ?? "Anonymous",
      authorImage: session.user.image ?? undefined,
    };

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { commentList: { $each: [newComment], $position: 0 } } },
      { new: true, select: "commentList" },
    ).lean();

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // The newly added comment is now at index 0 (we pushed to front)
    const saved = updatedPost.commentList?.[0];

    return NextResponse.json(
      {
        comment: {
          id: saved?._id?.toString() ?? "",
          text: saved?.text ?? newComment.text,
          authorId: saved?.authorId ?? newComment.authorId,
          authorName: saved?.authorName ?? newComment.authorName,
          authorImage: saved?.authorImage ?? newComment.authorImage ?? null,
          createdAt: saved?.createdAt ?? new Date(),
        },
        commentsCount: updatedPost.commentList?.length ?? 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/posts/[id]/comments]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ── GET /api/posts/[id]/comments ──────────────────────────────────────────────
// Returns all comments for a post, newest first.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view comments." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).select("commentList").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const comments = (post.commentList ?? []).map((c) => ({
      id: c._id?.toString() ?? "",
      text: c.text,
      authorId: c.authorId,
      authorName: c.authorName ?? "Anonymous",
      authorImage: c.authorImage ?? null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/posts/[id]/comments]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
