import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
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
        { error: "You must be signed in to view a profile." },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const postsCount = await Post.countDocuments({ authorId: id });

    const commentsAgg = await Post.aggregate([
      { $unwind: "$commentList" },
      { $match: { "commentList.authorId": id } },
      { $count: "total" },
    ]);
    const commentsCount: number = commentsAgg[0]?.total ?? 0;

    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name ?? null,
          email: user.email,
          image: user.image ?? null,
          provider: user.provider,
          createdAt: user.createdAt,
          postsCount,
          commentsCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/users/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
