export interface PostInfoType {
  authorName: string;
  authorPic?: string;
  postCreationDate: string;
  postType: "Article" | "Post";
  tags?: string[];
  postImage?: string;
  postTitle: string;
  postDesc: string;
  postLikes?: number;
  postComments?: string[];
  postId?: string;
}

export type PostsInfoType = PostInfoType[];

export interface TopPostProps {
  postTitle: string;
  postLink: string;
  numberOfComments: number;
}

export type TopPostsProps = TopPostProps[];
