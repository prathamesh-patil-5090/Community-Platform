import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import FeaturedDiscussion from "@/models/FeaturedDiscussion";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/top-discussions
 *
 * Returns all admin-curated featured discussions for the admin panel.
 * Ordered by `order` ascending, then `createdAt` descending.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      filter.postTitle = { $regex: search, $options: "i" };
    }

    const discussions = await FeaturedDiscussion.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const sanitized = discussions.map((d) => ({
      id: d._id.toString(),
      postId: d.postId,
      postTitle: d.postTitle,
      postLink: d.postLink,
      commentsCount: d.commentsCount,
      selectedBy: d.selectedBy,
      selectedByName: d.selectedByName,
      order: d.order,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      { discussions: sanitized, total: sanitized.length },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/top-discussions]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/top-discussions
 *
 * Adds a post as a featured/top discussion.
 *
 * Body:
 *   postId   string   (required — the ID of the post to feature)
 *   order    number   (optional — display order, defaults to 0)
 */
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { postId, order } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { error: "postId is required and must be a string." },
        { status: 400 },
      );
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID." },
        { status: 400 },
      );
    }

    // Check if the post exists
    const post = await Post.findById(postId)
      .select("_id title commentList isHidden")
      .lean();

    if (!post) {
      return NextResponse.json(
        { error: "Post not found." },
        { status: 404 },
      );
    }

    // Check if already featured
    const existing = await FeaturedDiscussion.findOne({ postId });
    if (existing) {
      return NextResponse.json(
        { error: "This post is already featured as a top discussion." },
        { status: 409 },
      );
    }

    const adminId = session.user.id!;
    const adminName =
      session.user.name ?? session.user.email?.split("@")[0] ?? "Admin";

    const discussion = await FeaturedDiscussion.create({
      postId: post._id.toString(),
      postTitle: post.title,
      postLink: `/posts/${post._id.toString()}`,
      commentsCount: post.commentList?.length ?? 0,
      selectedBy: adminId,
      selectedByName: adminName,
      order: typeof order === "number" ? Math.max(0, Math.floor(order)) : 0,
    });

    return NextResponse.json(
      {
        message: "Post added to top discussions.",
        discussion: {
          id: discussion._id.toString(),
          postId: discussion.postId,
          postTitle: discussion.postTitle,
          postLink: discussion.postLink,
          commentsCount: discussion.commentsCount,
          selectedBy: discussion.selectedBy,
          selectedByName: discussion.selectedByName,
          order: discussion.order,
          createdAt: discussion.createdAt.toISOString(),
          updatedAt: discussion.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/top-discussions]", err);

    // Handle duplicate key error (race condition)
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "This post is already featured as a top discussion." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
