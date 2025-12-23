"use client";
import { useRouter } from "next/navigation";

const sidebarObjects = [
  {
    name: "Home",
    link: "/",
    icon: "🏠",
  },
  {
    name: "Tech Talk",
    link: "/tech-talk",
    icon: "🎙️",
  },
  {
    name: "Gaming Hub",
    link: "/gaming-hub",
    icon: "🎮",
  },
  {
    name: "Art Gallery",
    link: "/art-gallery",
    icon: "🎨",
  },
  {
    name: "News Feed",
    link: "/news-feed",
    icon: "📰",
  },
  {
    name: "Support Center",
    link: "/support-center",
    icon: "👩🏻‍💻",
  },
  {
    name: "Music Lounge",
    link: "/music-lounge",
    icon: "🎵",
  },
  {
    name: "Sports Arena",
    link: "/sports-arena",
    icon: "⚽",
  },
  {
    name: "Book Club",
    link: "/book-club",
    icon: "📚",
  },
  {
    name: "Fitness Zone",
    link: "/fitness-zone",
    icon: "💪",
  },
  {
    name: "Travel Tales",
    link: "/travel-tales",
    icon: "✈️",
  },
  {
    name: "Cooking Corner",
    link: "/cooking-corner",
    icon: "🍳",
  },
];

function SideBar() {
  const router = useRouter();
  return (
    <div
      className="bg-[#0A0A0A] p-4 h-full"
      role="region"
      aria-label="sidebar"
    >
      {sidebarObjects.map((obj, idx) => {
        return (
          <div
            key={idx}
            className="group flex items-center justify-left gap-2 py-3 hover:border hover:border-amber-50 p-2 cursor-pointer rounded transition-all"
            onClick={() => router.push(`${obj.link}`)}
          >
            <span className="text-2xl group-hover:no-underline">
              {obj.icon}
            </span>
            <h4 className="font-sans text-xl font-medium group-hover:underline group-hover:underline-offset-[3px]">
              {obj.name}
            </h4>
          </div>
        );
      })}
    </div>
  );
}

export default SideBar;
