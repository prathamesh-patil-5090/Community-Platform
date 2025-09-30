"use client";
import Search from "@/app/components/search/Search";
import MobSearchBar from "../components/search/MobSearchBar";
import { CgOptions } from "react-icons/cg";
import { Suspense, useRef, useState } from "react";
import MobSearchModal from "../components/search/MobSearchModal";

export default function SearchPage() {
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [sortOptions, setSortOption] = useState<
    "Most Relevant" | "Newest" | "Oldest"
  >("Most Relevant");
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Suspense>
      <div className="flex flex-col gap-5 items-center justify-center">
        <div className="flex flex-row items-center justify-start relative w-full h-[50px] mt-3 p-2 md:hidden ">
          <MobSearchBar />
          <button
            ref={buttonRef}
            className="relative text-white hover:border cursor-pointer hover:border-white hover:bg-gray-700 rounded-md px-4 py-2"
            onClick={() => setOpenOptions(!openOptions)}
          >
            <CgOptions size={20} />
          </button>
          {openOptions && (
            <MobSearchModal
              onSelect={setSortOption}
              onClose={() => {
                setOpenOptions(!openOptions);
              }}
              buttonRef={buttonRef}
            />
          )}
        </div>
        <Search sortOptions={sortOptions} setSortOptions={setSortOption} />
      </div>
    </Suspense>
  );
}
