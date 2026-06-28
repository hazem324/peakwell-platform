export interface Reaction {
  id?: number;
  type: string;
  userIdentifier: string;
  articleId: number;
}

export interface ReactionCount {
  type: string;
  count: number;
  emoji: string;
}
