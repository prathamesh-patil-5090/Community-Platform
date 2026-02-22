"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MdOutlineModeComment } from "react-icons/md";

interface UserComment {
  id: string;
  text: string;
  postId: string;
  postTitle: string;
  createdAt: string;
}

function CommentSkeleton() {
  return (
    <div className="animate-pulse border border-white/10 rounded-xl p-4 bg-[#0a0a0a] space-y-3">
      <div className="h-3 w-1/3 bg-white/10 rounded" />
      <div className="h-4 w-full bg-white/10 rounded" />
      <div className="h-4 w-4/5 bg-white/10 rounded" />
      <div className="h-3 w-1/4 bg-white/10 rounded" />
    </div>
  );
}

export default function UserComments({ userId }: { userId: string }) {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}/comments`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to load comments.",
        );
      }
      const data = await res.json();
      setComments(data.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-white/10 rounded-xl bg-[#0a0a0a]">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchComments}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/10 rounded-xl bg-[#0a0a0a]">
        <MdOutlineModeComment size={40} className="text-white/20 mb-4" />
        <p className="text-white font-semibold text-lg mb-1">No comments yet</p>
        <p className="text-white/40 text-sm">
          Your comments on posts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div
          key={c.id}
          className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors"
        >
          {/* Post context */}
          <Link
            href={`/posts/${c.postId}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400/70 hover:text-blue-400 transition-colors mb-2 group"
          >
            <MdOutlineModeComment size={12} className="flex-shrink-0" />
            <span className="line-clamp-1 group-hover:underline underline-offset-2">
              {c.postTitle}
            </span>
          </Link>

          {/* Comment text */}
          <p className="text-white/80 text-sm leading-relaxed break-words border-l-2 border-white/10 pl-3">
            {c.text}
          </p>

          {/* Date */}
          <p className="text-white/25 text-xs mt-2">
            {new Date(c.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
