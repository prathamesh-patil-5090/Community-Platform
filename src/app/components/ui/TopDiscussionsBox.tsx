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

  return (
    <div
      role="region"
      aria-label="top-discussions-heading"
      className="w-full space-y-8"
    >
      {/* Top Discussions */}
      <section>
        <h3
          id="top-discussions-heading"
          className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4 flex items-center justify-between"
        >
          Top Discussions
          <span className="material-symbols-outlined text-xs">trending_up</span>
        </h3>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-variant border border-outline/10 animate-pulse"
              >
                <div className="h-2.5 bg-surface-elevated rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-surface-elevated rounded w-full mb-2"></div>
                <div className="h-4 bg-surface-elevated rounded w-4/5 mb-3"></div>
                <div className="h-2.5 bg-surface-elevated rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error || discussions.length === 0 ? (
          <div className="py-8 text-center bg-surface-variant rounded-xl border border-outline/10">
            <p className="text-slate-400 text-sm">
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
                className="mt-3 text-xs text-primary hover:text-primary-dim transition-colors cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion, idx) => (
              <div
                key={discussion.id ?? idx}
                onClick={() => router.push(discussion.postLink)}
                className="p-3 rounded-xl bg-surface-variant border border-outline/10 hover:border-primary/20 transition-all cursor-pointer group"
                aria-label={`Read discussion: ${discussion.postTitle}`}
              >
                <p className="text-xs text-slate-400 mb-1 uppercase font-bold tracking-tighter">
                  Discussion
                </p>
                <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {discussion.postTitle}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-primary/70 font-medium">
                    {discussion.commentsCount} comments • Active now
                  </p>
                  {isAdmin &&
                    discussion.isFeatured &&
                    discussion.selectedByName && (
                      <span className="text-[10px] text-primary/70 inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">
                          star
                        </span>
                        Picked by {discussion.selectedByName}
                      </span>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending Tags */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
          Trending Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "#NextJS",
            "#DevOps",
            "#Kubernetes",
            "#OpenSource",
            "#Web3",
            "#LLM",
          ].map((tag) => (
            <a
              key={tag}
              className="px-3 py-1.5 rounded-lg bg-surface-variant text-xs font-medium text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-outline/10"
              href="#"
            >
              {tag}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TopDiscussionsBox;
