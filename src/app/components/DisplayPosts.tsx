"use client";

import { CommentType, PostInfoType } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Post from "./ui/Post";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  postType: "Post" | "Article";
  tags: string[];
  likes: number;
  comments: string[];
  commentList?: {
    _id: string;
    text: string;
    authorId: string;
    authorName?: string;
    authorImage?: string;
    createdAt: string;
  }[];
  userHasLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Map an API post object to the PostInfoType shape used by the Post card */
function mapApiPost(apiPost: ApiPost): PostInfoType {
  const commentObjects: CommentType[] = (apiPost.commentList ?? []).map(
    (c) => ({
      id: c._id,
      text: c.text,
      authorId: c.authorId,
      authorName: c.authorName ?? "Anonymous",
      authorImage: c.authorImage || undefined,
      createdAt: c.createdAt,
    }),
  );

  return {
    postId: apiPost._id,
    authorName: apiPost.authorName ?? "Anonymous",
    authorId: apiPost.authorId,
    authorPic: apiPost.authorImage || undefined,
    postCreationDate: apiPost.createdAt,
    postType: apiPost.postType ?? "Post",
    tags: Array.isArray(apiPost.tags) ? apiPost.tags : [],
    postImage: apiPost.coverImage || undefined,
    postTitle: apiPost.title ?? "Untitled",
    postDesc: apiPost.content ?? "",
    postLikes: typeof apiPost.likes === "number" ? apiPost.likes : 0,
    postComments: Array.isArray(apiPost.comments) ? apiPost.comments : [],
    initialIsLiked: apiPost.userHasLiked === true,
    commentObjects,
  };
}

const POSTS_PER_PAGE = 10;

export default function DisplayPosts() {
  const { status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<PostInfoType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, isInitial: boolean) => {
      if (isInitial) {
        setInitialLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetch(
          `/api/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`,
        );

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "Failed to load posts.",
          );
        }

        const data = (await res.json()) as {
          posts: ApiPost[];
          pagination: PaginationInfo;
        };

        const mapped = data.posts.map(mapApiPost);

        setPosts((prev) => (isInitial ? mapped : [...prev, ...mapped]));
        setPagination(data.pagination);
        setCurrentPage(pageNum);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchPosts(1, true);
    }
  }, [status, fetchPosts, router]);

  const handleLoadMore = () => {
    fetchPosts(currentPage + 1, false);
  };

  const handleRetry = () => {
    fetchPosts(1, true);
  };

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (status === "loading" || initialLoading) {
    return (
      <div className="space-y-2 mt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-[#0A0A0A] border border-white/10 md:rounded-xl p-5 animate-pulse"
          >
            {/* Author row */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-3 w-24 rounded bg-white/10" />
              </div>
            </div>
            {/* Title */}
            <div className="h-6 w-3/4 rounded bg-white/10 mb-3" />
            {/* Cover image placeholder */}
            <div className="h-48 w-full rounded-lg bg-white/10 mb-3" />
            {/* Body lines */}
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/10" />
              <div className="h-4 w-4/6 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 text-lg mb-2">Could not load posts</p>
        <p className="text-white/50 text-sm mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!initialLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">✍️</div>
        <p className="text-xl font-semibold text-white mb-2">No posts yet</p>
        <p className="text-white/50 text-sm mb-6">
          Be the first to share something with the community!
        </p>
        <button
          onClick={() => router.push("/create-post")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Post
        </button>
      </div>
    );
  }

  // ── Post list + Load More ──────────────────────────────────────────────────
  return (
    <div>
      {posts.map((post) => (
        <Post key={post.postId} postData={post} />
      ))}

      {/* Load More */}
      {pagination?.hasNextPage && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Loading…
              </>
            ) : (
              "Load More Posts"
            )}
          </button>
        </div>
      )}

      {/* End of feed */}
      {!pagination?.hasNextPage && posts.length > 0 && (
        <p className="text-center text-white/30 text-sm py-8">
          You&apos;ve reached the end of the feed
        </p>
      )}
    </div>
  );
}
