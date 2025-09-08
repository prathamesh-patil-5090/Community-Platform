import React from "react";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";
import Post from "./ui/Post";

function Home() {
  return (
    <div className="flex items-start justify-center md:justify-evenly gap-50">
      <div className="flex-1 hidden md:block">
        <SideBar />
      </div>
      <div className="flex-1">
        <PostBar />
        <Post />
      </div>
      <div className="flex-1 hidden md:block">
        <TopDiscussionsBox />
      </div>
    </div>
  );
}

export default Home;
