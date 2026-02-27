"use client";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoIosClose, IoIosNotificationsOutline } from "react-icons/io";
import { IoPersonCircle, IoShieldCheckmarkOutline } from "react-icons/io5";
import "./css/CreatePostButton.css";
import Button from "./ui/Button";
import Logo from "./ui/Logo";
import SearchBar from "./ui/SearchBar";
import SideBar from "./ui/SideBar";

function Navbar() {
  const router = useRouter();
  const pathName = usePathname();
  const { data: session } = useSession();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const handleSidebarItemClick = () => setIsMenuOpen(false);

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
    <div>
      <div className="w-full bg-[#0A0A0A] flex items-center justify-between pt-2 pr-5 sm:pr-15 pb-3 relative">
        {pathName === "/" && (
          <div className="hidden lg:block absolute bottom-0 left-[233px] right-0 border-b border-white/10" />
        )}

        {/* Left side */}
        <div className="flex items-center justify-center pl-3">
          <HiMenuAlt2
            size={40}
            className="text-white cursor-pointer md:hidden"
            onClick={toggleMenu}
            aria-label="Menu"
          />
          <div className="flex gap-4 pl-3">
            <Logo onClick={() => router.push("/")} />
            <div className="hidden md:block items-center">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex sm:gap-8 gap-4 pl-3 items-center">
          <div className="hidden md:block">
            <Button
              name="Create Post"
              onClick={() => router.push("/create-post")}
              className="bg-transparent gradient-text border-white/10"
            />
          </div>
          <div className="md:hidden">
            <CiSearch
              className="text-white"
              size={35}
              onClick={() => router.push("/search")}
            />
          </div>
          <IoIosNotificationsOutline
            size={40}
            className="cursor-pointer rounded-full border border-white/10 p-1"
            aria-label="Notifications"
            onClick={() => router.push("/notifications")}
          />

          {/* Profile avatar + dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              aria-label="Profile menu"
              onClick={() => setIsProfileOpen((v) => !v)}
              className="flex items-center justify-center rounded-full focus:outline-none cursor-pointer"
            >
              {user?.image ? (
                <Image
                  src={user.image}
                  width={36}
                  height={36}
                  alt={displayName}
                  className="rounded-full object-cover border border-white/20 w-9 h-9"
                />
              ) : (
                <IoPersonCircle size={40} className="text-white/80" />
              )}
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#141414] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        width={36}
                        height={36}
                        alt={displayName}
                        className="rounded-full object-cover w-9 h-9 shrink-0"
                      />
                    ) : (
                      <IoPersonCircle
                        size={36}
                        className="text-white/60 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {displayName}
                      </p>
                      {user?.email && (
                        <p className="text-gray-400 text-xs truncate">
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
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <IoPersonCircle size={18} className="text-gray-400" />
                    View Profile
                  </button>

                  {user?.role === "admin" && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/admin-panel");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <IoShieldCheckmarkOutline
                        size={18}
                        className="text-purple-400"
                      />
                      Admin Panel
                    </button>
                  )}

                  <div className="border-t border-white/10 my-1" />

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-red-400"
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
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={toggleMenu}
        aria-label="Close Menu"
      >
        <div
          className={`fixed top-0 left-0 w-80 h-full bg-[#0A0A0A] transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-white text-xl font-semibold">Menu</h2>
            <IoIosClose
              onClick={toggleMenu}
              size={40}
              className="cursor-pointer"
              aria-label="Close Menu"
            />
          </div>
          <div className="bg-[#0A0A0A]" onClick={handleSidebarItemClick}>
            <SideBar />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
