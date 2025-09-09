import React from "react";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";
import DisplayPosts from "./DisplayPosts";

function Home() {
  return (
    <div className="flex items-start justify-center md:justify-evenly gap-50">
      <div className="flex-1 hidden md:block">
        <SideBar />
      </div>
      <div className="flex-1">
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
