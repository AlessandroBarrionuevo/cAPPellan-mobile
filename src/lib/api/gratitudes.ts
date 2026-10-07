import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  Gratitude,
  PaginatedGratitudesResponse,
  CreateGratitudeRequest,
  GratitudeComment,
  CreateGratitudeCommentRequest,
} from '../../types/gratitude';

/**
 * 1.2 GET /gratitudes
 * Retrieve paginated gratitude posts sorted in descending chronological order.
 */
export async function getGratitudes(
  page: number = 0,
  size: number = 20
): Promise<PaginatedGratitudesResponse> {
  return request<PaginatedGratitudesResponse>(
    `${ENDPOINTS.GRATITUDES}?page=${page}&size=${size}`
  );
}

/**
 * 1.1 POST /gratitudes
 * Submit a gratitude post or testimony. Open to anonymous users.
 */
export async function createGratitude(
  payload: CreateGratitudeRequest
): Promise<Gratitude> {
  return request<Gratitude>(ENDPOINTS.GRATITUDES, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 1.3 POST /gratitudes/{id}/thank (alias POST /gratitudes/{id}/react)
 * Increment reaction / praise count ("Amén" / "Doy gracias" / "Me alegro").
 */
export async function thankGratitude(id: number): Promise<Gratitude> {
  return request<Gratitude>(ENDPOINTS.GRATITUDE_THANK(id), {
    method: 'POST',
  });
}

/**
 * 1.5 GET /gratitudes/{id}/comments
 * Retrieve all comments for a gratitude post in ascending chronological order.
 */
export async function getGratitudeComments(
  gratitudeId: number
): Promise<GratitudeComment[]> {
  try {
    const data = await request<GratitudeComment[]>(
      ENDPOINTS.GRATITUDE_COMMENTS(gratitudeId)
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      `[GratitudeApi] Failed to fetch comments for gratitude #${gratitudeId}:`,
      error
    );
    return [];
  }
}

/**
 * 1.4 POST /gratitudes/{id}/comments
 * Post an encouraging/celebratory comment on a gratitude entry (requires auth).
 */
export async function addGratitudeComment(
  gratitudeId: number,
  content: string
): Promise<GratitudeComment> {
  const payload: CreateGratitudeCommentRequest = { content };
  return request<GratitudeComment>(ENDPOINTS.GRATITUDE_COMMENTS(gratitudeId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
