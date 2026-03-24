"use client";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { HiMenuAlt2 } from "react-icons/hi";
import "./css/CreatePostButton.css";
import Button from "./ui/Button";
import Logo from "./ui/Logo";
import SearchBar from "./ui/SearchBar";
import SideBar from "./ui/SideBar";

const NOTIFICATION_POLL_INTERVAL_MS = 30_000; // 30 seconds

function Navbar() {
  const router = useRouter();
  const pathName = usePathname();
  const { data: session, status } = useSession();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const profileRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const handleSidebarItemClick = () => setIsMenuOpen(false);

  // ─── Poll for unread notification count ──────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silently ignore — will retry on next poll
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Fetch immediately on mount
    fetchUnreadCount();

    // Then poll every 30 seconds
    const interval = setInterval(
      fetchUnreadCount,
      NOTIFICATION_POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [status, fetchUnreadCount]);

  // Re-fetch when navigating back from the notifications page
  useEffect(() => {
    if (status === "authenticated" && pathName !== "/notifications") {
      fetchUnreadCount();
    }
  }, [pathName, status, fetchUnreadCount]);

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
  const displayName = user?.name || user?.email?.split("@")[0] || "Profile";

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[#0B0E14]/60 backdrop-blur-xl border-b border-[#9D4EDD]/20 shadow-[0_4px_32px_rgba(0,0,0,0.4)] flex items-center justify-between px-6 h-16 w-full">
        {/* Left side */}
        <div className="flex items-center gap-4 md:gap-8">
          <HiMenuAlt2
            size={28}
            className="text-slate-400 hover:text-white cursor-pointer md:hidden transition-colors"
            onClick={toggleMenu}
            aria-label="Menu"
          />
          <div className="flex items-center gap-8">
            <Logo onClick={() => router.push("/")} />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#151921] px-3 py-1.5 rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-slate-400 text-sm mr-2">
              search
            </span>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <button
            className="p-2 text-slate-400 hover:text-primary transition-colors lg:hidden"
            onClick={() => router.push("/search")}
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[20px]">
              search
            </span>
          </button>

          <button
            className="p-2 text-slate-400 hover:text-primary transition-colors relative"
            aria-label="Notifications"
            onClick={() => router.push("/notifications")}
          >
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>

          {/* Profile avatar + dropdown */}
          {status === "authenticated" ? (
            <div className="relative ml-2 pb-1" ref={profileRef}>
              <button
                aria-label="Profile menu"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="h-8 w-8 rounded-full overflow-hidden border border-primary/30 flex items-center justify-center cursor-pointer focus:outline-none"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    width={32}
                    height={32}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                    person
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-surface-elevated border border-outline rounded-xl shadow-xl z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-outline">
                    <div className="flex items-center gap-3">
                      {user?.image ? (
                        <Image
                          src={user.image}
                          width={36}
                          height={36}
                          alt={displayName}
                          className="rounded-full object-cover w-9 h-9 shrink-0 border border-outline"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-variant border border-outline flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                            person
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-on-surface text-sm font-semibold truncate">
                          {displayName}
                        </p>
                        {user?.email && (
                          <p className="text-on-surface-variant text-xs truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                      View Profile
                    </button>

                    {user?.role === "admin" && (
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          router.push("/admin-panel");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-secondary hover:text-secondary-dim hover:bg-secondary/10 transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          admin_panel_settings
                        </span>
                        Admin Panel
                      </button>
                    )}

                    <div className="border-t border-outline my-1" />

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoggingOut ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4 text-error"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Signing out…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">
                            logout
                          </span>
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              name="Log In"
              onClick={() => router.push("/login")}
              className="bg-transparent text-on-surface border border-outline hover:bg-surface-variant transition-colors ml-2 rounded-full px-4 py-2"
            />
          )}
        </div>
      </nav>

      {/* Mobile Menu overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMenu}
        aria-label="Close Menu"
      >
        <div
          className={`fixed top-0 left-0 w-80 h-full bg-surface border-r border-outline transform transition-transform duration-300 ease-in-out flex flex-col ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-outline">
            <h2 className="text-on-surface font-headline text-xl font-semibold">
              Menu
            </h2>
            <button
              onClick={toggleMenu}
              className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors"
              aria-label="Close Menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                close
              </span>
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto"
            onClick={handleSidebarItemClick}
          >
            <SideBar />
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
