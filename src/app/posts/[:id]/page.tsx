"use client";
import { useRef } from "react";
import PostComponent, { PostComponentRef } from "@/app/components/posts-page/PostComponent";
import VerticalActionBar from "@/app/components/posts-page/VerticalActionBar";

export default function PostsPage() {
  const postComponentRef = useRef<PostComponentRef>(null);

  const demoPost = {
    postId: "32155w7f2152t8esjh85yt",
    authorName: "Prathamesh patil",
    authorId: "prathamesh-patil-5090",
    authorPic: "/logo/me.webp",
    postCreationDate: "2025-09-08",
    tags: ["facts", "student_life", "im_important"],
    postType: "Post",
    postTitle: "No good quality food in hostel",
    postDesc:
      "This Post discusses the ongoing issues with food quality in the hostel mess, highlighting student complaints and suggestions for improvement.",
    postImage: "/post1.webp",
    postLikes: 25000,
    postComments: [
      "Bhavesh, tum age badho ham tumhare saath hai!",
      "Fuck mess-Food!!!!!",
      "Ye bhadwa college",
    ],
  };

  const handleCommentClick = () => {
    postComponentRef.current?.openCommentsAndScroll();
  };

  return (
    <div className="bg-transparent flex items-start justify-center md:justify-evenly lg:gap-10">
      <div className="flex">
        <div className="flex-none hidden md:block">
          <VerticalActionBar
            postId={demoPost.postId}
            initialLikes={demoPost.postLikes}
            initialIsLiked={false}
            initialBookmarked={false}
            commentsCount={demoPost.postComments.length}
            onCommentClickAction={handleCommentClick}
          />
        </div>
      </div>
      <div className="flex-2 pl-[50px]">
        <PostComponent ref={postComponentRef} postData={demoPost} />
      </div>
      <div className="flex-1 hidden md:block"></div>
    </div>
  );
}
