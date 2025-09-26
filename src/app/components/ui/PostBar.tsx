"use client";
import Button from "./Button";
import { useRouter } from "next/navigation";
import "../css/CreatePostButton.css";

function PostBar() {
  const router = useRouter();

  return (
    <div className="relative max-w-full min-h-[50px] flex flex-row gap-2">
      <input
        placeholder="What's on your mind? "
        className={`text-white border border-white/10 bg-[#0A0A0A] rounded-md px-4 pl-2 py-2 sm:w-3xl focus:outline-black`}
      ></input>
      <Button
        name={"Create"}
        onClick={() => router.push("/create-post")}
        className="lg:hidden gradient-text" // Removed bg-transparent from className
      />
    </div>
  );
}

export default PostBar;
