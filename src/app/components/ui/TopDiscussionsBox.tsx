"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Discussion {
  id: string;
  postId: string;
  postTitle: string;
  postLink: string;
  commentsCount: number;
  isFeatured: boolean;
  selectedBy?: string;
  selectedByName?: string;
}

function TopDiscussionsBoxSkeleton() {
  return (
    <div
      className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4 max-w-95"
      role="region"
      aria-label="top-discussions-heading"
    >
      <h2
        id="top-discussions-heading"
        className="font-sans font-extrabold text-3xl pb-5 border-b my-4"
      >
        Top Discussions
      </h2>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-wrap sm:flex-row sm:justify-between sm:items-center p-3 border-b border-gray-200 animate-pulse"
          >
            <div className="w-full space-y-2">
              <div className="h-4 bg-white/5 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopDiscussionsBox() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchDiscussions() {
      try {
        const res = await fetch("/api/top-discussions?limit=7");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setDiscussions(data.discussions ?? []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDiscussions();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <TopDiscussionsBoxSkeleton />;
  }

  if (error || discussions.length === 0) {
    return (
      <div
        className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4 max-w-95"
        role="region"
        aria-label="top-discussions-heading"
      >
        <h2
          id="top-discussions-heading"
          className="font-sans font-extrabold text-3xl pb-5 border-b my-4"
        >
          Top Discussions
        </h2>
        <div className="py-8 text-center">
          <p className="text-gray-500 text-sm">
            {error
              ? "Unable to load discussions right now."
              : "No discussions to show yet."}
          </p>
          {error && (
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                fetch("/api/top-discussions?limit=7")
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed");
                    return res.json();
                  })
                  .then((data) => {
                    setDiscussions(data.discussions ?? []);
                    setLoading(false);
                  })
                  .catch(() => {
                    setError(true);
                    setLoading(false);
                  });
              }}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-[#0A0A0A] border border-white/10 rounded-lg p-4 max-w-95"
      role="region"
      aria-label="top-discussions-heading"
    >
      <h2
        id="top-discussions-heading"
        className="font-sans font-extrabold text-3xl pb-5 border-b my-4"
      >
        Top Discussions
      </h2>
      <div className="space-y-4">
        {discussions.map((discussion, idx) => (
          <div
            key={discussion.id ?? idx}
            className="flex flex-wrap sm:flex-row sm:justify-between sm:items-center p-3 cursor-pointer border-b border-gray-200 group"
          >
            <div className="flex-1 min-w-0">
              <h3
                className="font-sans font-light text-md hover:text-blue-400 transition-colors duration-200"
                onClick={() => router.push(discussion.postLink)}
                aria-label={`Read discussion: ${discussion.postTitle}`}
              >
                {discussion.postTitle}
              </h3>
              {isAdmin &&
                discussion.isFeatured &&
                discussion.selectedByName && (
                  <span className="text-[10px] text-purple-400/70 mt-0.5 inline-flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Picked by {discussion.selectedByName}
                  </span>
                )}
            </div>
            <span className="text-sm text-gray-500 flex-none ml-2">
              {discussion.commentsCount} comments
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopDiscussionsBox;
