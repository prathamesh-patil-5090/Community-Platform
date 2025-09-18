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
