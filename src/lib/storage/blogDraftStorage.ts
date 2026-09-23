import type { BlogDraft } from '../../types/blog';

const DRAFT_KEY_PREFIX = '@capellan:blog_draft:';

// Fast in-memory cache for instantaneous recovery across tab switches
const memoryDraftCache = new Map<number, BlogDraft>();

// Safe helper to get web or platform storage if available without crashing runtime
function getSafeStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, val: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      const ls = (globalThis as any).localStorage;
      return {
        getItem: async (k) => ls.getItem(k),
        setItem: async (k, v) => ls.setItem(k, v),
        removeItem: async (k) => ls.removeItem(k),
      };
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function saveLocalBlogDraft(userId: number, draft: BlogDraft): Promise<void> {
  try {
    memoryDraftCache.set(userId, draft);
    const storage = getSafeStorage();
    if (storage) {
      await storage.setItem(`${DRAFT_KEY_PREFIX}${userId}`, JSON.stringify(draft));
    }
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to save draft locally:', error);
  }
}

export async function loadLocalBlogDraft(userId: number): Promise<BlogDraft | null> {
  try {
    const cached = memoryDraftCache.get(userId);
    if (cached) return cached;

    const storage = getSafeStorage();
    if (storage) {
      const raw = await storage.getItem(`${DRAFT_KEY_PREFIX}${userId}`);
      if (raw) {
        const parsed: BlogDraft = JSON.parse(raw);
        memoryDraftCache.set(userId, parsed);
        return parsed;
      }
    }
    return null;
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to load local draft:', error);
    return memoryDraftCache.get(userId) || null;
  }
}

export async function clearLocalBlogDraft(userId: number): Promise<void> {
  try {
    memoryDraftCache.delete(userId);
    const storage = getSafeStorage();
    if (storage) {
      await storage.removeItem(`${DRAFT_KEY_PREFIX}${userId}`);
    }
  } catch (error) {
    console.warn('[BlogDraftStorage] Failed to clear local draft:', error);
  }
}
