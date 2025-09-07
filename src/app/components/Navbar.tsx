"use client";
import Logo from "./ui/Logo";
import SearchBar from "./ui/SearchBar";
import Button from "./ui/Button";
import { FaBell } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { CiSearch } from "react-icons/ci";
import { useRouter } from "next/navigation";

function Navbar() {
  const router = useRouter();
  return (
    <div className="flex items-start justify-between pt-2 pr-5 sm:pr-15 pb-2 border border-black border-b-white">
      <div className="flex gap-4 pl-3">
        <Logo
          onClick={() => {
            router.push("/");
          }}
        />
        <div className="hidden md:block">
          <SearchBar />
        </div>
      </div>
      <div className="flex sm:gap-8 gap-2 pl-3 items-center">
        <div className="hidden md:block">
          <Button name="Create Post" />
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
        <FaBell
          size={40}
          aria-label="Notifications"
          onClick={() => {
            router.push("/notifications");
          }}
        />
        <CgProfile
          size={40}
          aria-label="Profile"
          onClick={() => {
            router.push("/profile");
          }}
        />
      </div>
    </div>
  );
}

export default Navbar;
