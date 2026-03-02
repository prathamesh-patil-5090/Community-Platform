import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";
import Post from "@/models/Post";
import User from "@/models/User";

/**
 * Create notifications for all users when a new post is created.
 *
 * Every user except the post author gets a "new_post" notification.
 * Runs in the background — errors are logged but never thrown to the caller.
 */
export async function notifyNewPost(post: {
  postId: string;
  postTitle: string;
  postTags: string[];
  authorId: string;
  authorName?: string;
  authorImage?: string;
}): Promise<void> {
  try {
    await connectDB();

    // Find all non-banned users except the author
    const users = await User.find({
      _id: { $ne: post.authorId },
      isBanned: { $ne: true },
    })
      .select("_id")
      .lean();

    if (users.length === 0) return;

    const notifications = users.map((user) => ({
      recipientId: user._id.toString(),
      type: "new_post" as const,
      actorId: post.authorId,
      actorName: post.authorName ?? "Anonymous",
      actorImage: post.authorImage ?? undefined,
      postId: post.postId,
      postTitle: post.postTitle,
      postTags: post.postTags,
      isRead: false,
    }));

    // Use insertMany with ordered:false so one duplicate doesn't stop the rest
    await Notification.insertMany(notifications, { ordered: false }).catch(
      (err) => {
        // Ignore duplicate key errors (code 11000) — they just mean
        // a notification for this event already exists for that user.
        if (err?.code !== 11000 && err?.writeErrors) {
          const nonDuplicateErrors = err.writeErrors.filter(
            (e: { code: number }) => e.code !== 11000,
          );
          if (nonDuplicateErrors.length > 0) {
            console.error(
              "[notifyNewPost] Non-duplicate insert errors:",
              nonDuplicateErrors,
            );
          }
        }
      },
    );
  } catch (error) {
    console.error("[notifyNewPost] Failed to create notifications:", error);
  }
}

/**
 * Create a notification for the post author when someone comments on their post.
 *
 * The post author gets a "comment_on_post" notification.
 * If the commenter IS the post author, no notification is created.
 * Runs in the background — errors are logged but never thrown to the caller.
 */
export async function notifyCommentOnPost(comment: {
  postId: string;
  commentId: string;
  commentText: string;
  commentAuthorId: string;
  commentAuthorName?: string;
  commentAuthorImage?: string;
}): Promise<void> {
  try {
    await connectDB();

    // Find the post to get the author
    const post = await Post.findById(comment.postId)
      .select("authorId title tags")
      .lean();

    if (!post) {
      console.warn(
        `[notifyCommentOnPost] Post ${comment.postId} not found, skipping notification.`,
      );
      return;
    }

    // Don't notify if the commenter is the post author
    if (post.authorId === comment.commentAuthorId) {
      return;
    }

    // Truncate comment text for the notification preview
    const truncatedComment =
      comment.commentText.length > 200
        ? comment.commentText.substring(0, 200) + "…"
        : comment.commentText;

    await Notification.create({
      recipientId: post.authorId,
      type: "comment_on_post",
      actorId: comment.commentAuthorId,
      actorName: comment.commentAuthorName ?? "Anonymous",
      actorImage: comment.commentAuthorImage ?? undefined,
      postId: comment.postId,
      postTitle: post.title,
      postTags: post.tags ?? [],
      commentId: comment.commentId,
      commentText: truncatedComment,
      isRead: false,
    }).catch((err) => {
      // Ignore duplicate key errors
      if (err?.code === 11000) return;
      throw err;
    });
  } catch (error) {
    console.error(
      "[notifyCommentOnPost] Failed to create notification:",
      error,
    );
  }
}

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    await connectDB();
    return await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });
  } catch (error) {
    console.error("[getUnreadCount] Failed:", error);
    return 0;
  }
}

/**
 * Mark specific notifications as read.
 */
export async function markNotificationsRead(
  userId: string,
  notificationIds: string[],
): Promise<number> {
  try {
    await connectDB();
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipientId: userId,
      },
      { $set: { isRead: true } },
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("[markNotificationsRead] Failed:", error);
    return 0;
  }
}

/**
 * Mark ALL notifications as read for a user.
 */
export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  try {
    await connectDB();
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } },
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("[markAllNotificationsRead] Failed:", error);
    return 0;
  }
}
