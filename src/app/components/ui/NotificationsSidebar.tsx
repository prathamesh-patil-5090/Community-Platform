"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useWindowSize } from "../hooks/useWindowSize";

interface NotificationsSidebarProps {
  setType: Dispatch<SetStateAction<"post" | "comment" | "all">>;
}

const notificationsOptions = ["all", "comments", "posts"];

export default function NotificationsSidebar({
  setType,
}: NotificationsSidebarProps) {
  const [selected, setSelected] = useState<string>("all");
  const { width } = useWindowSize();

  const handleOption = (option: string) => {
    setSelected(option);
    const type: "post" | "comment" | "all" =
      option === "all" ? "all" : option === "comments" ? "comment" : "post";
    setType(type);
  };

  return (
    <div className={`space-y-2 ${width < 768 ? "flex gap-2" : "my-2 py-5"}`}>
      {notificationsOptions.map((option, idx) => (
        <div key={idx} className="rounded-lg md:w-3xs">
          <button
            className={`w-full text-left font-sans font-light py-2 px-4 text-lg hover:bg-gray-600 hover:border rounded-lg cursor-pointer transition-colors ${
              selected === option
                ? "bg-gray-600 text-white"
                : "bg-transparent hover:bg-gray-600 hover:border hover:border-gray-400"
            }`}
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
