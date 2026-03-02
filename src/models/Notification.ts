import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipientId: string;
  type: "new_post" | "comment_on_post";
  isRead: boolean;
  // The user who triggered the notification
  actorId: string;
  actorName?: string;
  actorImage?: string;
  // Related post
  postId: string;
  postTitle: string;
  postTags: string[];
  // Related comment (only for comment_on_post)
  commentId?: string;
  commentText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: String,
      required: [true, "Recipient ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["new_post", "comment_on_post"],
      required: [true, "Notification type is required"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    actorId: {
      type: String,
      required: [true, "Actor ID is required"],
    },
    actorName: {
      type: String,
      trim: true,
    },
    actorImage: {
      type: String,
    },
    postId: {
      type: String,
      required: [true, "Post ID is required"],
      index: true,
    },
    postTitle: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
    },
    postTags: {
      type: [String],
      default: [],
    },
    commentId: {
      type: String,
    },
    commentText: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying: unread notifications for a user, sorted by newest
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
// Index for counting unread notifications quickly
NotificationSchema.index({ recipientId: 1, isRead: 1 });
// Prevent duplicate notifications for the same event
NotificationSchema.index(
  { recipientId: 1, type: 1, postId: 1, commentId: 1 },
  { unique: true, partialFilterExpression: { commentId: { $exists: true } } },
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
