"use client";
import Logo from "./ui/Logo";
import SearchBar from "./ui/SearchBar";
import Button from "./ui/Button";
import { CgProfile } from "react-icons/cg";
import { CiSearch } from "react-icons/ci";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoIosClose, IoIosNotificationsOutline } from "react-icons/io";
import SideBar from "./ui/SideBar";

function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSidebarItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div>
      <div className="bg-black/30 flex items-center justify-between pt-2 pr-5 sm:pr-15 pb-2 border border-black border-b-white/50">
        <div className="flex items-center justify-center pl-3">
          <HiMenuAlt2
            size={40}
            className="text-white cursor-pointer md:hidden"
            onClick={toggleMenu}
            aria-label="Menu"
          />

          <div className="flex gap-4 pl-3">
            <Logo
              onClick={() => {
                router.push("/");
              }}
            />
            <div className="hidden md:block items-center">
              <SearchBar />
            </div>
          </div>
        </div>
        <div className="flex sm:gap-8 gap-4 pl-3 items-center">
          <div className="hidden md:block">
            <Button
              name="Create Post"
              onClick={() => router.push("/create-post")}
              className="bg-transparent"
            />
          </div>
          <div className="md:hidden">
            <CiSearch
              className="text-white"
              size={40}
              onClick={() => {
                router.push("/search");
              }}
            />
          </div>
          <IoIosNotificationsOutline
            size={40}
            className="cursor-pointer"
            aria-label="Notifications"
            onClick={() => {
              router.push("/notifications");
            }}
          />
          <CgProfile
            size={40}
            className="cursor-pointer text-white"
            aria-label="Profile"
            onClick={() => {
              router.push("/profile");
            }}
          />
        </div>
      </div>

      {/*Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/30 z-40 "
            onClick={toggleMenu}
            aria-label="Close Menu"
          >
            <div className="fixed top-0 left-0 w-80 h-full bg-[#0A0A0A] transform transition-transform duration-300 ease-in-out">
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
      )}
    </div>
  );
}

export default Navbar;
