import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view posts." },
        { status: 401 },
      );
    }

    await connectDB();

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
    if (author) filter.authorId = author;
    if (tag) filter.tags = tag;

    // Check if the current user is an admin — only admins see hidden posts
    const dbUser = await User.findById(session.user.id).select("role").lean();
    const isAdmin = dbUser?.role === "admin";

    // Non-admin users should never see hidden posts
    if (!isAdmin) {
      filter.isHidden = { $ne: true };
    }

    const currentUserId = session.user.id;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const annotatedPosts = posts.map((post) => ({
      ...post,
      userHasLiked: Array.isArray(post.likedBy)
        ? post.likedBy.includes(currentUserId)
        : false,
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
