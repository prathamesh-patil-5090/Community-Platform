export interface CommentType {
  id: string;
  text: string;
  authorId: string;
  authorName?: string;
  authorImage?: string;
  createdAt: string;
}

export interface PostInfoType {
  authorName: string;
  authorPic?: string;
  authorId: string;
  postCreationDate: string;
  postType: "Article" | "Post";
  tags?: string[];
  postImage?: string;
  postTitle: string;
  postDesc: string;
  postLikes?: number;
  postComments?: string[];
  postId?: string;
  initialIsLiked?: boolean;
  commentObjects?: CommentType[];
}

export type PostsInfoType = PostInfoType[];

export interface TopPostProps {
  postTitle: string;
  postLink: string;
  numberOfComments: number;
}

export type TopPostsProps = TopPostProps[];

export interface NotificationDetailProps {
  user: string;
  userPic?: string;
  time: string;
  postTitle: string;
  tags: string[];
  notificationType: "post" | "comment";
  authorProfile: string;
  postLink: string;
  isLiked: boolean;
  isSaved: boolean;
  isSubscribed: boolean;
  comment?: string;
}

export type NotificationDetailsProps = NotificationDetailProps[];

export interface SearchDetailProp {
  type: "posts" | "people" | "channels" | "tags" | "comments" | "my posts only";
  user?: string;
  name?: string;
  authorPic?: string;
  authorName?: string;
  logo?: string;
  userPic?: string;
  time?: string;
  postId?: string;
  postTitle?: string;
  tag?: string;
  description?: string;
  website?: string;
  comment?: string;
  bio?: string;
  count?: number;
  followers?: number;
  members?: number;
  tags?: string[];
  authorProfile?: string;
  profileLink?: string;
  postLink?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  isSubscribed?: boolean;
  postCreationDate?: string;
  postType?: "Article" | "Post";
  postDesc?: string;
  postImage?: string;
  postLikes?: number;
  postComments?: string[];
}

export type SearchDetailProps = SearchDetailProp[];
