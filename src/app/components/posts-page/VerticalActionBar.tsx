"use client";
import { useState } from "react";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { HiOutlineLink } from "react-icons/hi";
import { MdOutlineModeComment } from "react-icons/md";

type Props = {
  postId: string;
  initialLikes?: number;
  initialIsLiked?: boolean;
  initialBookmarked?: boolean;
  commentsCount?: number;
  // Callbacks are optional — Post page can pass handlers to synchronize state upstream
  // Rename callbacks to end with 'Action' to satisfy Next.js serialization rules for use-client components
  onLikeAction?: (liked: boolean) => void;
  onCommentClickAction?: () => void;
  onBookmarkAction?: (bookmarked: boolean) => void;
};

const formatCount = (num = 0) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    return String(num);
  }
};

export default function VerticalActionBar({
  postId,
  initialLikes = 0,
  initialIsLiked = false,
  initialBookmarked = false,
  commentsCount = 0,
  onLikeAction,
  onCommentClickAction,
  onBookmarkAction,
}: Props) {
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [likes, setLikes] = useState<number>(initialLikes);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const [copied, setCopied] = useState<boolean>(false);

  const handleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikes((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));
    if (onLikeAction) onLikeAction(next);
  };

  const handleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (onBookmarkAction) onBookmarkAction(next);
  };

  const handleCopyLink = async () => {
    const postUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/posts/${postId}`
        : `/posts/${postId}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        // fallback
        const tmp = document.createElement("textarea");
        tmp.value = postUrl;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand("copy");
        tmp.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // silently ignore - don't crash the UI
      console.error("copy failed", err);
    }
  };

  return (
    <aside
      aria-label="Post actions"
      className="hidden fixed left-0 top-[60px] h-[calc(100vh-60px)] md:flex select-none flex-col items-center gap-10 pt-20 p-3 text-white bg-black"
      style={{ minWidth: 80 }}
    >
      {/* Like */}
      <button
        aria-pressed={isLiked}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        onClick={handleLike}
        className="flex flex-col items-center gap-1 transition-transform transform hover:-translate-y-1 focus:outline-none"
        title={isLiked ? "Unlike" : "Like"}
      >
        <div className="text-white">
          {isLiked ? (
            <BiSolidLike size={26} className="text-red-500" />
          ) : (
            <BiLike size={26} />
          )}
        </div>
        <span className="text-sm">{formatCount(likes)}</span>
      </button>

      {/* Comment */}
      <button
        aria-label="Open comments"
        onClick={() => onCommentClickAction?.()}
        className="flex flex-col items-center gap-1 transition-transform transform hover:-translate-y-1 focus:outline-none"
        title="Comments"
      >
        <div className="text-white">
          <MdOutlineModeComment size={26} />
        </div>
        <span className="text-sm">{formatCount(commentsCount)}</span>
      </button>

      {/* Bookmark */}
      <button
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? "Remove bookmark" : "Save to bookmarks"}
        onClick={handleBookmark}
        className="flex flex-col items-center gap-1 transition-transform transform hover:-translate-y-1 focus:outline-none"
        title={isBookmarked ? "Bookmarked" : "Save"}
      >
        <div className="text-white">
          {isBookmarked ? (
            <BsBookmarkFill size={24} />
          ) : (
            <BsBookmark size={24} />
          )}
        </div>
        <span className="text-sm">{isBookmarked ? "Saved" : "Save"}</span>
      </button>

      {/* Copy Link / Share */}
      <button
        aria-label="Copy post link"
        onClick={handleCopyLink}
        className="flex flex-col items-center gap-1 transition-transform transform hover:-translate-y-1 focus:outline-none"
        title="Copy link"
      >
        <div className="text-white">
          <HiOutlineLink size={24} />
        </div>
        <span className="text-sm">{copied ? "Copied!" : "Share"}</span>
      </button>
    </aside>
  );
}
