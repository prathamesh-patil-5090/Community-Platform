import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/posts
 *
 * Returns a paginated list of all posts for the admin panel.
 *
 * Query parameters:
 *   page     number  (default 1)
 *   limit    number  (default 20, max 100)
 *   search   string  (optional — searches title)
 *   hidden   string  (optional — "true" or "false" to filter by hidden status)
 *   author   string  (optional — filter by authorId)
 *   tag      string  (optional — filter by tag)
 *   sort     string  (optional — "newest" | "oldest" | "most_liked" | "most_commented", default "newest")
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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const search = searchParams.get("search")?.trim();
    const hidden = searchParams.get("hidden");
    const author = searchParams.get("author")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const sort = searchParams.get("sort") ?? "newest";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Text search on title
    if (search && search.length > 0) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Filter by hidden status
    if (hidden === "true") {
      filter.isHidden = true;
    } else if (hidden === "false") {
      filter.isHidden = { $ne: true };
    }

    // Filter by author ID
    if (author && author.length > 0) {
      filter.authorId = author;
    }

    // Filter by tag
    if (tag && tag.length > 0) {
      filter.tags = tag.toLowerCase();
    }

    // Determine sort order
    let sortOption: Record<string, 1 | -1>;
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "most_liked":
        sortOption = { likes: -1, createdAt: -1 };
        break;
      case "most_commented":
        sortOption = { "commentList.length": -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const sanitizedPosts = posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      tags: post.tags ?? [],
      coverImage: post.coverImage ?? null,
      postType: post.postType,
      authorId: post.authorId,
      authorName: post.authorName ?? null,
      authorImage: post.authorImage ?? null,
      likes: post.likes ?? 0,
      commentsCount: Array.isArray(post.commentList)
        ? post.commentList.length
        : 0,
      isHidden: post.isHidden ?? false,
      hiddenBy: post.hiddenBy ?? null,
      hiddenByName: post.hiddenByName ?? null,
      hiddenReason: post.hiddenReason ?? null,
      hiddenAt: post.hiddenAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return NextResponse.json(
      {
        posts: sanitizedPosts,
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
  } catch (err) {
    console.error("[GET /api/admin/posts]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
