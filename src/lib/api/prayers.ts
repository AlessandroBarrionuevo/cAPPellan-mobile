import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type { PrayerComment, CreateCommentRequest } from '../../types/prayer';

/**
 * Section 5.5: List Comments for a Prayer Request (Public).
 */
export async function getPrayerComments(prayerId: number): Promise<PrayerComment[]> {
  try {
    const data = await request<PrayerComment[]>(ENDPOINTS.PRAYER_COMMENTS(prayerId));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`[PrayerApi] Failed to fetch comments for prayer #${prayerId}:`, error);
    return [];
  }
}

/**
 * Section 5.4: Post Comment on Prayer Request (Registered Users Only).
 */
export async function addPrayerComment(
  prayerId: number,
  content: string
): Promise<PrayerComment> {
  const payload: CreateCommentRequest = { content };
  return request<PrayerComment>(ENDPOINTS.PRAYER_COMMENTS(prayerId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
