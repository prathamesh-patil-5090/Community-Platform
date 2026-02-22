"use client";

import { notFound, useParams } from "next/navigation";
import SideBar from "../components/ui/SideBar";

const sidebarRoutes = [
  {
    slug: "tech-talk",
    name: "Tech Talk",
    icon: "🎙️",
    description:
      "Join discussions about the latest in technology, programming, and innovation.",
  },
  {
    slug: "gaming-hub",
    name: "Gaming Hub",
    icon: "🎮",
    description:
      "Connect with fellow gamers, share gameplay, and discuss your favorite titles.",
  },
  {
    slug: "art-gallery",
    name: "Art Gallery",
    icon: "🎨",
    description:
      "Showcase your artwork and discover talented artists from around the world.",
  },
  {
    slug: "news-feed",
    name: "News Feed",
    icon: "📰",
    description:
      "Stay updated with the latest news and trending topics in the community.",
  },
  {
    slug: "support-center",
    name: "Support Center",
    icon: "👩🏻‍💻",
    description: "Get help, report issues, and find answers to your questions.",
  },
  {
    slug: "music-lounge",
    name: "Music Lounge",
    icon: "🎵",
    description:
      "Share your favorite tracks, discuss music, and discover new artists.",
  },
  {
    slug: "sports-arena",
    name: "Sports Arena",
    icon: "⚽",
    description:
      "Talk about your favorite sports, teams, and athletic achievements.",
  },
  {
    slug: "book-club",
    name: "Book Club",
    icon: "📚",
    description:
      "Discuss literature, share book recommendations, and join reading groups.",
  },
  {
    slug: "fitness-zone",
    name: "Fitness Zone",
    icon: "💪",
    description:
      "Share workout routines, fitness tips, and health advice with the community.",
  },
  {
    slug: "travel-tales",
    name: "Travel Tales",
    icon: "✈️",
    description:
      "Share your travel experiences, tips, and discover new destinations.",
  },
  {
    slug: "cooking-corner",
    name: "Cooking Corner",
    icon: "🍳",
    description: "Exchange recipes, cooking tips, and culinary adventures.",
  },
];

export default function CommunityPage() {
  const params = useParams();
  const slug = params.slug as string;

  const currentRoute = sidebarRoutes.find((route) => route.slug === slug);

  if (!currentRoute) {
    notFound();
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] text-white">
      <div className="flex">
        <div className="flex-none hidden md:block">
          <SideBar />
        </div>
      </div>
      <div>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">{currentRoute.icon}</span>
              <h1 className="text-4xl md:text-5xl font-bold">
                {currentRoute.name}
              </h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl">
              {currentRoute.description}
            </p>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-3">
                Welcome to {currentRoute.name}!
              </h2>
              <p className="text-gray-300 mb-4">
                This is your space to connect, share, and engage with the
                community. Start by creating a post or exploring what others
                have shared.
              </p>
              <button className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-6 py-2 rounded-md transition-colors">
                Create New Post
              </button>
            </div>

            {/* Posts Section Placeholder */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          Sample Post Title {i}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
                          This is a preview of a post in the {currentRoute.name}{" "}
                          community. Click to read more...
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>👤 Username</span>
                          <span>💬 12 comments</span>
                          <span>❤️ 45 likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-500">0</div>
                <div className="text-sm text-gray-400 mt-1">Total Posts</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-500">0</div>
                <div className="text-sm text-gray-400 mt-1">Members</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-amber-500">0</div>
                <div className="text-sm text-gray-400 mt-1">Active Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
