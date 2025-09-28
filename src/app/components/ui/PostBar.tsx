"use client";
import Button from "./Button";
import { useRouter } from "next/navigation";
import "../css/CreatePostButton.css";
import Link from "next/link";
import { useState } from "react";

function PostBar() {
  const router = useRouter();
  const [showButton, setShowButton] = useState<boolean>(false);

  const handleBlur = () => {
    setTimeout(() => {
      setShowButton(false);
    }, 300);
  };

  return (
    <div
      className="relative max-w-full flex flex-col gap-2 p-2 hidden:border md:border md:border-white/10 rounded-md"
      onFocus={() => setShowButton(true)}
      onBlur={handleBlur}
    >
      <textarea
        rows={1}
        cols={200}
        placeholder="What's on your mind?"
        className={` text-white border border-white/10 bg-[#0A0A0A] rounded-md px-4 pl-2 py-2 w-full focus:outline-black`}
      ></textarea>
      {showButton && (
        <div className="flex flex-row items-center justify-around md:justify-between p-2 font-light text-sm">
          <span>
            Quickie Posts (beta) show up in the feed but not notifications or
            your profile —{" "}
            <Link className="underline font-semibold" href={"/create-post"}>
              Open Full Editor
            </Link>
          </span>
          <Button
            name={"Create"}
            onClick={() => router.push("/create-post")}
            className="gradient-text border border-white/10"
          />
        </div>
      )}
    </div>
  );
}

export default PostBar;
