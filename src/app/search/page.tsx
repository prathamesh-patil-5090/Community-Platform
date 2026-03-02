"use client";
import Search from "@/app/components/search/Search";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CgOptions } from "react-icons/cg";
import MobSearchBar from "../components/search/MobSearchBar";
import MobSearchModal from "../components/search/MobSearchModal";

type SortOption = "Most Relevant" | "Newest" | "Oldest";

const VALID_SORT_OPTIONS: SortOption[] = ["Most Relevant", "Newest", "Oldest"];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Initialize sort from URL param if present
  const sortFromUrl = searchParams?.get("sort") ?? "Most Relevant";
  const isValidSort = VALID_SORT_OPTIONS.includes(sortFromUrl as SortOption);
  const initialSort: SortOption = isValidSort
    ? (sortFromUrl as SortOption)
    : "Most Relevant";

  const [sortOptions, setSortOptionState] = useState<SortOption>(initialSort);

  // Sync sort state with URL changes (e.g. browser back/forward)
  useEffect(() => {
    const urlSort = searchParams?.get("sort") ?? "Most Relevant";
    const valid = VALID_SORT_OPTIONS.includes(urlSort as SortOption);
    const resolved: SortOption = valid
      ? (urlSort as SortOption)
      : "Most Relevant";
    setSortOptionState(resolved);
  }, [searchParams]);

  // When sort changes, update URL params (preserving q and type)
  const setSortOption = useCallback(
    (option: SortOption) => {
      setSortOptionState(option);

      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (option === "Most Relevant") {
        params.delete("sort"); // "Most Relevant" is the default, keep URL clean
      } else {
        params.set("sort", option);
      }
      // Reset page to 1 when changing sort
      params.delete("page");
      router.push(`/search?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  return (
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
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
