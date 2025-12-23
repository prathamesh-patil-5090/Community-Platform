"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiLike, BiSolidLike } from "react-icons/bi";
import { IoSend } from "react-icons/io5";
import { MdOutlineModeComment } from "react-icons/md";
import { PiDotsThreeCircleVerticalLight } from "react-icons/pi";
import CommentOptionsModal from "../ui/CommentOptionsModal";
import ReportsComponent from "../ui/ReportsComponent";

export type PostData = {
  postId: string;
  authorName?: string;
  authorId?: string;
  authorPic?: string;
  postCreationDate?: string;
  tags?: string[];
  postType?: string;
  postTitle?: string;
  postDesc?: string;
  postImage?: string;
  postLikes?: number;
  postComments?: string[];
};

export type PostComponentRef = {
  openCommentsAndScroll: () => void;
};

const PostComponent = forwardRef<PostComponentRef, { postData: PostData }>(({ postData }, ref) => {
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

  const commentsRef = useRef<HTMLDivElement>(null);

  const my_text = postData.postDesc || "";
  const tags: string[] = postData.tags || [];
  const postId = postData.postId;

  // Expose method to parent component
  useImperativeHandle(ref, () => ({
    openCommentsAndScroll: () => {
      setCommentPressed(true);
      // Scroll after state update
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
    }
  }));

  const formatLikes = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    } else {
      return num.toString();
    }
  };

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
    <div className="bg-[#0A0A0A] relative min-w-auto max-w-full border border-white/10 md:rounded-xl p-5 mt-2">
      <div className={`blur-${Blur}`}>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex items-center justify-self-start gap-2 bg-[#0A0A0A] px-1 py-2 rounded-md">
            <Link href={`/author/${postData.authorId}`}>
              <Image
                src={postData.authorPic ? postData.authorPic : "no-image"}
                alt="Author Pic"
                width={60}
                height={60}
                className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full object-cover flex-shrink-0"
              />
            </Link>
            <div className="font-sans ">
              <Link
                className="text-md md:text-lg"
                href={`/author/${postData.authorId}`}
              >
                {postData.authorName}
              </Link>
              <p className="text-md md:text-lg">
                {postData.postCreationDate && new Date(postData.postCreationDate)
                  .toDateString()
                  .split(" ")
                  .slice(1)
                  .join(" ")}
              </p>
            </div>
          </div>
        </div>

        <div
          className="font-sans font-bold text-xl md:text-5xl py-2 cursor-pointer"
          onClick={() => router.push(`/posts/${postId}`)}
        >
          {postData.postTitle}
        </div>
        <div className="flex flex-wrap gap-2 py-2">
          {tags.map((tag, index) => (
            <button
              key={index}
              className="font-light p-1 hover:text-blue-500 cursor-pointer"
              onClick={() => router.push(`/search?q=${tag}`)}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div>
          <Image
            src={postData.postImage ? postData.postImage : "no-image"}
            alt="Post Pic"
            width={1100}
            height={100}
            className="rounded-lg"
          />
        </div>

        <p className="font-sans font-small md:font-medium md:tracking-wide text-justify text-white py-2">
          {underFiftyWords(my_text)}
        </p>

        <div className="flex gap-5 py-2">
          {isLiked ? (
            <div className="flex items-center gap-2">
              <BiSolidLike size={30} onClick={handleLike} />
              <p>{formatLikes(likes)}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <BiLike size={30} onClick={handleLike} />
              <p>{formatLikes(likes)}</p>
            </div>
          )}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCommentPressed(!isCommentPressed)}
          >
            <MdOutlineModeComment size={30} />
          </div>
        </div>
      </div>
      
      <div ref={commentsRef} className="flex justify-center items-center pt-2">
        {isCommentPressed && (
          <div className="pt-2 w-full">
            {/* Input area */}
            <div className="relative flex items-center justify-center gap-2">
              <textarea
                className="border p-2 w-[80vw] md:w-150 rounded-xl resize-y text-black"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onClick={() => setCommentInput(true)}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a Comment..."
              />
              {isCommentInput && (
                <IoSend
                  className="cursor-pointer"
                  onClick={handleSubmitComment}
                  size={30}
                ></IoSend>
              )}
            </div>

            {/* Comments list */}
            <div className="mt-4 space-y-2">
              {comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <div key={idx}>
                    <h3 className="flex justify-between text-justify border rounded-lg p-3 text-wrap">
                      <div className="flex justify-start gap-2 md:gap-2 items-start text-wrap">
                        <Image
                          src={"/logo/me.webp"}
                          width={25}
                          height={25}
                          className="rounded-full flex-shrink-0 w-6 h-6 object-cover"
                          alt="Profile of Commentor"
                        ></Image>
                        <p className="flex-1 text-wrap break-all">{comment}</p>
                      </div>
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
                            className="bg-gray-950 absolute top-8 right-0 border border-gray-300 rounded-lg shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CommentOptionsModal
                              onEdit={() => {
                                console.log("Edit comment at index:", idx);
                                setOpenModalIndex(null);
                              }}
                              onDelete={() => {
                                setComments(
                                  comments.filter((_, i) => i !== idx),
                                );
                                setOpenModalIndex(null);
                              }}
                              onReport={() => {
                                setOpenModalIndex(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </h3>
                  </div>
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
                postData={postData.postTitle || ""}
                onClose={closeReportModal}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
});

PostComponent.displayName = "PostComponent";

export default PostComponent;
