"use client";
import { usePathname } from "next/navigation";
export default function PostsPage() {
  const pathName = usePathname();
  return <div>This is page for post : {pathName}</div>;
}
