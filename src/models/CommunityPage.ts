import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommunityPage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  icon: string;
  description: string;
  content: string;
  craftData?: string;
  coverImage?: string;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPageSchema = new Schema<ICommunityPage>(
  {
    name: {
      type: String,
      required: [true, "Page name is required"],
      trim: true,
      maxlength: [100, "Page name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      trim: true,
      lowercase: true,
      maxlength: [120, "Slug cannot exceed 120 characters"],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric with hyphens only (e.g. 'tech-talk')",
      ],
    },
    icon: {
      type: String,
      required: [true, "Icon (emoji) is required"],
      trim: true,
      maxlength: [10, "Icon cannot exceed 10 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    content: {
      type: String,
      default: "",
    },
    craftData: {
      type: String,
      default: "{}",
    },
    coverImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
      index: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
    },
    updatedByName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Slugs must be unique across all community pages
CommunityPageSchema.index({ slug: 1 }, { unique: true });
// Sort by order for sidebar display
CommunityPageSchema.index({ isActive: 1, order: 1 });

const CommunityPage: Model<ICommunityPage> =
  mongoose.models.CommunityPage ||
  mongoose.model<ICommunityPage>("CommunityPage", CommunityPageSchema);

export default CommunityPage;
