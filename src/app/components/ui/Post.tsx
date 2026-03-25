"use client";
import "@/app/components/create-post/styles.scss";
import { CommentType, PostInfoType } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { toast } from "react-toastify";
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

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [editCommentSubmitting, setEditCommentSubmitting] = useState(false);

  const [isReport, setIsReport] = useState(false);

  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (postData.initialIsLiked !== undefined) {
      setIsLiked(postData.initialIsLiked);
    }
  }, [postData.initialIsLiked]);

  useEffect(() => {
    document.body.style.overflow = isReport ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isReport]);

  const formatCount = (num: number): string => {
    if (num >= 1_000_000)
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  };

  const handleLike = async () => {
    if (likeLoading || !postData.postId) return;

    const prevLiked = isLiked;
    const prevCount = likes;
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likes + 1 : Math.max(0, likes - 1);

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
    } finally {
      setCommentSubmitting(false);
    }
  };

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
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleStartEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
    setOpenMenuId(null);
  };

  const handleSaveEditComment = async (commentId: string) => {
    const text = editCommentText.trim();
    if (!text || editCommentSubmitting || !postData.postId) return;

    setEditCommentSubmitting(true);
    try {
      const res = await fetch(
        `/api/posts/${postData.postId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, text: data.comment.text } : c,
        ),
      );
      setEditingCommentId(null);
      setEditCommentText("");
    } catch {
    } finally {
      setEditCommentSubmitting(false);
    }
  };

  const tags = postData.tags ?? [];
  const postId = postData.postId;

  return (
    <article className="group bg-(--surface-container) rounded-2xl border border-outline/60 transition-all hover:border-primary/40 hover:shadow-[0_0_40px_rgba(157,78,221,0.1)] relative w-full mb-8">
      {/* User Info Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/author/${postData.authorId}`} className="flex-shrink-0">
            {postData.authorPic ? (
              <Image
                src={postData.authorPic}
                alt={postData.authorName ?? "Author"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-white font-semibold text-base select-none border-2 border-primary/20">
                {(postData.authorName ?? "A").charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <p className="font-bold text-on-surface text-sm flex items-center gap-2">
              <Link
                href={`/author/${postData.authorId}`}
                className="hover:underline"
              >
                {postData.authorName}
              </Link>
              {/* @username generation fallback */}
              <span className="text-primary/60 font-normal">
                @
                {postData.authorName.replace(/\s+/g, "").toLowerCase() ||
                  "user"}
              </span>
            </p>
            <p className="text-xs text-on-surface-variant">
              {new Date(postData.postCreationDate)
                .toDateString()
                .split(" ")
                .slice(1)
                .join(" ")}{" "}
              • {postData.postType}
            </p>
          </div>
        </div>
        <button
          className="text-on-surface-variant hover:text-white transition-colors"
          aria-label="More options"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Post Title & Tags */}
      <div className="px-6 pb-4">
        <h2
          className="text-2xl font-bold font-headline text-white transition-colors leading-tight cursor-pointer"
          onClick={() => router.push(`/posts/${postId}`)}
        >
          {postData.postTitle}
        </h2>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag, i) => (
              <span
                key={i}
                onClick={() => router.push(`/search?q=${tag}`)}
                className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[11px] font-bold tracking-wider uppercase cursor-pointer hover:bg-primary/30 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hero Image Section */}
      {postData.postImage && (
        <div className="px-6 relative">
          <div
            className="aspect-video w-full rounded-xl overflow-hidden border border-outline-variant/20 cursor-pointer"
            onClick={() => router.push(`/posts/${postId}`)}
          >
            <Image
              src={postData.postImage}
              alt={postData.postTitle ?? "Post image"}
              width={800}
              height={450}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      )}

      {/* Content Preview */}
      {postData.postDesc && (
        <div
          className="p-6 text-on-surface-variant text-sm leading-relaxed max-w-2xl cursor-pointer"
          onClick={() => router.push(`/posts/${postId}`)}
        >
          <div
            className="tiptap-content line-clamp-3"
            dangerouslySetInnerHTML={{ __html: postData.postDesc }}
          />
        </div>
      )}

      {/* Actions Footer */}
      <div className="px-6 py-4 bg-surface-variant border-t rounded-b-2xl border-outline/10 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading || !session}
            className={`flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isLiked
                ? "text-error hover:text-error/80"
                : "text-on-surface-variant hover:text-error"
            }`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isLiked ? { fontVariationSettings: '"FILL" 1' } : {}}
            >
              favorite
            </span>
            <span className="text-xs font-medium">{formatCount(likes)}</span>
          </button>

          {/* Comments toggle */}
          <button
            onClick={() => {
              setIsCommentOpen((v) => !v);
              if (!isCommentOpen) {
                setTimeout(() => {
                  commentsRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 120);
              }
            }}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              chat_bubble
            </span>
            <span className="text-xs font-medium">
              {formatCount(comments.length)}
            </span>
          </button>

          <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              bookmark
            </span>
            <span className="text-xs font-medium">Save</span>
          </button>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(
              window.location.origin + "/posts/" + postData.postId,
            );
            toast.success("Link copied to clipboard!");
          }}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </button>
      </div>

      {/* ── Comments Section ── */}
      <div ref={commentsRef}>
        {isCommentOpen && (
          <div className="pt-4 pb-2 px-6 mt-0 border-t border-outline/10 space-y-4 bg-surface-variant">
            {/* Input area */}
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0 select-none mt-0.5 border border-primary/20">
                💬
              </div>
              <div className="flex-1 flex gap-2 items-end">
                <textarea
                  className="flex-1 bg-surface-elevated border border-outline/20 text-on-surface placeholder-slate-500 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary/50 focus:bg-surface-elevated transition-all min-h-[44px]"
                  placeholder="Add a comment…"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleSubmitComment();
                    }
                  }}
                  rows={1}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentInput.trim() || commentSubmitting}
                  className="p-3 bg-primary hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-primary/20"
                  aria-label="Submit comment"
                >
                  {commentSubmitting ? (
                    <span className="block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <IoSend size={16} className="text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-4">
                No comments yet.
              </p>
            ) : (
              <div className="space-y-4 mt-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start group">
                    {c.authorImage ? (
                      <Image
                        src={c.authorImage}
                        alt={c.authorName ?? "Commenter"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-primary/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-slate-400 text-xs font-semibold flex-shrink-0 mt-0.5 select-none border border-outline/20">
                        {(c.authorName ?? "A").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 bg-surface-elevated border border-outline/10 rounded-xl px-4 py-3 relative">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <Link
                          href={`/author/${c.authorId}`}
                          className="text-xs font-bold text-on-surface hover:text-primary transition-colors"
                        >
                          {c.authorName ?? "Anonymous"}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === c.id ? null : c.id)
                              }
                              className="p-1 rounded text-slate-500 hover:text-on-surface opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <BsThreeDotsVertical size={12} />
                            </button>
                            {openMenuId === c.id && (
                              <div
                                className="absolute right-0 top-6 bg-surface-elevated border border-outline/20 rounded-lg shadow-xl z-50 min-w-[100px] overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {c.authorId === session?.user?.id && (
                                  <button
                                    onClick={() =>
                                      handleStartEditComment(c.id, c.text)
                                    }
                                    className="w-full text-left px-3 py-2 text-xs text-secondary hover:bg-surface-variant transition-colors"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-error bg-surface-variant transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            className="w-full bg-surface-variant border border-outline/20 text-on-surface placeholder-slate-500 rounded-lg p-2 text-xs resize-none focus:outline-none focus:border-primary/50 transition-all"
                            rows={2}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.ctrlKey || e.metaKey)
                              ) {
                                handleSaveEditComment(c.id);
                              }
                              if (e.key === "Escape") {
                                setEditingCommentId(null);
                                setEditCommentText("");
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEditComment(c.id)}
                              disabled={
                                !editCommentText.trim() || editCommentSubmitting
                              }
                              className="px-3 py-1 bg-primary hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded transition-colors"
                            >
                              {editCommentSubmitting ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentText("");
                              }}
                              className="px-3 py-1 text-slate-400 hover:text-on-surface font-medium text-[10px] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-on-surface-variant text-sm leading-relaxed break-words">
                          {c.text}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
