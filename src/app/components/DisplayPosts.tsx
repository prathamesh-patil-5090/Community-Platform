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
    if (status !== "loading") {
      fetchPosts(1, true);
    }
  }, [status, fetchPosts]);

  const handleLoadMore = () => {
    fetchPosts(currentPage + 1, false);
  };

  const handleRetry = () => {
    fetchPosts(1, true);
  };

  if (status === "loading" || initialLoading) {
    return (
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-container rounded-2xl border border-primary/15 overflow-hidden animate-pulse mb-8"
          >
            {/* Author row */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-variant border-2 border-primary/20" />
                <div className="space-y-2">
                  <div className="h-3 w-32 rounded bg-surface-variant" />
                  <div className="h-2.5 w-24 rounded bg-surface-variant" />
                </div>
              </div>
            </div>
            {/* Title */}
            <div className="px-6 pb-4">
              <div className="h-6 w-3/4 rounded bg-surface-variant mb-4" />
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-surface-variant" />
                <div className="h-5 w-24 rounded-full bg-surface-variant" />
              </div>
            </div>
            {/* Cover image placeholder */}
            <div className="px-6 relative mb-4">
              <div className="aspect-video w-full rounded-xl bg-surface-variant border border-outline-variant/20" />
            </div>
            {/* Actions */}
            <div className="px-6 py-4 bg-surface-variant border-t border-outline/10 flex items-center gap-6">
              <div className="h-5 w-12 rounded bg-surface-elevated" />
              <div className="h-5 w-12 rounded bg-surface-elevated" />
              <div className="h-5 w-16 rounded bg-surface-elevated" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-surface-container rounded-2xl border border-primary/15">
        <span className="material-symbols-outlined text-4xl mb-4 text-error">
          warning
        </span>
        <p className="text-error text-lg mb-2 font-headline font-bold">
          Could not load posts
        </p>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-error/10 text-error rounded-full hover:bg-error/20 transition-colors font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!initialLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-surface-container rounded-2xl border border-primary/15">
        <span className="material-symbols-outlined text-5xl mb-4 text-primary">
          edit_document
        </span>
        <p className="text-xl font-bold font-headline text-white mb-2">
          No posts yet
        </p>
        <p className="text-slate-400 text-sm mb-6">
          Be the first to share something with the community!
        </p>
        <button
          onClick={() => router.push("/create-post")}
          className="px-6 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors font-medium text-sm"
        >
          Create Post
        </button>
      </div>
    );
  }

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
            className="px-8 py-2.5 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
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
        <p className="text-center text-slate-500 text-sm py-8 font-medium">
          You&apos;ve reached the end of the feed
        </p>
      )}
    </div>
  );
}
