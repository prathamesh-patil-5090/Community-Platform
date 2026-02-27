"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  IoAlertCircleOutline,
  IoChevronBack,
  IoChevronForward,
  IoCloseOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoFunnelOutline,
  IoOpenOutline,
  IoReloadOutline,
  IoSearchOutline,
  IoTrashOutline,
} from "react-icons/io5";

interface AdminPost {
  id: string;
  title: string;
  tags: string[];
  coverImage: string | null;
  postType: "Post" | "Article";
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  likes: number;
  commentsCount: number;
  isHidden: boolean;
  hiddenBy: string | null;
  hiddenByName: string | null;
  hiddenReason: string | null;
  hiddenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ModalState {
  type: "hide" | "unhide" | "delete" | null;
  post: AdminPost | null;
}

export default function AdminPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading posts...</p>
          </div>
        </div>
      }
    >
      <AdminPostsContent />
    </Suspense>
  );
}

function AdminPostsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [hiddenFilter, setHiddenFilter] = useState<string>(
    searchParams.get("hidden") ?? "",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );
  const [perPage, setPerPage] = useState(
    parseInt(searchParams.get("limit") ?? "15", 10),
  );

  // Modal
  const [modal, setModal] = useState<ModalState>({ type: null, post: null });
  const [hideReason, setHideReason] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(perPage));
      if (search.trim()) params.set("search", search.trim());
      if (hiddenFilter) params.set("hidden", hiddenFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch posts");
      }
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, hiddenFilter, sortBy]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchPosts();
  }, [session, status, fetchPosts, router]);

  async function handleHidePost() {
    if (!modal.post) return;
    setActionLoading(modal.post.id);
    try {
      const res = await fetch(`/api/admin/posts/${modal.post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hide",
          hiddenReason: hideReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to hide post");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === modal.post!.id
            ? {
                ...p,
                isHidden: true,
                hiddenByName:
                  data.post.hiddenByName ?? session?.user?.name ?? "Admin",
                hiddenReason: data.post.hiddenReason ?? hideReason.trim(),
                hiddenAt: data.post.hiddenAt ?? new Date().toISOString(),
              }
            : p,
        ),
      );
      setModal({ type: null, post: null });
      setHideReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnhidePost() {
    if (!modal.post) return;
    setActionLoading(modal.post.id);
    try {
      const res = await fetch(`/api/admin/posts/${modal.post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unhide" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to unhide post");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === modal.post!.id
            ? {
                ...p,
                isHidden: false,
                hiddenByName: null,
                hiddenReason: null,
                hiddenAt: null,
                hiddenBy: null,
              }
            : p,
        ),
      );
      setModal({ type: null, post: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeletePost() {
    if (!modal.post) return;
    setActionLoading(modal.post.id);
    try {
      const res = await fetch(`/api/admin/posts/${modal.post.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete post");
      }
      setPosts((prev) => prev.filter((p) => p.id !== modal.post!.id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
      setModal({ type: null, post: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function truncate(str: string, max: number) {
    if (str.length <= max) return str;
    return str.slice(0, max) + "…";
  }

  // Loading state
  if (status === "loading" || (loading && posts.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load posts
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPosts}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <IoReloadOutline size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Post Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pagination?.total ?? 0} total posts
          </p>
        </div>
        <button
          onClick={fetchPosts}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors self-start cursor-pointer"
        >
          <IoReloadOutline
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <IoSearchOutline
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-600/30 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Filter by visibility */}
          <div className="flex items-center gap-2">
            <IoFunnelOutline size={16} className="text-gray-500 shrink-0" />
            <select
              value={hiddenFilter}
              onChange={(e) => {
                setHiddenFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
            >
              <option value="">All Posts</option>
              <option value="false">Visible Only</option>
              <option value="true">Hidden Only</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_liked">Most Liked</option>
            <option value="most_commented">Most Commented</option>
          </select>
        </div>
      </div>

      {/* Posts table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Post
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Likes
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Comments
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    No posts found matching your criteria.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      post.isHidden ? "opacity-60" : ""
                    }`}
                  >
                    {/* Post info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.coverImage && (
                          <Image
                            src={post.coverImage}
                            width={48}
                            height={36}
                            alt=""
                            className="rounded-md object-cover w-12 h-9 shrink-0 hidden sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/posts/${post.id}`}
                            target="_blank"
                            className="text-white text-sm font-medium truncate max-w-[200px] lg:max-w-[300px] hover:text-purple-300 transition-colors block"
                            title="Open post in new tab"
                          >
                            {truncate(post.title, 60)}
                          </Link>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {post.authorImage ? (
                          <Image
                            src={post.authorImage}
                            width={24}
                            height={24}
                            alt=""
                            className="rounded-full object-cover w-6 h-6 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                        )}
                        <span className="text-gray-300 text-sm truncate max-w-[120px]">
                          {post.authorName ?? "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          post.postType === "Article"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}
                      >
                        {post.postType}
                      </span>
                    </td>

                    {/* Likes */}
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {post.likes}
                    </td>

                    {/* Comments */}
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {post.commentsCount}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {post.isHidden ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <IoEyeOffOutline size={12} />
                            Hidden
                          </span>
                          {post.hiddenByName && (
                            <span
                              className="text-[10px] text-red-400/60 max-w-[120px] truncate"
                              title={`Hidden by ${post.hiddenByName}${post.hiddenReason ? ` — ${post.hiddenReason}` : ""}`}
                            >
                              by {post.hiddenByName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <IoEyeOutline size={12} />
                          Visible
                        </span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {formatDate(post.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/posts/${post.id}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors cursor-pointer"
                          title="View post"
                        >
                          <IoOpenOutline size={16} />
                        </Link>
                        {post.isHidden ? (
                          <button
                            onClick={() => setModal({ type: "unhide", post })}
                            disabled={actionLoading === post.id}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors cursor-pointer disabled:opacity-50"
                            title="Unhide post"
                          >
                            <IoEyeOutline size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ type: "hide", post })}
                            disabled={actionLoading === post.id}
                            className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                            title="Hide post"
                          >
                            <IoEyeOffOutline size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setModal({ type: "delete", post })}
                          disabled={actionLoading === post.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete post"
                        >
                          <IoTrashOutline size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
          {/* Left: count + per-page */}
          <div className="flex items-center gap-3">
            <p className="text-gray-500 text-sm">
              {pagination.total === 0 ? (
                "No posts found"
              ) : (
                <>
                  Showing{" "}
                  <span className="text-gray-300 font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>
                  {" – "}
                  <span className="text-gray-300 font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="text-gray-300 font-medium">
                    {pagination.total}
                  </span>
                </>
              )}
            </p>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
              title="Rows per page"
            >
              {[10, 15, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous page"
            >
              <IoChevronBack size={15} />
            </button>

            {/* Numbered pages */}
            {(() => {
              const total = pagination.totalPages;
              const current = pagination.page;
              const pages: (number | "…")[] = [];

              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 3) pages.push("…");
                for (
                  let i = Math.max(2, current - 1);
                  i <= Math.min(total - 1, current + 1);
                  i++
                ) {
                  pages.push(i);
                }
                if (current < total - 2) pages.push("…");
                pages.push(total);
              }

              return pages.map((p, idx) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-gray-600 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      p === current
                        ? "bg-purple-600 text-white border border-purple-500"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ),
              );
            })()}

            {/* Next */}
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next page"
            >
              <IoChevronForward size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Hide Post Modal */}
      {modal.type === "hide" && modal.post && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Hide Post</h3>
              <button
                onClick={() => {
                  setModal({ type: null, post: null });
                  setHideReason("");
                }}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                Are you sure you want to hide this post? It will no longer be
                visible to regular users.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {modal.post.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  by {modal.post.authorName ?? "Unknown"}
                </p>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="Why is this post being hidden?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => {
                  setModal({ type: null, post: null });
                  setHideReason("");
                }}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleHidePost}
                disabled={actionLoading === modal.post.id}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.post.id ? "Hiding..." : "Hide Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unhide Post Modal */}
      {modal.type === "unhide" && modal.post && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Unhide Post</h3>
              <button
                onClick={() => setModal({ type: null, post: null })}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                This post will become visible to all users again.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {modal.post.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  by {modal.post.authorName ?? "Unknown"}
                </p>
                {modal.post.hiddenReason && (
                  <p className="text-amber-400/70 text-xs mt-2">
                    Hidden reason: {modal.post.hiddenReason}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => setModal({ type: null, post: null })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnhidePost}
                disabled={actionLoading === modal.post.id}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.post.id
                  ? "Unhiding..."
                  : "Unhide Post"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Post Modal */}
      {modal.type === "delete" && modal.post && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-semibold text-red-400">Delete Post</h3>
              <button
                onClick={() => setModal({ type: null, post: null })}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <IoAlertCircleOutline
                  size={20}
                  className="text-red-400 shrink-0 mt-0.5"
                />
                <p className="text-red-300 text-sm">
                  This action is <strong>permanent</strong> and cannot be
                  undone. The post, along with all its likes and comments, will
                  be permanently removed.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {modal.post.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  by {modal.post.authorName ?? "Unknown"} &middot;{" "}
                  {modal.post.likes} likes &middot; {modal.post.commentsCount}{" "}
                  comments
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => setModal({ type: null, post: null })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={actionLoading === modal.post.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.post.id
                  ? "Deleting..."
                  : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
