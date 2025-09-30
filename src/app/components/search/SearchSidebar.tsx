"use client";

import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

interface SearchSidebarProps {
  setType: Dispatch<
    SetStateAction<
      | "posts"
      | "people"
      | "organizations"
      | "tags"
      | "comments"
      | "my posts only"
    >
  >;
}

const SearchOptions = [
  "posts",
  "people",
  "organizations",
  "tags",
  "comments",
  "my posts only",
];

export default function SearchSidebar({ setType }: SearchSidebarProps) {
  const [selected, setSelected] = useState<string>("posts");
  const { width } = useWindowSize();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleOption = (option: string) => {
    setSelected(option);
    const type:
      | "posts"
      | "people"
      | "organizations"
      | "tags"
      | "comments"
      | "my posts only" =
      option === "posts"
        ? "posts"
        : option === "comments"
        ? "comments"
        : option === "people"
        ? "people"
        : option === "organizations"
        ? "organizations"
        : option === "tags"
        ? "tags"
        : "my posts only";
    setType(type);
  };

  const checkArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1); // -1 for precision
    }
  };

  useEffect(() => {
    // Set initial type on mount
    setType("posts");
    checkArrows();
    const handleResize = () => checkArrows();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setType]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  if (width >= 768) {
    // Desktop view: no changes
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
              aria-label={`Filter notification by - ${option}`}
              aria-pressed={selected === option}
              value={selected}
              onClick={() => handleOption(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
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
          onClick={scrollLeft}
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
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
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
