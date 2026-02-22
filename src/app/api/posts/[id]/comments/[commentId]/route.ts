import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to edit a comment." },
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

    const post = await Post.findById(id).select("commentList").lean();

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

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not allowed to edit this comment." },
        { status: 403 },
      );
    }

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        "commentList._id": new mongoose.Types.ObjectId(commentId),
      },
      {
        $set: { "commentList.$.text": text.trim() },
      },
      { new: true, select: "commentList" },
    ).lean();

    const updatedComment = (updatedPost?.commentList ?? []).find(
      (c) => c._id?.toString() === commentId,
    );

    return NextResponse.json(
      {
        comment: {
          id: updatedComment?._id?.toString() ?? commentId,
          text: updatedComment?.text ?? text.trim(),
          authorId: updatedComment?.authorId ?? comment.authorId,
          authorName:
            updatedComment?.authorName ?? comment.authorName ?? "Anonymous",
          authorImage:
            updatedComment?.authorImage ?? comment.authorImage ?? null,
          createdAt: updatedComment?.createdAt ?? comment.createdAt,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/posts/[id]/comments/[commentId]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

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

    const post = await Post.findById(id).select("authorId commentList").lean();

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
