"use client";
import "@/app/components/create-post/styles.scss";
import { CommentType } from "@/lib/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoSend } from "react-icons/io5";
import { MdOutlineModeComment } from "react-icons/md";
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
    const router = useRouter();
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
      <article className="bg-[#0A0A0A] relative w-full border border-white/10 md:rounded-xl p-5 mt-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/author/${postData.authorId}`} className="flex-shrink-0">
            {postData.authorPic ? (
              <Image
                src={postData.authorPic}
                alt={postData.authorName ?? "Author"}
                width={52}
                height={52}
                className="w-11 h-11 md:w-13 md:h-13 rounded-full object-cover ring-2 ring-white/10 hover:ring-blue-500/60 transition-all"
              />
            ) : (
              <div className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg select-none ring-2 ring-white/10 hover:ring-blue-500/60 transition-all">
                {(postData.authorName ?? "A").charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/author/${postData.authorId}`}
              className="text-white font-medium hover:text-blue-400 transition-colors"
            >
              {postData.authorName}
            </Link>
            {postData.postCreationDate && (
              <p className="text-white/50 text-sm">
                {new Date(postData.postCreationDate)
                  .toDateString()
                  .split(" ")
                  .slice(1)
                  .join(" ")}
              </p>
            )}
          </div>
          {postData.postType && (
            <span className="ml-auto text-xs bg-white/10 text-white/60 px-2.5 py-1 rounded-full">
              {postData.postType}
            </span>
          )}
        </div>

        <h1 className="font-bold text-2xl md:text-4xl text-white mb-3 leading-snug">
          {postData.postTitle}
        </h1>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, i) => (
              <button
                key={i}
                onClick={() => router.push(`/search?q=${tag}`)}
                className="text-sm text-blue-400/80 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {postData.postImage && (
          <div className="mb-6 rounded-xl overflow-hidden">
            <Image
              src={postData.postImage}
              alt={postData.postTitle ?? "Post image"}
              width={1100}
              height={600}
              className="w-full object-cover rounded-xl"
            />
          </div>
        )}

        {postData.postDesc && (
          <div
            className="tiptap-content mb-6"
            dangerouslySetInnerHTML={{ __html: postData.postDesc }}
          />
        )}

        <div className="flex items-center gap-5 py-3 border-t border-white/10">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
              ${
                isLiked
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            {isLiked ? (
              <BiSolidLike size={22} className="text-red-400" />
            ) : (
              <BiLike size={22} />
            )}
            <span className="text-sm font-medium">{formatCount(likes)}</span>
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/60 hover:bg-white/5 hover:text-white transition-all"
          >
            <MdOutlineModeComment size={22} />
            <span className="text-sm font-medium">
              {formatCount(comments.length)}
            </span>
          </button>
        </div>

        <div ref={commentsRef}>
          {isCommentOpen && (
            <div className="pt-4 space-y-4">
              {/* Comment input */}
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 select-none mt-0.5">
                  💬
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <textarea
                    className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all min-h-[80px]"
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
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex-shrink-0"
                    aria-label="Submit comment"
                  >
                    {commentSubmitting ? (
                      <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <IoSend size={18} className="text-white" />
                    )}
                  </button>
                </div>
              </div>

              {/* Comments list */}
              {comments.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-6">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start group">
                      {/* Avatar */}
                      {c.authorImage ? (
                        <Image
                          src={c.authorImage}
                          alt={c.authorName ?? "Commenter"}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 mt-0.5 select-none">
                          {(c.authorName ?? "A").charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 relative">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <Link
                            href={`/author/${c.authorId}`}
                            className="text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                          >
                            {c.authorName ?? "Anonymous"}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/30">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            {/* Menu button */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === c.id ? null : c.id,
                                  )
                                }
                                className="p-1 rounded text-white/30 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <BsThreeDotsVertical size={14} />
                              </button>
                              {openMenuId === c.id && (
                                <div
                                  className="absolute right-0 top-7 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[110px] overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.authorId === session?.user?.id && (
                                    <button
                                      onClick={() =>
                                        handleStartEditComment(c.id, c.text)
                                      }
                                      className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-white/5 transition-colors"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
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
                              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:border-blue-500/50 transition-all"
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
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors"
                              >
                                {editCommentSubmitting ? "Saving…" : "Save"}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditCommentText("");
                                }}
                                className="px-3 py-1.5 text-white/40 hover:text-white text-xs transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-white/80 text-sm leading-relaxed break-words">
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
  },
);

PostComponent.displayName = "PostComponent";
export default PostComponent;
