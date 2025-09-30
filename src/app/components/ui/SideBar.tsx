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
      className="rounded-lg p-4 max-w-3xs items-left justify-left"
      role="region"
      aria-label="sidebar"
    >
      {sidebarObjects.map((obj, idx) => {
        return (
          <div
            key={idx}
            className="group flex items-center justify-left-safe gap-2 py-3 hover:border hover:border-amber-50 rounded-lg p-2 cursor-pointer"
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
