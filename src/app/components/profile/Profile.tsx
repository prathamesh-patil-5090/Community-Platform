import React from "react";
import ProfileHeroSection from "./ProfileHeroSection";
import UserActivity from "./UserActivity";
import UserPosts from "./UserPosts";

function Profile() {
  return (
    <div className="flex flex-col items-center justify-center pt-30 gap-5">
      <ProfileHeroSection />
      <div className="flex flex-col md:flex-row gap-8 md:items-start md:justify-center w-full">
        <UserActivity />
        <UserPosts />
      </div>
    </div>
  );
}

export default Profile;
