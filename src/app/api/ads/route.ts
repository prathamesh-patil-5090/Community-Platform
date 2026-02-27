import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ads
 *
 * Returns active ads for public display, filtered by placement.
 * Respects startDate/endDate scheduling — only returns ads
 * whose schedule window includes the current time (or has no schedule).
 *
 * Query parameters:
 *   placement   string  (optional — "sidebar" | "feed" | "banner"; defaults to all)
 *   limit       number  (optional — max ads to return, default 5, max 20)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const placement = searchParams.get("placement")?.trim();
    const limit = Math.min(
      20,
      Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10)),
    );

    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    // Filter by placement if provided
    const validPlacements = ["sidebar", "feed", "banner"];
    if (placement && validPlacements.includes(placement)) {
      filter.placement = placement;
    }

    const ads = await Ad.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .select("title content coverImage linkUrl placement tags priority")
      .lean();

    const sanitizedAds = ads.map((ad) => ({
      id: ad._id.toString(),
      title: ad.title,
      content: ad.content,
      coverImage: ad.coverImage ?? null,
      linkUrl: ad.linkUrl ?? null,
      placement: ad.placement,
      tags: ad.tags ?? [],
    }));

    return NextResponse.json({ ads: sanitizedAds }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/ads]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
