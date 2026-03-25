"use client";
import "@/app/components/create-post/styles.scss";
import { CommentType } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "react-toastify";
import ReportsComponent from "../ui/ReportsComponent";

export type PostData = {
  postId: string;
  authorName?: string;
  authorId?: string;
  authorPic?: string;
  postCreationDate?: string;
  tags?: string[];
  postType?: string;
  postTitle?: string;
  postDesc?: string;
  postImage?: string;
  postLikes?: number;
  postComments?: string[];
  initialIsLiked?: boolean;
  commentObjects?: CommentType[];
};

export type PostComponentRef = {
  openCommentsAndScroll: () => void;
};

type Props = {
  postData: PostData;
  onLikeChange?: (liked: boolean, newCount: number) => void;
  onCommentsCountChange?: (count: number) => void;
};

const PostComponent = forwardRef<PostComponentRef, Props>(
  ({ postData, onLikeChange, onCommentsCountChange }, ref) => {
    const { data: session } = useSession();
    const commentsRef = useRef<HTMLDivElement>(null);

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
    const [isReport, setIsReport] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState<string | null>(
      null,
    );
    const [editCommentText, setEditCommentText] = useState("");
    const [editCommentSubmitting, setEditCommentSubmitting] = useState(false);

    useEffect(() => {
      if (postData.initialIsLiked !== undefined) {
        setIsLiked(postData.initialIsLiked);
      }
    }, [postData.initialIsLiked]);

    useEffect(() => {
      setLikes(postData.postLikes ?? 0);
    }, [postData.postLikes]);

    useEffect(() => {
      setComments(postData.commentObjects ?? []);
    }, [postData.commentObjects]);

    useEffect(() => {
      document.body.style.overflow = isReport ? "hidden" : "unset";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isReport]);

    useImperativeHandle(ref, () => ({
      openCommentsAndScroll: () => {
        setIsCommentOpen(true);
        setTimeout(() => {
          commentsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      },
    }));

    const formatCount = (num: number) => {
      if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
      if (num >= 1_000)
        return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
      return String(num);
    };

    const handleLike = async () => {
      if (likeLoading) return;
      const prevLiked = isLiked;
      const prevCount = likes;
      const nextLiked = !isLiked;
      const nextCount = nextLiked ? likes + 1 : Math.max(0, likes - 1);
      setIsLiked(nextLiked);
      setLikes(nextCount);
      onLikeChange?.(nextLiked, nextCount);

      setLikeLoading(true);
      try {
        const res = await fetch(`/api/posts/${postData.postId}/like`, {
          method: "PATCH",
        });
        if (!res.ok) {
          setIsLiked(prevLiked);
          setLikes(prevCount);
          onLikeChange?.(prevLiked, prevCount);
          return;
        }
        const data = await res.json();
        setIsLiked(data.liked);
        setLikes(data.likes);
        onLikeChange?.(data.liked, data.likes);
      } catch {
        setIsLiked(prevLiked);
        setLikes(prevCount);
        onLikeChange?.(prevLiked, prevCount);
      } finally {
        setLikeLoading(false);
      }
    };

    const handleSubmitComment = async () => {
      const text = commentInput.trim();
      if (!text || commentSubmitting) return;

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
        onCommentsCountChange?.(data.commentsCount);
      } catch {
      } finally {
        setCommentSubmitting(false);
      }
    };

    const handleDeleteComment = async (commentId: string) => {
      try {
        const res = await fetch(
          `/api/posts/${postData.postId}/comments/${commentId}`,
          { method: "DELETE" },
        );
        if (!res.ok) return;
        const data = await res.json();
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentsCountChange?.(data.commentsCount);
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
        // silently ignore
      } finally {
        setEditCommentSubmitting(false);
      }
    };

    const tags = postData.tags ?? [];

    return (
      <article className="relative w-full">
        {postData.postDesc && (
          <div
            className="tiptap-content prose prose-invert max-w-none text-on-surface-variant font-body leading-relaxed mb-12"
            dangerouslySetInnerHTML={{ __html: postData.postDesc }}
          />
        )}

        <div className="flex items-center justify-between py-8 mt-12 border-y border-outline-variant/10 text-on-surface-variant">
          <div className="flex gap-6">
            <button
              onClick={handleLike}
              disabled={likeLoading || !session}
              className={`flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isLiked ? "text-primary" : "hover:text-primary"
              }`}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <span
                className="material-symbols-outlined"
                style={isLiked ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                favorite
              </span>
              <span className="font-bold">{formatCount(likes)}</span>
            </button>
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
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">forum</span>
              <span className="font-bold">{formatCount(comments.length)}</span>
            </button>
          </div>
          <div className="flex gap-4">
            <button className="material-symbols-outlined p-2 hover:bg-surface-bright rounded-lg transition-colors">
              bookmark
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
              }}
              className="material-symbols-outlined p-2 hover:bg-surface-bright rounded-lg transition-colors"
            >
              share
            </button>
          </div>
        </div>

        <div ref={commentsRef}>
          {isCommentOpen && (
            <div className="pt-4 space-y-4">
              {/* Comment input */}
              <div className="flex gap-4 items-start mt-6">
                <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 select-none border-2 border-primary/20">
                  💬
                </div>
                <div className="flex-1 flex gap-3 items-end">
                  <textarea
                    className="flex-1 bg-surface-container border-none text-on-surface placeholder-on-surface-variant rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-all min-h-[80px]"
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
                    className="p-3 bg-primary hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0 text-on-primary-container"
                    aria-label="Submit comment"
                  >
                    {commentSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined ml-0.5 text-white">
                        send
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Comments list */}
              {comments.length === 0 ? (
                <p className="text-center text-on-surface-variant text-sm py-6">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-4 items-start group mt-4"
                    >
                      {/* Avatar */}
                      {c.authorImage ? (
                        <Image
                          src={c.authorImage}
                          alt={c.authorName ?? "Commenter"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-white text-sm font-semibold border-2 border-primary/20 flex-shrink-0 select-none">
                          {(c.authorName ?? "A").charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className="flex-1 bg-surface-container rounded-2xl px-5 py-4 relative">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <Link
                            href={`/author/${c.authorId}`}
                            className="text-sm font-bold text-on-surface hover:text-primary transition-colors"
                          >
                            {c.authorName ?? "Anonymous"}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === c.id ? null : c.id,
                                  )
                                }
                                className="p-1 rounded text-on-surface-variant hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <BsThreeDotsVertical size={14} />
                              </button>
                              {openMenuId === c.id && (
                                <div
                                  className="absolute right-0 top-7 bg-surface-elevated border border-outline/20 rounded-lg shadow-xl z-50 min-w-[110px] overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.authorId === session?.user?.id && (
                                    <button
                                      onClick={() =>
                                        handleStartEditComment(c.id, c.text)
                                      }
                                      className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-surface-variant transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-variant transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Inline edit mode */}
                        {editingCommentId === c.id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              className="w-full bg-surface-variant border border-outline/20 text-on-surface placeholder-on-surface-variant rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-all"
                              rows={3}
                              value={editCommentText}
                              onChange={(e) =>
                                setEditCommentText(e.target.value)
                              }
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
                                  !editCommentText.trim() ||
                                  editCommentSubmitting
                                }
                                className="px-4 py-1.5 bg-primary hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed text-on-primary-container text-xs font-bold rounded-lg transition-colors"
                              >
                                {editCommentSubmitting ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentText("");
                                }}
                                disabled={editCommentSubmitting}
                                className="px-4 py-1.5 bg-surface-variant border border-outline/10 hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed text-on-surface text-xs font-bold rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-on-surface-variant text-sm whitespace-pre-wrap break-words leading-relaxed mt-1">
                            {c.text}
                          </div>
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
  },
);

PostComponent.displayName = "PostComponent";
export default PostComponent;
