"use client";
import { useState } from "react";
import { useWindowSize } from "./hooks/useWindowSize";
import NotificationsDetails from "./ui/NotificationsDetails";
import NotificationsSidebar from "./ui/NotificationsSidebar";

export default function Notifications() {
  const { width } = useWindowSize();
  const [notiType, setNotiType] = useState<"post" | "comment" | "all">("all");
  return (
    <div
      className={`flex md:items-start ${
        width < 768 ? "flex-col" : "justify-left"
      } items-center gap-10`}
    >
      <NotificationsSidebar setType={setNotiType} />
      <NotificationsDetails notiType={notiType} />
    </div>
  );
}
