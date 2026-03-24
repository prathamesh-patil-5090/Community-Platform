import DisplayPosts from "./DisplayPosts";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";

function Home() {
  return (
    <div className="relative min-h-screen">
      <div className="hidden lg:block">
        <SideBar />
      </div>

      <div className="lg:ml-64 flex justify-center xl:justify-between gap-6 max-w-[1400px] mx-auto px-4 lg:px-8 py-8 items-start">
        <main className="min-w-[850px] flex flex-col gap-6 w-full max-w-3xl">
          <PostBar />
          <DisplayPosts />
        </main>

        <aside className="hidden xl:block sticky top-24 self-start space-y-6 w-[340px] flex-shrink-0">
          <TopDiscussionsBox />
        </aside>
      </div>
    </div>
  );
}

export default Home;
