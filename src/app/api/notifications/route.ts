import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/notifications
 *
 * Returns paginated notifications for the current user.
 *
 * Query parameters:
 *   type     string   (optional) — "all" | "new_post" | "comment_on_post" — defaults to "all"
 *   page     number   (optional) — page number, defaults to 1
 *   limit    number   (optional) — results per page, defaults to 20, max 50
 *   unread   string   (optional) — "true" to only return unread notifications
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to view notifications." },
        { status: 401 },
      );
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") ?? "all";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const unreadOnly = searchParams.get("unread") === "true";

    await connectDB();

    const userId = session.user.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { recipientId: userId };

    if (type !== "all") {
      const validTypes = ["new_post", "comment_on_post"];
      if (validTypes.includes(type)) {
        filter.type = type;
      }
    }

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    const results = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      isRead: n.isRead,
      actorId: n.actorId,
      actorName: n.actorName ?? "Anonymous",
      actorImage: n.actorImage ?? null,
      postId: n.postId,
      postTitle: n.postTitle,
      postTags: n.postTags ?? [],
      postLink: `/posts/${n.postId}`,
      commentId: n.commentId ?? null,
      commentText: n.commentText ?? null,
      createdAt: n.createdAt,
    }));

    return NextResponse.json(
      {
        notifications: results,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 *
 * Mark notifications as read.
 *
 * Body (JSON):
 *   ids       string[]   (optional) — specific notification IDs to mark as read
 *   markAll   boolean    (optional) — if true, marks ALL notifications as read (ignores ids)
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { ids, markAll } = body;

    await connectDB();

    const userId = session.user.id;

    if (markAll === true) {
      const result = await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { $set: { isRead: true } },
      );

      return NextResponse.json(
        {
          message: "All notifications marked as read.",
          modifiedCount: result.modifiedCount,
        },
        { status: 200 },
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of notification 'ids' or set 'markAll' to true." },
        { status: 400 },
      );
    }

    // Limit batch size to prevent abuse
    const limitedIds = ids.slice(0, 100);

    const result = await Notification.updateMany(
      {
        _id: { $in: limitedIds },
        recipientId: userId,
      },
      { $set: { isRead: true } },
    );

    return NextResponse.json(
      {
        message: "Notifications marked as read.",
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications
 *
 * Delete notifications for the current user.
 *
 * Body (JSON):
 *   ids        string[]   (optional) — specific notification IDs to delete
 *   deleteAll  boolean    (optional) — if true, deletes ALL notifications for the user
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { ids, deleteAll } = body;

    await connectDB();

    const userId = session.user.id;

    if (deleteAll === true) {
      const result = await Notification.deleteMany({ recipientId: userId });

      return NextResponse.json(
        {
          message: "All notifications deleted.",
          deletedCount: result.deletedCount,
        },
        { status: 200 },
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Provide an array of notification 'ids' or set 'deleteAll' to true." },
        { status: 400 },
      );
    }

    const limitedIds = ids.slice(0, 100);

    const result = await Notification.deleteMany({
      _id: { $in: limitedIds },
      recipientId: userId,
    });

    return NextResponse.json(
      {
        message: "Notifications deleted.",
        deletedCount: result.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DELETE /api/notifications]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
