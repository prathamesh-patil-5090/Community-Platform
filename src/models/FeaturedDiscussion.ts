import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFeaturedDiscussion extends Document {
  _id: mongoose.Types.ObjectId;
  postId: string;
  postTitle: string;
  postLink: string;
  commentsCount: number;
  selectedBy: string;
  selectedByName: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FeaturedDiscussionSchema = new Schema<IFeaturedDiscussion>(
  {
    postId: {
      type: String,
      required: [true, "Post ID is required"],
      index: true,
    },
    postTitle: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [300, "Post title cannot exceed 300 characters"],
    },
    postLink: {
      type: String,
      required: [true, "Post link is required"],
      trim: true,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    selectedBy: {
      type: String,
      required: [true, "Selector admin ID is required"],
      index: true,
    },
    selectedByName: {
      type: String,
      required: [true, "Selector admin name is required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure a post can only be featured once
FeaturedDiscussionSchema.index({ postId: 1 }, { unique: true });
// Sort by order for display
FeaturedDiscussionSchema.index({ order: 1, createdAt: -1 });

const FeaturedDiscussion: Model<IFeaturedDiscussion> =
  mongoose.models.FeaturedDiscussion ||
  mongoose.model<IFeaturedDiscussion>(
    "FeaturedDiscussion",
    FeaturedDiscussionSchema,
  );

export default FeaturedDiscussion;
