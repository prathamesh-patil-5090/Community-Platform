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
  onLikeAction?: (liked: boolean, newCount: number) => void;
  onCommentClickAction?: () => void;
  onBookmarkAction?: (bookmarked: boolean) => void;
};

const formatCount = (num = 0) => {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
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
  const [likeLoading, setLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const [copied, setCopied] = useState<boolean>(false);

  const handleLike = async () => {
    if (likeLoading) return;

    const prevLiked = isLiked;
    const prevCount = likes;
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likes + 1 : Math.max(0, likes - 1);

    setIsLiked(nextLiked);
    setLikes(nextCount);
    onLikeAction?.(nextLiked, nextCount);

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "PATCH",
      });

      if (!res.ok) {
        setIsLiked(prevLiked);
        setLikes(prevCount);
        onLikeAction?.(prevLiked, prevCount);
        return;
      }

      const data = await res.json();
      setIsLiked(data.liked);
      setLikes(data.likes);
      onLikeAction?.(data.liked, data.likes);
    } catch {
      setIsLiked(prevLiked);
      setLikes(prevCount);
      onLikeAction?.(prevLiked, prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    onBookmarkAction?.(next);
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
      console.error("copy failed", err);
    }
  };

  return (
    <aside
      aria-label="Post actions"
      className="hidden fixed left-0 top-[60px] h-[calc(100vh-60px)] md:flex select-none flex-col items-center gap-8 pt-20 p-3 text-white bg-black border-r border-white/5"
      style={{ minWidth: 83 }}
    >
      {/* Like */}
      <button
        aria-pressed={isLiked}
        aria-label={isLiked ? "Unlike post" : "Like post"}
        onClick={handleLike}
        disabled={likeLoading}
        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all
          ${
            isLiked
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }
          disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isLiked ? "Unlike" : "Like"}
      >
        {isLiked ? (
          <BiSolidLike size={24} className="text-red-400" />
        ) : (
          <BiLike size={24} />
        )}
        <span className="text-xs font-medium">{formatCount(likes)}</span>
      </button>

      {/* Comment */}
      <button
        aria-label="Open comments"
        onClick={() => onCommentClickAction?.()}
        className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all"
        title="Comments"
      >
        <MdOutlineModeComment size={24} />
        <span className="text-xs font-medium">
          {formatCount(commentsCount)}
        </span>
      </button>

      {/* Bookmark */}
      <button
        aria-pressed={isBookmarked}
        aria-label={isBookmarked ? "Remove bookmark" : "Save to bookmarks"}
        onClick={handleBookmark}
        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all
          ${
            isBookmarked
              ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        title={isBookmarked ? "Bookmarked" : "Save"}
      >
        {isBookmarked ? (
          <BsBookmarkFill size={22} className="text-blue-400" />
        ) : (
          <BsBookmark size={22} />
        )}
        <span className="text-xs font-medium">
          {isBookmarked ? "Saved" : "Save"}
        </span>
      </button>

      {/* Copy Link / Share */}
      <button
        aria-label="Copy post link"
        onClick={handleCopyLink}
        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all
          ${
            copied
              ? "bg-green-500/10 text-green-400"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        title="Copy link"
      >
        <HiOutlineLink size={22} />
        <span className="text-xs font-medium">
          {copied ? "Copied!" : "Share"}
        </span>
      </button>
    </aside>
  );
}
