import Link from "next/link";
import { FiHome, FiMessageSquare, FiSearch, FiUser } from "react-icons/fi";
import DisplayPosts from "./DisplayPosts";
import PostBar from "./ui/PostBar";
import SideBar from "./ui/SideBar";
import TopDiscussionsBox from "./ui/TopDiscussionsBox";

function Home() {
  return (
    <div className="relative min-h-screen pb-20 lg:pb-0">
      <div className="hidden lg:block">
        <SideBar />
      </div>

      <div className="lg:ml-64 flex justify-center xl:justify-between gap-6 max-w-[1400px] mx-auto px-0 md:px-4 lg:px-8 py-4 md:py-8 items-start">
        <main className="w-full lg:min-w-[850px] flex flex-col gap-6 max-w-3xl px-4 md:px-0">
          <PostBar />
          <DisplayPosts />
        </main>

        <aside className="hidden xl:block sticky top-24 self-start space-y-6 w-[340px] flex-shrink-0">
          <TopDiscussionsBox />
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0B0E]/90 backdrop-blur-md border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 lg:hidden">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-400 transition-colors"
        >
          <FiHome className="text-2xl" />
          <span className="text-[10px] font-medium tracking-wide">HOME</span>
        </Link>
        <Link
          href="/talks"
          className="flex flex-col items-center gap-1 text-white"
        >
          <span className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex items-center justify-center">
            <FiMessageSquare className="text-2xl" />
          </span>
          <span className="text-[10px] font-medium tracking-wide text-purple-400 mt-1">
            TALKS
          </span>
        </Link>
        <Link
          href="/search"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-400 transition-colors"
        >
          <FiSearch className="text-2xl" />
          <span className="text-[10px] font-medium tracking-wide">SEARCH</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-400 transition-colors"
        >
          <FiUser className="text-2xl" />
          <span className="text-[10px] font-medium tracking-wide">PROFILE</span>
        </Link>
      </nav>
    </div>
  );
}

export default Home;
