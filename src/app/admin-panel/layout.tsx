"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IoChevronDown,
  IoGridOutline,
  IoHomeOutline,
  IoLogOutOutline,
  IoMegaphoneOutline,
  IoMenuOutline,
  IoNewspaperOutline,
  IoPeopleOutline,
  IoPersonCircle,
  IoShieldCheckmarkOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

/* ─── Sidebar navigation items ─────────────────────────────────────────────── */
const sidebarItems = [
  {
    name: "Dashboard",
    href: "/admin-panel",
    icon: IoGridOutline,
  },
  {
    name: "Posts",
    href: "/admin-panel/posts",
    icon: IoNewspaperOutline,
  },
  {
    name: "Users",
    href: "/admin-panel/users",
    icon: IoPeopleOutline,
  },
  {
    name: "Ads",
    href: "/admin-panel/ads",
    icon: IoMegaphoneOutline,
  },
];

/* ─── Admin Sidebar ────────────────────────────────────────────────────────── */
function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin-panel") return pathname === "/admin-panel";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0c0c0f] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header / branding */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
            <IoShieldCheckmarkOutline size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">
              Admin Panel
            </h1>
            <p className="text-gray-500 text-[11px]">Community Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 border border-purple-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <Icon size={20} className={active ? "text-purple-400" : ""} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer — back to site */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all"
          >
            <IoHomeOutline size={20} />
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}

/* ─── Admin Navbar ─────────────────────────────────────────────────────────── */
function AdminNavbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setIsLoggingOut(false);
    }
  }

  const user = session?.user;
  const displayName = user?.name || user?.email?.split("@")[0] || "Admin";

  // Derive page title from pathname
  const getPageTitle = () => {
    if (pathname === "/admin-panel") return "Dashboard";
    if (pathname.startsWith("/admin-panel/posts")) return "Post Management";
    if (pathname.startsWith("/admin-panel/users")) return "User Management";
    if (pathname.startsWith("/admin-panel/ads")) return "Ad Management";
    return "Admin Panel";
  };

  return (
    <header className="h-16 bg-[#0c0c0f] border-b border-white/10 flex items-center justify-between px-4 lg:px-6">
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Toggle sidebar"
        >
          <IoMenuOutline size={24} />
        </button>
        <div>
          <h2 className="text-white font-semibold text-lg">{getPageTitle()}</h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <IoStatsChartOutline size={12} />
            <span>Admin Overview</span>
          </div>
        </div>
      </div>

      {/* Right: profile dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Admin profile menu"
        >
          {user?.image ? (
            <Image
              src={user.image}
              width={32}
              height={32}
              alt={displayName}
              className="rounded-full object-cover w-8 h-8 border border-white/20"
            />
          ) : (
            <IoPersonCircle size={32} className="text-gray-400" />
          )}
          <div className="hidden sm:block text-left">
            <p className="text-white text-sm font-medium leading-tight">
              {displayName}
            </p>
            <p className="text-purple-400 text-[11px]">Administrator</p>
          </div>
          <IoChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${
              isProfileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isProfileOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-[#141418] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white text-sm font-semibold truncate">
                {displayName}
              </p>
              {user?.email && (
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
              )}
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/profile");
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <IoPersonCircle size={16} className="text-gray-500" />
                View Profile
              </button>
              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/");
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
              >
                <IoHomeOutline size={16} className="text-gray-500" />
                Back to Site
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 disabled:opacity-50 cursor-pointer"
              >
                <IoLogOutOutline size={16} />
                {isLoggingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── Admin Footer ─────────────────────────────────────────────────────────── */
function AdminFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0c0c0f] py-4 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Community Platform &mdash; Admin
          Panel
        </p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Main Site
          </Link>
          <span className="text-white/10">|</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Admin Layout ─────────────────────────────────────────────────────────── */
export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08080b] text-gray-100">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Navbar */}
        <AdminNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        {/* Footer */}
        <AdminFooter />
      </div>
    </div>
  );
}
