import Link from "next/link";
import Image from "next/image";
import { CiHeart, CiBookmark, CiBellOn } from "react-icons/ci";
import { useState } from "react";
import { notificationDetails } from "../../../../lib/data";

interface NotificationDetailsProps {
  notiType: "post" | "comment" | "all";
}

export default function NotificationsDetails({
  notiType,
}: NotificationDetailsProps) {
  const [likes, setLikes] = useState(
    notificationDetails.map((noti) => noti.isLiked || false)
  );
  const [saves, setSaves] = useState(
    notificationDetails.map((noti) => noti.isSaved || false)
  );
  const [subscriptions, setSubscriptions] = useState(
    notificationDetails.map((noti) => noti.isSubscribed || false)
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

  return (
    <div>
      {notificationDetails &&
        notificationDetails.map((noti, idx) => {
          if (notiType !== "all" && noti.notificationType !== notiType)
            return null;
          return (
            <div
              key={idx}
              className="rounded-lg border border-gray-500 border-l-8 hover:border-l-blue-500 p-3 font-sans my-3"
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
              <div className="rounded-lg rounded-b-none border border-gray-500 py-5 text-wrap justify-center p-3 md:ml-20 md:w-xl hover:text-blue-300">
                <Link
                  href={noti.postLink}
                  className="flex flex-wrap font-sans font-bold text-md md:text-3xl"
                >
                  {noti.postTitle}
                </Link>
                {noti.tags && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {noti.tags.map((tag, index) => (
                      <span key={index}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {/*Display Comment if notificationType: "comment" */}
              {noti.comment && (
                <div className="border border-gray-500 border-l-3 border-l-blue-300 text-wrap justify-center p-3 md:ml-20 md:w-xl">
                  <span className="font-bold italic">New Comment - </span>
                  <span className="text-gray-500">{noti.comment}</span>
                </div>
              )}
              {/*Like, Save and Subscribe to comments */}
              <div className="border border-gray-500 text-wrap justify-center p-3 md:ml-20 md:w-xl rounded-lg rounded-t-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-left gap-2">
                    <button
                      onClick={() => handleLike(idx)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        likes[idx]
                          ? "text-red-500"
                          : "text-gray-600 hover:bg-gray-100"
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
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <CiBookmark
                        size={24}
                        className={saves[idx] ? "fill-blue-500" : ""}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSubscribe(idx)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      subscriptions[idx]
                        ? "text-green-500"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <CiBellOn
                      size={24}
                      className={subscriptions[idx] ? "fill-green-500" : ""}
                    />
                    <span className="text-nowrap">
                      {subscriptions[idx]
                        ? "Subscribed"
                        : "Subscribe to comments"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
