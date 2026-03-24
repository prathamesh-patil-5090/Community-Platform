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
    <nav
      className="p-4 h-full space-y-1 lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-64px)] lg:w-64 lg:border-r lg:border-[#9D4EDD]/10 lg:bg-[#10131A] z-40"
      role="region"
      aria-label="sidebar"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse">
        <div className="w-6 h-6 rounded bg-surface-variant" />
        <div className="h-4 bg-surface-variant rounded w-20" />
      </div>
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse"
        >
          <div className="w-6 h-6 rounded bg-surface-variant" />
          <div className="h-4 bg-surface-variant rounded w-24" />
        </div>
      ))}
    </nav>
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
  const sidebarItems: {
    name: string;
    link: string;
    icon: string;
    isMaterial?: boolean;
  }[] = [
    { name: "Home", link: "/", icon: "home", isMaterial: true },
    ...pages.map((page) => ({
      name: page.name,
      link: `/${page.slug}`,
      icon: page.icon,
      isMaterial: page.icon.length > 2, // simple heuristic: if it's longer than a typical emoji, assume material icon
    })),
  ];

  return (
    <div
      className="py-6 bg-[#10131A] h-full flex flex-col z-40 lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-64px)] lg:w-64 lg:border-r lg:border-[#9D4EDD]/10"
      role="region"
      aria-label="sidebar"
    >
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            biotech
          </span>
        </div>
        <div>
          <div className="text-xl font-bold text-primary font-headline">
            Tech Hub
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest">
            Neon Brutalist Curator
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {sidebarItems.map((obj, idx) => {
          const isActive =
            obj.link === "/"
              ? pathname === "/"
              : pathname === obj.link || pathname.startsWith(`${obj.link}/`);

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:translate-x-1 duration-150 transition-all ${
                isActive
                  ? "bg-primary/10 text-[#d095ff] border-r-4 border-primary rounded-l-lg"
                  : "text-slate-400 hover:text-white hover:bg-[#161A21] rounded-lg"
              }`}
              onClick={() => router.push(obj.link)}
            >
              {obj.isMaterial ? (
                <span
                  className={`material-symbols-outlined ${isActive ? "" : ""}`}
                  style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
                >
                  {obj.icon}
                </span>
              ) : (
                <span className="text-xl">{obj.icon}</span>
              )}
              <span className="font-medium text-sm">{obj.name}</span>
            </div>
          );
        })}

        {/* Empty state when no community pages exist */}
        {pages.length === 0 && (
          <div className="mt-6 px-4 text-center">
            <p className="text-on-surface-variant text-xs">
              No community pages available yet.
            </p>
          </div>
        )}
      </nav>

      <div className="px-6 mt-auto space-y-4">
        <button
          onClick={() => router.push("/create-post")}
          className="w-full py-3 bg-gradient-to-br from-primary to-primary-dim text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create Post
        </button>
        <div className="pt-6 border-t border-outline-variant/50 space-y-1">
          <button className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-4 py-2 hover:bg-[#161A21] transition-colors rounded-lg text-sm">
            <span className="material-symbols-outlined text-lg">settings</span>
            Settings
          </button>
          <button className="w-full flex items-center gap-3 text-slate-400 hover:text-white px-4 py-2 hover:bg-[#161A21] transition-colors rounded-lg text-sm mt-2">
            <span className="material-symbols-outlined text-lg">help</span>
            Help
          </button>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
