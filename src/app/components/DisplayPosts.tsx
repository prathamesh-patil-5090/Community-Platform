"use client";
interface PostInfoType {
  authorName: string;
  authorPic?: string;
  postCreationDate: string;
  postType: "Article" | "Post";
  tags?: string[];
  postImage?: File;
  postTitle: string;
  postLikes?: number;
  postComments?: string[];
  postId?: string;
}
type PostsInfoType = PostInfoType[];
const PostInfo: PostsInfoType = [
  {
    postId: "32155w7f2152t8esjh85yt",
    authorName: "Prathamesh patil",
    authorPic:
      "https://aid4pratham.netlify.app/_next/image?url=%2Fprofile.jpg&w=640&q=75",
    postCreationDate: "8th sept 2025",
    tags: ["#facts", "#student_life", "#im_important"],
    postType: "Article",
    postTitle: "No good quality food in hostel",
    postLikes: 25000,
    postComments: [
      "Prathamesh, tum age badho ham tumhare saath hai!",
      "Fuck mess-Food!!!!!",
      "Ye bhadwa college",
    ],
  },
];

function DisplayPosts() {
  return <div></div>;
}

export default DisplayPosts;
