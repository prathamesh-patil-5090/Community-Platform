"use client";
import Button from "./Button";
import { useRouter } from "next/navigation";

function PostBar() {
  const router = useRouter();

  return (
    <div className="relative max-w-full min-h-[50px] flex flex-row gap-2">
      <input
        placeholder="What's on your mind? "
        className={`text-white border border-white/50 bg-[#0A0A0A] hover:bg-gray-700 rounded-md px-4 pl-2 py-2 sm:w-3xl focus:outline-blue-400`}
      ></input>
      <Button
        name={"Create"}
        onClick={() => router.push("/create-post")}
        bgColor={"bg-black"}
        className="block lg:hidden"
      />
    </div>
  );
}

export default PostBar;
