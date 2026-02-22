"use client";

import EditPostComponent from "@/app/components/edit-post/EditPostComponent";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ApiPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId: string;
  postType: "Post" | "Article";
  tags: string[];
}

function EditPostSkeleton() {
  return (
    <div className="mt-10 p-3 flex flex-col md:flex-row gap-6 animate-pulse">
      <div className="md:w-[60%] space-y-3">
        {/* Cover image placeholder */}
        <div className="h-14 w-full rounded-md bg-white/10" />
        {/* Post type toggle */}
        <div className="h-10 w-full rounded-md bg-white/10" />
        {/* Title */}
        <div className="h-12 w-full rounded-md bg-white/10" />
        {/* Tags row */}
        <div className="h-10 w-full rounded-md bg-white/10" />
        {/* Toolbar */}
        <div className="h-10 w-full rounded-md bg-white/10" />
        {/* Editor body */}
        <div className="h-64 w-full rounded-md bg-white/10" />
        {/* Buttons */}
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded-md bg-white/10" />
          <div className="h-10 w-20 rounded-md bg-white/10" />
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 space-y-3">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-4/5 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function EditPostPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("Post not found.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to load post.",
        );
      }
      const data = await res.json();
      const p: ApiPost = data.post;

      // Only the author can edit
      if (session?.user?.id && p.authorId !== session.user.id) {
        setError("You are not allowed to edit this post.");
        return;
      }

      setPost(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [postId, router, session?.user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchPost();
    }
  }, [status, fetchPost, router]);

  if (status === "loading" || loading) {
    return <EditPostSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-xl font-semibold text-white mb-2">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!post) return null;

  return (
    <EditPostComponent
      postId={post._id}
      initialTitle={post.title}
      initialContent={post.content}
      initialTags={post.tags}
      initialCoverImage={post.coverImage ?? null}
      initialPostType={post.postType}
    />
  );
}
