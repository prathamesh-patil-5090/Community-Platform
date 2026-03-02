import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import CommunityPage from "@/models/CommunityPage";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/community-pages/[id]
 *
 * Returns detailed information about a single community page for the admin panel.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid community page ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const page = await CommunityPage.findById(id).lean();

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
          isActive: page.isActive,
          order: page.order,
          createdBy: page.createdBy,
          createdByName: page.createdByName ?? null,
          updatedBy: page.updatedBy ?? null,
          updatedByName: page.updatedByName ?? null,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/community-pages/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/community-pages/[id]
 *
 * Updates a community page. Supports two modes:
 *
 * 1. Toggle active:
 *    Body: { action: "toggle_active" }
 *
 * 2. General update:
 *    Body: { name?, slug?, icon?, description?, content?, coverImage?, isActive?, order? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid community page ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const page = await CommunityPage.findById(id);

    if (!page) {
      return NextResponse.json(
        { error: "Community page not found." },
        { status: 404 },
      );
    }

    const body = await req.json();
    const adminId = session.user.id!;
    const adminName =
      session.user.name ?? session.user.email?.split("@")[0] ?? "Admin";

    /* ── Toggle active mode ──────────────────────────────────────────────── */
    if (body.action === "toggle_active") {
      page.isActive = !page.isActive;
      page.updatedBy = adminId;
      page.updatedByName = adminName;
      await page.save();

      return NextResponse.json(
        {
          message: page.isActive
            ? "Community page activated."
            : "Community page deactivated.",
          page: {
            id: page._id.toString(),
            name: page.name,
            slug: page.slug,
            icon: page.icon,
            isActive: page.isActive,
            updatedBy: page.updatedBy,
            updatedByName: page.updatedByName,
          },
        },
        { status: 200 },
      );
    }

    /* ── General update mode ─────────────────────────────────────────────── */
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

    // Validate and apply name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Page name cannot be empty." },
          { status: 400 },
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: "Page name cannot exceed 100 characters." },
          { status: 400 },
        );
      }
      page.name = name.trim();
    }

    // Validate and apply slug
    if (slug !== undefined) {
      if (typeof slug !== "string" || !slug.trim()) {
        return NextResponse.json(
          { error: "Slug cannot be empty." },
          { status: 400 },
        );
      }

      const normalizedSlug = slug.trim().toLowerCase();

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
        return NextResponse.json(
          {
            error:
              "Slug must be lowercase alphanumeric with hyphens only (e.g. 'tech-talk').",
          },
          { status: 400 },
        );
      }

      // Prevent reserved slugs
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

      // Check uniqueness (excluding this page)
      if (normalizedSlug !== page.slug) {
        const existing = await CommunityPage.findOne({
          slug: normalizedSlug,
          _id: { $ne: page._id },
        });
        if (existing) {
          return NextResponse.json(
            {
              error: `A community page with slug "${normalizedSlug}" already exists.`,
            },
            { status: 409 },
          );
        }
      }

      page.slug = normalizedSlug;
    }

    // Validate and apply icon
    if (icon !== undefined) {
      if (typeof icon !== "string" || !icon.trim()) {
        return NextResponse.json(
          { error: "Icon (emoji) cannot be empty." },
          { status: 400 },
        );
      }
      if (icon.trim().length > 10) {
        return NextResponse.json(
          { error: "Icon cannot exceed 10 characters." },
          { status: 400 },
        );
      }
      page.icon = icon.trim();
    }

    // Validate and apply description
    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return NextResponse.json(
          { error: "Description cannot be empty." },
          { status: 400 },
        );
      }
      if (description.trim().length > 500) {
        return NextResponse.json(
          { error: "Description cannot exceed 500 characters." },
          { status: 400 },
        );
      }
      page.description = description.trim();
    }

    // Apply content (TipTap HTML)
    if (content !== undefined) {
      if (typeof content !== "string") {
        return NextResponse.json(
          { error: "Content must be a string." },
          { status: 400 },
        );
      }
      page.content = content;
    }

    // Apply cover image
    if (coverImage !== undefined) {
      if (coverImage === null || coverImage === "") {
        page.coverImage = undefined;
      } else if (typeof coverImage === "string") {
        page.coverImage = coverImage.trim();
      }
    }

    // Apply isActive
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean." },
          { status: 400 },
        );
      }
      page.isActive = isActive;
    }

    // Apply order
    if (order !== undefined) {
      if (typeof order !== "number") {
        return NextResponse.json(
          { error: "Order must be a number." },
          { status: 400 },
        );
      }
      page.order = Math.max(0, Math.floor(order));
    }

    // Set updater info
    page.updatedBy = adminId;
    page.updatedByName = adminName;

    await page.save();

    return NextResponse.json(
      {
        message: "Community page updated successfully.",
        page: {
          id: page._id.toString(),
          name: page.name,
          slug: page.slug,
          icon: page.icon,
          description: page.description,
          content: page.content ?? "",
          coverImage: page.coverImage ?? null,
          isActive: page.isActive,
          order: page.order,
          createdBy: page.createdBy,
          createdByName: page.createdByName ?? null,
          updatedBy: page.updatedBy,
          updatedByName: page.updatedByName,
          createdAt: page.createdAt.toISOString(),
          updatedAt: page.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[PATCH /api/admin/community-pages/[id]]", err);

    // Handle duplicate key error (race condition on slug)
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

/**
 * DELETE /api/admin/community-pages/[id]
 *
 * Permanently deletes a community page.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid community page ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const page = await CommunityPage.findByIdAndDelete(id);

    if (!page) {
      return NextResponse.json(
        { error: "Community page not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message: "Community page deleted permanently.",
        deletedId: id,
        name: page.name,
        slug: page.slug,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/admin/community-pages/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
