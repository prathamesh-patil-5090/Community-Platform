"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarPage {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  order: number;
}

function SideBarSkeleton() {
  return (
    <div className="bg-[#0A0A0A] p-4 h-full" role="region" aria-label="sidebar">
      {/* Home is always shown */}
      <div className="group flex items-center justify-left gap-2 py-3 p-2 rounded">
        <span className="text-2xl">🏠</span>
        <h4 className="font-sans text-xl font-medium">Home</h4>
      </div>
      {/* Skeleton items */}
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 py-3 p-2 animate-pulse"
        >
          <div className="w-8 h-8 rounded bg-white/5" />
          <div className="h-5 bg-white/5 rounded w-28" />
        </div>
      ))}
    </div>
  );
}

function SideBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [pages, setPages] = useState<SidebarPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPages() {
      try {
        const res = await fetch("/api/community-pages");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setPages(data.pages ?? []);
        }
      } catch {
        // Silently fail — sidebar is non-critical
        // Pages array stays empty, user still sees Home
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPages();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <SideBarSkeleton />;
  }

  // Build the sidebar items: Home is always first, then dynamic pages
  const sidebarItems: { name: string; link: string; icon: string }[] = [
    { name: "Home", link: "/", icon: "🏠" },
    ...pages.map((page) => ({
      name: page.name,
      link: `/${page.slug}`,
      icon: page.icon,
    })),
  ];

  return (
    <div className="bg-[#0A0A0A] p-4 h-full" role="region" aria-label="sidebar">
      {sidebarItems.map((obj, idx) => {
        const isActive =
          obj.link === "/"
            ? pathname === "/"
            : pathname === obj.link || pathname.startsWith(`${obj.link}/`);

        return (
          <div
            key={idx}
            className={`group flex items-center justify-left gap-2 py-3 p-2 cursor-pointer rounded transition-all ${
              isActive
                ? "border border-amber-50/30 bg-white/[0.03]"
                : "hover:border hover:border-amber-50 hover:bg-transparent"
            }`}
            onClick={() => router.push(obj.link)}
          >
            <span className="text-2xl group-hover:no-underline">
              {obj.icon}
            </span>
            <h4
              className={`font-sans text-xl font-medium group-hover:underline group-hover:underline-offset-[3px] ${
                isActive ? "text-white" : ""
              }`}
            >
              {obj.name}
            </h4>
          </div>
        );
      })}

      {/* Empty state when no community pages exist */}
      {pages.length === 0 && (
        <div className="mt-4 px-2 py-3 text-center">
          <p className="text-gray-600 text-xs">
            No community pages available yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default SideBar;
