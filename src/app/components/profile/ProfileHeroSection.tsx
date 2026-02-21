"use client";

import Image from "next/image";
import { FaBirthdayCake } from "react-icons/fa";
import { IoPersonCircle } from "react-icons/io5";

interface ProfileHeroSectionProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  joinedAt?: string | null;
}

function ProfileHeroSection({
  name,
  email,
  image,
  joinedAt,
}: ProfileHeroSectionProps) {
  const displayName = name || email?.split("@")[0] || "Anonymous";

  const formattedDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full flex-col md:w-[1100px] bg-[#0a0a0a] md:rounded-lg flex items-center justify-start">
      {/* Avatar */}
      <div className="relative w-50 h-50 rounded-full bg-black bottom-25 flex items-center justify-center">
        {image ? (
          <Image
            src={image}
            width={180}
            height={180}
            alt={displayName}
            className="absolute rounded-full ml-2.5 mt-2 object-cover"
          />
        ) : (
          <IoPersonCircle
            size={180}
            className="text-white/60 absolute ml-2.5 mt-2"
          />
        )}
      </div>

      {/* Info */}
      <div className="relative flex flex-col justify-center items-center px-4 md:px-3 text-wrap -top-22">
        <h1 className="text-white text-2xl md:text-4xl font-bold">
          {displayName}
        </h1>

        {email && (
          <p className="text-gray-400 text-sm md:text-base mt-1">{email}</p>
        )}

        {formattedDate && (
          <h3 className="flex items-center gap-2 text-white text-lg mt-5">
            <FaBirthdayCake />
            Joined on {formattedDate}
          </h3>
        )}
      </div>
    </div>
  );
}

export default ProfileHeroSection;
