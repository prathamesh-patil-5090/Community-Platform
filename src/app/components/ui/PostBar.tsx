"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "../css/CreatePostButton.css";
import Button from "./Button";

function PostBar() {
  const router = useRouter();
  const [showButton, setShowButton] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");
  const postBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        postBarRef.current &&
        !postBarRef.current.contains(event.target as Node)
      ) {
        setShowButton(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigateToFullEditor = () => {
    if (content.trim()) {
      sessionStorage.setItem("quickpost_draft", content.trim());
    }
    router.push("/create-post");
  };

  return (
    <div
      className="relative max-w-full flex flex-col gap-2 p-2 hidden:border md:border md:border-white/10 rounded-md"
      onFocus={() => setShowButton(true)}
      ref={postBarRef}
    >
      <textarea
        rows={1}
        cols={200}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-white border border-white/10 bg-[#0A0A0A] rounded-md px-4 pl-2 py-2 w-full focus:outline-black resize-none"
      />
      {showButton && (
        <div className="flex flex-row items-center justify-around md:justify-between p-2 font-light text-sm">
          <span>
            Quickie Posts (beta) show up in the feed but not notifications or
            your profile —{" "}
            <button
              type="button"
              className="underline font-semibold cursor-pointer hover:text-blue-400 transition-colors"
              onClick={handleNavigateToFullEditor}
            >
              Open Full Editor
            </button>
          </span>
          <Button
            name={"Create"}
            onClick={handleNavigateToFullEditor}
            className="gradient-text border border-white/10"
          />
        </div>
      )}
    </div>
  );
}

export default PostBar;
