export interface Prayer {
  id: number;
  title: string;
  description: string;
  content: string[];
  authorName?: string;
  isAnonymous: boolean;
  prayerCount: number;
  createdAt: string;
}

export interface PaginatedPrayersResponse {
  content: Prayer[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
}

export interface CreatePrayerRequest {
  title: string;
  description: string;
  content?: string[];
  authorName?: string;
  isAnonymous?: boolean;
}

export interface PrayerComment {
  id: number;
  prayerRequestId: number;
  userId: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
}
