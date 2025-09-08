"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { MdOutlineModeComment } from "react-icons/md";

type tagsType = string[];

const tags: tagsType = ["facts", "student_life", "im_important"];

function Post() {
  const my_text =
    "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Impedit aliquam eius deserunt veritatis minus voluptatum, possimus quos quas quasi ullam accusantium. Quae necessitatibus recusandae illo et! Exercitationem officia debitis tempora eos repudiandae natus expedita. Debitis, ducimus repellat quas dolores error, placeat non commodi doloribus amet illo facere libero perferendis harum delectus vel illum. Quisquam deleniti minima quidem vel, velit maiores hic aspernatur est repellendus, illum eius praesentium. Quos delectus aperiam blanditiis minus architecto asperiores eos vero sint magni id unde deleniti illo deserunt repellat voluptatum cumque accusantium exercitationem accusamus, nam odit? Laboriosam voluptatibus velit, deserunt ipsam ad maiores dolore quam.";

  const router = useRouter();
  const [isLiked, setLike] = useState(false);
  const [likes, setLikes] = useState<number>(0);
  const [isCommentPressed, setCommentPressed] = useState(false);
  const [isCommentInput, setCommentInput] = useState(false);
  const underFiftyWords = (text: string): string => {
    const words = text.split(" ");
    const shouldTruncate = words.length > 50;
    if (shouldTruncate) return words.slice(0, 50).join(" ") + "...Read more";
    return text;
  };

  const handleLike = () => {
    if (isLiked) {
      setLike(false);
      setLikes(likes - 1);
    }
    if (!isLiked) {
      setLike(true);
      setLikes(likes + 1);
    }
  };

  return (
    <div className="w-full border rounded-xl p-5 mt-2">
      <div>
        <div className="flex justify-between gap-2">
          <div className="flex justify-self-start gap-2 bg-gray-800 px-4 py-2 rounded-md">
            <Image
              src="/logo/me.webp"
              alt="Author Pic"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="font-sans">
              <p>Prathamesh Patil</p>
              <p>8 Sept 2025</p>
            </div>
          </div>
          <span className="flex bg-gray-600 rounded-lg pt-3 px-2 my-2">
            Article
          </span>
        </div>
      </div>
      <div className="font-sans font-bold text-3xl">
        No good quality food in hostel
      </div>
      <div>
        <Image
          src="/logo/trial_image.webp"
          alt="Post Pic"
          width={2500}
          height={1500}
          className="rounded-lg"
        />
      </div>

      <p className="font-sans font-medium tracking-wide text-justify text-white">
        {underFiftyWords(my_text)}
      </p>

      <div className="flex gap-2 py-2">
        {tags.map((tag, index) => (
          <button
            key={index}
            className="font-light bg-gray-700 rounded-xl px-1 py-1"
            onClick={() => router.push(`/tags/${tag}`)}
          >
            #{tag}
          </button>
        ))}
      </div>
      <div className="flex gap-5">
        {isLiked ? (
          <div className="flex items-center gap-2">
            <BiSolidLike size={40} onClick={handleLike} />
            <p>{likes}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <BiLike size={40} onClick={handleLike} />
            <p>{likes}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MdOutlineModeComment
            size={40}
            onClick={() => setCommentPressed(!isCommentPressed)}
          />
          <p className="font-sans font-bold">Add a Comment</p>
        </div>
      </div>
      <div className="flex justify-center items-center pt-2">
        {isCommentPressed && (
          <div className="relative pt-2 flex items-center gap-2">
            <textarea
              className="border p-2 w-full md:w-150 rounded-full"
              onClick={() => setCommentInput(true)}
            />
            {!isCommentInput && (
              <span className="absolute left-7 md:left-55 flex-wrap-reverse whitespace-nowrap font-sans font-light text-2xl">
                Add a Comment
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Post;
