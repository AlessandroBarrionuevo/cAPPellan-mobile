import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  BlogPostItem,
  BlogDetail,
  BlogComment,
  BlogTag,
  CreateBlogPayload,
  UpdateBlogPayload,
  PaginatedBlogResponse,
  BlogLikeResponse,
  BlogShareResponse,
  BlogDraft,
  SaveBlogDraftPayload,
} from '../../types/blog';

export interface FetchBlogsParams {
  tag?: string;
  page?: number;
  size?: number;
}

/**
 * Lists paginated blogs feed.
 * Publicly accessible; calculates isLikedByMe if user is authenticated.
 */
export async function fetchBlogs(params: FetchBlogsParams = {}): Promise<PaginatedBlogResponse> {
  const { tag, page = 0, size = 10 } = params;
  const searchParams = new URLSearchParams();
  searchParams.append('page', String(page));
  searchParams.append('size', String(size));
  if (tag && tag !== 'ALL') {
    searchParams.append('tag', tag);
  }

  const url = `${ENDPOINTS.BLOGS}?${searchParams.toString()}`;
  return request<PaginatedBlogResponse>(url);
}

/**
 * Retrieves full details for a single blog by ID or Slug.
 * Publicly accessible.
 */
export async function fetchBlogDetail(idOrSlug: string | number): Promise<BlogDetail> {
  return request<BlogDetail>(ENDPOINTS.BLOG_DETAIL(idOrSlug));
}

/**
 * Creates a new blog post.
 * Open to any authenticated user (including BASIC role).
 * Authorship is strictly non-anonymous.
 */
export async function createBlog(payload: CreateBlogPayload): Promise<BlogDetail> {
  return request<BlogDetail>(ENDPOINTS.BLOGS, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing blog post.
 * Restricted to the original author or SUPERUSER.
 */
export async function updateBlog(id: number, payload: UpdateBlogPayload): Promise<BlogDetail> {
  return request<BlogDetail>(ENDPOINTS.BLOG_DETAIL(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a blog post.
 * Allowed for original author or pastoral moderators (CHAPLAIN, CHAPLAIN_LEADER, CHAPLAIN_CONTENT_LEADER, SUPERUSER).
 */
export async function deleteBlog(id: number): Promise<void> {
  return request<void>(ENDPOINTS.BLOG_DETAIL(id), {
    method: 'DELETE',
  });
}

/**
 * Atomically toggles like status for a blog post.
 * Requires authentication.
 */
export async function toggleBlogLike(id: number): Promise<BlogLikeResponse> {
  return request<BlogLikeResponse>(ENDPOINTS.BLOG_LIKE(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Increments share count on backend and returns official share URL.
 */
export async function shareBlog(id: number): Promise<BlogShareResponse> {
  return request<BlogShareResponse>(ENDPOINTS.BLOG_SHARE(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Lists comments for a blog post.
 * Publicly accessible.
 */
export async function fetchBlogComments(blogId: number): Promise<BlogComment[]> {
  return request<BlogComment[]>(ENDPOINTS.BLOG_COMMENTS(blogId));
}

/**
 * Submits a new comment for a blog post.
 * Requires authentication. Authorship is strictly non-anonymous.
 */
export async function createBlogComment(blogId: number, content: string): Promise<BlogComment> {
  return request<BlogComment>(ENDPOINTS.BLOG_COMMENTS(blogId), {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/**
 * Deletes a comment.
 * Allowed for comment author or pastoral moderators.
 */
export async function deleteBlogComment(commentId: number): Promise<void> {
  return request<void>(ENDPOINTS.BLOG_COMMENT_DELETE(commentId), {
    method: 'DELETE',
  });
}

/**
 * Lists all available tags for blogs.
 * Initial seeds: anecdota, descargo, espiritual, reflexion, historia de combate, predica, testimonio.
 */
export async function fetchBlogTags(): Promise<BlogTag[]> {
  return request<BlogTag[]>(ENDPOINTS.BLOG_TAGS);
}

/**
 * Creates a new blog tag.
 * Restricted to CHAPLAIN_CONTENT_LEADER or SUPERUSER.
 */
export async function createBlogTag(name: string): Promise<BlogTag> {
  return request<BlogTag>(ENDPOINTS.BLOG_TAGS, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Retrieves the active draft buffer for the authenticated user.
 * Returns null if status 204 No Content.
 */
export async function fetchBlogDraft(): Promise<BlogDraft | null> {
  const result = await request<BlogDraft | undefined>(ENDPOINTS.BLOG_DRAFT);
  return result || null;
}

/**
 * Saves / auto-saves draft buffer to backend via Upsert (PUT /blogs/draft).
 * Allows incomplete or partial fields while user is drafting.
 */
export async function saveBlogDraft(payload: SaveBlogDraftPayload): Promise<BlogDraft> {
  return request<BlogDraft>(ENDPOINTS.BLOG_DRAFT, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Discards and cleans the active draft buffer on the backend (DELETE /blogs/draft).
 */
export async function discardBlogDraft(): Promise<void> {
  return request<void>(ENDPOINTS.BLOG_DRAFT, {
    method: 'DELETE',
  });
}

/**
 * Converts the active draft buffer into an official published blog post (POST /blogs/draft/publish)
 * and cleans the buffer in database.
 */
export async function publishBlogDraft(): Promise<BlogDetail> {
  return request<BlogDetail>(ENDPOINTS.BLOG_DRAFT_PUBLISH, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

