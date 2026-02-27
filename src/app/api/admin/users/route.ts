import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/users
 *
 * Returns a paginated list of all users for the admin panel.
 *
 * Query parameters:
 *   page     number  (default 1)
 *   limit    number  (default 20, max 100)
 *   search   string  (optional — searches name and email)
 *   role     string  (optional — filter by "user" or "admin")
 *   banned   string  (optional — "true" or "false" to filter by ban status)
 *   sort     string  (optional — "newest" | "oldest" | "name", default "newest")
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
    const role = searchParams.get("role");
    const banned = searchParams.get("banned");
    const sort = searchParams.get("sort") ?? "newest";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Text search across name and email
    if (search && search.length > 0) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role === "admin" || role === "user") {
      filter.role = role;
    }

    // Filter by ban status
    if (banned === "true") {
      filter.isBanned = true;
    } else if (banned === "false") {
      filter.isBanned = { $ne: true };
    }

    // Determine sort order
    let sortOption: Record<string, 1 | -1>;
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "name":
        sortOption = { name: 1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const sanitizedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name ?? null,
      email: user.email,
      image: user.image ?? null,
      provider: user.provider,
      role: user.role ?? "user",
      isBanned: user.isBanned ?? false,
      banReason: user.banReason ?? null,
      bannedAt: user.bannedAt ?? null,
      bannedBy: user.bannedBy ?? null,
      bannedByName: user.bannedByName ?? null,
      blockedIPs: user.blockedIPs ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(
      {
        users: sanitizedUsers,
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
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
