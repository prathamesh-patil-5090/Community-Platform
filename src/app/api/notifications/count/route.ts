import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

/**
 * GET /api/notifications/count
 *
 * Returns the count of unread notifications for the current user.
 * This is a lightweight endpoint designed to be polled by the Navbar
 * for the notification badge.
 *
 * Response:
 *   { unreadCount: number }
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    await connectDB();

    const unreadCount = await Notification.countDocuments({
      recipientId: session.user.id,
      isRead: false,
    });

    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/notifications/count]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
