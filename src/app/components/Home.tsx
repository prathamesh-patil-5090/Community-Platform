import React from "react";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";
import DisplayPosts from "./DisplayPosts";

function Home() {
  return (
    <div className="bg-transparent flex items-start justify-center md:justify-evenly gap-12">
      <div className="flex-none hidden md:block">
        <SideBar />
      </div>
      <div className="flex-2">
        <PostBar />
        <DisplayPosts />
      </div>
      <div className="flex-1 hidden md:block">
        <TopDiscussionsBox />
      </div>
    </div>
  );
}

export default Home;
