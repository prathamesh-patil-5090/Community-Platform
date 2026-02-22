"use client";

import { useState } from "react";
import UserActivity from "./UserActivity";
import UserComments from "./UserComments";
import UserPosts from "./UserPosts";

type View = "posts" | "comments";

interface ProfileContentProps {
  userId: string;
  postsCount: number;
  commentsCount: number;
}

export default function ProfileContent({
  userId,
  postsCount,
  commentsCount,
}: ProfileContentProps) {
  const [view, setView] = useState<View>("posts");

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
      <div className="w-full md:w-64 flex-shrink-0">
        <UserActivity
          postsCount={postsCount}
          commentsCount={commentsCount}
          activeView={view}
          onViewChange={setView}
        />
      </div>

      <div className="flex-1 min-w-0">
        {view === "posts" ? (
          <UserPosts userId={userId} />
        ) : (
          <UserComments userId={userId} />
        )}
      </div>
    </div>
  );
}
