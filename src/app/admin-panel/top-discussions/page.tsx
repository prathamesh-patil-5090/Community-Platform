"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  IoAlertCircleOutline,
  IoArrowDown,
  IoArrowUp,
  IoChatbubblesOutline,
  IoCheckmarkCircleOutline,
  IoCloseOutline,
  IoReloadOutline,
  IoStarOutline,
  IoTrashOutline,
} from "react-icons/io5";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface FeaturedDiscussion {
  id: string;
  postId: string;
  postTitle: string;
  postLink: string;
  commentsCount: number;
  selectedBy: string;
  selectedByName: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface AvailablePost {
  id: string;
  title: string;
  commentsCount: number;
  likes: number;
  authorName: string;
  createdAt: string;
  isHidden: boolean;
  alreadyFeatured: boolean;
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function AdminTopDiscussionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [discussions, setDiscussions] = useState<FeaturedDiscussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal to select posts to feature
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [availablePosts, setAvailablePosts] = useState<AvailablePost[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(
    new Set(),
  );
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLimit] = useState(20);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{
    discussion: FeaturedDiscussion;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* ── Auth guard ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  /* ── Fetch featured discussions ──────────────────────────────────────────── */
  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/top-discussions");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch discussions");
      }
      const data = await res.json();
      setDiscussions(data.discussions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDiscussions();
    }
  }, [status, fetchDiscussions]);

  /* ── Fetch available posts for selection ──────────────────────────────────── */
  const fetchAvailablePosts = useCallback(
    async (page: number = 1) => {
      setPostsLoading(true);
      setPostsError(null);
      try {
        const res = await fetch(
          `/api/admin/posts?page=${page}&limit=${postsLimit}&sort=comments&dir=desc`,
        );
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await res.json();
        const featuredIds = new Set(discussions.map((d) => d.postId));
        const posts: AvailablePost[] = (data.posts ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => ({
            id: p.id,
            title: p.title,
            commentsCount: p.commentCount ?? p.commentsCount ?? 0,
            likes: p.likes ?? 0,
            authorName: p.authorName ?? "Unknown",
            createdAt: p.createdAt,
            isHidden: p.isHidden ?? false,
            alreadyFeatured: featuredIds.has(p.id),
          }),
        );
        setAvailablePosts(posts);
        setPostsTotal(data.pagination?.total ?? 0);
        setPostsPage(page);
      } catch (err) {
        setPostsError(
          err instanceof Error ? err.message : "Failed to fetch posts",
        );
      } finally {
        setPostsLoading(false);
      }
    },
    [discussions, postsLimit],
  );

  const openSelectionModal = () => {
    setSelectedPostIds(new Set());
    setPostsPage(1);
    setShowSelectionModal(true);
    fetchAvailablePosts(1);
  };

  /* ── Handle checkbox toggle ──────────────────────────────────────────────── */
  const togglePostSelection = (postId: string) => {
    const updated = new Set(selectedPostIds);
    if (updated.has(postId)) {
      updated.delete(postId);
    } else {
      updated.add(postId);
    }
    setSelectedPostIds(updated);
  };

  /* ── Add selected posts to featured ──────────────────────────────────────── */
  const handleAddSelectedPosts = async () => {
    if (selectedPostIds.size === 0) {
      setToast({ message: "Please select at least one post", type: "error" });
      return;
    }

    setActionLoading("bulk-add");
    try {
      const maxOrder =
        discussions.length > 0
          ? Math.max(...discussions.map((d) => d.order))
          : -1;

      const promises = Array.from(selectedPostIds).map((postId, idx) =>
        fetch("/api/admin/top-discussions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            order: maxOrder + 1 + idx,
          }),
        }),
      );

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok).length;

      if (failed > 0) {
        throw new Error(`Failed to add ${failed} post${failed > 1 ? "s" : ""}`);
      }

      setToast({
        message: `Added ${selectedPostIds.size} post${selectedPostIds.size > 1 ? "s" : ""} to top discussions`,
        type: "success",
      });
      setShowSelectionModal(false);
      setSelectedPostIds(new Set());
      fetchDiscussions();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to add posts",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Delete featured discussion ───────────────────────────────────────────── */
  const handleDelete = async (discussion: FeaturedDiscussion) => {
    setActionLoading(discussion.id);
    try {
      const res = await fetch(`/api/admin/top-discussions/${discussion.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to remove discussion");
      }

      setToast({
        message: `"${discussion.postTitle}" removed from top discussions`,
        type: "success",
      });
      setDeleteModal(null);
      fetchDiscussions();
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to remove discussion",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Reorder discussions ─────────────────────────────────────────────────── */
  const handleReorder = async (
    discussion: FeaturedDiscussion,
    direction: "up" | "down",
  ) => {
    const currentIndex = discussions.findIndex((d) => d.id === discussion.id);
    if (currentIndex === -1) return;

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const other = discussions[swapIndex];

    if (!other) return;

    setActionLoading(discussion.id);

    try {
      await Promise.all([
        fetch(`/api/admin/top-discussions/${discussion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: other.order,
          }),
        }),
        fetch(`/api/admin/top-discussions/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: discussion.order,
          }),
        }),
      ]);

      setToast({ message: "Discussion reordered", type: "success" });
      fetchDiscussions();
    } catch {
      setToast({
        message: "Failed to reorder",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Loading state ───────────────────────────────────────────────────────── */
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading top discussions...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load discussions
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDiscussions}
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
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-sm transition-all ${
            toast.type === "success"
              ? "bg-green-600/20 border-green-500/30 text-green-300"
              : "bg-red-600/20 border-red-500/30 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <IoCheckmarkCircleOutline size={20} />
          ) : (
            <IoAlertCircleOutline size={20} />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/40 hover:text-white/70 cursor-pointer"
          >
            <IoCloseOutline size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <IoChatbubblesOutline size={28} className="text-purple-400" />
            Top Discussions
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Curate the featured discussions shown on the homepage. Posts not
            manually featured will be auto-filled from popular posts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDiscussions}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <IoReloadOutline size={16} />
            Refresh
          </button>
          <button
            onClick={openSelectionModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <IoStarOutline size={16} />
            Feature a Post
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-600/5 px-5 py-4">
        <p className="text-blue-300 text-sm">
          <strong>How it works:</strong> Admin-curated discussions appear first
          in the &ldquo;Top Discussions&rdquo; widget. If fewer than 7 are
          selected, the remaining slots are automatically filled with the
          most-commented posts.
        </p>
      </div>

      {/* Featured Discussions List */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">
            Featured Discussions ({discussions.length})
          </h2>
        </div>

        {discussions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <IoChatbubblesOutline
              size={48}
              className="text-gray-600 mx-auto mb-4"
            />
            <p className="text-gray-400 font-medium">
              No manually featured discussions yet
            </p>
            <p className="text-gray-500 text-sm mt-1">
              The homepage will show auto-selected popular posts. Click
              &ldquo;Feature a Post&rdquo; to curate the list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {discussions.map((d, idx) => (
              <div
                key={d.id}
                className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors ${
                  actionLoading === d.id ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Order number */}
                <div className="flex-none w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-300 text-sm font-bold">
                    {idx + 1}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {d.postTitle}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>💬 {d.commentsCount} comments</span>
                    <span>•</span>
                    <span>
                      Featured by{" "}
                      <span className="text-purple-400">
                        {d.selectedByName}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(d.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    onClick={() => handleReorder(d, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <IoArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleReorder(d, "down")}
                    disabled={idx === discussions.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <IoArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ discussion: d })}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove from featured"
                  >
                    <IoTrashOutline size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Selection Modal */}
      {showSelectionModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowSelectionModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] px-4 pb-4">
            <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
              {/* Modal header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#141418]">
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    Select Posts to Feature
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">
                    {selectedPostIds.size} post
                    {selectedPostIds.size !== 1 ? "s" : ""} selected
                  </p>
                </div>
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              {/* Posts list */}
              <div className="flex-1 overflow-y-auto">
                {postsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : postsError ? (
                  <div className="text-center py-16 text-red-400 text-sm">
                    {postsError}
                  </div>
                ) : availablePosts.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 text-sm">
                    No posts available
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {availablePosts.map((post) => (
                      <div
                        key={post.id}
                        className={`flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          post.alreadyFeatured || post.isHidden
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                        onClick={() => {
                          if (!post.alreadyFeatured && !post.isHidden) {
                            togglePostSelection(post.id);
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <div className="flex-none">
                          <input
                            type="checkbox"
                            checked={selectedPostIds.has(post.id)}
                            onChange={() => togglePostSelection(post.id)}
                            disabled={post.alreadyFeatured || post.isHidden}
                            className="w-5 h-5 rounded border-gray-400 text-purple-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        {/* Post info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>by {post.authorName}</span>
                            <span>•</span>
                            <span>💬 {post.commentsCount}</span>
                            <span>•</span>
                            <span>❤️ {post.likes}</span>
                            {post.isHidden && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400">Hidden</span>
                              </>
                            )}
                            {post.alreadyFeatured && (
                              <>
                                <span>•</span>
                                <span className="text-purple-400">
                                  Already featured
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!postsLoading && postsTotal > postsLimit && (
                <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Page {postsPage} of {Math.ceil(postsTotal / postsLimit)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchAvailablePosts(postsPage - 1)}
                      disabled={postsPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchAvailablePosts(postsPage + 1)}
                      disabled={postsPage >= Math.ceil(postsTotal / postsLimit)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Modal footer */}
              <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end sticky bottom-0 bg-[#141418]">
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelectedPosts}
                  disabled={
                    selectedPostIds.size === 0 || actionLoading === "bulk-add"
                  }
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {actionLoading === "bulk-add"
                    ? "Adding..."
                    : `Add Selected (${selectedPostIds.size})`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setDeleteModal(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600/20">
                  <IoTrashOutline size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    Remove from Top Discussions
                  </h3>
                  <p className="text-gray-500 text-xs">
                    This won&apos;t delete the post itself
                  </p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-2">
                Are you sure you want to remove this post from the featured
                discussions?
              </p>
              <div className="bg-white/5 rounded-lg px-4 py-3 mb-6">
                <p className="text-white text-sm font-medium truncate">
                  {deleteModal.discussion.postTitle}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Featured by {deleteModal.discussion.selectedByName}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.discussion)}
                  className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-sm text-red-300 font-medium hover:bg-red-600/30 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
