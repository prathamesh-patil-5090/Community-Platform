"use client";

import PostComponent, {
  PostComponentRef,
} from "@/app/components/posts-page/PostComponent";
import VerticalActionBar from "@/app/components/posts-page/VerticalActionBar";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ApiPost {
  _id: string;
  title: string;
  content: string;
  coverImage?: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  postType: "Post" | "Article";
  tags: string[];
  likes: number;
  likedBy: string[];
  commentList: {
    _id: string;
    text: string;
    authorId: string;
    authorName?: string;
    authorImage?: string;
    createdAt: string;
  }[];
  userHasLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

function PostPageSkeleton() {
  return (
    <div className="flex items-start justify-center gap-4 px-4 pt-4 animate-pulse">
      <div className="hidden md:block w-20 flex-shrink-0" />
      <div className="flex-1 max-w-3xl space-y-4 py-6">
        {/* Author row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-3 w-24 bg-white/10 rounded" />
          </div>
        </div>
        {/* Title */}
        <div className="h-10 w-3/4 bg-white/10 rounded" />
        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-white/10 rounded-full" />
          <div className="h-6 w-20 bg-white/10 rounded-full" />
        </div>
        {/* Cover image */}
        <div className="h-64 w-full bg-white/10 rounded-xl" />
        {/* Content lines */}
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-4 bg-white/10 rounded`}
              style={{ width: `${100 - (i % 3) * 12}%` }}
            />
          ))}
        </div>
      </div>
      <div className="hidden lg:block w-48 flex-shrink-0" />
    </div>
  );
}

export default function PostsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const postComponentRef = useRef<PostComponentRef>(null);

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

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
      setPost(p);
      setIsLiked(p.userHasLiked ?? false);
      setLikes(p.likes ?? 0);
      setCommentsCount(p.commentList?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchPost();
    }
  }, [status, fetchPost, router]);

  const handleCommentClick = () => {
    postComponentRef.current?.openCommentsAndScroll();
  };

  const handleLikeToggle = (liked: boolean, newCount: number) => {
    setIsLiked(liked);
    setLikes(newCount);
  };

  const handleCommentsCountChange = (count: number) => {
    setCommentsCount(count);
  };

  if (status === "loading" || loading) return <PostPageSkeleton />;

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

  const postData = {
    postId: post._id,
    authorName: post.authorName ?? "Anonymous",
    authorId: post.authorId,
    authorPic: post.authorImage ?? undefined,
    postCreationDate: post.createdAt,
    tags: post.tags,
    postType: post.postType,
    postTitle: post.title,
    postDesc: post.content,
    postImage: post.coverImage ?? undefined,
    postLikes: likes,
    postComments: post.commentList?.map((c) => c.text) ?? [],
    initialIsLiked: isLiked,
    commentObjects: (post.commentList ?? []).map((c) => ({
      id: c._id,
      text: c.text,
      authorId: c.authorId,
      authorName: c.authorName ?? "Anonymous",
      authorImage: c.authorImage ?? undefined,
      createdAt: c.createdAt,
    })),
  };

  return (
    <div className="bg-transparent flex items-start justify-center md:justify-evenly lg:gap-10">
      {/* Vertical action bar (desktop only, fixed left sidebar) */}
      <div className="flex-none hidden md:block">
        <VerticalActionBar
          postId={post._id}
          initialLikes={likes}
          initialIsLiked={isLiked}
          initialBookmarked={false}
          commentsCount={commentsCount}
          onLikeAction={handleLikeToggle}
          onCommentClickAction={handleCommentClick}
        />
      </div>

      {/* Post content */}
      <div className="flex-2 w-full md:pl-[50px]">
        <PostComponent
          ref={postComponentRef}
          postData={postData}
          onLikeChange={handleLikeToggle}
          onCommentsCountChange={handleCommentsCountChange}
        />
      </div>

      <div className="flex-1 hidden md:block" />
    </div>
  );
}
