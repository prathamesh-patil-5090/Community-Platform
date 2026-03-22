import { auth } from "@/auth";
import { env } from "@/lib/env";
import connectDB from "@/lib/mongodb";
import { notifyNewPost } from "@/lib/notifications";
import Post from "@/models/Post";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    await connectDB();

    const gravityKey: number = env.GRAVITY_VAL;

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const author = searchParams.get("author");
    const tag = searchParams.get("tag");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (author) {
      const isEmail = author.includes("@");
      if (isEmail) {
        const authorUser = await User.findOne({
          email: author.toLowerCase().trim(),
        })
          .select("_id")
          .lean();
        if (!authorUser) {
          return NextResponse.json(
            {
              posts: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
              },
            },
            { status: 200 },
          );
        }
        filter.authorId = authorUser._id.toString();
      } else {
        filter.authorId = author;
      }
    }

    if (tag) filter.tags = tag;

    let isAdmin = false;
    if (session?.user?.id) {
      const dbUser = await User.findById(session.user.id).select("role").lean();
      isAdmin = dbUser?.role === "admin";
    }

    if (!isAdmin) {
      filter.isHidden = { $ne: true };
    }

    const currentUserId = session?.user?.id;
    const now = new Date();
    const gravity = gravityKey || 1.8;
    const SCALING_FACTOR = 10000;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipeline: any[] = [{ $match: filter }];

    pipeline.push({
      $addFields: {
        ageInHours: {
          $max: [
            0,
            {
              $divide: [{ $subtract: [now, "$createdAt"] }, 1000 * 60 * 60],
            },
          ],
        },
        engagement: {
          $add: [
            { $multiply: [{ $ifNull: ["$likes", 0] }, 1.5] },
            { $multiply: [{ $size: { $ifNull: ["$commentList", []] } }, 2] },
          ],
        },
      },
    });

    const userIdObj =
      currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
        ? new mongoose.Types.ObjectId(currentUserId)
        : currentUserId;

    pipeline.push({
      $addFields: {
        score: {
          $multiply: [
            {
              $divide: [
                { $add: ["$engagement", 1] },
                { $pow: [{ $add: ["$ageInHours", 2] }, gravity] },
              ],
            },
            SCALING_FACTOR,
          ],
        },
        userHasLiked: currentUserId
          ? {
              $or: [
                { $in: [currentUserId, { $ifNull: ["$likedBy", []] }] },
                { $in: [userIdObj, { $ifNull: ["$likedBy", []] }] },
              ],
            }
          : false,
      },
    });

    pipeline.push({ $sort: { score: -1, createdAt: -1 } });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    const [posts, total] = await Promise.all([
      Post.aggregate(pipeline),
      Post.countDocuments(filter),
    ]);

    const annotatedPosts = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      authorId: post.authorId?.toString(),
    }));

    return NextResponse.json(
      {
        posts: annotatedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a post." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { title, content, tags, coverImage, postType } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Post title is required." },
        { status: 400 },
      );
    }

    if (title.trim().length > 300) {
      return NextResponse.json(
        { error: "Title cannot exceed 300 characters." },
        { status: 400 },
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Post content is required." },
        { status: 400 },
      );
    }

    let parsedTags: string[] = [];
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: "Tags must be an array of strings." },
          { status: 400 },
        );
      }
      parsedTags = (tags as unknown[])
        .filter((t) => typeof t === "string" && t.trim().length > 0)
        .map((t) => (t as string).trim().toLowerCase())
        .slice(0, 4); // enforce max 4
    }

    const validPostTypes = ["Post", "Article"];
    const resolvedPostType =
      typeof postType === "string" && validPostTypes.includes(postType)
        ? (postType as "Post" | "Article")
        : "Post";

    await connectDB();

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      tags: parsedTags,
      coverImage: typeof coverImage === "string" ? coverImage : undefined,
      postType: resolvedPostType,
      authorId: session.user.id,
      authorName: session.user.name ?? session.user.email ?? "Anonymous",
      authorImage: session.user.image ?? undefined,
    });

    // Fire-and-forget: notify all other users about the new post
    notifyNewPost({
      postId: post._id.toString(),
      postTitle: post.title,
      postTags: post.tags,
      authorId: post.authorId,
      authorName: post.authorName,
      authorImage: post.authorImage,
    });

    return NextResponse.json(
      {
        message: "Post created successfully.",
        post: {
          id: post._id.toString(),
          title: post.title,
          tags: post.tags,
          coverImage: post.coverImage,
          postType: post.postType,
          authorId: post.authorId,
          authorName: post.authorName,
          createdAt: post.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/posts]", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: string }).name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
