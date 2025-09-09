import Post from "./ui/Post";
import { PostsInfoType } from "../../../lib/types";

const PostInfo: PostsInfoType = [
  {
    postId: "32155w7f2152t8esjh85yt",
    authorName: "Prathamesh patil",
    authorPic: "/logo/me.webp",
    postCreationDate: "2025-09-08",
    tags: ["facts", "student_life", "im_important"],
    postType: "Article",
    postTitle: "No good quality food in hostel",
    postDesc:
      "This article discusses the ongoing issues with food quality in the hostel mess, highlighting student complaints and suggestions for improvement.",
    postImage: "/post1.webp",
    postLikes: 25000,
    postComments: [
      "Prathamesh, tum age badho ham tumhare saath hai!",
      "Fuck mess-Food!!!!!",
      "Ye bhadwa college",
    ],
  },
  {
    postId: "45678g9h3210k1lmn23op",
    authorName: "Anjali Sharma",
    authorPic: "/post2.webp",
    postCreationDate: "2025-09-07",
    tags: ["campus_events", "student_life", "fun"],
    postType: "Post",
    postTitle: "Exciting Fest Coming Up!",
    postDesc:
      "Get ready for an amazing campus fest with music, dance, and fun activities. Don't miss out on the performances and events!",
    postImage: "/post2.webp",
    postLikes: 15000,
    postComments: [
      "Can't wait for the performances!",
      "Who's performing?",
      "This is going to be epic!",
    ],
  },
  {
    postId: "78901q2w3456e7r8t9y0u",
    authorName: "Ravi Kumar",
    authorPic: "/post3.webp",
    postCreationDate: "2025-09-06",
    tags: ["study_tips", "exams", "student_life"],
    postType: "Article",
    postTitle: "How to Ace Your Exams",
    postDesc:
      "A comprehensive guide to effective study techniques, time management, and tips to perform well in exams.",
    postImage: "/post3.webp",
    postLikes: 32000,
    postComments: [
      "Great tips, thanks!",
      "I needed this.",
      "More articles like this please.",
    ],
  },
  {
    postId: "12345a6s7d8f9g0h1j2k3",
    authorName: "Sneha Patel",
    authorPic: "/post4.webp",
    postCreationDate: "2025-09-05",
    tags: ["hostel_life", "complaints", "we_need_better_food"],
    postType: "Post",
    postTitle: "Hostel WiFi is Terrible",
    postDesc:
      "Frustrated with slow and unreliable WiFi in the hostel? Share your experiences and let's push for better connectivity.",
    postImage: "/post4.webp",
    postLikes: 18000,
    postComments: [
      "Totally agree!",
      "When will they fix it?",
      "Can't study properly.",
    ],
  },
  {
    postId: "98765z1x2c3v4b5n6m7l8",
    authorName: "Karan Singh",
    authorPic: "/post5.webp",
    postCreationDate: "2025-09-04",
    tags: ["sports", "student_life", "fitness"],
    postType: "Article",
    postTitle: "Benefits of Campus Sports",
    postDesc:
      "Explore how participating in sports on campus improves physical health, mental well-being, and social skills.",
    postImage: "/post5.webp",
    postLikes: 22000,
    postComments: [
      "Love playing football!",
      "Keeps me fit.",
      "More facilities needed.",
    ],
  },
  {
    postId: "abcd1234efgh5678ijkl",
    authorName: "Maya Gupta",
    authorPic: "/post6.webp",
    postCreationDate: "2025-09-03",
    tags: ["library", "study_hacks", "student_life"],
    postType: "Post",
    postTitle: "Best Study Spots on Campus",
    postDesc:
      "Discover the quietest and most productive places to study around campus, from the library to hidden corners.",
    postImage: "/post6.webp",
    postLikes: 12000,
    postComments: ["The library is my go-to!", "Thanks for the tips."],
  },
  {
    postId: "mnop9012qrst3456uvwx",
    authorName: "Vikram Rao",
    authorPic: "/post7.webp",
    postCreationDate: "2025-09-02",
    tags: ["mental_health", "wellness", "student_life"],
    postType: "Article",
    postTitle: "Managing Stress During Exams",
    postDesc:
      "Tips and strategies for staying calm and focused during exam season, including mindfulness and self-care.",
    postImage: "/post7.jpg",
    postLikes: 28000,
    postComments: ["This is so helpful!", "I need to try these."],
  },
];

export default function DisplayPosts() {
  console.log("DisplayPosts rendering, PostInfo:", PostInfo);

  if (!PostInfo || PostInfo.length === 0) {
    return <div>No posts available</div>;
  }

  return (
    <div>
      {PostInfo.map((post) => {
        console.log("Mapping post:", post);
        if (!post || !post.postId) {
          console.error("Invalid post data:", post);
          return null;
        }
        return <Post key={post.postId} postData={post} />;
      })}
    </div>
  );
}
