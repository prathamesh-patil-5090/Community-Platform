import { requireAdmin } from "@/lib/admin";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/users/[id]
 *
 * Returns detailed information about a single user for the admin panel.
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
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
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
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GET /api/admin/users/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 *
 * Allows an admin to perform moderation actions on a user:
 *
 * Body (JSON) — all fields optional; only provided fields are applied:
 *   action      "ban" | "unban" | "block_ip" | "unblock_ip" | "update_role" | "restrict"
 *   banReason   string          (used with "ban" and "restrict" actions)
 *   ip          string          (used with "block_ip" and "unblock_ip" actions)
 *   role        "user" | "admin" (used with "update_role" action)
 *
 * Actions:
 *   - ban:          Sets isBanned=true, records banReason and bannedAt timestamp
 *   - unban:        Sets isBanned=false, clears banReason and bannedAt
 *   - block_ip:     Adds an IP address to the user's blockedIPs array
 *   - unblock_ip:   Removes an IP address from the user's blockedIPs array
 *   - update_role:  Changes the user's role to "user" or "admin"
 *   - restrict:     Soft restriction — sets isBanned=true with a reason (same as ban but semantic)
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
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    // Prevent admins from modifying their own account through the admin panel
    if (id === session.user.id) {
      return NextResponse.json(
        {
          error: "You cannot modify your own account through the admin panel.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const { action, banReason, ip, role } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "An 'action' field is required." },
        { status: 400 },
      );
    }

    const validActions = [
      "ban",
      "unban",
      "block_ip",
      "unblock_ip",
      "update_role",
      "restrict",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    switch (action) {
      case "ban":
      case "restrict": {
        user.isBanned = true;
        user.banReason =
          typeof banReason === "string" && banReason.trim().length > 0
            ? banReason.trim()
            : action === "restrict"
              ? "Restricted by admin"
              : "Banned by admin";
        user.bannedAt = new Date();
        user.bannedBy = session.user.id;
        user.bannedByName = session.user.name ?? session.user.email ?? "Admin";
        await user.save();

        return NextResponse.json(
          {
            message: `User has been ${action === "restrict" ? "restricted" : "banned"} successfully.`,
            user: {
              id: user._id.toString(),
              isBanned: user.isBanned,
              banReason: user.banReason,
              bannedAt: user.bannedAt,
              bannedBy: user.bannedBy,
              bannedByName: user.bannedByName,
            },
          },
          { status: 200 },
        );
      }

      case "unban": {
        user.isBanned = false;
        user.banReason = undefined;
        user.bannedAt = undefined;
        user.bannedBy = undefined;
        user.bannedByName = undefined;
        await user.save();

        return NextResponse.json(
          {
            message: "User has been unbanned successfully.",
            user: {
              id: user._id.toString(),
              isBanned: false,
              banReason: null,
              bannedAt: null,
              bannedBy: null,
              bannedByName: null,
            },
          },
          { status: 200 },
        );
      }

      case "block_ip": {
        if (!ip || typeof ip !== "string" || ip.trim().length === 0) {
          return NextResponse.json(
            { error: "An 'ip' field is required for block_ip action." },
            { status: 400 },
          );
        }

        const trimmedIP = ip.trim();

        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex =
          /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

        if (!ipv4Regex.test(trimmedIP) && !ipv6Regex.test(trimmedIP)) {
          return NextResponse.json(
            { error: "Invalid IP address format." },
            { status: 400 },
          );
        }

        // Avoid duplicate IPs
        if (!user.blockedIPs.includes(trimmedIP)) {
          user.blockedIPs.push(trimmedIP);
          await user.save();
        }

        // Also ban the user when blocking their IP
        if (!user.isBanned) {
          user.isBanned = true;
          user.banReason =
            typeof banReason === "string" && banReason.trim().length > 0
              ? banReason.trim()
              : `IP ${trimmedIP} blocked by admin`;
          user.bannedAt = new Date();
          user.bannedBy = session.user.id;
          user.bannedByName =
            session.user.name ?? session.user.email ?? "Admin";
          await user.save();
        }

        return NextResponse.json(
          {
            message: `IP address ${trimmedIP} has been blocked for this user.`,
            user: {
              id: user._id.toString(),
              blockedIPs: user.blockedIPs,
              isBanned: user.isBanned,
            },
          },
          { status: 200 },
        );
      }

      case "unblock_ip": {
        if (!ip || typeof ip !== "string" || ip.trim().length === 0) {
          return NextResponse.json(
            { error: "An 'ip' field is required for unblock_ip action." },
            { status: 400 },
          );
        }

        const trimmedIP = ip.trim();

        user.blockedIPs = user.blockedIPs.filter(
          (blocked: string) => blocked !== trimmedIP,
        );
        await user.save();

        return NextResponse.json(
          {
            message: `IP address ${trimmedIP} has been unblocked for this user.`,
            user: {
              id: user._id.toString(),
              blockedIPs: user.blockedIPs,
            },
          },
          { status: 200 },
        );
      }

      case "update_role": {
        const validRoles = ["user", "admin"];
        if (!role || !validRoles.includes(role)) {
          return NextResponse.json(
            { error: "Role must be 'user' or 'admin'." },
            { status: 400 },
          );
        }

        user.role = role;
        await user.save();

        return NextResponse.json(
          {
            message: `User role has been updated to '${role}'.`,
            user: {
              id: user._id.toString(),
              role: user.role,
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
    console.error("[PATCH /api/admin/users/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Permanently deletes a user account. This action cannot be undone.
 * Admin users cannot delete their own account through this endpoint.
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
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json(
        {
          error: "You cannot delete your own account through the admin panel.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(id).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "User has been permanently deleted." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
