import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import CommunityPage from "@/models/CommunityPage";
import Post from "@/models/Post";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type PipelineStage = mongoose.PipelineStage;

/**
 * GET /api/search
 *
 * Unified search endpoint for the search page.
 *
 * Query parameters:
 *   q        string   (required) — the search query
 *   type     string   (optional) — one of: posts, people, channels, tags, comments, "my posts only"
 *                                   defaults to "posts"
 *   sort     string   (optional) — "Most Relevant" | "Newest" | "Oldest" — defaults to "Most Relevant"
 *   page     number   (optional) — page number, defaults to 1
 *   limit    number   (optional) — results per page, defaults to 10, max 50
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to search." },
        { status: 401 },
      );
    }

    const { searchParams } = req.nextUrl;
    const q = (searchParams.get("q") ?? "").trim();
    const type = searchParams.get("type") ?? "posts";
    const sort = searchParams.get("sort") ?? "Most Relevant";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
    );

    if (!q) {
      return NextResponse.json(
        {
          results: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        { status: 200 },
      );
    }

    await connectDB();

    const currentUserId = session.user.id;

    switch (type) {
      case "posts":
        return await searchPosts(q, sort, page, limit, currentUserId);
      case "people":
        return await searchPeople(q, sort, page, limit);
      case "channels":
        return await searchChannels(q, sort, page, limit);
      case "tags":
        return await searchTags(q, sort, page, limit);
      case "comments":
        return await searchComments(q, sort, page, limit, currentUserId);
      case "my posts only":
        return await searchMyPosts(q, sort, page, limit, currentUserId);
      default:
        return NextResponse.json(
          {
            error: `Invalid search type: "${type}". Must be one of: posts, people, channels, tags, comments, my posts only`,
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ─── Helper: build sort option for posts ──────────────────────────────────────
function getPostSortOption(sort: string): Record<string, 1 | -1> {
  switch (sort) {
    case "Newest":
      return { createdAt: -1 };
    case "Oldest":
      return { createdAt: 1 };
    case "Most Relevant":
    default:
      // MongoDB text score for relevance, then newest as tiebreaker
      return { score: -1, createdAt: -1 };
  }
}

// ─── Helper: create pagination metadata ───────────────────────────────────────
function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

// ─── POSTS search ─────────────────────────────────────────────────────────────
async function searchPosts(
  q: string,
  sort: string,
  page: number,
  limit: number,
  currentUserId: string,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  // Use a combination of regex search on title, tags, and content for broad matching
  const filter = {
    isHidden: { $ne: true },
    $or: [
      { title: { $regex: regex } },
      { tags: { $regex: regex } },
      { content: { $regex: regex } },
      { authorName: { $regex: regex } },
    ],
  };

  let sortOption: Record<string, 1 | -1>;
  // For "Most Relevant", we'll use text search if possible, otherwise fallback to likes-based relevance
  if (sort === "Most Relevant") {
    sortOption = { likes: -1, createdAt: -1 };
  } else {
    sortOption = getPostSortOption(sort);
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title tags content coverImage authorId authorName authorImage postType likes likedBy comments commentList createdAt",
      )
      .lean(),
    Post.countDocuments(filter),
  ]);

  const results = posts.map((post) => ({
    type: "posts" as const,
    postId: post._id.toString(),
    postTitle: post.title,
    postLink: `/posts/${post._id.toString()}`,
    tags: post.tags ?? [],
    user: post.authorName ?? "Anonymous",
    userPic: post.authorImage ?? null,
    authorProfile: `/users/${post.authorId}`,
    time: post.createdAt,
    postType: post.postType,
    likes: post.likes ?? 0,
    commentsCount: post.commentList?.length ?? 0,
    isLiked: Array.isArray(post.likedBy)
      ? post.likedBy.includes(currentUserId)
      : false,
    coverImage: post.coverImage ?? null,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}

// ─── PEOPLE search ────────────────────────────────────────────────────────────
async function searchPeople(
  q: string,
  sort: string,
  page: number,
  limit: number,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  const filter = {
    isBanned: { $ne: true },
    $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
  };

  let sortOption: Record<string, 1 | -1>;
  if (sort === "Newest") {
    sortOption = { createdAt: -1 };
  } else if (sort === "Oldest") {
    sortOption = { createdAt: 1 };
  } else {
    // Most Relevant — sort by name match quality approximation (exact match first)
    sortOption = { createdAt: -1 };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email image provider createdAt")
      .lean(),
    User.countDocuments(filter),
  ]);

  // For each user, get their post count to show as a stat
  const userIds = users.map((u) => u._id.toString());
  const postCounts = await Post.aggregate([
    { $match: { authorId: { $in: userIds }, isHidden: { $ne: true } } },
    { $group: { _id: "$authorId", count: { $sum: 1 } } },
  ]);
  const postCountMap: Record<string, number> = {};
  for (const pc of postCounts) {
    postCountMap[pc._id] = pc.count;
  }

  const results = users.map((user) => ({
    type: "people" as const,
    userId: user._id.toString(),
    user: user.name ?? user.email,
    userPic: user.image ?? null,
    profileLink: `/users/${user._id.toString()}`,
    email: user.email,
    postsCount: postCountMap[user._id.toString()] ?? 0,
    createdAt: user.createdAt,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}

// ─── CHANNELS search (Community Pages) ───────────────────────────────────────
async function searchChannels(
  q: string,
  sort: string,
  page: number,
  limit: number,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  const filter = {
    isActive: true,
    $or: [
      { name: { $regex: regex } },
      { description: { $regex: regex } },
      { slug: { $regex: regex } },
    ],
  };

  let sortOption: Record<string, 1 | -1>;
  if (sort === "Newest") {
    sortOption = { createdAt: -1 };
  } else if (sort === "Oldest") {
    sortOption = { createdAt: 1 };
  } else {
    sortOption = { order: 1, createdAt: -1 };
  }

  const [channels, total] = await Promise.all([
    CommunityPage.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name slug icon description coverImage order createdAt")
      .lean(),
    CommunityPage.countDocuments(filter),
  ]);

  const results = channels.map((ch) => ({
    type: "channels" as const,
    channelId: ch._id.toString(),
    name: ch.name,
    slug: ch.slug,
    icon: ch.icon,
    description: ch.description ?? "",
    coverImage: ch.coverImage ?? null,
    link: `/${ch.slug}`,
    createdAt: ch.createdAt,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}

// ─── TAGS search ──────────────────────────────────────────────────────────────
async function searchTags(
  q: string,
  sort: string,
  page: number,
  limit: number,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  // Aggregate tags from all non-hidden posts, filter by query, count posts per tag
  const pipeline: PipelineStage[] = [
    { $match: { isHidden: { $ne: true } } },
    { $unwind: "$tags" },
    { $match: { tags: { $regex: regex } } },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
        latestPost: { $max: "$createdAt" },
      },
    },
  ];

  // Sort
  if (sort === "Newest") {
    pipeline.push({ $sort: { latestPost: -1 } } as PipelineStage);
  } else if (sort === "Oldest") {
    pipeline.push({ $sort: { latestPost: 1 } } as PipelineStage);
  } else {
    // Most Relevant — sort by post count descending
    pipeline.push({ $sort: { count: -1, _id: 1 } } as PipelineStage);
  }

  // Get total count before pagination
  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "total" } as PipelineStage,
  ];
  const countResult = await Post.aggregate(countPipeline);
  const total = countResult[0]?.total ?? 0;

  // Add pagination
  pipeline.push({ $skip: (page - 1) * limit } as PipelineStage);
  pipeline.push({ $limit: limit } as PipelineStage);

  const tags = await Post.aggregate(pipeline);

  const results = tags.map((tag) => ({
    type: "tags" as const,
    tag: tag._id,
    count: tag.count,
    link: `/search?q=${encodeURIComponent(tag._id)}&type=posts`,
    latestPost: tag.latestPost,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}

// ─── COMMENTS search ──────────────────────────────────────────────────────────
async function searchComments(
  q: string,
  sort: string,
  page: number,
  limit: number,
  currentUserId: string,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  // Aggregate: unwind comments, filter by text matching query
  const pipeline: PipelineStage[] = [
    { $match: { isHidden: { $ne: true } } },
    { $unwind: "$commentList" },
    {
      $match: {
        $or: [
          { "commentList.text": { $regex: regex } },
          { "commentList.authorName": { $regex: regex } },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        commentId: "$commentList._id",
        commentText: "$commentList.text",
        commentAuthorId: "$commentList.authorId",
        commentAuthorName: "$commentList.authorName",
        commentAuthorImage: "$commentList.authorImage",
        commentCreatedAt: "$commentList.createdAt",
        postId: "$_id",
        postTitle: "$title",
        postTags: "$tags",
        postAuthorId: "$authorId",
        postAuthorName: "$authorName",
        postAuthorImage: "$authorImage",
        postCreatedAt: "$createdAt",
        likedBy: "$likedBy",
      },
    },
  ];

  // Sort
  if (sort === "Newest") {
    pipeline.push({ $sort: { commentCreatedAt: -1 } } as PipelineStage);
  } else if (sort === "Oldest") {
    pipeline.push({ $sort: { commentCreatedAt: 1 } } as PipelineStage);
  } else {
    // Most Relevant — newest first as default
    pipeline.push({ $sort: { commentCreatedAt: -1 } } as PipelineStage);
  }

  // Get total count
  const countPipeline: PipelineStage[] = [
    ...pipeline,
    { $count: "total" } as PipelineStage,
  ];
  const countResult = await Post.aggregate(countPipeline);
  const total = countResult[0]?.total ?? 0;

  // Pagination
  pipeline.push({ $skip: (page - 1) * limit } as PipelineStage);
  pipeline.push({ $limit: limit } as PipelineStage);

  const comments = await Post.aggregate(pipeline);

  const results = comments.map((c) => ({
    type: "comments" as const,
    commentId: c.commentId?.toString() ?? "",
    comment: c.commentText,
    user: c.commentAuthorName ?? "Anonymous",
    userPic: c.commentAuthorImage ?? null,
    authorProfile: `/users/${c.commentAuthorId}`,
    time: c.commentCreatedAt,
    postId: c.postId?.toString() ?? "",
    postTitle: c.postTitle,
    postLink: `/posts/${c.postId?.toString()}`,
    tags: c.postTags ?? [],
    postAuthorName: c.postAuthorName ?? "Anonymous",
    postAuthorImage: c.postAuthorImage ?? null,
    isLiked: Array.isArray(c.likedBy)
      ? c.likedBy.includes(currentUserId)
      : false,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}

// ─── MY POSTS ONLY search ────────────────────────────────────────────────────
async function searchMyPosts(
  q: string,
  sort: string,
  page: number,
  limit: number,
  currentUserId: string,
) {
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedQuery, "i");

  const filter = {
    authorId: currentUserId,
    $or: [
      { title: { $regex: regex } },
      { tags: { $regex: regex } },
      { content: { $regex: regex } },
    ],
  };

  let sortOption: Record<string, 1 | -1>;
  if (sort === "Newest") {
    sortOption = { createdAt: -1 };
  } else if (sort === "Oldest") {
    sortOption = { createdAt: 1 };
  } else {
    sortOption = { likes: -1, createdAt: -1 };
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "title tags content coverImage authorId authorName authorImage postType likes likedBy comments commentList isHidden createdAt",
      )
      .lean(),
    Post.countDocuments(filter),
  ]);

  const results = posts.map((post) => ({
    type: "my posts only" as const,
    postId: post._id.toString(),
    postTitle: post.title,
    postLink: `/posts/${post._id.toString()}`,
    postDesc: post.content?.substring(0, 200) ?? "",
    tags: post.tags ?? [],
    authorName: post.authorName ?? "Anonymous",
    authorPic: post.authorImage ?? null,
    postType: post.postType,
    postCreationDate: post.createdAt,
    postLikes: post.likes ?? 0,
    postComments: post.commentList?.map((c) => c.text) ?? [],
    commentsCount: post.commentList?.length ?? 0,
    isHidden: post.isHidden ?? false,
    isLiked: Array.isArray(post.likedBy)
      ? post.likedBy.includes(currentUserId)
      : false,
    coverImage: post.coverImage ?? null,
  }));

  return NextResponse.json(
    { results, pagination: paginationMeta(page, limit, total) },
    { status: 200 },
  );
}
