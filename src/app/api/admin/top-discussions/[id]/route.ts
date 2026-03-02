import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import FeaturedDiscussion from "@/models/FeaturedDiscussion";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/admin/top-discussions/[id]
 *
 * Updates a featured discussion entry (currently supports updating `order`).
 *
 * Body:
 *   order   number   (optional — new display order)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid discussion ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const body = await req.json();
    const { order } = body;

    const discussion = await FeaturedDiscussion.findById(id);

    if (!discussion) {
      return NextResponse.json(
        { error: "Featured discussion not found." },
        { status: 404 },
      );
    }

    if (typeof order === "number") {
      discussion.order = Math.max(0, Math.floor(order));
    }

    await discussion.save();

    return NextResponse.json(
      {
        message: "Featured discussion updated.",
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
      { status: 200 },
    );
  } catch (err) {
    console.error("[PATCH /api/admin/top-discussions/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/top-discussions/[id]
 *
 * Removes a post from the featured/top discussions list.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid discussion ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const discussion = await FeaturedDiscussion.findByIdAndDelete(id);

    if (!discussion) {
      return NextResponse.json(
        { error: "Featured discussion not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message: "Post removed from top discussions.",
        deletedId: id,
        postTitle: discussion.postTitle,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/admin/top-discussions/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
