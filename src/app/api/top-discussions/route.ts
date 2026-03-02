import connectDB from "@/lib/mongodb";
import FeaturedDiscussion from "@/models/FeaturedDiscussion";
import Post from "@/models/Post";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/top-discussions
 *
 * Returns top discussions for public display.
 *
 * Strategy:
 *   1. First, return all admin-curated featured discussions (ordered by `order` asc).
 *   2. If fewer than `limit` results, backfill with the most-commented
 *      non-hidden posts that aren't already in the featured list.
 *
 * Query parameters:
 *   limit   number  (optional — max discussions to return, default 7, max 15)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const limit = Math.min(
      15,
      Math.max(1, parseInt(searchParams.get("limit") ?? "7", 10)),
    );

    // 1. Fetch admin-curated featured discussions
    const featured = await FeaturedDiscussion.find({})
      .sort({ order: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    const results: {
      id: string;
      postId: string;
      postTitle: string;
      postLink: string;
      commentsCount: number;
      isFeatured: boolean;
      selectedBy?: string;
      selectedByName?: string;
    }[] = featured.map((f) => ({
      id: f._id.toString(),
      postId: f.postId,
      postTitle: f.postTitle,
      postLink: f.postLink,
      commentsCount: f.commentsCount,
      isFeatured: true,
      selectedBy: f.selectedBy,
      selectedByName: f.selectedByName,
    }));

    // 2. If we need more, backfill from popular posts
    const remaining = limit - results.length;

    if (remaining > 0) {
      const featuredPostIds = results.map((r) => r.postId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postFilter: Record<string, any> = {
        isHidden: { $ne: true },
      };

      if (featuredPostIds.length > 0) {
        postFilter.$expr = {
          $not: {
            $in: [{ $toString: "$_id" }, featuredPostIds],
          },
        };
      }

      const popularPosts = await Post.find(postFilter)
        .sort({ "commentList": -1, likes: -1, createdAt: -1 })
        .limit(remaining * 3) // fetch extra so we can sort by comment count in JS
        .select("_id title commentList likes createdAt")
        .lean();

      // Sort by actual commentList length descending, then likes
      const sorted = popularPosts
        .map((p) => ({
          id: p._id.toString(),
          postId: p._id.toString(),
          postTitle: p.title,
          postLink: `/posts/${p._id.toString()}`,
          commentsCount: p.commentList?.length ?? 0,
          likes: p.likes ?? 0,
          isFeatured: false as const,
        }))
        .sort((a, b) => {
          if (b.commentsCount !== a.commentsCount)
            return b.commentsCount - a.commentsCount;
          return b.likes - a.likes;
        })
        .slice(0, remaining);

      for (const post of sorted) {
        results.push({
          id: post.id,
          postId: post.postId,
          postTitle: post.postTitle,
          postLink: post.postLink,
          commentsCount: post.commentsCount,
          isFeatured: false,
        });
      }
    }

    return NextResponse.json({ discussions: results }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/top-discussions]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
