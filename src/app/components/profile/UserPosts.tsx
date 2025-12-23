"use client";
import { notificationDetails } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CiBookmark, CiHeart } from "react-icons/ci";

export default function NotificationsDetails() {
  const router = useRouter();
  const [likes, setLikes] = useState(
    notificationDetails.map((noti) => noti.isLiked || false),
  );
  const [saves, setSaves] = useState(
    notificationDetails.map((noti) => noti.isSaved || false),
  );

  const handleLike = (idx: number) => {
    setLikes((prev) => prev.map((like, i) => (i === idx ? !like : like)));
  };

  const handleSave = (idx: number) => {
    setSaves((prev) => prev.map((save, i) => (i === idx ? !save : save)));
  };

  return (
    <div>
      {notificationDetails &&
        notificationDetails.map((noti, idx) => {
          return (
            <div
              key={idx}
              className="md:rounded-lg border border-white/10 border-l-8 hover:border-l-blue-500 p-3 font-sans my-3 bg-[#0A0A0A]"
            >
              {/* Profile Section */}
              <div className="flex items-center justify-left pb-3">
                <Image
                  src={noti.userPic || "/default-avatar.webp"}
                  width={50}
                  height={50}
                  alt={noti.user}
                  className="rounded-full"
                />
                <div className="grid grid-row-2 pl-2">
                  <div className="flex gap-1">
                    <Link
                      className="font-bold hover:text-blue-300"
                      href={noti.authorProfile}
                    >
                      {noti.user}
                    </Link>
                    <span>made a new</span>
                    <span>{noti.notificationType}</span>
                  </div>
                  <span className="font-light text-gray-400 text-sm">
                    about {noti.time}
                  </span>
                </div>
              </div>
              {/*Notifications Details*/}
              <div className="rounded-lg rounded-b-none border border-white/10 py-5 text-wrap justify-center p-3 md:ml-20 md:w-xl hover:text-blue-300 bg-black/10">
                <Link
                  href={noti.postLink}
                  className="flex flex-wrap font-sans font-bold text-md md:text-3xl text-white"
                >
                  {noti.postTitle}
                </Link>
                {noti.tags && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {noti.tags.map((tag, index) => (
                      <button
                        key={index}
                        className="font-light p-1 hover:text-blue-500 cursor-pointer"
                        onClick={() => router.push(`/search?q=${tag}`)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/*Display Comment if notificationType: "comment" */}
              {noti.comment && (
                <div className="border border-white/10 border-l-3 border-l-blue-300 text-wrap justify-center p-3 md:ml-20 md:w-xl bg-black/10">
                  <span className="font-bold italic text-white">
                    New Comment -{" "}
                  </span>
                  <span className="text-gray-400">{noti.comment}</span>
                </div>
              )}
              {/*Like, Save and Subscribe to comments */}
              <div className="border border-white/10 text-wrap justify-center p-3 md:ml-20 md:w-xl rounded-lg rounded-t-none bg-black/10">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-left gap-2">
                    <button
                      onClick={() => handleLike(idx)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        likes[idx]
                          ? "text-red-500"
                          : "text-white/80 hover:bg-gray-700"
                      }`}
                    >
                      <CiHeart
                        size={24}
                        className={likes[idx] ? "fill-red-500" : ""}
                      />
                    </button>

                    <button
                      onClick={() => handleSave(idx)}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                        saves[idx]
                          ? "text-blue-500"
                          : "text-white/80 hover:bg-gray-700"
                      }`}
                    >
                      <CiBookmark
                        size={24}
                        className={saves[idx] ? "fill-blue-500" : ""}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
