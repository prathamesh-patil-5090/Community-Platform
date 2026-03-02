"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
    IoAddOutline,
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoChevronBack,
    IoChevronForward,
    IoCloseOutline,
    IoCreateOutline,
    IoEyeOffOutline,
    IoEyeOutline,
    IoFunnelOutline,
    IoLayersOutline,
    IoLinkOutline,
    IoReloadOutline,
    IoSearchOutline,
    IoTrashOutline,
} from "react-icons/io5";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface CommunityPageItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  content: string;
  coverImage: string | null;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdByName: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
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
  page: CommunityPageItem | null;
}

/* ─── Wrapper with Suspense ────────────────────────────────────────────────── */

export default function AdminCommunityPagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading community pages...</p>
          </div>
        </div>
      }
    >
      <AdminCommunityPagesContent />
    </Suspense>
  );
}

/* ─── Main Content ─────────────────────────────────────────────────────────── */

function AdminCommunityPagesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── State ───────────────────────────────────────────────────────────────── */
  const [pages, setPages] = useState<CommunityPageItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("active") ?? ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10)
  );
  const [perPage] = useState(15);
  const [showFilters, setShowFilters] = useState(false);

  // Modal
  const [modal, setModal] = useState<ModalState>({ type: null, page: null });

  // Toast
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

  /* ── Fetch community pages ───────────────────────────────────────────────── */
  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", perPage.toString());
      params.set("sort", "order");
      params.set("dir", "asc");
      if (search.trim()) params.set("search", search.trim());
      if (activeFilter) params.set("active", activeFilter);

      const res = await fetch(`/api/admin/community-pages?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch community pages");
      }
      const data = await res.json();
      setPages(data.pages ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, search, activeFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPages();
    }
  }, [status, fetchPages]);

  /* ── URL sync ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (activeFilter) params.set("active", activeFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    const qs = params.toString();
    router.replace(`/admin-panel/community-pages${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }, [search, activeFilter, currentPage, router]);

  /* ── Search with debounce ────────────────────────────────────────────────── */
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ── Toggle active ───────────────────────────────────────────────────────── */
  const handleToggleActive = async (page: CommunityPageItem) => {
    setActionLoading(page.id);
    setModal({ type: null, page: null });
    try {
      const res = await fetch(`/api/admin/community-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to toggle status");
      }

      const data = await res.json();
      setToast({
        message: data.message ?? `Page ${page.isActive ? "deactivated" : "activated"}`,
        type: "success",
      });
      fetchPages();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Toggle failed",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Delete ──────────────────────────────────────────────────────────────── */
  const handleDelete = async (page: CommunityPageItem) => {
    setActionLoading(page.id);
    setModal({ type: null, page: null });
    try {
      const res = await fetch(`/api/admin/community-pages/${page.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete page");
      }

      setToast({
        message: `"${page.name}" deleted permanently`,
        type: "success",
      });
      fetchPages();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Delete failed",
        type: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Loading state ───────────────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────────────────────── */
  if (error && pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load community pages
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchPages}
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
            <IoLayersOutline size={28} className="text-purple-400" />
            Community Pages
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage sidebar community pages. Each page becomes a /{"{slug}"}{" "}
            route on the site.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPages}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <IoReloadOutline size={16} />
            Refresh
          </button>
          <Link
            href="/admin-panel/community-pages/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
          >
            <IoAddOutline size={18} />
            New Page
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <IoSearchOutline
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, slug, or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
            >
              <IoCloseOutline size={18} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
            showFilters || activeFilter
              ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          <IoFunnelOutline size={16} />
          Filters
          {activeFilter && (
            <span className="ml-1 w-2 h-2 rounded-full bg-purple-400" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            Status:
          </span>
          {["", "true", "false"].map((val) => (
            <button
              key={val}
              onClick={() => {
                setActiveFilter(val);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                activeFilter === val
                  ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {val === "" ? "All" : val === "true" ? "Active" : "Inactive"}
            </button>
          ))}

          {activeFilter && (
            <button
              onClick={() => {
                setActiveFilter("");
                setCurrentPage(1);
              }}
              className="ml-auto text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2.5rem_1fr_10rem_6rem_6rem_8rem_10rem] gap-4 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <span>#</span>
          <span>Page</span>
          <span>Slug</span>
          <span>Order</span>
          <span>Status</span>
          <span>Created by</span>
          <span>Actions</span>
        </div>

        {/* Loading overlay */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Loading pages...</p>
            </div>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IoLayersOutline size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">
              {search || activeFilter
                ? "No community pages match your filters"
                : "No community pages yet"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {search || activeFilter
                ? "Try adjusting your search or filter criteria"
                : "Create your first community page to get started"}
            </p>
            {!search && !activeFilter && (
              <Link
                href="/admin-panel/community-pages/create"
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/20 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-colors"
              >
                <IoAddOutline size={16} />
                Create Page
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pages.map((page, idx) => {
              const isLoading = actionLoading === page.id;
              return (
                <div
                  key={page.id}
                  className={`md:grid md:grid-cols-[2.5rem_1fr_10rem_6rem_6rem_8rem_10rem] gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center ${
                    isLoading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Index */}
                  <span className="hidden md:block text-gray-500 text-sm">
                    {(pagination?.page ?? 1 - 1) * perPage + idx + 1 > 0
                      ? ((pagination?.page ?? 1) - 1) * perPage + idx + 1
                      : idx + 1}
                  </span>

                  {/* Page info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-none">{page.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {page.name}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {page.description}
                      </p>
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="mt-2 md:mt-0">
                    <Link
                      href={`/${page.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-mono bg-purple-600/10 px-2 py-1 rounded"
                    >
                      <IoLinkOutline size={12} />
                      /{page.slug}
                    </Link>
                  </div>

                  {/* Order */}
                  <span className="hidden md:block text-gray-400 text-sm">
                    {page.order}
                  </span>

                  {/* Status */}
                  <div className="mt-2 md:mt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        page.isActive
                          ? "bg-green-600/15 text-green-400 border border-green-500/20"
                          : "bg-gray-600/15 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {page.isActive ? (
                        <IoEyeOutline size={12} />
                      ) : (
                        <IoEyeOffOutline size={12} />
                      )}
                      {page.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Created by */}
                  <div className="hidden md:block">
                    <p className="text-gray-400 text-xs truncate">
                      {page.createdByName ?? "Unknown"}
                    </p>
                    <p className="text-gray-600 text-[10px]">
                      {new Date(page.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 mt-3 md:mt-0">
                    <button
                      onClick={() => setModal({ type: "view", page })}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="View details"
                    >
                      <IoEyeOutline size={16} />
                    </button>
                    <Link
                      href={`/admin-panel/community-pages/${page.id}/edit`}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <IoCreateOutline size={16} />
                    </Link>
                    <button
                      onClick={() => setModal({ type: "toggle", page })}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        page.isActive
                          ? "hover:bg-amber-500/10 text-gray-400 hover:text-amber-400"
                          : "hover:bg-green-500/10 text-gray-400 hover:text-green-400"
                      }`}
                      title={page.isActive ? "Deactivate" : "Activate"}
                    >
                      {page.isActive ? (
                        <IoEyeOffOutline size={16} />
                      ) : (
                        <IoEyeOutline size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => setModal({ type: "delete", page })}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} pages
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <IoChevronBack size={14} />
              Prev
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] ?? 0) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="px-2 text-gray-600 text-xs"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      pagination.page === item
                        ? "bg-purple-600/30 border border-purple-500/30 text-purple-300"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(pagination.totalPages, p + 1)
                )
              }
              disabled={!pagination.hasNextPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <IoChevronForward size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── View Details Modal ──────────────────────────────────────────────── */}
      {modal.type === "view" && modal.page && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setModal({ type: null, page: null })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{modal.page.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold">
                      {modal.page.name}
                    </h3>
                    <p className="text-gray-500 text-xs font-mono">
                      /{modal.page.slug}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModal({ type: null, page: null })}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    Description
                  </p>
                  <p className="text-gray-300 text-sm">
                    {modal.page.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        modal.page.isActive
                          ? "bg-green-600/15 text-green-400"
                          : "bg-gray-600/15 text-gray-400"
                      }`}
                    >
                      {modal.page.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      Order
                    </p>
                    <p className="text-gray-300 text-sm">{modal.page.order}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      Created by
                    </p>
                    <p className="text-gray-300 text-sm">
                      {modal.page.createdByName ?? "Unknown"}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(modal.page.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {modal.page.updatedByName && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Last updated by
                      </p>
                      <p className="text-gray-300 text-sm">
                        {modal.page.updatedByName}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {new Date(modal.page.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {modal.page.content && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      Content Preview
                    </p>
                    <div
                      className="text-gray-400 text-xs leading-relaxed max-h-40 overflow-y-auto rounded-lg bg-white/5 p-3 prose prose-invert prose-sm max-w-none
                        [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0
                        [&_strong]:text-gray-300 [&_em]:text-gray-400 [&_a]:text-purple-400 [&_img]:rounded-lg [&_img]:max-h-32"
                      dangerouslySetInnerHTML={{
                        __html: modal.page.content,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                <Link
                  href={`/admin-panel/community-pages/${modal.page.id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 border border-purple-500/20 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-colors"
                >
                  <IoCreateOutline size={16} />
                  Edit Page
                </Link>
                <Link
                  href={`/${modal.page.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  <IoLinkOutline size={16} />
                  View Live
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Toggle Active Modal ─────────────────────────────────────────────── */}
      {modal.type === "toggle" && modal.page && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setModal({ type: null, page: null })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    modal.page.isActive
                      ? "bg-amber-600/20"
                      : "bg-green-600/20"
                  }`}
                >
                  {modal.page.isActive ? (
                    <IoEyeOffOutline size={20} className="text-amber-400" />
                  ) : (
                    <IoEyeOutline size={20} className="text-green-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {modal.page.isActive ? "Deactivate" : "Activate"} Page
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {modal.page.isActive
                      ? "This will hide it from the sidebar and make the URL return 404"
                      : "This will show it in the sidebar and make it publicly accessible"}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
                <span className="text-2xl">{modal.page.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">
                    {modal.page.name}
                  </p>
                  <p className="text-gray-500 text-xs font-mono">
                    /{modal.page.slug}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModal({ type: null, page: null })}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleActive(modal.page!)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                    modal.page.isActive
                      ? "bg-amber-600/20 border-amber-500/30 text-amber-300 hover:bg-amber-600/30"
                      : "bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30"
                  }`}
                >
                  {modal.page.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      {modal.type === "delete" && modal.page && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setModal({ type: null, page: null })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-[#141418] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-600/20">
                  <IoTrashOutline size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    Delete Community Page
                  </h3>
                  <p className="text-gray-500 text-xs">
                    This action is permanent and cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-2">
                Are you sure you want to permanently delete this community page?
                The /{modal.page.slug} URL will stop working.
              </p>

              <div className="bg-white/5 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
                <span className="text-2xl">{modal.page.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">
                    {modal.page.name}
                  </p>
                  <p className="text-gray-500 text-xs font-mono">
                    /{modal.page.slug}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModal({ type: null, page: null })}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(modal.page!)}
                  className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-sm text-red-300 font-medium hover:bg-red-600/30 transition-colors cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
