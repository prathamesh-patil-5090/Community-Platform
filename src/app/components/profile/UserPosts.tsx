"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BiLike } from "react-icons/bi";
import { FaRegNewspaper } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdOutlineModeComment } from "react-icons/md";

interface UserPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  postType: "Post" | "Article";
  tags: string[];
  likes: number;
  commentList: { _id: string }[];
  createdAt: string;
}

interface PaginationInfo {
  hasNextPage: boolean;
}

function PostCardSkeleton() {
  return (
    <div className="animate-pulse border border-white/10 rounded-xl p-4 bg-[#111] space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="ml-auto h-5 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 w-12 bg-white/10 rounded-full" />
        <div className="h-4 w-16 bg-white/10 rounded-full" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-12 bg-white/10 rounded" />
        <div className="h-4 w-12 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export default function UserPosts({ userId }: { userId: string }) {
  const router = useRouter();

  const [posts, setPosts] = useState<UserPost[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (page: number, isInitial: boolean) => {
      if (isInitial) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetch(
          `/api/posts?author=${userId}&page=${page}&limit=10`,
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

        const data = await res.json();
        const incoming: UserPost[] = data.posts;

        setPosts((prev) => (isInitial ? incoming : [...prev, ...incoming]));
        setPagination(data.pagination);
        setCurrentPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId, router],
  );

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  const handleDelete = async (postId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert((body as { error?: string }).error ?? "Failed to delete post.");
        return;
      }
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-white/10 rounded-xl bg-[#0a0a0a]">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchPosts(1, true)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 rounded-xl bg-[#0a0a0a]">
        <FaRegNewspaper size={40} className="text-white/20 mb-4" />
        <p className="text-white font-semibold text-lg mb-1">No posts yet</p>
        <p className="text-white/40 text-sm mb-6">
          Share your first post with the community!
        </p>
        <button
          onClick={() => router.push("/create-post")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Create Post
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post._id}
          className="group relative bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors"
        >
          {/* Cover thumbnail + title row */}
          <div className="flex gap-3 items-start">
            {post.coverImage && (
              <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title + type badge */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  href={`/posts/${post._id}`}
                  className="text-white font-semibold text-base leading-snug hover:text-blue-400 transition-colors line-clamp-2"
                >
                  {post.title}
                </Link>
                <span className="flex-shrink-0 text-xs bg-white/5 text-white/40 border border-white/10 px-2 py-0.5 rounded-full">
                  {post.postType}
                </span>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-blue-400/60 bg-blue-500/8 border border-blue-500/15 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats + date */}
              <div className="flex items-center gap-4 text-white/30 text-xs">
                <span className="flex items-center gap-1">
                  <BiLike size={13} />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MdOutlineModeComment size={13} />
                  {post.commentList?.length ?? 0}
                </span>
                <span>
                  {new Date(post.createdAt)
                    .toDateString()
                    .split(" ")
                    .slice(1)
                    .join(" ")}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons – visible on hover */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <button
              onClick={() => router.push(`/edit-post/${post._id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-blue-400 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/20 rounded-lg transition-all"
            >
              <FiEdit2 size={12} />
              Edit
            </button>
            <button
              onClick={() => handleDelete(post._id)}
              disabled={deletingId === post._id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deletingId === post._id ? (
                <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiTrash2 size={12} />
              )}
              {deletingId === post._id ? "Deleting…" : "Delete"}
            </button>
            <Link
              href={`/posts/${post._id}`}
              className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              View post →
            </Link>
          </div>
        </div>
      ))}

      {/* Load more */}
      {pagination?.hasNextPage && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => fetchPosts(currentPage + 1, false)}
            disabled={loadingMore}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
