import React from "react";
import AuthorHeroSection from "./AuthorHeroSection";
import UserActivity from "./UserActivity";
import UserPosts from "./UserPosts";

function Author() {
  return (
    <div className="flex flex-col items-center justify-center pt-30 gap-5">
      <AuthorHeroSection />
      <div className="flex flex-col md:flex-row gap-8 md:items-start md:justify-center w-full">
        <UserActivity />
        <UserPosts />
      </div>
    </div>
  );
}

export default Author;
