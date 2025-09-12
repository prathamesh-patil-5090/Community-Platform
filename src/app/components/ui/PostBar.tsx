"use client";
import { useEffect, useState } from "react";
import Button from "./Button";
import { useRouter } from "next/navigation";

function PostBar() {
  const router = useRouter();

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative h-[50px] flex flex-warp gap-2">
      <input
        placeholder="What's on your mind? "
        className={`text-white border border-white bg-black hover:bg-gray-700 rounded-md px-4 pl-2 py-2 sm:w-2xl focus:outline-blue-400`}
      ></input>
      {windowDimensions.width < 1024 && (
        <Button
          name={"Create"}
          onClick={() => router.push("/create-post")}
          bgColor={"bg-indigo-950"}
        />
      )}
    </div>
  );
}

export default PostBar;
