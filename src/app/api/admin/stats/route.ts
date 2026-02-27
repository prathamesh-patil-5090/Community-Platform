import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 *
 * Returns high-level dashboard statistics for the admin panel:
 *   - totalUsers: total registered users
 *   - totalPosts: total posts created
 *   - bannedUsers: number of currently banned users
 *   - hiddenPosts: number of currently hidden posts
 *   - totalComments: total comments across all posts
 *   - recentUsers: users registered in the last 7 days
 *   - recentPosts: posts created in the last 7 days
 */
export async function GET() {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalPosts,
      bannedUsers,
      hiddenPosts,
      recentUsers,
      recentPosts,
      commentsAgg,
      totalAds,
      activeAds,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Post.countDocuments({ isHidden: true }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.aggregate([
        {
          $project: {
            commentCount: { $size: { $ifNull: ["$commentList", []] } },
          },
        },
        { $group: { _id: null, total: { $sum: "$commentCount" } } },
      ]),
      Ad.countDocuments(),
      Ad.countDocuments({ isActive: true }),
    ]);

    const totalComments: number = commentsAgg[0]?.total ?? 0;

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          totalPosts,
          bannedUsers,
          hiddenPosts,
          totalComments,
          recentUsers,
          recentPosts,
          totalAds,
          activeAds,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
