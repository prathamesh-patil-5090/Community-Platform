"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    IoAlertCircleOutline,
    IoBanOutline,
    IoDocumentTextOutline,
    IoEyeOffOutline,
    IoNewspaperOutline,
    IoPeopleOutline,
    IoPersonAddOutline,
    IoReloadOutline,
    IoTrendingUpOutline,
} from "react-icons/io5";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  bannedUsers: number;
  hiddenPosts: number;
  totalComments: number;
  recentUsers: number;
  recentPosts: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  color: string;
  subtitle?: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    purple: {
      bg: "from-purple-600/10 to-purple-800/5",
      text: "text-purple-400",
      border: "border-purple-500/20",
      iconBg: "bg-purple-600/20",
    },
    blue: {
      bg: "from-blue-600/10 to-blue-800/5",
      text: "text-blue-400",
      border: "border-blue-500/20",
      iconBg: "bg-blue-600/20",
    },
    red: {
      bg: "from-red-600/10 to-red-800/5",
      text: "text-red-400",
      border: "border-red-500/20",
      iconBg: "bg-red-600/20",
    },
    amber: {
      bg: "from-amber-600/10 to-amber-800/5",
      text: "text-amber-400",
      border: "border-amber-500/20",
      iconBg: "bg-amber-600/20",
    },
    green: {
      bg: "from-green-600/10 to-green-800/5",
      text: "text-green-400",
      border: "border-green-500/20",
      iconBg: "bg-green-600/20",
    },
    indigo: {
      bg: "from-indigo-600/10 to-indigo-800/5",
      text: "text-indigo-400",
      border: "border-indigo-500/20",
      iconBg: "bg-indigo-600/20",
    },
    cyan: {
      bg: "from-cyan-600/10 to-cyan-800/5",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
      iconBg: "bg-cyan-600/20",
    },
  };

  const c = colorClasses[color] ?? colorClasses.purple;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-white text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.iconBg}`}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  href: string;
  color: string;
}) {
  const router = useRouter();

  const colorClasses: Record<string, string> = {
    purple: "text-purple-400 group-hover:text-purple-300",
    blue: "text-blue-400 group-hover:text-blue-300",
    red: "text-red-400 group-hover:text-red-300",
    amber: "text-amber-400 group-hover:text-amber-300",
  };

  return (
    <button
      onClick={() => router.push(href)}
      className="group text-left w-full rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-5 transition-all hover:border-white/20 cursor-pointer"
    >
      <Icon size={24} className={colorClasses[color] ?? "text-gray-400"} />
      <h3 className="text-white font-semibold mt-3 mb-1 text-sm">{title}</h3>
      <p className="text-gray-500 text-xs">{description}</p>
    </button>
  );
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <IoAlertCircleOutline size={48} className="text-red-400" />
          <div>
            <h3 className="text-white font-semibold text-lg">
              Failed to load dashboard
            </h3>
            <p className="text-gray-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={fetchStats}
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
    <div className="space-y-8">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session?.user?.name ?? "Admin"} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Here&apos;s an overview of your community platform.
        </p>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={IoPeopleOutline}
          color="purple"
          subtitle={`${stats?.recentUsers ?? 0} new this week`}
        />
        <StatCard
          title="Total Posts"
          value={stats?.totalPosts ?? 0}
          icon={IoNewspaperOutline}
          color="blue"
          subtitle={`${stats?.recentPosts ?? 0} new this week`}
        />
        <StatCard
          title="Banned Users"
          value={stats?.bannedUsers ?? 0}
          icon={IoBanOutline}
          color="red"
        />
        <StatCard
          title="Hidden Posts"
          value={stats?.hiddenPosts ?? 0}
          icon={IoEyeOffOutline}
          color="amber"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Comments"
          value={stats?.totalComments ?? 0}
          icon={IoDocumentTextOutline}
          color="cyan"
        />
        <StatCard
          title="New Users (7d)"
          value={stats?.recentUsers ?? 0}
          icon={IoPersonAddOutline}
          color="green"
        />
        <StatCard
          title="New Posts (7d)"
          value={stats?.recentPosts ?? 0}
          icon={IoTrendingUpOutline}
          color="indigo"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Manage Posts"
            description="View, hide, or delete posts from the platform"
            icon={IoNewspaperOutline}
            href="/admin-panel/posts"
            color="blue"
          />
          <QuickActionCard
            title="Manage Users"
            description="Ban, restrict, or manage user accounts"
            icon={IoPeopleOutline}
            href="/admin-panel/users"
            color="purple"
          />
          <QuickActionCard
            title="View Banned Users"
            description="Review currently banned or restricted accounts"
            icon={IoBanOutline}
            href="/admin-panel/users?banned=true"
            color="red"
          />
          <QuickActionCard
            title="View Hidden Posts"
            description="Review posts that have been hidden from the feed"
            icon={IoEyeOffOutline}
            href="/admin-panel/posts?hidden=true"
            color="amber"
          />
        </div>
      </div>

      {/* Platform health */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-white font-semibold text-lg mb-3">
          Platform Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Ban Rate
            </p>
            <p className="text-white text-lg font-semibold">
              {stats && stats.totalUsers > 0
                ? ((stats.bannedUsers / stats.totalUsers) * 100).toFixed(1)
                : "0.0"}
              %
            </p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats && stats.totalUsers > 0
                      ? Math.min(
                          (stats.bannedUsers / stats.totalUsers) * 100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Hidden Post Rate
            </p>
            <p className="text-white text-lg font-semibold">
              {stats && stats.totalPosts > 0
                ? ((stats.hiddenPosts / stats.totalPosts) * 100).toFixed(1)
                : "0.0"}
              %
            </p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats && stats.totalPosts > 0
                      ? Math.min(
                          (stats.hiddenPosts / stats.totalPosts) * 100,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Avg Comments / Post
            </p>
            <p className="text-white text-lg font-semibold">
              {stats && stats.totalPosts > 0
                ? (stats.totalComments / stats.totalPosts).toFixed(1)
                : "0.0"}
            </p>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    stats && stats.totalPosts > 0
                      ? Math.min(
                          (stats.totalComments / stats.totalPosts) * 10,
                          100,
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
