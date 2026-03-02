"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CiBellOn, CiBookmark, CiHeart } from "react-icons/ci";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

type NotificationType = "all" | "new_post" | "comment_on_post";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface NotificationItem {
  id: string;
  type: "new_post" | "comment_on_post";
  isRead: boolean;
  actorId: string;
  actorName: string;
  actorImage: string | null;
  postId: string;
  postTitle: string;
  postTags: string[];
  postLink: string;
  commentId: string | null;
  commentText: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface NotificationDetailsProps {
  notiType: NotificationType;
  onUnreadCountChange?: (count: number) => void;
}

function formatTimeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0)
    return `about ${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  if (diffMonths > 0)
    return `about ${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffWeeks > 0)
    return `about ${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  if (diffDays > 0)
    return `about ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0)
    return `about ${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMinutes > 0)
    return `about ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  return "just now";
}

export default function NotificationsDetails({
  notiType,
  onUnreadCountChange,
}: NotificationDetailsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Local interaction state
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>(
    {},
  );

  const fetchNotifications = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (notiType !== "all") {
          params.set("type", notiType);
        }
        params.set("page", String(page));
        params.set("limit", "20");

        const res = await fetch(`/api/notifications?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Failed to fetch notifications (${res.status})`,
          );
        }

        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setPagination(
          data.pagination ?? {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        );

        if (onUnreadCountChange && data.unreadCount !== undefined) {
          onUnreadCountChange(data.unreadCount);
        }
      } catch (err: any) {
        console.error("[NotificationsDetails] fetch error:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [notiType, onUnreadCountChange],
  );

  // Refetch when filter type changes — reset to page 1
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const goToPage = (page: number) => {
    fetchNotifications(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Mark single notification as read ───────────────────────────────────────
  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [notificationId] }),
      });

      if (res.ok) {
        // Decrement unread count
        if (onUnreadCountChange) {
          const countRes = await fetch("/api/notifications/count");
          if (countRes.ok) {
            const countData = await countRes.json();
            onUnreadCountChange(countData.unreadCount ?? 0);
          }
        }
      }
    } catch {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: false } : n,
        ),
      );
    }
  };

  // ─── Mark all notifications as read ─────────────────────────────────────────
  const markAllAsRead = async () => {
    setMarkingAll(true);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (res.ok) {
        // Update all local notifications
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        if (onUnreadCountChange) {
          onUnreadCountChange(0);
        }
      }
    } catch (err) {
      console.error("[markAllAsRead] error:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── Interaction handlers ───────────────────────────────────────────────────
  const handleLike = async (key: string, postId?: string) => {
    setLikedMap((prev) => ({ ...prev, [key]: !prev[key] }));
    if (postId) {
      try {
        await fetch(`/api/posts/${postId}/like`, { method: "PATCH" });
      } catch {
        setLikedMap((prev) => ({ ...prev, [key]: !prev[key] }));
      }
    }
  };

  const handleSave = (key: string) => {
    setSavedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubscribe = (key: string) => {
    setSubscribedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 border-l-8 p-3 my-1 bg-[#0A0A0A] animate-pulse"
          >
            <div className="flex items-center gap-3 pb-3">
              <div className="w-[50px] h-[50px] rounded-full bg-gray-700" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-800 rounded w-1/5" />
              </div>
            </div>
            <div className="ml-0 md:ml-20 rounded-lg border border-white/10 p-3 bg-black/10">
              <div className="h-6 bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── ERROR STATE ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex-1 rounded-lg border border-red-500/30 p-6 my-3 bg-red-900/10 text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button
          onClick={() => fetchNotifications(pagination.page)}
          className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  if (notifications.length === 0) {
    return (
      <div className="flex-1 rounded-lg border border-white/10 p-10 my-3 bg-[#0A0A0A] text-center">
        <div className="text-5xl mb-4">🔔</div>
        <p className="text-gray-400 text-lg font-medium">
          No notifications yet
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {notiType === "all"
            ? "When someone creates a post or comments on yours, you'll see it here."
            : notiType === "new_post"
              ? "Notifications for new posts will appear here."
              : "Notifications for comments on your posts will appear here."}
        </p>
      </div>
    );
  }

  // ─── PAGINATION ─────────────────────────────────────────────────────────────
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const current = pagination.page;
    const total = pagination.totalPages;

    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    for (
      let i = Math.max(2, current - 1);
      i <= Math.min(total - 1, current + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (current < total - 2) {
      pages.push("...");
    }

    if (total > 1 && !pages.includes(total)) {
      pages.push(total);
    }

    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <button
          onClick={() => goToPage(current - 1)}
          disabled={!pagination.hasPrevPage}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pagination.hasPrevPage
              ? "bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"
              : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
          }`}
        >
          ← Prev
        </button>

        {pages.map((p, idx) =>
          typeof p === "string" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                p === current
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => goToPage(current + 1)}
          disabled={!pagination.hasNextPage}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pagination.hasNextPage
              ? "bg-gray-700 hover:bg-gray-600 text-white cursor-pointer"
              : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
          }`}
        >
          Next →
        </button>
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex-1">
      {/* Header bar with count and mark-all-read */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-sm">
          Showing {(pagination.page - 1) * pagination.limit + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} notification
          {pagination.total !== 1 ? "s" : ""}
        </p>

        {hasUnread && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoCheckmarkDoneOutline size={18} />
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        )}
      </div>

      {notifications.map((noti) => {
        const key = noti.id;
        const isPost = noti.type === "new_post";
        const typeLabel = isPost ? "post" : "comment";

        return (
          <div
            key={key}
            className={`rounded-lg border border-white/10 border-l-8 p-3 font-sans my-3 bg-[#0A0A0A] transition-all ${
              !noti.isRead
                ? "border-l-blue-500 bg-blue-950/10"
                : "hover:border-l-blue-500"
            }`}
            onClick={() => {
              if (!noti.isRead) {
                markAsRead(noti.id);
              }
            }}
          >
            {/* Unread indicator */}
            {!noti.isRead && (
              <div className="flex justify-end mb-1">
                <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">
                  New
                </span>
              </div>
            )}

            {/* Profile Section */}
            <div className="flex items-center justify-left pb-3">
              <Image
                src={noti.actorImage || "/default-avatar.webp"}
                width={50}
                height={50}
                alt={noti.actorName}
                className="rounded-full"
              />
              <div className="grid grid-row-2 pl-2">
                <div className="flex gap-1 flex-wrap">
                  <Link
                    className="font-bold hover:text-blue-300"
                    href={`/users/${noti.actorId}`}
                  >
                    {noti.actorName}
                  </Link>
                  <span>made a new</span>
                  <span>{typeLabel}</span>
                </div>
                <span className="font-light text-gray-400 text-sm">
                  {formatTimeAgo(noti.createdAt)}
                </span>
              </div>
            </div>

            {/* Post Details */}
            <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 md:ml-20 md:w-xl hover:text-blue-300 bg-black/10">
              <Link
                href={noti.postLink}
                className="flex flex-wrap font-sans font-bold text-md md:text-3xl text-white"
              >
                {noti.postTitle}
              </Link>
              {noti.postTags && noti.postTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {noti.postTags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(tag)}&type=posts`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Comment section (only for comment_on_post) */}
            {noti.type === "comment_on_post" && noti.commentText && (
              <div className="border border-white/10 border-l-3 border-l-blue-300 text-wrap justify-center p-3 md:ml-20 md:w-xl bg-black/10">
                <span className="font-bold italic text-white">
                  New Comment –{" "}
                </span>
                <span className="text-gray-400">{noti.commentText}</span>
              </div>
            )}

            {/* Like, Save, Subscribe actions */}
            <div className="border border-white/10 text-wrap justify-center p-3 md:ml-20 md:w-xl rounded-lg rounded-t-none bg-black/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-left gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(key, noti.postId);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      likedMap[key]
                        ? "text-red-500"
                        : "text-white/80 hover:bg-gray-700"
                    }`}
                  >
                    <CiHeart
                      size={24}
                      className={likedMap[key] ? "fill-red-500" : ""}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(key);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                      savedMap[key]
                        ? "text-blue-500"
                        : "text-white/80 hover:bg-gray-700"
                    }`}
                  >
                    <CiBookmark
                      size={24}
                      className={savedMap[key] ? "fill-blue-500" : ""}
                    />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(key);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    subscribedMap[key]
                      ? "text-green-500"
                      : "text-white/80 hover:bg-gray-700"
                  }`}
                >
                  <CiBellOn
                    size={24}
                    className={subscribedMap[key] ? "fill-green-500" : ""}
                  />
                  <span className="text-nowrap">
                    {subscribedMap[key]
                      ? "Subscribed"
                      : "Subscribe to comments"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      <PaginationControls />
    </div>
  );
}
