import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAd extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  coverImage?: string;
  linkUrl?: string;
  placement: "sidebar" | "feed" | "banner";
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  tags: string[];
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    title: {
      type: String,
      required: [true, "Ad title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Ad content is required"],
    },
    coverImage: {
      type: String,
    },
    linkUrl: {
      type: String,
      trim: true,
    },
    placement: {
      type: String,
      enum: ["sidebar", "feed", "banner"],
      default: "sidebar",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 4,
        message: "An ad can have at most 4 tags",
      },
    },
    createdBy: {
      type: String,
      required: [true, "Creator ID is required"],
      index: true,
    },
    createdByName: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
    updatedByName: {
      type: String,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

AdSchema.index({ isActive: 1, placement: 1, priority: -1 });
AdSchema.index({ startDate: 1, endDate: 1 });

const Ad: Model<IAd> =
  mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema);

export default Ad;
