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

  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10">
      {/* Banner */}
      <div className="h-32 md:h-44 w-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative">
        {/* subtle pattern overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
      </div>

      {/* Avatar – overlapping the banner */}
      <div className="px-6 md:px-10">
        <div className="relative -mt-12 md:-mt-16 mb-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-[#0a0a0a] overflow-hidden bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
            {image ? (
              <Image
                src={image}
                width={128}
                height={128}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-700 flex items-center justify-center text-white text-3xl md:text-4xl font-bold select-none">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="pb-6 md:pb-8">
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight">
            {displayName}
          </h1>

          {email && <p className="text-white/40 text-sm mt-1">{email}</p>}

          {formattedDate && (
            <p className="flex items-center gap-1.5 text-white/40 text-sm mt-3">
              <FaBirthdayCake size={13} className="text-white/30" />
              Joined {formattedDate}
            </p>
          )}

          {!formattedDate && !email && (
            <div className="flex items-center gap-1.5 mt-2">
              <IoPersonCircle size={16} className="text-white/20" />
              <span className="text-white/30 text-sm">Community Member</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileHeroSection;
