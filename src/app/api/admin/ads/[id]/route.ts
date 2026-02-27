import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import Ad from "@/models/Ad";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/ads/[id]
 *
 * Returns detailed information about a single ad for the admin panel.
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
      return NextResponse.json({ error: "Invalid ad ID." }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(id).lean();

    if (!ad) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ad: {
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
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/ads/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/ads/[id]
 *
 * Allows an admin to perform actions on an ad:
 *
 * Body (JSON):
 *   action      "update" | "toggle_active"
 *
 * For "toggle_active":
 *   Flips the isActive boolean.
 *
 * For "update":
 *   title       string   (optional)
 *   content     string   (optional)
 *   coverImage  string | null (optional)
 *   linkUrl     string | null (optional)
 *   placement   "sidebar" | "feed" | "banner" (optional)
 *   isActive    boolean  (optional)
 *   startDate   string | null (optional — ISO date)
 *   endDate     string | null (optional — ISO date)
 *   priority    number   (optional)
 *   tags        string[] (optional)
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
      return NextResponse.json({ error: "Invalid ad ID." }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(id);

    if (!ad) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "An 'action' field is required." },
        { status: 400 },
      );
    }

    const validActions = ["update", "toggle_active"];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    switch (action) {
      case "toggle_active": {
        ad.isActive = !ad.isActive;
        ad.updatedBy = session.user.id;
        ad.updatedByName = session.user.name ?? session.user.email ?? "Admin";
        await ad.save();

        return NextResponse.json(
          {
            message: `Ad has been ${ad.isActive ? "activated" : "deactivated"} successfully.`,
            ad: {
              id: ad._id.toString(),
              isActive: ad.isActive,
              updatedBy: ad.updatedBy,
              updatedByName: ad.updatedByName,
            },
          },
          { status: 200 },
        );
      }

      case "update": {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const update: Record<string, any> = {};

        if (title !== undefined) {
          if (typeof title !== "string" || title.trim().length === 0) {
            return NextResponse.json(
              { error: "Ad title cannot be empty." },
              { status: 400 },
            );
          }
          if (title.trim().length > 300) {
            return NextResponse.json(
              { error: "Title cannot exceed 300 characters." },
              { status: 400 },
            );
          }
          update.title = title.trim();
        }

        if (content !== undefined) {
          if (typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json(
              { error: "Ad content cannot be empty." },
              { status: 400 },
            );
          }
          update.content = content.trim();
        }

        if (coverImage !== undefined) {
          update.coverImage =
            coverImage === null || coverImage === "" ? undefined : coverImage;
        }

        if (linkUrl !== undefined) {
          update.linkUrl =
            linkUrl === null || linkUrl === ""
              ? undefined
              : typeof linkUrl === "string"
                ? linkUrl.trim()
                : undefined;
        }

        if (placement !== undefined) {
          const validPlacements = ["sidebar", "feed", "banner"];
          if (!validPlacements.includes(placement)) {
            return NextResponse.json(
              {
                error:
                  "Placement must be 'sidebar', 'feed', or 'banner'.",
              },
              { status: 400 },
            );
          }
          update.placement = placement;
        }

        if (isActive !== undefined) {
          if (typeof isActive !== "boolean") {
            return NextResponse.json(
              { error: "isActive must be a boolean." },
              { status: 400 },
            );
          }
          update.isActive = isActive;
        }

        if (startDate !== undefined) {
          if (startDate === null) {
            update.startDate = undefined;
          } else {
            const parsed = new Date(startDate);
            if (isNaN(parsed.getTime())) {
              return NextResponse.json(
                { error: "Invalid start date format." },
                { status: 400 },
              );
            }
            update.startDate = parsed;
          }
        }

        if (endDate !== undefined) {
          if (endDate === null) {
            update.endDate = undefined;
          } else {
            const parsed = new Date(endDate);
            if (isNaN(parsed.getTime())) {
              return NextResponse.json(
                { error: "Invalid end date format." },
                { status: 400 },
              );
            }
            update.endDate = parsed;
          }
        }

        // Cross-validate dates
        const finalStartDate = update.startDate ?? ad.startDate;
        const finalEndDate = update.endDate ?? ad.endDate;
        if (
          finalStartDate &&
          finalEndDate &&
          new Date(finalEndDate) <= new Date(finalStartDate)
        ) {
          return NextResponse.json(
            { error: "End date must be after start date." },
            { status: 400 },
          );
        }

        if (priority !== undefined) {
          if (typeof priority !== "number") {
            return NextResponse.json(
              { error: "Priority must be a number." },
              { status: 400 },
            );
          }
          update.priority = Math.min(100, Math.max(0, Math.round(priority)));
        }

        if (tags !== undefined) {
          if (!Array.isArray(tags)) {
            return NextResponse.json(
              { error: "Tags must be an array of strings." },
              { status: 400 },
            );
          }
          update.tags = (tags as unknown[])
            .filter(
              (t) =>
                typeof t === "string" && (t as string).trim().length > 0,
            )
            .map((t) => (t as string).trim().toLowerCase())
            .slice(0, 4);
        }

        if (Object.keys(update).length === 0) {
          return NextResponse.json(
            { error: "No valid fields provided for update." },
            { status: 400 },
          );
        }

        // Track who updated
        update.updatedBy = session.user.id;
        update.updatedByName =
          session.user.name ?? session.user.email ?? "Admin";

        const updated = await Ad.findByIdAndUpdate(
          id,
          { $set: update },
          { new: true },
        ).lean();

        return NextResponse.json(
          {
            message: "Ad updated successfully.",
            ad: {
              id,
              title: updated?.title,
              content: updated?.content,
              coverImage: updated?.coverImage ?? null,
              linkUrl: updated?.linkUrl ?? null,
              placement: updated?.placement,
              isActive: updated?.isActive,
              startDate: updated?.startDate ?? null,
              endDate: updated?.endDate ?? null,
              priority: updated?.priority ?? 0,
              tags: updated?.tags ?? [],
              updatedBy: updated?.updatedBy ?? null,
              updatedByName: updated?.updatedByName ?? null,
              updatedAt: updated?.updatedAt,
            },
          },
          { status: 200 },
        );
      }

      default: {
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
      }
    }
  } catch (err) {
    console.error("[PATCH /api/admin/ads/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/ads/[id]
 *
 * Permanently deletes an ad. This action cannot be undone.
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
      return NextResponse.json({ error: "Invalid ad ID." }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(id).lean();

    if (!ad) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }

    await Ad.findByIdAndDelete(id);

    return NextResponse.json(
      {
        message: "Ad has been permanently deleted.",
        deletedAd: {
          id: ad._id.toString(),
          title: ad.title,
          createdBy: ad.createdBy,
          createdByName: ad.createdByName ?? null,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/admin/ads/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
