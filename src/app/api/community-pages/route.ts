import connectDB from "@/lib/mongodb";
import CommunityPage from "@/models/CommunityPage";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/community-pages
 *
 * Returns all active community pages for public display (e.g. sidebar).
 * Ordered by `order` ascending, then `createdAt` ascending.
 *
 * Only returns lightweight fields needed for sidebar rendering
 * (not the full page content).
 *
 * Query parameters:
 *   includeContent   "true" | "false"  (optional — default false; if true, includes full content)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const includeContent = searchParams.get("includeContent") === "true";

    const selectFields = includeContent
      ? "name slug icon description content coverImage order"
      : "name slug icon description order";

    const pages = await CommunityPage.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select(selectFields)
      .lean();

    const sanitized = pages.map((page) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = {
        id: page._id.toString(),
        name: page.name,
        slug: page.slug,
        icon: page.icon,
        description: page.description,
        order: page.order,
      };

      if (includeContent) {
        result.content = page.content ?? "";
        result.coverImage = page.coverImage ?? null;
      }

      return result;
    });

    return NextResponse.json({ pages: sanitized }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/community-pages]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
