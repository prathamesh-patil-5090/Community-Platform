"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBell, FiHome, FiSearch, FiUser } from "react-icons/fi";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin panel and auth pages, similar to Navbar
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminPanel = pathname?.startsWith("/admin-panel");
  if (isAuthPage || isAdminPanel) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0B0E]/90 backdrop-blur-md border-t border-white/5 px-6 py-1 flex justify-between items-center z-50 lg:hidden">
      <Link
        href="/"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/"
            ? "text-white"
            : "text-gray-500 hover:text-purple-400 transition-colors"
        }`}
      >
        {pathname === "/" ? (
          <span className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
            <FiHome className="text-2xl" />
          </span>
        ) : (
          <FiHome className="text-2xl" />
        )}
        <span
          className={`text-[10px] font-medium tracking-wide ${
            pathname === "/" ? "text-purple-400 mt-1" : ""
          }`}
        >
          HOME
        </span>
      </Link>

      <Link
        href="/notifications"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/notifications"
            ? "text-white"
            : "text-gray-500 hover:text-purple-400 transition-colors"
        }`}
      >
        {pathname === "/notifications" ? (
          <span className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
            <FiBell className="text-2xl" />
          </span>
        ) : (
          <FiBell className="text-2xl" />
        )}
        <span
          className={`text-[10px] font-medium tracking-wide ${
            pathname === "/notifications" ? "text-purple-400 mt-1" : ""
          }`}
        >
          NOTIFICATIONS
        </span>
      </Link>

      <Link
        href="/search"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/search"
            ? "text-white"
            : "text-gray-500 hover:text-purple-400 transition-colors"
        }`}
      >
        {pathname === "/search" ? (
          <span className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
            <FiSearch className="text-2xl" />
          </span>
        ) : (
          <FiSearch className="text-2xl" />
        )}
        <span
          className={`text-[10px] font-medium tracking-wide ${
            pathname === "/search" ? "text-purple-400 mt-1" : ""
          }`}
        >
          SEARCH
        </span>
      </Link>

      <Link
        href="/profile"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/profile"
            ? "text-white"
            : "text-gray-500 hover:text-purple-400 transition-colors"
        }`}
      >
        {pathname === "/profile" ? (
          <span className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
            <FiUser className="text-2xl" />
          </span>
        ) : (
          <FiUser className="text-2xl" />
        )}
        <span
          className={`text-[10px] font-medium tracking-wide ${
            pathname === "/profile" ? "text-purple-400 mt-1" : ""
          }`}
        >
          PROFILE
        </span>
      </Link>
    </nav>
  );
}
