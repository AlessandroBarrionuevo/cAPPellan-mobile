import type { AppRole } from './api';

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
}

export interface BlogPostItem {
  id: number;
  slug: string;
  title: string;
  summary: string;
  authorId: number;
  authorName: string;
  authorRole: AppRole;
  tags: BlogTag[];
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;
  createdAt: string;
}

export interface BlogDetail extends BlogPostItem {
  content: string;
  updatedAt?: string;
}

export interface BlogComment {
  id: number;
  blogId: number;
  userId: number;
  authorName: string;
  authorRole: AppRole;
  content: string;
  createdAt: string;
}

export interface CreateBlogPayload {
  title: string;
  summary?: string;
  content: string;
  tagSlugs: string[];
}

export interface UpdateBlogPayload {
  title?: string;
  summary?: string;
  content?: string;
  tagSlugs?: string[];
}

export interface PaginatedBlogResponse {
  content: BlogPostItem[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface BlogLikeResponse {
  blogId: number;
  likesCount: number;
  liked: boolean;
}

export interface BlogShareResponse {
  blogId: number;
  sharesCount: number;
  shareUrl: string;
}

export interface BlogDraft {
  id?: number;
  userId?: number;
  postId?: number | null;
  title: string;
  summary?: string;
  content: string;
  tagSlugs: string[];
  updatedAt?: string;
}

export interface SaveBlogDraftPayload {
  postId: number | null;
  title: string;
  summary?: string;
  content: string;
  tagSlugs: string[];
}
