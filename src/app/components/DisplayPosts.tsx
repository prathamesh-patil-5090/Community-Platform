import { PostInfo } from "../../lib/data";
import Post from "./ui/Post";

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
