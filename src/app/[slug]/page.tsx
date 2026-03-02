"use client";

import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SideBar from "../components/ui/SideBar";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface CommunityPageData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  content: string;
  coverImage: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-white">
      <div className="flex">
        <div className="flex-none hidden md:block">
          <SideBar />
        </div>
      </div>
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-white/5" />
              <div className="space-y-2">
                <div className="h-10 w-64 bg-white/5 rounded" />
                <div className="h-5 w-96 bg-white/5 rounded" />
              </div>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-white/5 rounded-lg" />
            <div className="h-64 bg-white/5 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Error State ──────────────────────────────────────────────────────────── */

function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-white">
      <div className="flex">
        <div className="flex-none hidden md:block">
          <SideBar />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4 max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{message}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              Go Home
            </button>
            <button
              onClick={onRetry}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [page, setPage] = useState<CommunityPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchPage() {
      setLoading(true);
      setError(null);
      setIs404(false);

      try {
        const res = await fetch(
          `/api/community-pages/${encodeURIComponent(slug)}`,
        );

        if (res.status === 404) {
          if (!cancelled) setIs404(true);
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to load page");
        }

        const data = await res.json();

        if (!cancelled) {
          setPage(data.page);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return <PageSkeleton />;
  }

  /* ── 404 ─────────────────────────────────────────────────────────────────── */
  if (is404) {
    notFound();
  }

  /* ── Error ───────────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <PageError
        message={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          fetch(`/api/community-pages/${encodeURIComponent(slug)}`)
            .then((res) => {
              if (res.status === 404) {
                setIs404(true);
                setLoading(false);
                return null;
              }
              if (!res.ok) throw new Error("Failed to load page");
              return res.json();
            })
            .then((data) => {
              if (data) {
                setPage(data.page);
                setLoading(false);
              }
            })
            .catch((err) => {
              setError(
                err instanceof Error ? err.message : "Something went wrong",
              );
              setLoading(false);
            });
        }}
      />
    );
  }

  if (!page) return null;

  /* ── Has content check ───────────────────────────────────────────────────── */
  const hasContent =
    page.content && page.content !== "" && page.content !== "<p></p>";

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <div className="flex">
        <div className="flex-none hidden md:block">
          <SideBar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{page.icon}</span>
              <h1 className="text-4xl md:text-5xl font-bold">{page.name}</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl">
              {page.description}
            </p>
          </div>

          {/* Cover Image */}
          {page.coverImage && (
            <div className="mb-8 relative w-full aspect-[21/9] max-h-[360px] rounded-xl overflow-hidden border border-white/10">
              <Image
                src={page.coverImage}
                alt={page.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
                priority
              />
            </div>
          )}

          {/* Content Section */}
          <div className="space-y-6">
            {/* Rich Content from TipTap */}
            {hasContent && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
                <div
                  className="prose prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
                    prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
                    prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
                    prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
                    prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline hover:prose-a:text-amber-300
                    prose-strong:text-white
                    prose-em:text-gray-300
                    prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-li:text-gray-300
                    prose-blockquote:border-l-amber-500 prose-blockquote:bg-white/[0.02] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                    prose-code:text-amber-400 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-[#0c0c0c] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                    prose-img:rounded-xl prose-img:border prose-img:border-white/10 prose-img:max-w-full
                    prose-hr:border-white/10"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </div>
            )}

            {/* Welcome Card (shown when there's no rich content) */}
            {!hasContent && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-3">
                  Welcome to {page.name}!
                </h2>
                <p className="text-gray-300 mb-4">
                  This is your space to connect, share, and engage with the
                  community. Start by creating a post or exploring what others
                  have shared.
                </p>
                <button
                  onClick={() => router.push("/create-post")}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-6 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Create New Post
                </button>
              </div>
            )}

            {/* Page metadata footer */}
            <div className="flex items-center justify-between text-xs text-gray-600 px-1 pt-4">
              <span>
                Last updated:{" "}
                {new Date(page.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
