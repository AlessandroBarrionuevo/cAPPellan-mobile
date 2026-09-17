import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BlogDraft } from '../../types/blog';

const DRAFT_KEY_PREFIX = '@capellan:blog_draft:';

// Fast in-memory cache for instantaneous recovery across tab switches
const memoryDraftCache = new Map<number, BlogDraft>();

export async function saveLocalBlogDraft(userId: number, draft: BlogDraft): Promise<void> {
  try {
    memoryDraftCache.set(userId, draft);
    const serialized = JSON.stringify(draft);
    await AsyncStorage.setItem(`${DRAFT_KEY_PREFIX}${userId}`, serialized);
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to save draft to AsyncStorage:', error);
  }
}

export async function loadLocalBlogDraft(userId: number): Promise<BlogDraft | null> {
  try {
    // Check in-memory cache first
    const cached = memoryDraftCache.get(userId);
    if (cached) {
      return cached;
    }

    const raw = await AsyncStorage.getItem(`${DRAFT_KEY_PREFIX}${userId}`);
    if (!raw) return null;

    const parsed: BlogDraft = JSON.parse(raw);
    memoryDraftCache.set(userId, parsed);
    return parsed;
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to load draft:', error);
    return memoryDraftCache.get(userId) || null;
  }
}

export async function clearLocalBlogDraft(userId: number): Promise<void> {
  try {
    memoryDraftCache.delete(userId);
    await AsyncStorage.removeItem(`${DRAFT_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to clear draft:', error);
  }
}
