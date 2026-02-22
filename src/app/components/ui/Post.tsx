"use client";
import "@/app/components/create-post/styles.scss";
import { CommentType, PostInfoType } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { MdOutlineModeComment } from "react-icons/md";
import ReportsComponent from "./ReportsComponent";

export default function Post({ postData }: { postData: PostInfoType }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(postData.initialIsLiked ?? false);
  const [likes, setLikes] = useState(postData.postLikes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [comments, setComments] = useState<CommentType[]>(
    postData.commentObjects ?? [],
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // ── Report modal ────────────────────────────────────────────────────────────
  const [isReport, setIsReport] = useState(false);

  const commentsRef = useRef<HTMLDivElement>(null);

  // Sync if parent provides updated initialIsLiked (e.g., after refetch)
  useEffect(() => {
    if (postData.initialIsLiked !== undefined) {
      setIsLiked(postData.initialIsLiked);
    }
  }, [postData.initialIsLiked]);

  // Lock body scroll while report modal is open
  useEffect(() => {
    document.body.style.overflow = isReport ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isReport]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatCount = (num: number): string => {
    if (num >= 1_000_000)
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  };

  // ── Like toggle ──────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (likeLoading || !postData.postId) return;

    const prevLiked = isLiked;
    const prevCount = likes;
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likes + 1 : Math.max(0, likes - 1);

    // Optimistic update
    setIsLiked(nextLiked);
    setLikes(nextCount);

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/posts/${postData.postId}/like`, {
        method: "PATCH",
      });
      if (!res.ok) {
        setIsLiked(prevLiked);
        setLikes(prevCount);
        return;
      }
      const data = await res.json();
      setIsLiked(data.liked);
      setLikes(data.likes);
    } catch {
      setIsLiked(prevLiked);
      setLikes(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Submit comment ───────────────────────────────────────────────────────────
  const handleSubmitComment = async () => {
    const text = commentInput.trim();
    if (!text || commentSubmitting || !postData.postId) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postData.postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setComments((prev) => [data.comment, ...prev]);
      setCommentInput("");
    } catch {
      // silently ignore
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ── Delete comment ───────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId: string) => {
    if (!postData.postId) return;
    try {
      const res = await fetch(
        `/api/posts/${postData.postId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (!res.ok) return;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently ignore
    } finally {
      setOpenMenuId(null);
    }
  };

  const tags = postData.tags ?? [];
  const postId = postData.postId;

  return (
    <article className="bg-[#0A0A0A] relative w-full border border-white/10 md:rounded-xl p-4 md:p-5 mt-2">
      {/* ── Author row ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link href={`/author/${postData.authorId}`} className="flex-shrink-0">
            {postData.authorPic ? (
              <Image
                src={postData.authorPic}
                alt={postData.authorName ?? "Author"}
                width={44}
                height={44}
                className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-white/10 hover:ring-blue-500/60 transition-all"
              />
            ) : (
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-base select-none ring-2 ring-white/10 hover:ring-blue-500/60 transition-all">
                {(postData.authorName ?? "A").charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/author/${postData.authorId}`}
              className="text-sm md:text-base font-medium text-white hover:text-blue-400 transition-colors"
            >
              {postData.authorName}
            </Link>
            <p className="text-xs text-white/40">
              {new Date(postData.postCreationDate)
                .toDateString()
                .split(" ")
                .slice(1)
                .join(" ")}
            </p>
          </div>
        </div>

        {/* Post type badge */}
        {postData.postType && (
          <span className="text-xs bg-white/5 text-white/50 border border-white/10 px-2.5 py-0.5 rounded-full">
            {postData.postType}
          </span>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────────────────────── */}
      <h2
        className="font-bold text-lg md:text-2xl text-white mb-2 cursor-pointer hover:text-blue-300 transition-colors leading-snug"
        onClick={() => router.push(`/posts/${postId}`)}
      >
        {postData.postTitle}
      </h2>

      {/* ── Cover image ─────────────────────────────────────────────────────── */}
      {postData.postImage && (
        <div
          className="mb-3 rounded-xl overflow-hidden cursor-pointer"
          onClick={() => router.push(`/posts/${postId}`)}
        >
          <Image
            src={postData.postImage}
            alt={postData.postTitle ?? "Post image"}
            width={800}
            height={420}
            className="w-full object-cover rounded-xl hover:opacity-90 transition-opacity"
          />
        </div>
      )}

      {/* ── Excerpt (TipTap rendered preview) ───────────────────────────────── */}
      {postData.postDesc && (
        <div className="mb-3">
          <div
            className="relative max-h-40 overflow-hidden cursor-pointer"
            onClick={() => router.push(`/posts/${postId}`)}
          >
            <div
              className="tiptap-content text-sm"
              dangerouslySetInnerHTML={{ __html: postData.postDesc }}
            />
            {/* gradient fade to signal clipped content */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
          </div>
          <button
            onClick={() => router.push(`/posts/${postId}`)}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm mt-1 inline-block"
          >
            Read more →
          </button>
        </div>
      )}

      {/* ── Tags ────────────────────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag, i) => (
            <button
              key={i}
              onClick={() => router.push(`/search?q=${tag}`)}
              className="text-xs text-blue-400/70 bg-blue-500/8 hover:bg-blue-500/15 border border-blue-500/15 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* ── Action bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
            ${
              isLiked
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }
            disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          {isLiked ? (
            <BiSolidLike size={18} className="text-red-400" />
          ) : (
            <BiLike size={18} />
          )}
          <span className="font-medium">{formatCount(likes)}</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={() => {
            setIsCommentOpen((v) => !v);
            if (!isCommentOpen) {
              setTimeout(() => {
                commentsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }, 100);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
            ${
              isCommentOpen
                ? "bg-blue-500/10 text-blue-400"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          aria-label="Toggle comments"
        >
          <MdOutlineModeComment size={18} />
          <span className="font-medium">{formatCount(comments.length)}</span>
        </button>
      </div>

      {/* ── Comments section ────────────────────────────────────────────────── */}
      <div ref={commentsRef}>
        {isCommentOpen && (
          <div className="pt-4 space-y-3 border-t border-white/5 mt-2">
            {/* Input row */}
            <div className="flex gap-2 items-start">
              {/* Current user avatar */}
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="You"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5 select-none">
                  {(session?.user?.name ?? session?.user?.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl p-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                  rows={2}
                  placeholder="Write a comment…"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleSubmitComment();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim() || commentSubmitting}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                  aria-label="Post comment"
                >
                  {commentSubmitting ? (
                    <span className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IoSend size={16} className="text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Comment list */}
            {comments.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">
                No comments yet.
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 items-start group">
                    {/* Commenter avatar */}
                    {c.authorImage ? (
                      <Image
                        src={c.authorImage}
                        alt={c.authorName ?? "Commenter"}
                        width={30}
                        height={30}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5 select-none">
                        {(c.authorName ?? "A").charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="flex-1 min-w-0 bg-white/5 border border-white/8 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link
                          href={`/author/${c.authorId}`}
                          className="text-xs font-semibold text-white/80 hover:text-blue-400 transition-colors truncate"
                        >
                          {c.authorName ?? "Anonymous"}
                        </Link>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-white/25">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          {/* Context menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === c.id ? null : c.id)
                              }
                              className="p-0.5 rounded text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <BsThreeDotsVertical size={12} />
                            </button>
                            {openMenuId === c.id && (
                              <div
                                className="absolute right-0 top-6 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[100px] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed break-words">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Report modal portal ──────────────────────────────────────────────── */}
      {isReport &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div onClick={(e) => e.stopPropagation()}>
              <ReportsComponent
                postData={postData.postTitle ?? ""}
                onClose={() => setIsReport(false)}
              />
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
