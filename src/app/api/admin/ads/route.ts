import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/ads
 *
 * Returns a paginated list of all ads for the admin panel.
 *
 * Query parameters:
 *   page        number  (default 1)
 *   limit       number  (default 20, max 100)
 *   search      string  (optional — searches title)
 *   placement   string  (optional — "sidebar" | "feed" | "banner")
 *   active      string  (optional — "true" | "false")
 *   sort        string  (optional — "newest" | "oldest" | "priority" | "most_clicks", default "newest")
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
    const placement = searchParams.get("placement")?.trim();
    const active = searchParams.get("active");
    const sort = searchParams.get("sort") ?? "newest";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Text search on title
    if (search && search.length > 0) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Filter by placement
    const validPlacements = ["sidebar", "feed", "banner"];
    if (placement && validPlacements.includes(placement)) {
      filter.placement = placement;
    }

    // Filter by active status
    if (active === "true") {
      filter.isActive = true;
    } else if (active === "false") {
      filter.isActive = false;
    }

    // Determine sort order
    let sortOption: Record<string, 1 | -1>;
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "priority":
        sortOption = { priority: -1, createdAt: -1 };
        break;
      case "most_clicks":
        sortOption = { clicks: -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const [ads, total] = await Promise.all([
      Ad.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Ad.countDocuments(filter),
    ]);

    const sanitizedAds = ads.map((ad) => ({
      id: ad._id.toString(),
      title: ad.title,
      content: ad.content,
      coverImage: ad.coverImage ?? null,
      linkUrl: ad.linkUrl ?? null,
      placement: ad.placement,
      isActive: ad.isActive ?? true,
      startDate: ad.startDate ?? null,
      endDate: ad.endDate ?? null,
      priority: ad.priority ?? 0,
      tags: ad.tags ?? [],
      createdBy: ad.createdBy,
      createdByName: ad.createdByName ?? null,
      updatedBy: ad.updatedBy ?? null,
      updatedByName: ad.updatedByName ?? null,
      impressions: ad.impressions ?? 0,
      clicks: ad.clicks ?? 0,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    }));

    return NextResponse.json(
      {
        ads: sanitizedAds,
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
    console.error("[GET /api/admin/ads]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/ads
 *
 * Creates a new ad.
 *
 * Body (JSON):
 *   title       string   (required)
 *   content     string   (required — HTML from TipTap editor)
 *   coverImage  string   (optional)
 *   linkUrl     string   (optional)
 *   placement   string   (optional — "sidebar" | "feed" | "banner", default "sidebar")
 *   isActive    boolean  (optional, default true)
 *   startDate   string   (optional — ISO date)
 *   endDate     string   (optional — ISO date)
 *   priority    number   (optional, default 0)
 *   tags        string[] (optional, max 4)
 */
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const {
      title,
      content,
      coverImage,
      linkUrl,
      placement,
      isActive,
      startDate,
      endDate,
      priority,
      tags,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Ad title is required." },
        { status: 400 },
      );
    }

    if (title.trim().length > 300) {
      return NextResponse.json(
        { error: "Title cannot exceed 300 characters." },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Ad content is required." },
        { status: 400 },
      );
    }

    // Validate placement
    const validPlacements = ["sidebar", "feed", "banner"];
    const adPlacement =
      placement && validPlacements.includes(placement) ? placement : "sidebar";

    // Validate priority
    const adPriority =
      typeof priority === "number"
        ? Math.min(100, Math.max(0, Math.round(priority)))
        : 0;

    // Validate tags
    let adTags: string[] = [];
    if (Array.isArray(tags)) {
      adTags = (tags as unknown[])
        .filter(
          (t) => typeof t === "string" && (t as string).trim().length > 0,
        )
        .map((t) => (t as string).trim().toLowerCase())
        .slice(0, 4);
    }

    // Validate dates
    let adStartDate: Date | undefined;
    let adEndDate: Date | undefined;

    if (startDate) {
      const parsed = new Date(startDate);
      if (!isNaN(parsed.getTime())) {
        adStartDate = parsed;
      }
    }

    if (endDate) {
      const parsed = new Date(endDate);
      if (!isNaN(parsed.getTime())) {
        adEndDate = parsed;
      }
    }

    if (adStartDate && adEndDate && adEndDate <= adStartDate) {
      return NextResponse.json(
        { error: "End date must be after start date." },
        { status: 400 },
      );
    }

    const ad = await Ad.create({
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage && typeof coverImage === "string" ? coverImage.trim() : undefined,
      linkUrl: linkUrl && typeof linkUrl === "string" ? linkUrl.trim() : undefined,
      placement: adPlacement,
      isActive: typeof isActive === "boolean" ? isActive : true,
      startDate: adStartDate,
      endDate: adEndDate,
      priority: adPriority,
      tags: adTags,
      createdBy: session.user.id,
      createdByName: session.user.name ?? session.user.email ?? "Admin",
      impressions: 0,
      clicks: 0,
    });

    return NextResponse.json(
      {
        message: "Ad created successfully.",
        ad: {
          id: ad._id.toString(),
          title: ad.title,
          content: ad.content,
          coverImage: ad.coverImage ?? null,
          linkUrl: ad.linkUrl ?? null,
          placement: ad.placement,
          isActive: ad.isActive,
          startDate: ad.startDate ?? null,
          endDate: ad.endDate ?? null,
          priority: ad.priority,
          tags: ad.tags,
          createdBy: ad.createdBy,
          createdByName: ad.createdByName ?? null,
          impressions: 0,
          clicks: 0,
          createdAt: ad.createdAt,
          updatedAt: ad.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/ads]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
