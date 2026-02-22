"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBirthdayCake } from "react-icons/fa";
import { FaRegNewspaper } from "react-icons/fa6";
import { MdOutlineInsertComment } from "react-icons/md";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  provider: string;
  createdAt: string;
  postsCount: number;
}

interface AuthorPost {
  _id: string;
  title: string;
  coverImage?: string;
  tags: string[];
  likes: number;
  commentList: { _id: string }[];
  createdAt: string;
}

function AuthorSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 gap-5 animate-pulse px-4">
      <div className="w-full max-w-4xl bg-[#0a0a0a] rounded-lg p-8 flex flex-col items-center gap-4">
        <div className="w-32 h-32 rounded-full bg-white/10" />
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-5 w-72 rounded bg-white/10" />
        <div className="h-4 w-36 rounded bg-white/10" />
      </div>
    </div>
  );
}

export default function AuthorPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.slug as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<AuthorPost[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      fetchUser();
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);

  async function fetchUser() {
    setLoadingUser(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setError("User not found.");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingUser(false);
    }
  }

  async function fetchPosts() {
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?author=${userId}&limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // silently fail — posts section just stays empty
    } finally {
      setLoadingPosts(false);
    }
  }

  if (status === "loading" || loadingUser) return <AuthorSkeleton />;

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

  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center justify-start pt-24 gap-6 px-4 pb-12">
      {/* Hero Card */}
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-xl p-8 flex flex-col items-center gap-3">
        {/* Avatar */}
        {user.image ? (
          <Image
            src={user.image}
            width={120}
            height={120}
            alt={user.name ?? "Author"}
            className="rounded-full object-cover w-28 h-28 border-2 border-white/20"
          />
        ) : (
          <div className="w-28 h-28 rounded-full bg-blue-600 flex items-center justify-center text-white text-5xl font-bold select-none border-2 border-white/20">
            {(user.name ?? user.email ?? "A").charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <h1 className="text-white text-2xl md:text-4xl font-bold text-center">
          {user.name ?? "Anonymous"}
        </h1>

        {/* Email */}
        <p className="text-white/50 text-sm">{user.email}</p>

        {/* Join date */}
        <p className="flex items-center gap-2 text-white/60 text-sm">
          <FaBirthdayCake />
          Joined on {joinDate}
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">
              {user.postsCount}
            </span>
            <span className="text-xs text-white/50">Posts</span>
          </div>
        </div>
      </div>

      {/* Activity + Posts */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 items-start">
        {/* Activity sidebar */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 w-full md:w-56 flex-shrink-0">
          <h2 className="text-white font-semibold text-lg mb-4">Activity</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <FaRegNewspaper className="text-white/40 flex-shrink-0" />
              <span>
                {user.postsCount} post{user.postsCount !== 1 ? "s" : ""} written
              </span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <MdOutlineInsertComment className="text-white/40 flex-shrink-0" />
              <span>Comments via posts</span>
            </div>
          </div>
        </div>

        {/* Posts list */}
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-semibold text-lg mb-4">Posts</h2>
          {loadingPosts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 animate-pulse"
                >
                  <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8 text-center text-white/40">
              No posts yet.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/posts/${post._id}`}
                  className="block bg-[#0a0a0a] border border-white/10 hover:border-blue-500/50 rounded-xl p-4 transition-colors group"
                >
                  <div className="flex gap-4 items-start">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        width={80}
                        height={60}
                        className="rounded-lg object-cover w-20 h-14 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                        {post.title}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.commentList?.length ?? 0}</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
