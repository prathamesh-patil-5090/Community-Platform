import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  text: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  createdAt: Date;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  tags: string[];
  content: string;
  coverImage?: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  postType: "Article" | "Post";
  likes: number;
  likedBy: string[];
  comments: string[];
  commentList: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    authorId: {
      type: String,
      required: [true, "Comment author ID is required"],
    },
    authorName: {
      type: String,
    },
    authorImage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 4,
        message: "A post can have at most 4 tags",
      },
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
    },
    coverImage: {
      type: String,
    },
    authorId: {
      type: String,
      required: [true, "Author ID is required"],
      index: true,
    },
    authorName: {
      type: String,
    },
    authorImage: {
      type: String,
    },
    postType: {
      type: String,
      enum: ["Article", "Post"],
      default: "Post",
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [String],
      default: [],
      index: true,
    },
    comments: {
      type: [String],
      default: [],
    },
    commentList: {
      type: [CommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

PostSchema.index({ title: "text", tags: "text" });

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
