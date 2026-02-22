"use client";

import { FaHashtag, FaRegNewspaper } from "react-icons/fa";
import { MdOutlineInsertComment } from "react-icons/md";

type View = "posts" | "comments";

interface UserActivityProps {
  postsCount: number;
  commentsCount: number;
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function UserActivity({
  postsCount,
  commentsCount,
  activeView,
  onViewChange,
}: UserActivityProps) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest">
          Activity
        </h2>
      </div>

      <div className="p-2 flex flex-col gap-1">
        {/* Posts */}
        <button
          onClick={() => onViewChange("posts")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
            activeView === "posts"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
          }`}
        >
          <FaRegNewspaper
            size={15}
            className={
              activeView === "posts" ? "text-blue-400" : "text-white/30"
            }
          />
          <span className="text-sm">
            <span
              className={`font-semibold ${activeView === "posts" ? "text-blue-300" : "text-white"}`}
            >
              {postsCount}
            </span>{" "}
            {postsCount === 1 ? "post" : "posts"} written
          </span>
          {activeView === "posts" && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          )}
        </button>

        {/* Comments */}
        <button
          onClick={() => onViewChange("comments")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
            activeView === "comments"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
          }`}
        >
          <MdOutlineInsertComment
            size={16}
            className={
              activeView === "comments" ? "text-blue-400" : "text-white/30"
            }
          />
          <span className="text-sm">
            <span
              className={`font-semibold ${activeView === "comments" ? "text-blue-300" : "text-white"}`}
            >
              {commentsCount}
            </span>{" "}
            {commentsCount === 1 ? "comment" : "comments"} written
          </span>
          {activeView === "comments" && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          )}
        </button>

        {/* Tags – non-interactive stat */}
        <div className="flex items-center gap-3 px-3 py-2.5 text-white/40 border border-transparent">
          <FaHashtag size={14} className="text-white/20 flex-shrink-0" />
          <span className="text-sm">
            <span className="font-semibold text-white/50">3</span> tags followed
          </span>
        </div>
      </div>
    </div>
  );
}
