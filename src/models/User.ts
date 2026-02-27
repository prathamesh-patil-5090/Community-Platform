import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email: string;
  password?: string;
  image?: string;
  provider: "credentials" | "github" | "google";
  role: "user" | "admin";
  isBanned: boolean;
  banReason?: string;
  bannedAt?: Date;
  bannedBy?: string;
  bannedByName?: string;
  blockedIPs: string[];
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    image: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["credentials", "github", "google"],
      default: "credentials",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      trim: true,
    },
    bannedAt: {
      type: Date,
    },
    bannedBy: {
      type: String,
    },
    bannedByName: {
      type: String,
      trim: true,
    },
    blockedIPs: {
      type: [String],
      default: [],
    },
    emailVerified: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
