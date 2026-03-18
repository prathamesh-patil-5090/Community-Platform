"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useWindowSize } from "./hooks/useWindowSize";
import NotificationsDetails from "./ui/NotificationsDetails";
import NotificationsSidebar from "./ui/NotificationsSidebar";

export type NotificationType = "all" | "new_post" | "comment_on_post";

export default function Notifications() {
  const { width } = useWindowSize();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize type from URL if present
  const typeFromUrl = (searchParams?.get("type") ?? "all") as NotificationType;
  const validTypes: NotificationType[] = ["all", "new_post", "comment_on_post"];
  const initialType = validTypes.includes(typeFromUrl) ? typeFromUrl : "all";

  const [notiType, setNotiType] = useState<NotificationType>(initialType);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handleTypeChange = useCallback(
    (type: NotificationType) => {
      setNotiType(type);

      // Update URL to reflect the filter
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (type === "all") {
        params.delete("type");
      } else {
        params.set("type", type);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(`/notifications${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center pt-40 text-white/50 w-full">
        <p>Please Log in or Register to see your personalized Notifications</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex md:items-start ${
        width < 768 ? "flex-col" : "justify-left"
      } items-center gap-10`}
    >
      <NotificationsSidebar
        setType={handleTypeChange}
        activeType={notiType}
        unreadCount={unreadCount}
      />
      <NotificationsDetails
        notiType={notiType}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </div>
  );
}
