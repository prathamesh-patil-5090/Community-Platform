"use client";

import PostComponent, {
  PostComponentRef,
} from "@/app/components/posts-page/PostComponent";
import VerticalActionBar from "@/app/components/posts-page/VerticalActionBar";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
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
  isHidden?: boolean;
  hiddenReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthorInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  provider: string;
  createdAt: string;
  postsCount: number;
  commentsCount: number;
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function PostPageSkeleton() {
  return (
    <div className="flex items-start">
      {/* Sidebar placeholder */}
      <div className="hidden md:block w-[83px] flex-shrink-0" />

      <div className="flex-1 flex gap-6 px-4 lg:px-6 pt-4 animate-pulse">
        {/* Post skeleton */}
        <div className="flex-[65] min-w-0 space-y-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-3 w-24 bg-white/10 rounded" />
            </div>
          </div>
          <div className="h-10 w-3/4 bg-white/10 rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-white/10 rounded-full" />
            <div className="h-6 w-20 bg-white/10 rounded-full" />
          </div>
          <div className="h-64 w-full bg-white/10 rounded-xl" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-4 bg-white/10 rounded"
                style={{ width: `${100 - (i % 3) * 12}%` }}
              />
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="hidden lg:block flex-[35] max-w-[380px] space-y-4 pt-6">
          <div className="rounded-2xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-2/3 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-white/10 rounded" />
            <div className="h-3 w-3/4 bg-white/10 rounded" />
          </div>
          <div className="rounded-2xl border border-white/10 h-64 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Post Hidden Screen ───────────────────────────────────────────────────── */

function PostHiddenScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-md w-full">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">Post Removed</h2>
        <p className="text-gray-400 leading-relaxed mb-2">
          This post has been removed by an administrator for violating our
          community guidelines.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          If you believe this was a mistake, please{" "}
          <a
            href="mailto:admin@community.com"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            contact the admins
          </a>
          .
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Browse Posts
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Author Profile Card ──────────────────────────────────────────────────── */

function AuthorProfileCard({ authorId }: { authorId: string }) {
  const [author, setAuthor] = useState<AuthorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/users/${authorId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAuthor(data.user);
        }
      } catch {
        /* silently fail — card just won't show */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/10 shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="h-4 w-2/3 bg-white/10 rounded" />
            <div className="h-3 w-1/2 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-8 flex-1 bg-white/5 rounded-lg" />
          <div className="h-8 flex-1 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!author) return null;

  const joinedDate = new Date(author.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Banner gradient */}
      <div className="h-16 bg-gradient-to-r from-purple-600/20 via-blue-600/10 to-pink-600/20" />

      <div className="px-5 pb-5 -mt-8">
        {/* Avatar */}
        <Link href={`/author/${author.id}`} className="block w-fit">
          {author.image ? (
            <Image
              src={author.image}
              alt={author.name ?? "Author"}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-[#0A0A0A] hover:ring-purple-500/40 transition-all"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl ring-4 ring-[#0A0A0A] hover:ring-purple-500/40 transition-all select-none">
              {(author.name ?? "A").charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        {/* Name & email */}
        <div className="mt-3">
          <Link
            href={`/author/${author.id}`}
            className="text-white font-semibold text-lg hover:text-purple-300 transition-colors"
          >
            {author.name ?? "Anonymous"}
          </Link>
          <p className="text-gray-500 text-sm truncate">{author.email}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 text-center px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white font-semibold text-lg leading-tight">
              {author.postsCount}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Posts</p>
          </div>
          <div className="flex-1 text-center px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white font-semibold text-lg leading-tight">
              {author.commentsCount}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">Comments</p>
          </div>
        </div>

        {/* Joined date & provider */}
        <div className="flex items-center gap-2 mt-4 text-gray-500 text-xs">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Joined {joinedDate}</span>
          <span className="text-gray-700">·</span>
          <span className="capitalize">{author.provider}</span>
        </div>

        {/* View profile button */}
        <Link
          href={`/author/${author.id}`}
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 font-medium hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          View Profile
        </Link>
      </div>
    </div>
  );
}

/* ─── Ad Card ──────────────────────────────────────────────────────────────── */

interface SidebarAd {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  linkUrl: string | null;
  placement: string;
  tags: string[];
}

function AdCardPlaceholder() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="aspect-[16/9] bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-pink-500/10 flex items-center justify-center relative">
        <div className="text-center px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Advertisement</p>
          <p className="text-gray-600 text-xs mt-1">Your ad could be here</p>
        </div>
        <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600 border border-white/5">
          Ad
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-3/4 bg-white/5 rounded" />
        <div className="h-3 w-1/2 bg-white/5 rounded" />
        <div className="mt-4">
          <div className="h-9 w-full rounded-lg bg-purple-600/10 border border-purple-500/10 flex items-center justify-center">
            <span className="text-purple-400/60 text-xs font-medium">
              Learn More
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdCard({ ad }: { ad: SidebarAd }) {
  const inner = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 transition-colors group">
      {/* Cover image */}
      {ad.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-black/20">
          <Image
            src={ad.coverImage}
            alt={ad.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="380px"
          />
          <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-gray-300 border border-white/10 backdrop-blur-sm">
            Ad
          </span>
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-pink-500/10 flex items-center justify-center relative">
          <div className="text-center px-4">
            <p className="text-gray-400 text-sm font-semibold">{ad.title}</p>
          </div>
          <span className="absolute top-3 right-3 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-600 border border-white/5">
            Ad
          </span>
        </div>
      )}

      {/* Body */}
      <div className="p-4 space-y-2">
        <p className="text-white/90 text-sm font-semibold leading-snug line-clamp-2">
          {ad.title}
        </p>

        {/* Rendered TipTap HTML content */}
        <div
          className="text-gray-400 text-xs leading-relaxed line-clamp-3 prose prose-invert prose-sm max-w-none
            [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0 [&_li]:my-0
            [&_strong]:text-gray-300 [&_em]:text-gray-400 [&_a]:text-purple-400"
          dangerouslySetInnerHTML={{ __html: ad.content }}
        />

        {/* Tags */}
        {ad.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {ad.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA button */}
        {ad.linkUrl && (
          <div className="pt-2">
            <div className="h-9 w-full rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-600/30 group-hover:border-purple-500/40 transition-colors">
              <span className="text-purple-300 text-xs font-medium">
                Learn More &rarr;
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (ad.linkUrl) {
    return (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block"
      >
        {inner}
      </a>
    );
  }

  return inner;
}

function SidebarAds() {
  const [ads, setAds] = useState<SidebarAd[]>([]);
  const [adLoading, setAdLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ads?placement=sidebar&limit=3");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAds(data.ads ?? []);
      } catch {
        // silently ignore — ads are non-critical
      } finally {
        if (!cancelled) setAdLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (adLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden animate-pulse">
        <div className="aspect-[16/9] bg-white/5" />
        <div className="p-4 space-y-3">
          <div className="h-3 w-3/4 bg-white/5 rounded" />
          <div className="h-3 w-1/2 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return <AdCardPlaceholder />;
  }

  return (
    <div className="space-y-5">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const postComponentRef = useRef<PostComponentRef>(null);

  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPostHidden, setIsPostHidden] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    setIsPostHidden(false);
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
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body.code === "POST_HIDDEN") {
          setIsPostHidden(true);
          return;
        }
        setError(body.error ?? "You don't have access to this post.");
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

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (status === "loading" || loading) return <PostPageSkeleton />;

  /* ── Hidden post (non-admin) ─────────────────────────────────────────────── */
  if (isPostHidden) return <PostHiddenScreen />;

  /* ── Error ───────────────────────────────────────────────────────────────── */
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

  /* ── Admin hidden-post banner logic ──────────────────────────────────────── */
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "admin";
  const showHiddenBanner = post.isHidden && isAdmin;

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
    <div className="flex items-start min-h-screen">
      {/* ── Vertical Action Bar (fixed left sidebar — untouched) ──────────── */}
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

      {/* ── Main content area (everything after the fixed sidebar) ────────── */}
      <div className="md:pl-[83px] flex flex-col lg:ml-15 lg:flex-row lg:gap-6 lg:-mt-1.5 -mt-2 lg:px-6">
        {/* ── LEFT: Post content — ~65% ───────────────────────────────────── */}
        <div className="w-full lg:flex-[70] min-w-0">
          {/* Admin hidden banner */}
          {showHiddenBanner && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                />
              </svg>
              <div>
                <p className="text-amber-300 text-sm font-semibold">
                  This post is hidden from regular users
                </p>
                {post.hiddenReason && (
                  <p className="text-amber-400/70 text-xs mt-0.5">
                    Reason: {post.hiddenReason}
                  </p>
                )}
                <p className="text-amber-500/60 text-xs mt-0.5">
                  You can see it because you are an admin.
                </p>
              </div>
            </div>
          )}

          <PostComponent
            ref={postComponentRef}
            postData={postData}
            onLikeChange={handleLikeToggle}
            onCommentsCountChange={handleCommentsCountChange}
          />
        </div>

        {/* ── RIGHT: Sidebar — ~35% (Author Card + Ad Card) ──────────────── */}
        <aside className="hidden lg:block lg:flex-[35] max-w-[380px] pt-2">
          <div className="sticky top-20 space-y-5">
            {/* Author Profile Card */}
            <AuthorProfileCard authorId={post.authorId} />

            {/* Ads */}
            <SidebarAds />
          </div>
        </aside>
      </div>
    </div>
  );
}
