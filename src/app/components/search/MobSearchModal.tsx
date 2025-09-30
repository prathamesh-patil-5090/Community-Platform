"use client";
import React, { useEffect, useRef } from "react";

interface MobSearchModalProps {
  onSelect: (option: "Most Relevant" | "Newest" | "Oldest") => void;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

function MobSearchModal({ onSelect, onClose, buttonRef }: MobSearchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef?.current &&
        !buttonRef?.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, buttonRef]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="absolute flex flex-col gap-2 items-center text-nowrap right-3 top-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-2 animate-fade-in"
      role="menu"
      aria-label="Sort options"
    >
      <button
        className="w-full text-left px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors"
        onClick={() => {
          onSelect("Most Relevant");
          onClose();
        }}
        role="menuitem"
      >
        Most Relevant
      </button>
      <button
        className="w-full text-left px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors"
        onClick={() => {
          onSelect("Newest");
          onClose();
        }}
        role="menuitem"
      >
        Newest
      </button>
      <button
        className="w-full text-left px-3 py-1 text-white hover:bg-gray-700 rounded transition-colors"
        onClick={() => {
          onSelect("Oldest");
          onClose();
        }}
        role="menuitem"
      >
        Oldest
      </button>
    </div>
  );
}

export default MobSearchModal;
