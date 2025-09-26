"use client";
import { useRouter } from "next/navigation";
import { TopPosts } from "../../../../lib/data";

function TopDiscussionsBox() {
  const router = useRouter();
  return (
    <div
      className="bg-[#0A0A0A] border border-white/50 rounded-lg p-4 max-w-95"
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
        {TopPosts.map((post, idx) => (
          <div
            key={idx}
            className="flex flex-wrap sm:flex-row sm:justify-between sm:items-center p-3 cursor-pointer border-b border-gray-200"
          >
            <h3
              className="font-sans font-light text-md hover:text-blue-400 transition-colors duration-200"
              onClick={() => router.push(`${post.postLink}`)}
              aria-label={`Read discussion: ${post.postTitle}`}
            >
              {post.postTitle}
            </h3>
            <span className="text-sm text-gray-500">
              {post.numberOfComments} comments
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopDiscussionsBox;
