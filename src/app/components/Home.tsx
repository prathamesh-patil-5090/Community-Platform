import DisplayPosts from "./DisplayPosts";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";

function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Fixed Sidebar - Left side */}
      <div className="hidden md:block fixed left-0 top-[60px] h-[calc(100vh-60px)] w-[233px] overflow-y-auto bg-[#0A0A0A] border-r border-white/10 z-40">
        <SideBar />
      </div>

      {/* Main Content - Center (scrollable) */}
      <div className="md:ml-[250px] min-h-screen flex justify-center lg:justify-start lg:gap-10">
        <div className="flex-1 max-w-4xl">
          <PostBar />
          <DisplayPosts />
        </div>

        {/* Top Discussions - Scrolls with content */}
        <div className="hidden lg:block flex-shrink-0 w-[350px]">
          <TopDiscussionsBox />
        </div>
      </div>
    </div>
  );
}

export default Home;
