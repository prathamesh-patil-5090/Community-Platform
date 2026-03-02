"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

export type SearchType =
  | "posts"
  | "people"
  | "channels"
  | "tags"
  | "comments"
  | "my posts only";

interface SearchSidebarProps {
  setType: Dispatch<SetStateAction<SearchType>>;
  resultCounts?: Partial<Record<SearchType, number>>;
}

const SearchOptions: SearchType[] = [
  "posts",
  "people",
  "channels",
  "tags",
  "comments",
  "my posts only",
];

export default function SearchSidebar({
  setType,
  resultCounts,
}: SearchSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize from URL param if present
  const typeFromUrl = (searchParams?.get("type") ?? "posts") as SearchType;
  const isValidType = SearchOptions.includes(typeFromUrl);
  const initialType = isValidType ? typeFromUrl : "posts";

  const [selected, setSelected] = useState<string>(initialType);
  const { width } = useWindowSize();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Sync with URL changes (e.g. browser back/forward)
  useEffect(() => {
    const urlType = (searchParams?.get("type") ?? "posts") as SearchType;
    const valid = SearchOptions.includes(urlType);
    const resolved = valid ? urlType : "posts";
    setSelected(resolved);
    setType(resolved);
  }, [searchParams, setType]);

  const handleOption = (option: SearchType) => {
    setSelected(option);
    setType(option);

    // Update URL to include the type param (preserving q and sort)
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (option === "posts") {
      params.delete("type"); // "posts" is the default, keep URL clean
    } else {
      params.set("type", option);
    }
    // Reset page to 1 when changing type
    params.delete("page");
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const checkArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkArrows();
    const handleResize = () => checkArrows();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollLeftFn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRightFn = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const getLabel = (option: string) => {
    const label = option.charAt(0).toUpperCase() + option.slice(1);
    const count = resultCounts?.[option as SearchType];
    if (count !== undefined && count >= 0) {
      return `${label} (${count})`;
    }
    return label;
  };

  if (width >= 768) {
    // Desktop view
    return (
      <div className="space-y-2 my-2 py-5">
        {SearchOptions.map((option, idx) => (
          <div key={idx} className="rounded-lg md:w-3xs">
            <button
              className={`w-full text-left font-sans font-light py-2 px-4 text-lg hover:bg-gray-600 hover:border rounded-lg cursor-pointer transition-colors ${
                selected === option
                  ? "bg-gray-600 text-white"
                  : "bg-transparent hover:bg-gray-600 hover:border hover:border-gray-400"
              } text-nowrap`}
              aria-label={`Filter search by - ${option}`}
              aria-pressed={selected === option}
              value={selected}
              onClick={() => handleOption(option)}
            >
              {getLabel(option)}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Mobile view: slidable with arrows
  return (
    <div className="relative w-full">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={scrollLeftFn}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full shadow-lg hover:bg-black/90 transition-colors"
          aria-label="Scroll left"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide"
        onScroll={checkArrows}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {SearchOptions.map((option, idx) => (
          <button
            key={idx}
            className={`flex-shrink-0 font-sans font-medium py-2 px-4 text-sm rounded-full cursor-pointer transition-all duration-200 border ${
              selected === option
                ? "bg-gray-600 text-white border-gray-600 shadow-md"
                : "bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500"
            } whitespace-nowrap`}
            aria-label={`Filter by ${option}`}
            aria-pressed={selected === option}
            onClick={() => handleOption(option)}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={scrollRightFn}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full shadow-lg hover:bg-black/90 transition-colors"
          aria-label="Scroll right"
        >
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Custom CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
