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
      className="relative max-w-full flex flex-col gap-2 p-3 bg-surface-container border border-outline/60 rounded-2xl shadow-sm focus-within:border-primary/40 focus-within:shadow-[0_0_20px_rgba(217,70,239,0.1)] transition-all"
      onFocus={() => setShowButton(true)}
      ref={postBarRef}
    >
      <textarea
        rows={1}
        cols={200}
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-on-surface bg-transparent rounded-xl px-4 py-2 w-full focus:outline-none resize-none placeholder-on-surface-variant"
      />
      {showButton && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-2 pt-2 pb-1 text-xs text-on-surface-variant border-t border-outline/10 mt-2">
          <span className="leading-relaxed">
            Quickie Posts (beta) show up in the feed but not notifications or
            your profile —{" "}
            <button
              type="button"
              className="underline font-semibold text-primary hover:text-primary-dim transition-colors"
              onClick={handleNavigateToFullEditor}
            >
              Open Full Editor
            </button>
          </span>
          <Button
            name={"Create"}
            onClick={handleNavigateToFullEditor}
            className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-lg px-4 py-1.5 transition-colors self-end md:self-auto"
          />
        </div>
      )}
    </div>
  );
}

export default PostBar;
