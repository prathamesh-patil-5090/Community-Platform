"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
    IoAddOutline,
    IoAlertCircleOutline,
    IoChevronBack,
    IoChevronForward,
    IoCloseOutline,
    IoEyeOutline,
    IoFunnelOutline,
    IoMegaphoneOutline,
    IoPauseOutline,
    IoPlayOutline,
    IoReloadOutline,
    IoSearchOutline,
    IoTrashOutline,
} from "react-icons/io5";

interface AdminAd {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  linkUrl: string | null;
  placement: "sidebar" | "feed" | "banner";
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  tags: string[];
  createdBy: string;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  impressions: number;
  clicks: number;
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
  type: "toggle" | "delete" | "view" | null;
  ad: AdminAd | null;
}

export default function AdminAdsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading ads...</p>
          </div>
        </div>
      }
    >
      <AdminAdsContent />
    </Suspense>
  );
}

function AdminAdsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ads, setAds] = useState<AdminAd[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [placementFilter, setPlacementFilter] = useState<string>(
    searchParams.get("placement") ?? "",
  );
  const [activeFilter, setActiveFilter] = useState<string>(
    searchParams.get("active") ?? "",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );
  const [perPage, setPerPage] = useState(
    parseInt(searchParams.get("limit") ?? "15", 10),
  );

  // Modal
  const [modal, setModal] = useState<ModalState>({ type: null, ad: null });

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(perPage));
      if (search) params.set("search", search);
      if (placementFilter) params.set("placement", placementFilter);
      if (activeFilter) params.set("active", activeFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/ads?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch ads");
      }
      const data = await res.json();
      setAds(data.ads);
      setPagination(data.pagination);
    } catch (err) {
      const data = err instanceof Error ? err.message : "Something went wrong";
      setError(data);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, placementFilter, activeFilter, sortBy]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchAds();
  }, [session, status, router, fetchAds]);

  async function handleToggleActive() {
    if (!modal.ad) return;
    setActionLoading(modal.ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${modal.ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to toggle ad");

      setAds((prev) =>
        prev.map((a) =>
          a.id === modal.ad!.id
            ? {
                ...a,
                isActive: data.ad.isActive,
                updatedBy: data.ad.updatedBy ?? a.updatedBy,
                updatedByName: data.ad.updatedByName ?? a.updatedByName,
              }
            : a,
        ),
      );
      setModal({ type: null, ad: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteAd() {
    if (!modal.ad) return;
    setActionLoading(modal.ad.id);
    try {
      const res = await fetch(`/api/admin/ads/${modal.ad.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete ad");

      setAds((prev) => prev.filter((a) => a.id !== modal.ad!.id));
      if (pagination) setPagination({ ...pagination, total: pagination.total - 1 });
      setModal({ type: null, ad: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchAds();
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function truncate(str: string, max: number) {
    if (str.length <= max) return str;
    return str.slice(0, max) + "…";
  }

  function getPlacementBadge(placement: string) {
    const styles: Record<string, string> = {
      sidebar:
        "bg-blue-500/10 text-blue-400 border-blue-500/20",
      feed: "bg-green-500/10 text-green-400 border-green-500/20",
      banner:
        "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return styles[placement] ?? styles.sidebar;
  }

  // Loading state
  if (status === "loading" || (loading && ads.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading ads...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && ads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load ads
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchAds}
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
          <h1 className="text-2xl font-bold text-white">Ad Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pagination?.total ?? 0} total ads
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={fetchAds}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <IoReloadOutline
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <Link
            href="/admin-panel/ads/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <IoAddOutline size={16} />
            Create Ad
          </Link>
        </div>
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

          {/* Filter by placement */}
          <div className="flex items-center gap-2">
            <IoFunnelOutline size={16} className="text-gray-500 shrink-0" />
            <select
              value={placementFilter}
              onChange={(e) => {
                setPlacementFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
            >
              <option value="">All Placements</option>
              <option value="sidebar">Sidebar</option>
              <option value="feed">Feed</option>
              <option value="banner">Banner</option>
            </select>
          </div>

          {/* Filter by active status */}
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
          >
            <option value="">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

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
            <option value="priority">Highest Priority</option>
            <option value="most_clicks">Most Clicks</option>
          </select>
        </div>
      </div>

      {/* Ads table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Ad
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Placement
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Priority
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Clicks
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Impressions
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Created By
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
              {ads.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    No ads found matching your criteria.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr
                    key={ad.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      !ad.isActive ? "opacity-60" : ""
                    }`}
                  >
                    {/* Ad info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ad.coverImage && (
                          <Image
                            src={ad.coverImage}
                            width={48}
                            height={36}
                            alt=""
                            className="rounded-md object-cover w-12 h-9 shrink-0 hidden sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <button
                            onClick={() => setModal({ type: "view", ad })}
                            className="text-white text-sm font-medium truncate max-w-[200px] lg:max-w-[300px] hover:text-purple-300 transition-colors block text-left cursor-pointer"
                            title="View ad details"
                          >
                            {truncate(ad.title, 60)}
                          </button>
                          {ad.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {ad.tags.slice(0, 3).map((tag) => (
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

                    {/* Placement */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full border capitalize ${getPlacementBadge(
                          ad.placement,
                        )}`}
                      >
                        {ad.placement}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {ad.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <IoPlayOutline size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          <IoPauseOutline size={12} />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          ad.priority >= 70
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : ad.priority >= 30
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}
                      >
                        {ad.priority}
                      </span>
                    </td>

                    {/* Clicks */}
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {ad.clicks.toLocaleString()}
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-3 text-center text-gray-300 text-sm hidden lg:table-cell">
                      {ad.impressions.toLocaleString()}
                    </td>

                    {/* Created By */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-300 text-sm truncate max-w-[120px] block">
                        {ad.createdByName ?? "Unknown"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                      {formatDate(ad.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <button
                          onClick={() => setModal({ type: "view", ad })}
                          className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors cursor-pointer"
                          title="View ad details"
                        >
                          <IoEyeOutline size={16} />
                        </button>
                        {/* Edit */}
                        <Link
                          href={`/admin-panel/ads/${ad.id}/edit`}
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors cursor-pointer"
                          title="Edit ad"
                        >
                          <IoMegaphoneOutline size={16} />
                        </Link>
                        {/* Toggle active */}
                        <button
                          onClick={() => setModal({ type: "toggle", ad })}
                          disabled={actionLoading === ad.id}
                          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                            ad.isActive
                              ? "hover:bg-amber-500/10 text-amber-400"
                              : "hover:bg-green-500/10 text-green-400"
                          }`}
                          title={ad.isActive ? "Deactivate ad" : "Activate ad"}
                        >
                          {ad.isActive ? (
                            <IoPauseOutline size={16} />
                          ) : (
                            <IoPlayOutline size={16} />
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setModal({ type: "delete", ad })}
                          disabled={actionLoading === ad.id}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete ad"
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
                "No ads found"
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

      {/* View Ad Detail Modal */}
      {modal.type === "view" && modal.ad && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h3 className="text-white font-semibold">Ad Details</h3>
              <button
                onClick={() => setModal({ type: null, ad: null })}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Cover Image */}
              {modal.ad.coverImage && (
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <Image
                    src={modal.ad.coverImage}
                    width={600}
                    height={200}
                    alt="Ad cover"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Title */}
              <div>
                <p className="text-white text-lg font-semibold">
                  {modal.ad.title}
                </p>
                {modal.ad.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {modal.ad.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Ad ID */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Ad ID
                  </p>
                  <p
                    className="text-gray-300 text-xs font-mono truncate"
                    title={modal.ad.id}
                  >
                    {modal.ad.id}
                  </p>
                </div>

                {/* Placement */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Placement
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getPlacementBadge(
                      modal.ad.placement,
                    )}`}
                  >
                    {modal.ad.placement}
                  </span>
                </div>

                {/* Status */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Status
                  </p>
                  {modal.ad.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Priority
                  </p>
                  <p className="text-gray-300 text-sm font-medium">
                    {modal.ad.priority}
                  </p>
                </div>

                {/* Impressions */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Impressions
                  </p>
                  <p className="text-gray-300 text-sm font-medium">
                    {modal.ad.impressions.toLocaleString()}
                  </p>
                </div>

                {/* Clicks */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Clicks
                  </p>
                  <p className="text-gray-300 text-sm font-medium">
                    {modal.ad.clicks.toLocaleString()}
                  </p>
                </div>

                {/* Created */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Created
                  </p>
                  <p className="text-gray-300 text-xs">
                    {formatDate(modal.ad.createdAt)}
                  </p>
                </div>

                {/* Created By */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Created By
                  </p>
                  <p className="text-gray-300 text-xs">
                    {modal.ad.createdByName ?? "Unknown"}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              {(modal.ad.startDate || modal.ad.endDate) && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Schedule
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {modal.ad.startDate && (
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                          Start Date
                        </p>
                        <p className="text-gray-300 text-xs">
                          {formatDate(modal.ad.startDate)}
                        </p>
                      </div>
                    )}
                    {modal.ad.endDate && (
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                          End Date
                        </p>
                        <p className="text-gray-300 text-xs">
                          {formatDate(modal.ad.endDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Link URL */}
              {modal.ad.linkUrl && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-1">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Link URL
                  </p>
                  <a
                    href={modal.ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline break-all"
                  >
                    {modal.ad.linkUrl}
                  </a>
                </div>
              )}

              {/* Content preview */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Content Preview
                </p>
                <div
                  className="tiptap-content text-sm text-gray-300 max-h-[200px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: modal.ad.content }}
                />
              </div>

              {/* Last updated by */}
              {modal.ad.updatedByName && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-3">
                  <p className="text-amber-400/80 text-xs">
                    Last updated by{" "}
                    <span className="font-medium text-amber-300">
                      {modal.ad.updatedByName}
                    </span>{" "}
                    on {formatDate(modal.ad.updatedAt)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 shrink-0">
              <Link
                href={`/admin-panel/ads/${modal.ad.id}/edit`}
                className="px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-600/30 transition-colors"
              >
                Edit Ad
              </Link>
              <button
                onClick={() => setModal({ type: null, ad: null })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Active Modal */}
      {modal.type === "toggle" && modal.ad && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">
                {modal.ad.isActive ? "Deactivate Ad" : "Activate Ad"}
              </h3>
              <button
                onClick={() => setModal({ type: null, ad: null })}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                {modal.ad.isActive
                  ? "This ad will be deactivated and will no longer be shown to users."
                  : "This ad will be activated and will start being shown to users (if within schedule)."}
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {modal.ad.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${getPlacementBadge(
                      modal.ad.placement,
                    )}`}
                  >
                    {modal.ad.placement}
                  </span>
                  <span className="text-gray-500 text-xs">
                    Priority: {modal.ad.priority}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => setModal({ type: null, ad: null })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleActive}
                disabled={actionLoading === modal.ad.id}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                  modal.ad.isActive
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {actionLoading === modal.ad.id
                  ? modal.ad.isActive
                    ? "Deactivating..."
                    : "Activating..."
                  : modal.ad.isActive
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ad Modal */}
      {modal.type === "delete" && modal.ad && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-semibold text-red-400">Delete Ad</h3>
              <button
                onClick={() => setModal({ type: null, ad: null })}
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
                  This action is <strong>permanent</strong> and cannot be undone.
                  The ad will be permanently removed from the platform.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium truncate">
                  {modal.ad.title}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Created by {modal.ad.createdByName ?? "Unknown"} &middot;{" "}
                  {modal.ad.impressions.toLocaleString()} impressions &middot;{" "}
                  {modal.ad.clicks.toLocaleString()} clicks
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => setModal({ type: null, ad: null })}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAd}
                disabled={actionLoading === modal.ad.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.ad.id
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
