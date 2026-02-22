import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ── DELETE /api/posts/[id]/comments/[commentId] ───────────────────────────────
// Deletes a comment from a post.
// Only the comment's author (or the post's author) can delete a comment.
//
// Response 200:
//   { message: string; commentsCount: number }
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to delete a comment." },
        { status: 401 },
      );
    }

    const { id, commentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: "Invalid comment ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const post = await Post.findById(id)
      .select("authorId commentList")
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const comment = (post.commentList ?? []).find(
      (c) => c._id?.toString() === commentId,
    );

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found." },
        { status: 404 },
      );
    }

    const currentUserId = session.user.id;
    const isCommentAuthor = comment.authorId === currentUserId;
    const isPostAuthor = post.authorId === currentUserId;

    if (!isCommentAuthor && !isPostAuthor) {
      return NextResponse.json(
        { error: "You are not allowed to delete this comment." },
        { status: 403 },
      );
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $pull: {
          commentList: { _id: new mongoose.Types.ObjectId(commentId) },
        },
      },
      { new: true, select: "commentList" },
    ).lean();

    return NextResponse.json(
      {
        message: "Comment deleted successfully.",
        commentsCount: updatedPost?.commentList?.length ?? 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DELETE /api/posts/[id]/comments/[commentId]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
