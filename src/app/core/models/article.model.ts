export interface Article {
  id: string;
  allianceId: string;
  title: string;
  content: string;       // HTML from TipTap
  coverImage?: string | null;   // Firebase Storage URL
  category?: string | null;
  authorName?: string | null;
  status: 'published' | 'draft';
  createdAt: number;
  updatedAt: number;
}

export interface ArticleFeedback {
  id: string;
  articleId: string;
  allianceId: string;
  content: string;
  createdAt: number;
}

export interface AdminFeedback {
  id: string;
  allianceId: string;
  content: string;
  createdAt: number;
}
