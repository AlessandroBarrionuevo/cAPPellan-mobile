export interface Gratitude {
  id: number;
  title: string;
  description: string;
  content: string[];
  authorName?: string;
  isAnonymous: boolean;
  gratitudeCount: number;
  prayerCount: number; // alias from backend for component compatibility
  createdAt: string;
  commentCount?: number;
}

export interface PaginatedGratitudesResponse {
  content: Gratitude[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
}

export interface CreateGratitudeRequest {
  title: string;
  description: string;
  content?: string[];
  authorName?: string;
  isAnonymous?: boolean;
}

export interface GratitudeComment {
  id: number;
  gratitudeId: number;
  userId: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CreateGratitudeCommentRequest {
  content: string;
}
