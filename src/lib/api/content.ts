import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  ContentItem,
  ContentType,
  ContentRequestPayload,
  LikeResponse,
} from '../../types/api';

/**
 * Lists contents optionally filtered by content type.
 * Publicly accessible; calculates isLikedByMe if authenticated.
 */
export async function fetchContents(type?: ContentType | 'ALL'): Promise<ContentItem[]> {
  const query = type && type !== 'ALL' ? `?type=${encodeURIComponent(type)}` : '';
  const url = `${ENDPOINTS.CONTENTS}${query}`;
  return request<ContentItem[]>(url);
}

/**
 * Retrieves full details for a single content item.
 * Publicly accessible.
 */
export async function fetchContentDetail(id: number): Promise<ContentItem> {
  return request<ContentItem>(ENDPOINTS.CONTENT_DETAIL(id));
}

/**
 * Atomically toggles like on a content item.
 * Requires user authentication.
 */
export async function toggleContentLike(id: number): Promise<LikeResponse> {
  return request<LikeResponse>(ENDPOINTS.CONTENT_LIKE(id), {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Creates a new content item.
 * Restricted to CHAPLAIN_CONTENT_LEADER or SUPERUSER.
 */
export async function createContent(payload: ContentRequestPayload): Promise<ContentItem> {
  return request<ContentItem>(ENDPOINTS.CONTENTS, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing content item.
 * Restricted to CHAPLAIN_CONTENT_LEADER or SUPERUSER.
 */
export async function updateContent(
  id: number,
  payload: ContentRequestPayload
): Promise<ContentItem> {
  return request<ContentItem>(ENDPOINTS.CONTENT_DETAIL(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a content item and its likes in cascade.
 * Restricted to CHAPLAIN_CONTENT_LEADER or SUPERUSER.
 */
export async function deleteContent(id: number): Promise<void> {
  return request<void>(ENDPOINTS.CONTENT_DETAIL(id), {
    method: 'DELETE',
  });
}
