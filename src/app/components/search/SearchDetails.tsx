import Link from "next/link";
import Image from "next/image";
import { CiHeart, CiBookmark, CiBellOn } from "react-icons/ci";
import { useState } from "react";
import { SearchDetails } from "@/lib/data";
import { SearchDetailProp } from "@/lib/types";

interface SearchDetailsProps {
  searchType:
    | "posts"
    | "people"
    | "channels"
    | "tags"
    | "comments"
    | "my posts only";
  sortOptions?: "Most Relevant" | "Newest" | "Oldest";
}

export default function SearchDetailsComponent({
  searchType,
  sortOptions,
}: SearchDetailsProps) {
  const [likes, setLikes] = useState(
    SearchDetails.map((search) => search.isLiked || false)
  );
  const [saves, setSaves] = useState(
    SearchDetails.map((search) => search.isSaved || false)
  );
  const [subscriptions, setSubscriptions] = useState(
    SearchDetails.map((search) => search.isSubscribed || false)
  );

  const handleLike = (idx: number) => {
    setLikes((prev) => prev.map((like, i) => (i === idx ? !like : like)));
  };

  const handleSave = (idx: number) => {
    setSaves((prev) => prev.map((save, i) => (i === idx ? !save : save)));
  };

  const handleSubscribe = (idx: number) => {
    setSubscriptions((prev) =>
      prev.map((subscriptions, i) =>
        i === idx ? !subscriptions : subscriptions
      )
    );
  };

  const getSortValue = (item: SearchDetailProp): Date => {
    if (item.postCreationDate) {
      return new Date(item.postCreationDate);
    }

    if (item.time) {
      const now = new Date();
      const match = item.time.match(/(\d+)\s*(hour|day|week|month)s?\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        const unit = match[2];
        const multipliers: { [key: string]: number } = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        };
        const multiplier = multipliers[unit] || 0;
        return new Date(now.getTime() - num * multiplier);
      }
    }
    return new Date(0);
  };

  const filteredAndSortedData = SearchDetails.filter(
    (search) => search.type === searchType
  ).sort((a, b) => {
    if (sortOptions === "Newest") {
      return getSortValue(b).getTime() - getSortValue(a).getTime();
    } else if (sortOptions === "Oldest") {
      return getSortValue(a).getTime() - getSortValue(b).getTime();
    } else {
      return 0;
    }
  });

  return (
    <div>
      {filteredAndSortedData.map((search, idx) => {
        const originalIdx = SearchDetails.indexOf(search);
        return (
          <div
            key={idx}
            className="rounded-lg border w-full border-white/10 border-l-4 md:border-l-8 hover:border-l-blue-500 p-3 font-sans my-3 bg-[#0A0A0A]"
          >
            {search.type === "posts" || search.type === "comments" ? (
              <>
                {/* Profile Section */}
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={search.userPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={search.user || "user"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    <div className="flex gap-1">
                      {search.authorProfile && (
                        <Link
                          className="font-bold hover:text-blue-300"
                          href={search.authorProfile}
                        >
                          {search.user}
                        </Link>
                      )}
                      <span>made a new</span>
                      <span>{search.type}</span>
                    </div>
                    <span className="font-light text-gray-400 text-sm">
                      about {search.time}
                    </span>
                  </div>
                </div>
                {/*Search Details*/}
                <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl hover:text-blue-300 bg-black/10">
                  {search.postLink && (
                    <Link
                      href={search.postLink}
                      className="flex flex-wrap font-sans font-bold text-lg md:text-3xl text-white"
                    >
                      {search.postTitle}
                    </Link>
                  )}
                  {search.tags && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {search.tags.map((tag, index) => (
                        <span key={index}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/*Display Comment if type: "comment" */}
                {search.comment && (
                  <div className="border border-white/10 border-l-3 border-l-blue-300 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                    <span className="font-bold italic text-white">
                      New Comment -{" "}
                    </span>
                    <span className="text-gray-400">{search.comment}</span>
                  </div>
                )}
                {/*Like, Save and Subscribe to comments */}
                <div className="border border-white/10 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl rounded-lg rounded-t-none bg-black/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-left gap-2">
                      <button
                        onClick={() => handleLike(originalIdx)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          likes[originalIdx]
                            ? "text-red-500"
                            : "text-white/80 hover:bg-gray-700"
                        }`}
                      >
                        <CiHeart
                          size={24}
                          className={likes[originalIdx] ? "fill-red-500" : ""}
                        />
                      </button>

                      <button
                        onClick={() => handleSave(originalIdx)}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                          saves[originalIdx]
                            ? "text-blue-500"
                            : "text-white/80 hover:bg-gray-700"
                        }`}
                      >
                        <CiBookmark
                          size={24}
                          className={saves[originalIdx] ? "fill-blue-500" : ""}
                        />
                      </button>
                    </div>

                    <button
                      onClick={() => handleSubscribe(originalIdx)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        subscriptions[originalIdx]
                          ? "text-green-500"
                          : "text-white/80 hover:bg-gray-700"
                      }`}
                    >
                      <CiBellOn
                        size={24}
                        className={
                          subscriptions[originalIdx] ? "fill-green-500" : ""
                        }
                      />
                      <span className="text-nowrap">
                        {subscriptions[originalIdx]
                          ? "Subscribed"
                          : "Subscribe to comments"}
                      </span>
                    </button>
                  </div>
                </div>
              </>
            ) : search.type === "people" ? (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={search.userPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={search.user || "user"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    {search.profileLink && (
                      <Link
                        className="font-bold hover:text-blue-300"
                        href={search.profileLink}
                      >
                        {search.user}
                      </Link>
                    )}
                    <span className="font-light text-gray-400 text-sm">
                      {search.followers} followers
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                  <p className="text-gray-400">{search.bio}</p>
                </div>
              </>
            ) : search.type === "channels" ? (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={search.logo || "/default-logo.webp"}
                    width={50}
                    height={50}
                    alt={search.name || "organization"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    {search.website && (
                      <Link
                        className="font-bold hover:text-blue-300"
                        href={search.website}
                      >
                        {search.name}
                      </Link>
                    )}
                    <span className="font-light text-gray-400 text-sm">
                      {search.members} members
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl bg-black/10">
                  <p className="text-gray-400">{search.description}</p>
                </div>
              </>
            ) : search.type === "tags" ? (
              <div className="rounded-lg border border-white/10 py-5 text-wrap justify-center p-3 bg-black/10">
                <Link
                  href={`/tag/${search.tag}`}
                  className="font-bold text-blue-300 text-xl"
                >
                  #{search.tag}
                </Link>
                <p className="text-gray-400 mt-2">{search.description}</p>
                <span className="font-light text-gray-400 text-sm">
                  {search.count} posts
                </span>
              </div>
            ) : search.type === "my posts only" ? (
              <>
                <div className="flex items-center justify-left pb-3">
                  <Image
                    src={search.authorPic || "/default-avatar.webp"}
                    width={50}
                    height={50}
                    alt={search.authorName || "author"}
                    className="rounded-full"
                  />
                  <div className="grid grid-row-2 pl-2">
                    <span className="font-bold">{search.authorName}</span>
                    <span className="font-light text-gray-400 text-sm">
                      {search.postCreationDate}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl hover:text-blue-300 bg-black/10">
                  <div className="font-sans font-bold text-lg md:text-3xl text-white">
                    {search.postTitle}
                  </div>
                  <p className="text-gray-400 mt-2">{search.postDesc}</p>
                  {search.tags && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {search.tags.map((tag, index) => (
                        <span key={index}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border border-white/10 text-wrap justify-center p-3 ml-0 md:ml-20 w-full md:w-xl rounded-lg rounded-t-none bg-black/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">
                      {search.postLikes} likes
                    </span>
                    <span className="text-gray-400">
                      {search.postComments?.length || 0} comments
                    </span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
