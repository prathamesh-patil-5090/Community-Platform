import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/posts/[id]
 *
 * Returns detailed information about a single post for the admin panel.
 */
export async function GET(
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
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        post: {
          id: post._id.toString(),
          title: post.title,
          content: post.content,
          tags: post.tags ?? [],
          coverImage: post.coverImage ?? null,
          postType: post.postType,
          authorId: post.authorId,
          authorName: post.authorName ?? null,
          authorImage: post.authorImage ?? null,
          likes: post.likes ?? 0,
          likedBy: post.likedBy ?? [],
          commentsCount: Array.isArray(post.commentList)
            ? post.commentList.length
            : 0,
          commentList: post.commentList ?? [],
          isHidden: post.isHidden ?? false,
          hiddenBy: post.hiddenBy ?? null,
          hiddenByName: post.hiddenByName ?? null,
          hiddenReason: post.hiddenReason ?? null,
          hiddenAt: post.hiddenAt ?? null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/posts/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/posts/[id]
 *
 * Allows an admin to perform moderation actions on a post:
 *
 * Body (JSON):
 *   action        "hide" | "unhide" | "update"
 *   hiddenReason  string  (optional — used with "hide" action)
 *   title         string  (optional — used with "update" action)
 *   content       string  (optional — used with "update" action)
 *   tags          string[] (optional — used with "update" action)
 *   coverImage    string | null (optional — used with "update" action)
 *   postType      "Post" | "Article" (optional — used with "update" action)
 *
 * Actions:
 *   - hide:    Sets isHidden=true, records hiddenBy (admin ID), hiddenReason, and hiddenAt
 *   - unhide:  Sets isHidden=false, clears hiddenBy, hiddenReason, and hiddenAt
 *   - update:  Updates post fields (title, content, tags, coverImage, postType)
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
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "An 'action' field is required." },
        { status: 400 },
      );
    }

    const validActions = ["hide", "unhide", "update"];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    switch (action) {
      case "hide": {
        const { hiddenReason } = body;

        post.isHidden = true;
        post.hiddenBy = session.user.id;
        post.hiddenByName = session.user.name ?? session.user.email ?? "Admin";
        post.hiddenReason =
          typeof hiddenReason === "string" && hiddenReason.trim().length > 0
            ? hiddenReason.trim()
            : "Hidden by admin";
        post.hiddenAt = new Date();
        await post.save();

        return NextResponse.json(
          {
            message: "Post has been hidden successfully.",
            post: {
              id: post._id.toString(),
              isHidden: post.isHidden,
              hiddenBy: post.hiddenBy,
              hiddenByName: post.hiddenByName,
              hiddenReason: post.hiddenReason,
              hiddenAt: post.hiddenAt,
            },
          },
          { status: 200 },
        );
      }

      case "unhide": {
        post.isHidden = false;
        post.hiddenBy = undefined;
        post.hiddenByName = undefined;
        post.hiddenReason = undefined;
        post.hiddenAt = undefined;
        await post.save();

        return NextResponse.json(
          {
            message: "Post has been unhidden successfully.",
            post: {
              id: post._id.toString(),
              isHidden: false,
              hiddenBy: null,
              hiddenByName: null,
              hiddenReason: null,
              hiddenAt: null,
            },
          },
          { status: 200 },
        );
      }

      case "update": {
        const { title, content, tags, coverImage, postType } = body;

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
            .filter(
              (t) => typeof t === "string" && (t as string).trim().length > 0,
            )
            .map((t) => (t as string).trim().toLowerCase())
            .slice(0, 4);
        }

        if (coverImage !== undefined) {
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
          {
            new: true,
            select: "title tags coverImage postType updatedAt",
          },
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
      }

      default: {
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
      }
    }
  } catch (err) {
    console.error("[PATCH /api/admin/posts/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/posts/[id]
 *
 * Permanently deletes a post. This action cannot be undone.
 * Any post can be deleted by an admin regardless of authorship.
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
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Post has been permanently deleted.",
        deletedPost: {
          id: post._id.toString(),
          title: post.title,
          authorId: post.authorId,
          authorName: post.authorName ?? null,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/admin/posts/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
