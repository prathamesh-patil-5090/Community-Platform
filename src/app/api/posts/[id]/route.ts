import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ── PATCH /api/posts/[id] ─────────────────────────────────────────────────────
// Edits an existing post. Only the post's author may edit it.
//
// Body (JSON) – all fields optional; only provided fields are updated:
//   title       string
//   content     string   (HTML from TipTap)
//   tags        string[] max 4
//   coverImage  string | null   (null removes the cover image)
//   postType    "Post" | "Article"
//
// Response 200:
//   { message: string; post: { id, title, tags, coverImage, postType, updatedAt } }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to edit a post." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).select("authorId").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not allowed to edit this post." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { title, content, tags, coverImage, postType } = body;

    // Build the update object with only provided fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Post title cannot be empty." },
          { status: 400 },
        );
      }
      if (title.trim().length > 300) {
        return NextResponse.json(
          { error: "Title cannot exceed 300 characters." },
          { status: 400 },
        );
      }
      update.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return NextResponse.json(
          { error: "Post content cannot be empty." },
          { status: 400 },
        );
      }
      update.content = content.trim();
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: "Tags must be an array of strings." },
          { status: 400 },
        );
      }
      update.tags = (tags as unknown[])
        .filter((t) => typeof t === "string" && (t as string).trim().length > 0)
        .map((t) => (t as string).trim().toLowerCase())
        .slice(0, 4);
    }

    if (coverImage !== undefined) {
      // null explicitly removes the cover image
      update.coverImage = coverImage === null ? undefined : coverImage;
    }

    if (postType !== undefined) {
      const valid = ["Post", "Article"];
      if (!valid.includes(postType)) {
        return NextResponse.json(
          { error: "postType must be 'Post' or 'Article'." },
          { status: 400 },
        );
      }
      update.postType = postType;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update." },
        { status: 400 },
      );
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, select: "title tags coverImage postType updatedAt" },
    ).lean();

    return NextResponse.json(
      {
        message: "Post updated successfully.",
        post: {
          id,
          title: updated?.title,
          tags: updated?.tags,
          coverImage: updated?.coverImage ?? null,
          postType: updated?.postType,
          updatedAt: updated?.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ── DELETE /api/posts/[id] ────────────────────────────────────────────────────
// Deletes a post. Only the post's author may delete it.
//
// Response 200:
//   { message: string }
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to delete a post." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).select("authorId").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not allowed to delete this post." },
        { status: 403 },
      );
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Post deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

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
