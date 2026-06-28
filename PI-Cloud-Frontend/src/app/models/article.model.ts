export interface Article {
  id?: number;
  title: string;
  content: string;
  author: string;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string;
  embedUrl?: string;

  // ✅ AI FIELDS
  aiSummary?: string;
  aiTags?: string[];
}

export interface SavedArticle {
  id?: number;
  userIdentifier: string;
  articleId: number;
  savedAt?: Date;
  article?: Article;
}

export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}