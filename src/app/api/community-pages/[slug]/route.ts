import connectDB from "@/lib/mongodb";
import CommunityPage from "@/models/CommunityPage";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/community-pages/[slug]
 *
 * Returns the full data for a single community page identified by its slug.
 * Only returns the page if it is active.
 *
 * Used by the public `[slug]/page.tsx` to render community page content.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();

    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Slug is required." },
        { status: 400 },
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    const page = await CommunityPage.findOne({
      slug: normalizedSlug,
      isActive: true,
    })
      .select(
        "name slug icon description content coverImage order createdAt updatedAt",
      )
      .lean();

    if (!page) {
      return NextResponse.json(
        { error: "Community page not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        page: {
          id: page._id.toString(),
          name: page.name,
          slug: page.slug,
          icon: page.icon,
          description: page.description,
          content: page.content ?? "",
          coverImage: page.coverImage ?? null,
          order: page.order,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/community-pages/[slug]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
