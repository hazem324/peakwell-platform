export interface Comment {
  id: number;
  content: string;
  author: string;
  ownerId?: string; // userId of the comment creator
  createdAt?: Date;
  articleId: number;
  parentCommentId?: number;
  replies?: Comment[];
  upvotes?: number;
  downvotes?: number;
  userVote?: string | null;
  moderationStatus?: string;
}