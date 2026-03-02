"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CiBellOn, CiBookmark, CiHeart } from "react-icons/ci";

type SearchType =
  | "posts"
  | "people"
  | "channels"
  | "tags"
  | "comments"
  | "my posts only";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SearchDetailsProps {
  searchType: SearchType;
  sortOptions?: "Most Relevant" | "Newest" | "Oldest";
  onTotalChange?: (type: SearchType, total: number) => void;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").substring(0, 200);
}

export default function SearchDetailsComponent({
  searchType,
  sortOptions = "Most Relevant",
  onTotalChange,
}: SearchDetailsProps) {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";

  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local interaction state
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});
  const [subscribedMap, setSubscribedMap] = useState<Record<string, boolean>>(
    {},
  );

  const fetchResults = useCallback(
    async (page: number) => {
      if (!query) {
        setResults([]);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("q", query);
        params.set("type", searchType);
        params.set("sort", sortOptions);
        params.set("page", String(page));
        params.set("limit", "10");

        const res = await fetch(`/api/search?${params.toString()}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Search failed (${res.status})`);
        }

        const data = await res.json();
        setResults(data.results ?? []);
        setPagination(
          data.pagination ?? {
            page,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        );

        // Initialize interaction states from results
        const likes: Record<string, boolean> = {};
        for (const r of data.results ?? []) {
          const key =
            r.postId ||
            r.commentId ||
            r.userId ||
            r.channelId ||
            r.tag ||
            String(Math.random());
          if (r.isLiked !== undefined) likes[key] = r.isLiked;
        }
        setLikedMap((prev) => ({ ...prev, ...likes }));

        // Report total to parent for sidebar counts
        if (onTotalChange) {
          onTotalChange(searchType, data.pagination?.total ?? 0);
        }
      } catch (err: any) {
        console.error("[SearchDetails] fetch error:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [query, searchType, sortOptions, onTotalChange],
  );

  // Refetch when query, type, or sort changes — reset to page 1
  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  const goToPage = (page: number) => {
    fetchResults(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getKey = (item: any, idx: number): string => {
    return (
      item.postId ||
      item.commentId ||
      item.userId ||
      item.channelId ||
      item.tag ||
      `item-${idx}`
    );
  };

  const handleLike = async (key: string, postId?: string) => {
    setLikedMap((prev) => ({ ...prev, [key]: !prev[key] }));
    if (postId) {
      try {
        await fetch(`/api/posts/${postId}/like`, { method: "PATCH" });
      } catch {
        // Revert on error
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
      <div className="flex flex-col gap-3 py-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/10 border-l-4 md:border-l-8 p-3 my-1 bg-[#0A0A0A] animate-pulse"
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
      <div className="rounded-lg border border-red-500/30 p-6 my-3 bg-red-900/10 text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button
          onClick={() => fetchResults(pagination.page)}
          className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  if (results.length === 0 && !loading) {
    return (
      <div className="rounded-lg border border-white/10 p-6 my-3 bg-[#0A0A0A] text-center">
        <p className="text-gray-400 text-lg">
          No {searchType} found for &ldquo;{query}&rdquo;
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Try adjusting your search query or filter.
        </p>
      </div>
    );
  }

  // ─── PAGINATION COMPONENT ──────────────────────────────────────────────────
  const PaginationControls = () => {
    if (pagination.totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const current = pagination.page;
    const total = pagination.totalPages;

    // Always show first page
    pages.push(1);

    if (current > 3) {
      pages.push("...");
    }

    // Show pages around current
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

    // Always show last page
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

  // ─── RESULTS RENDERING ─────────────────────────────────────────────────────
  return (
    <div>
      {/* Results count */}
      <p className="text-gray-400 text-sm mb-3">
        Showing {(pagination.page - 1) * pagination.limit + 1}–
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} result{pagination.total !== 1 ? "s" : ""}
      </p>

      {results.map((item, idx) => {
        const key = getKey(item, idx);

        return (
          <div
            key={key}
            className="rounded-lg border w-full border-white/10 border-l-4 md:border-l-8 hover:border-l-blue-500 p-3 font-sans my-3 bg-[#0A0A0A] transition-colors"
          >
            {/* ─── POSTS ─────────────────────────────────────────────── */}
            {searchType === "posts" && (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={item.userPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={item.user || "user"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    <div className="flex gap-1">
                      {item.authorProfile && (
                        <Link
                          className="font-bold hover:text-blue-300"
                          href={item.authorProfile}
                        >
                          {item.user}
                        </Link>
                      )}
                      <span>made a new</span>
                      <span>post</span>
                    </div>
                    <span className="font-light text-gray-400 text-sm">
                      {item.time ? formatTimeAgo(item.time) : ""}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl hover:text-blue-300 bg-black/10">
                  {item.postLink && (
                    <Link
                      href={item.postLink}
                      className="flex flex-wrap font-sans font-bold text-lg md:text-3xl text-white"
                    >
                      {item.postTitle}
                    </Link>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.tags.map((tag: string, i: number) => (
                        <Link
                          key={i}
                          href={`/search?q=${encodeURIComponent(tag)}&type=posts`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-white/10 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl rounded-lg rounded-t-none bg-black/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-left gap-2">
                      <button
                        onClick={() => handleLike(key, item.postId)}
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
                        onClick={() => handleSave(key)}
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
                      onClick={() => handleSubscribe(key)}
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
              </>
            )}

            {/* ─── PEOPLE ────────────────────────────────────────────── */}
            {searchType === "people" && (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={item.userPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={item.user || "user"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    {item.profileLink && (
                      <Link
                        className="font-bold hover:text-blue-300"
                        href={item.profileLink}
                      >
                        {item.user}
                      </Link>
                    )}
                    <span className="font-light text-gray-400 text-sm">
                      {item.postsCount ?? 0} post
                      {item.postsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                  <p className="text-gray-400">
                    Joined{" "}
                    {item.createdAt
                      ? formatTimeAgo(item.createdAt)
                      : "recently"}
                  </p>
                </div>
              </>
            )}

            {/* ─── CHANNELS ──────────────────────────────────────────── */}
            {searchType === "channels" && (
              <>
                <div className="flex items-center justify-left pb-3">
                  <div className="w-[50px] h-[50px] rounded-full bg-gray-700 flex items-center justify-center text-2xl">
                    {item.icon || "📁"}
                  </div>
                  <div className="grid grid-row-2 pl-2">
                    {item.link && (
                      <Link
                        className="font-bold hover:text-blue-300"
                        href={item.link}
                      >
                        {item.name}
                      </Link>
                    )}
                    <span className="font-light text-gray-400 text-sm">
                      /{item.slug}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </>
            )}

            {/* ─── TAGS ──────────────────────────────────────────────── */}
            {searchType === "tags" && (
              <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 bg-black/10">
                <Link
                  href={`/search?q=${encodeURIComponent(item.tag)}&type=posts`}
                  className="font-bold text-blue-300 text-xl"
                >
                  #{item.tag}
                </Link>
                <span className="font-light text-gray-400 text-sm block mt-2">
                  {item.count} post{item.count !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* ─── COMMENTS ──────────────────────────────────────────── */}
            {searchType === "comments" && (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={item.userPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={item.user || "user"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    <div className="flex gap-1">
                      {item.authorProfile && (
                        <Link
                          className="font-bold hover:text-blue-300"
                          href={item.authorProfile}
                        >
                          {item.user}
                        </Link>
                      )}
                      <span>commented on a</span>
                      <span>post</span>
                    </div>
                    <span className="font-light text-gray-400 text-sm">
                      {item.time ? formatTimeAgo(item.time) : ""}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl hover:text-blue-300 bg-black/10">
                  {item.postLink && (
                    <Link
                      href={item.postLink}
                      className="flex flex-wrap font-sans font-bold text-lg md:text-3xl text-white"
                    >
                      {item.postTitle}
                    </Link>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.tags.map((tag: string, i: number) => (
                        <Link
                          key={i}
                          href={`/search?q=${encodeURIComponent(tag)}&type=posts`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {item.comment && (
                  <div className="border border-white/10 border-l-3 border-l-blue-300 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                    <span className="font-bold italic text-white">
                      Comment –{" "}
                    </span>
                    <span className="text-gray-400">{item.comment}</span>
                  </div>
                )}

                <div className="border border-white/10 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl rounded-lg rounded-t-none bg-black/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-left gap-2">
                      <button
                        onClick={() => handleLike(key, item.postId)}
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
                        onClick={() => handleSave(key)}
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
                      onClick={() => handleSubscribe(key)}
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
              </>
            )}

            {/* ─── MY POSTS ONLY ─────────────────────────────────────── */}
            {searchType === "my posts only" && (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={item.authorPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={item.authorName || "author"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    <span className="font-bold">{item.authorName}</span>
                    <span className="font-light text-gray-400 text-sm">
                      {item.postCreationDate
                        ? formatTimeAgo(item.postCreationDate)
                        : ""}
                    </span>
                  </div>
                  {item.isHidden && (
                    <span className="ml-auto text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl hover:text-blue-300 bg-black/10">
                  {item.postLink ? (
                    <Link
                      href={item.postLink}
                      className="font-sans font-bold text-lg md:text-3xl text-white"
                    >
                      {item.postTitle}
                    </Link>
                  ) : (
                    <div className="font-sans font-bold text-lg md:text-3xl text-white">
                      {item.postTitle}
                    </div>
                  )}
                  {item.postDesc && (
                    <p className="text-gray-400 mt-2">
                      {stripHtml(item.postDesc)}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.tags.map((tag: string, i: number) => (
                        <Link
                          key={i}
                          href={`/search?q=${encodeURIComponent(tag)}&type=posts`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-white/10 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl rounded-lg rounded-t-none bg-black/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      {item.postLikes ?? 0} like
                      {item.postLikes !== 1 ? "s" : ""}
                    </span>
                    <span className="text-gray-400">
                      {item.commentsCount ?? 0} comment
                      {item.commentsCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Pagination */}
      <PaginationControls />
    </div>
  );
}
