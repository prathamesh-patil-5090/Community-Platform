import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    await connectDB();

    const posts = await Post.find({ "commentList.authorId": id })
      .select("_id title commentList")
      .lean();

    type CommentResult = {
      id: string;
      text: string;
      postId: string;
      postTitle: string;
      createdAt: Date | string;
    };

    const comments: CommentResult[] = posts
      .flatMap((post) =>
        (post.commentList ?? [])
          .filter((c) => c.authorId === id)
          .map((c) => ({
            id: c._id?.toString() ?? "",
            text: c.text,
            postId: post._id.toString(),
            postTitle: post.title,
            createdAt: c.createdAt,
          })),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/users/[id]/comments]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
