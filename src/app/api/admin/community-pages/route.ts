import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import CommunityPage from "@/models/CommunityPage";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/community-pages
 *
 * Returns a paginated list of all community pages for the admin panel.
 *
 * Query parameters:
 *   page      number  (optional — default 1)
 *   limit     number  (optional — default 20, max 100)
 *   search    string  (optional — filters by name or slug)
 *   active    "true" | "false" (optional — filter by isActive)
 *   sort      "order" | "name" | "createdAt" | "updatedAt" (optional — default "order")
 *   dir       "asc" | "desc" (optional — default "asc")
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
    const search = searchParams.get("search")?.trim() ?? "";
    const activeFilter = searchParams.get("active")?.trim();
    const sort = searchParams.get("sort")?.trim() ?? "order";
    const dir = searchParams.get("dir")?.trim() === "desc" ? "desc" : "asc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (activeFilter === "true") {
      filter.isActive = true;
    } else if (activeFilter === "false") {
      filter.isActive = false;
    }

    // Build sort object
    const validSortFields: Record<string, string> = {
      order: "order",
      name: "name",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };
    const sortField = validSortFields[sort] ?? "order";
    const sortDirection = dir === "desc" ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
    if (sortField !== "createdAt") {
      sortObj.createdAt = -1;
    }

    const skip = (page - 1) * limit;
    const [pages, total] = await Promise.all([
      CommunityPage.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityPage.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    const sanitized = pages.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      icon: p.icon,
      description: p.description,
      content: p.content ?? "",
      coverImage: p.coverImage ?? null,
      isActive: p.isActive,
      order: p.order,
      createdBy: p.createdBy,
      createdByName: p.createdByName ?? null,
      updatedBy: p.updatedBy ?? null,
      updatedByName: p.updatedByName ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(
      {
        pages: sanitized,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/community-pages]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/community-pages
 *
 * Creates a new community page.
 *
 * Body:
 *   name          string   (required)
 *   slug          string   (required — lowercase, alphanumeric + hyphens)
 *   icon          string   (required — emoji)
 *   description   string   (required)
 *   content       string   (optional — TipTap HTML content)
 *   coverImage    string   (optional — URL)
 *   isActive      boolean  (optional — default true)
 *   order         number   (optional — default 0)
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
      name,
      slug,
      icon,
      description,
      content,
      coverImage,
      isActive,
      order,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Page name is required." },
        { status: 400 },
      );
    }

    if (!slug || typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json(
        { error: "Slug is required." },
        { status: 400 },
      );
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      return NextResponse.json(
        {
          error:
            "Slug must be lowercase alphanumeric with hyphens only (e.g. 'tech-talk').",
        },
        { status: 400 },
      );
    }

    // Prevent reserved slugs that would conflict with other routes
    const reservedSlugs = [
      "login",
      "register",
      "profile",
      "settings",
      "admin-panel",
      "create-post",
      "posts",
      "api",
      "search",
      "notifications",
    ];
    if (reservedSlugs.includes(normalizedSlug)) {
      return NextResponse.json(
        {
          error: `The slug "${normalizedSlug}" is reserved and cannot be used.`,
        },
        { status: 400 },
      );
    }

    if (!icon || typeof icon !== "string" || !icon.trim()) {
      return NextResponse.json(
        { error: "Icon (emoji) is required." },
        { status: 400 },
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 },
      );
    }

    // Check uniqueness
    const existing = await CommunityPage.findOne({ slug: normalizedSlug });
    if (existing) {
      return NextResponse.json(
        { error: `A community page with slug "${normalizedSlug}" already exists.` },
        { status: 409 },
      );
    }

    const adminId = session.user.id!;
    const adminName =
      session.user.name ?? session.user.email?.split("@")[0] ?? "Admin";

    const page = await CommunityPage.create({
      name: name.trim(),
      slug: normalizedSlug,
      icon: icon.trim(),
      description: description.trim(),
      content: typeof content === "string" ? content : "",
      coverImage: typeof coverImage === "string" && coverImage.trim() ? coverImage.trim() : undefined,
      isActive: typeof isActive === "boolean" ? isActive : true,
      order: typeof order === "number" ? Math.max(0, Math.floor(order)) : 0,
      createdBy: adminId,
      createdByName: adminName,
    });

    return NextResponse.json(
      {
        message: "Community page created successfully.",
        page: {
          id: page._id.toString(),
          name: page.name,
          slug: page.slug,
          icon: page.icon,
          description: page.description,
          content: page.content,
          coverImage: page.coverImage ?? null,
          isActive: page.isActive,
          order: page.order,
          createdBy: page.createdBy,
          createdByName: page.createdByName ?? null,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/community-pages]", err);

    // Handle duplicate key error (race condition)
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "A community page with this slug already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
