"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { MdOutlineModeComment, MdOutlineReport } from "react-icons/md";
import { PiDotsThreeCircleVerticalLight } from "react-icons/pi";
import CommentOptionsModal from "./CommentOptionsModal";
import { IoSend } from "react-icons/io5";
import { PostInfoType } from "../../../../lib/types";
import ReportsComponent from "./ReportsComponent";
import { createPortal } from "react-dom";

export default function Post({ postData }: { postData: PostInfoType }) {
  const postComments = postData.postComments || [];
  const postLikes = postData.postLikes || 0;

  const router = useRouter();
  const [isLiked, setLike] = useState(false);
  const [likes, setLikes] = useState<number>(postLikes);
  const [isCommentPressed, setCommentPressed] = useState(false);
  const [isCommentInput, setCommentInput] = useState(false);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<string[]>(postComments);
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null);
  const [isReport, setReport] = useState<boolean>(false);
  const [Blur, setBlur] = useState<string>("none");

  const my_text = postData.postDesc || "";

  const tags: string[] = postData.tags || [];
  const postId = postData.postId;

  const underFiftyWords = (text: string): string => {
    const words = text.split(" ");
    const shouldTruncate = words.length > 50;
    if (shouldTruncate) return words.slice(0, 50).join(" ") + "...Read more";
    return text;
  };

  const handleLike = (): void => {
    setLike(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const addComment = (comment: string): void => {
    setComments((prevComments) => [...prevComments, comment]);
  };

  const handleSubmitComment = (): void => {
    if (comment.trim()) {
      addComment(comment);
      setComment("");
      setCommentInput(false);
    }
  };

  const handleReport = (): void => {
    const newIsReport = !isReport;
    setReport(newIsReport);
    setBlur(newIsReport ? "xl" : "none");
  };

  const closeReportModal = (): void => {
    setReport(false);
    setBlur("none");
  };

  useEffect(() => {
    if (isReport) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isReport]);

  if (!postData) {
    return <div className="p-5">loading post...</div>;
  }

  return (
    <div className="relative min-w-auto max-w-full border rounded-xl p-5 mt-2">
      <div className={`blur-${Blur}`}>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex justify-self-start gap-2 bg-gray-800 px-4 py-2 rounded-md">
            <Image
              src={postData.authorPic ? postData.authorPic : "no-image"}
              alt="Author Pic"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="font-sans">
              <p>{postData.authorName}</p>
              <p>
                {new Date(postData.postCreationDate)
                  .toDateString()
                  .split(" ")
                  .slice(1)
                  .join(" ")}
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="flex bg-gray-600 rounded-lg px-2 my-4">
              {postData.postType}
            </span>
            <MdOutlineReport
              className="flex text-red-500 my-3 cursor-pointer"
              size={30}
              onClick={handleReport}
            />
          </div>
        </div>

        <div
          className="font-sans font-bold text-xl md:text-3xl py-2 cursor-pointer"
          onClick={() => router.push(`/article/${postId}`)}
        >
          {postData.postTitle}
        </div>
        <div>
          <Image
            src={postData.postImage ? postData.postImage : "no-image"}
            alt="Post Pic"
            width={800}
            height={100}
            className="rounded-lg"
          />
        </div>

        <p className="font-sans font-small md:font-medium md:tracking-wide text-justify text-white py-2">
          {underFiftyWords(my_text)}
        </p>

        <div className="flex flex-wrap gap-2 py-2">
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
        <div className="flex gap-5 py-2">
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
          <div
            className="flex items-center gap-2"
            onClick={() => setCommentPressed(!isCommentPressed)}
          >
            <MdOutlineModeComment size={40} />
            <p className="font-sans font-bold">Add a Comment</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center pt-2">
        {isCommentPressed && (
          <div className="pt-2">
            {/* Input area */}
            <div className="relative flex items-center gap-2">
              <textarea
                className="border p-2 w-full md:w-150 rounded-xl resize-y"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onClick={() => setCommentInput(true)}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a Comment..."
              />
              {isCommentInput && (
                <IoSend
                  className=""
                  onClick={handleSubmitComment}
                  size={30}
                ></IoSend>
              )}
            </div>

            {/* Comments list */}
            <div className="mt-4 space-y-2">
              {comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <h3
                    key={idx}
                    className="flex justify-between text-justify border rounded-lg p-3"
                  >
                    {comment}
                    <div
                      className="flex items-start gap-3 pl-2 relative"
                      onClick={() =>
                        setOpenModalIndex(openModalIndex === idx ? null : idx)
                      }
                    >
                      <PiDotsThreeCircleVerticalLight
                        size={25}
                        className="cursor-pointer"
                      />
                      {openModalIndex === idx && (
                        <div
                          className="bg-white absolute top-8 right-0 border border-gray-300 rounded-lg shadow-lg z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <CommentOptionsModal />
                        </div>
                      )}
                    </div>
                  </h3>
                ))
              ) : (
                <p className="bg-gray-600 rounded-lg p-3">No Comments</p>
              )}
            </div>
          </div>
        )}
      </div>
      {isReport &&
        createPortal(
          <div className="fixed inset-0 bg-black/55 flex justify-center items-center z-50 overflow-hidden">
            <div onClick={(e) => e.stopPropagation()}>
              <ReportsComponent
                postData={postData.postTitle}
                onClose={closeReportModal}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
