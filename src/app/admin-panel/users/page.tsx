"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import {
  IoAlertCircleOutline,
  IoBanOutline,
  IoChevronBack,
  IoChevronForward,
  IoCloseOutline,
  IoEyeOutline,
  IoFunnelOutline,
  IoGlobeOutline,
  IoPersonCircle,
  IoReloadOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoShieldOutline,
  IoTrashOutline,
} from "react-icons/io5";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  provider: "github" | "google" | "credentials";
  role: "user" | "admin";
  isBanned: boolean;
  banReason: string | null;
  bannedAt: string | null;
  bannedBy: string | null;
  bannedByName: string | null;
  blockedIPs: string[];
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

type ModalType =
  | "view"
  | "ban"
  | "unban"
  | "block_ip"
  | "unblock_ip"
  | "promote"
  | "demote"
  | "delete"
  | null;

interface ModalState {
  type: ModalType;
  user: AdminUser | null;
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading users...</p>
          </div>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [bannedFilter, setBannedFilter] = useState<string>(
    searchParams.get("banned") ?? "",
  );
  const [roleFilter, setRoleFilter] = useState<string>(
    searchParams.get("role") ?? "",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );
  const [perPage, setPerPage] = useState(
    parseInt(searchParams.get("limit") ?? "15", 10),
  );

