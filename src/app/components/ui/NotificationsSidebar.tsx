"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

type NotificationType = "all" | "new_post" | "comment_on_post";

interface NotificationsSidebarProps {
  setType: (type: NotificationType) => void;
  activeType: NotificationType;
  unreadCount?: number;
}

const notificationsOptions: { value: NotificationType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new_post", label: "Posts" },
  { value: "comment_on_post", label: "Comments" },
];

export default function NotificationsSidebar({
  setType,
  activeType,
  unreadCount,
}: NotificationsSidebarProps) {
  const { width } = useWindowSize();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleOption = (option: NotificationType) => {
    setType(option);
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

  const getLabel = (option: { value: NotificationType; label: string }) => {
    if (
      option.value === "all" &&
      unreadCount !== undefined &&
      unreadCount > 0
    ) {
      return `${option.label} (${unreadCount})`;
    }
    return option.label;
  };

  // Desktop view
  if (width >= 768) {
    return (
      <div className="space-y-2 my-2 py-5">
        {notificationsOptions.map((option) => (
          <div key={option.value} className="rounded-lg md:w-3xs">
            <button
              className={`w-full text-left font-sans font-light py-2 px-4 text-lg hover:bg-gray-600 hover:border rounded-lg cursor-pointer transition-colors ${
                activeType === option.value
                  ? "bg-gray-600 text-white"
                  : "bg-transparent hover:bg-gray-600 hover:border hover:border-gray-400"
              } text-nowrap`}
              aria-label={`Filter notifications by - ${option.label}`}
              aria-pressed={activeType === option.value}
              onClick={() => handleOption(option.value)}
            >
              {getLabel(option)}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Mobile view: horizontal scrollable
  return (
    <div className="relative w-full">
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

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide"
        onScroll={checkArrows}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {notificationsOptions.map((option) => (
          <button
            key={option.value}
            className={`flex-shrink-0 font-sans font-medium py-2 px-4 text-sm rounded-full cursor-pointer transition-all duration-200 border ${
              activeType === option.value
                ? "bg-gray-600 text-white border-gray-600 shadow-md"
                : "bg-gray-800/50 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500"
            } whitespace-nowrap`}
            aria-label={`Filter by ${option.label}`}
            aria-pressed={activeType === option.value}
            onClick={() => handleOption(option.value)}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>

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

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