  // Modal
  const [modal, setModal] = useState<ModalState>({ type: null, user: null });
  const [banReason, setBanReason] = useState("");
  const [blockIP, setBlockIP] = useState("");
  const [unblockIP, setUnblockIP] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(perPage));
      if (search.trim()) params.set("search", search.trim());
      if (bannedFilter) params.set("banned", bannedFilter);
      if (roleFilter) params.set("role", roleFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, bannedFilter, roleFilter, sortBy]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchUsers();
  }, [session, status, fetchUsers, router]);

  async function performAction(userId: string, body: Record<string, unknown>) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Action failed");
      }
      // Refresh user list after action
      await fetchUsers();
      resetModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteUser() {
    if (!modal.user) return;
    setActionLoading(modal.user.id);
    try {
      const res = await fetch(`/api/admin/users/${modal.user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== modal.user!.id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
      resetModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  function resetModal() {
    setModal({ type: null, user: null });
    setBanReason("");
    setBlockIP("");
    setUnblockIP("");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getProviderBadge(provider: string) {
    const styles: Record<string, string> = {
      github: "bg-gray-500/10 text-gray-300 border-gray-500/20",
      google: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      credentials: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    };
    return styles[provider] ?? styles.credentials;
  }

  // Loading state
  if (status === "loading" || (loading && users.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load users
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchUsers}
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
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pagination?.total ?? 0} total users
          </p>
        </div>
        <button
          onClick={fetchUsers}
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
                placeholder="Search by name or email..."
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

          {/* Filter by ban status */}
          <div className="flex items-center gap-2">
            <IoFunnelOutline size={16} className="text-gray-500 shrink-0" />
            <select
              value={bannedFilter}
              onChange={(e) => {
                setBannedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
            >
              <option value="">All Users</option>
              <option value="false">Active Only</option>
              <option value="true">Banned Only</option>
            </select>
          </div>

          {/* Filter by role */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 cursor-pointer appearance-none"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
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
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Provider
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Blocked IPs
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-500 text-sm"
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === session?.user?.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        user.isBanned ? "opacity-60" : ""
                      }`}
                    >
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setModal({ type: "view", user })}
                          title="View user details"
                        >
                          {user.image ? (
                            <Image
                              src={user.image}
                              width={36}
                              height={36}
                              alt=""
                              className="rounded-full object-cover w-9 h-9 shrink-0"
                            />
                          ) : (
                            <IoPersonCircle
                              size={36}
                              className="text-gray-500 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm font-medium truncate max-w-[160px] lg:max-w-[240px] group-hover:text-purple-300 transition-colors">
                                {user.name ?? "Unnamed"}
                              </p>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs truncate max-w-[160px] lg:max-w-[240px]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border capitalize ${getProviderBadge(
                            user.provider,
                          )}`}
                        >
                          {user.provider}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 text-center">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <IoShieldCheckmarkOutline size={12} />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                            <IoShieldOutline size={12} />
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {user.isBanned ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              <IoBanOutline size={12} />
                              Banned
                            </span>
                            {user.bannedByName && (
                              <span
                                className="text-[10px] text-red-400/60 max-w-[120px] truncate"
                                title={`Banned by ${user.bannedByName}${user.banReason ? ` — ${user.banReason}` : ""}`}
                              >
                                by {user.bannedByName}
                              </span>
                            )}
                            {!user.bannedByName && user.banReason && (
                              <span
                                className="text-[10px] text-red-400/60 max-w-[120px] truncate"
                                title={user.banReason}
                              >
                                {user.banReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Blocked IPs */}
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {user.blockedIPs.length > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-red-400 text-xs font-medium">
                              {user.blockedIPs.length}
                            </span>
                            <span
                              className="text-[10px] text-gray-500 truncate max-w-[100px]"
                              title={user.blockedIPs.join(", ")}
                            >
                              {user.blockedIPs.slice(0, 2).join(", ")}
                              {user.blockedIPs.length > 2 && "..."}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-xs">None</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setModal({ type: "view", user })}
                            className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors cursor-pointer"
                            title="View user details"
                          >
                            <IoEyeOutline size={16} />
                          </button>
                          {/* Ban / Unban */}
                          {!isSelf && (
                            <>
                              {user.isBanned ? (
                                <button
                                  onClick={() =>
                                    setModal({ type: "unban", user })
                                  }
                                  disabled={actionLoading === user.id}
                                  className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Unban user"
                                >
                                  <IoShieldCheckmarkOutline size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setModal({ type: "ban", user })
                                  }
                                  disabled={actionLoading === user.id}
                                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Ban user"
                                >
                                  <IoBanOutline size={16} />
                                </button>
                              )}

                              {/* Block IP */}
                              <button
                                onClick={() =>
                                  setModal({ type: "block_ip", user })
                                }
                                disabled={actionLoading === user.id}
                                className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                                title="Block IP address"
                              >
                                <IoGlobeOutline size={16} />
                              </button>

                              {/* Promote / Demote */}
                              {user.role === "user" ? (
                                <button
                                  onClick={() =>
                                    setModal({ type: "promote", user })
                                  }
                                  disabled={actionLoading === user.id}
                                  className="p-2 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Promote to admin"
                                >
                                  <IoShieldOutline size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setModal({ type: "demote", user })
                                  }
                                  disabled={actionLoading === user.id}
                                  className="p-2 rounded-lg hover:bg-gray-500/10 text-gray-400 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Demote to user"
                                >
                                  <IoShieldOutline size={16} />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() =>
                                  setModal({ type: "delete", user })
                                }
                                disabled={actionLoading === user.id}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                                title="Delete user"
                              >
                                <IoTrashOutline size={16} />
                              </button>
                            </>
                          )}
                          {isSelf && (
                            <span className="text-gray-600 text-xs italic px-2">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                "No users found"
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

      {/* View User Detail Modal */}
      {modal.type === "view" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <h3 className="text-white font-semibold">User Details</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                {modal.user.image ? (
                  <Image
                    src={modal.user.image}
                    width={64}
                    height={64}
                    alt=""
                    className="rounded-full object-cover w-16 h-16 shrink-0"
                  />
                ) : (
                  <IoPersonCircle
                    size={64}
                    className="text-gray-500 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-white text-lg font-semibold truncate">
                    {modal.user.name ?? "Unnamed"}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    {modal.user.email}
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* User ID */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    User ID
                  </p>
                  <p
                    className="text-gray-300 text-xs font-mono truncate"
                    title={modal.user.id}
                  >
                    {modal.user.id}
                  </p>
                </div>

                {/* Provider */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Provider
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getProviderBadge(
                      modal.user.provider,
                    )}`}
                  >
                    {modal.user.provider}
                  </span>
                </div>

                {/* Role */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Role
                  </p>
                  {modal.user.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <IoShieldCheckmarkOutline size={12} />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                      <IoShieldOutline size={12} />
                      User
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Status
                  </p>
                  {modal.user.isBanned ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      <IoBanOutline size={12} />
                      Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </span>
                  )}
                </div>

                {/* Joined */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Joined
                  </p>
                  <p className="text-gray-300 text-xs">
                    {formatDate(modal.user.createdAt)}
                  </p>
                </div>

                {/* Updated */}
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Last Updated
                  </p>
                  <p className="text-gray-300 text-xs">
                    {formatDate(modal.user.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Ban details (if banned) */}
              {modal.user.isBanned && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-4 space-y-2">
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">
                    Ban Details
                  </p>
                  {modal.user.bannedByName && (
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        Banned By
                      </p>
                      <p className="text-red-300 text-sm">
                        {modal.user.bannedByName}
                      </p>
                    </div>
                  )}
                  {modal.user.banReason && (
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        Reason
                      </p>
                      <p className="text-red-300 text-sm">
                        {modal.user.banReason}
                      </p>
                    </div>
                  )}
                  {modal.user.bannedAt && (
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-0.5">
                        Banned On
                      </p>
                      <p className="text-red-300 text-xs">
                        {formatDate(modal.user.bannedAt)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Blocked IPs */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Blocked IPs
                </p>
                {modal.user.blockedIPs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {modal.user.blockedIPs.map((ip) => (
                      <span
                        key={ip}
                        className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono"
                      >
                        {ip}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">
                    No IPs blocked for this user.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end px-5 py-4 border-t border-white/10 shrink-0">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {modal.type === "ban" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Ban User</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                This user will be banned from the community. They will not be
                able to access the platform.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  {modal.user.image ? (
                    <Image
                      src={modal.user.image}
                      width={32}
                      height={32}
                      alt=""
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <IoPersonCircle size={32} className="text-gray-500" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {modal.user.name ?? "Unnamed"}
                    </p>
                    <p className="text-gray-500 text-xs">{modal.user.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">
                  Ban Reason (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Why is this user being banned?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  performAction(modal.user!.id, {
                    action: "ban",
                    banReason: banReason.trim() || undefined,
                  })
                }
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban User Modal */}
      {modal.type === "unban" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Unban User</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                This user will regain access to the community platform.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  {modal.user.image ? (
                    <Image
                      src={modal.user.image}
                      width={32}
                      height={32}
                      alt=""
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <IoPersonCircle size={32} className="text-gray-500" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {modal.user.name ?? "Unnamed"}
                    </p>
                    <p className="text-gray-500 text-xs">{modal.user.email}</p>
                  </div>
                </div>
                {modal.user.banReason && (
                  <p className="text-red-400/70 text-xs mt-2">
                    Ban reason: {modal.user.banReason}
                  </p>
                )}
                {modal.user.bannedAt && (
                  <p className="text-gray-500 text-xs mt-1">
                    Banned on: {formatDate(modal.user.bannedAt)}
                  </p>
                )}
              </div>
              {modal.user.blockedIPs.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <IoAlertCircleOutline
                    size={16}
                    className="text-amber-400 shrink-0 mt-0.5"
                  />
                  <p className="text-amber-300 text-xs">
                    Note: This user has {modal.user.blockedIPs.length} blocked
                    IP(s). Unbanning will not remove IP blocks. Use the IP
                    management action separately.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  performAction(modal.user!.id, { action: "unban" })
                }
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id
                  ? "Unbanning..."
                  : "Unban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block IP Modal */}
      {modal.type === "block_ip" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Block IP Address</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                Enter an IP address to block for this user. The user will also
                be banned automatically.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-white text-sm font-medium">
                  {modal.user.name ?? "Unnamed"}
                </p>
                <p className="text-gray-500 text-xs">{modal.user.email}</p>
              </div>

              {/* Currently blocked IPs */}
              {modal.user.blockedIPs.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-2">
                    Currently Blocked IPs
                  </p>
                  <div className="space-y-1.5">
                    {modal.user.blockedIPs.map((ip) => (
                      <div
                        key={ip}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                      >
                        <span className="text-red-400 text-sm font-mono">
                          {ip}
                        </span>
                        <button
                          onClick={() => {
                            setUnblockIP(ip);
                            setModal({
                              type: "unblock_ip",
                              user: modal.user,
                            });
                          }}
                          className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded hover:bg-white/5"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">
                  IP Address to Block
                </label>
                <input
                  type="text"
                  value={blockIP}
                  onChange={(e) => setBlockIP(e.target.value)}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-1.5">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for blocking this IP"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!blockIP.trim()) {
                    alert("Please enter an IP address.");
                    return;
                  }
                  performAction(modal.user!.id, {
                    action: "block_ip",
                    ip: blockIP.trim(),
                    banReason: banReason.trim() || undefined,
                  });
                }}
                disabled={actionLoading === modal.user.id || !blockIP.trim()}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id ? "Blocking..." : "Block IP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock IP Modal */}
      {modal.type === "unblock_ip" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Unblock IP Address</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                Are you sure you want to unblock this IP address for{" "}
                <strong className="text-white">
                  {modal.user.name ?? modal.user.email}
                </strong>
                ?
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                <span className="text-amber-400 font-mono text-sm">
                  {unblockIP}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={() => {
                  setUnblockIP("");
                  setModal({ type: "block_ip", user: modal.user });
                }}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() =>
                  performAction(modal.user!.id, {
                    action: "unblock_ip",
                    ip: unblockIP,
                  })
                }
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id
                  ? "Unblocking..."
                  : "Unblock IP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote to Admin Modal */}
      {modal.type === "promote" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Promote to Admin</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <IoAlertCircleOutline
                  size={20}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <p className="text-amber-300 text-sm">
                  This will grant <strong>full admin privileges</strong> to this
                  user, including the ability to manage other users and posts.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  {modal.user.image ? (
                    <Image
                      src={modal.user.image}
                      width={32}
                      height={32}
                      alt=""
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <IoPersonCircle size={32} className="text-gray-500" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {modal.user.name ?? "Unnamed"}
                    </p>
                    <p className="text-gray-500 text-xs">{modal.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  performAction(modal.user!.id, {
                    action: "update_role",
                    role: "admin",
                  })
                }
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id
                  ? "Promoting..."
                  : "Promote to Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote to User Modal */}
      {modal.type === "demote" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Demote to User</h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <IoCloseOutline size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-300 text-sm">
                This will remove admin privileges from this user. They will
                become a regular user.
              </p>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  {modal.user.image ? (
                    <Image
                      src={modal.user.image}
                      width={32}
                      height={32}
                      alt=""
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <IoPersonCircle size={32} className="text-gray-500" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {modal.user.name ?? "Unnamed"}
                    </p>
                    <p className="text-gray-500 text-xs">{modal.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  performAction(modal.user!.id, {
                    action: "update_role",
                    role: "user",
                  })
                }
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id
                  ? "Demoting..."
                  : "Demote to User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {modal.type === "delete" && modal.user && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-semibold text-red-400">Delete User</h3>
              <button
                onClick={resetModal}
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
                  undone. The user account will be permanently deleted. Their
                  posts and comments will remain but will show as from a deleted
                  user.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <div className="flex items-center gap-3">
                  {modal.user.image ? (
                    <Image
                      src={modal.user.image}
                      width={32}
                      height={32}
                      alt=""
                      className="rounded-full object-cover w-8 h-8"
                    />
                  ) : (
                    <IoPersonCircle size={32} className="text-gray-500" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {modal.user.name ?? "Unnamed"}
                    </p>
                    <p className="text-gray-500 text-xs">{modal.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/10">
              <button
                onClick={resetModal}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading === modal.user.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === modal.user.id
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
