import type { BibleBookSummary, BibleChapter, Perlita } from '../../types/bible';

const BOOKS_CACHE_KEY = '@capellan:bible_books';
const CHAPTER_PREFIX = '@capellan:bible_chapter:';
const PERLITA_PREFIX = '@capellan:perlita:';

// Memory cache for rapid UI updates
let memoryBooks: BibleBookSummary[] | null = null;
const memoryChapters = new Map<string, BibleChapter>();
const memoryPerlitas = new Map<string, Perlita>();

function getSafeStorage(): {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, val: string) => Promise<void>;
} | null {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      const ls = (globalThis as any).localStorage;
      return {
        getItem: async (k) => ls.getItem(k),
        setItem: async (k, v) => ls.setItem(k, v),
      };
    }
  } catch {
    // Ignore fallback
  }
  return null;
}

export async function saveCachedBooks(books: BibleBookSummary[]): Promise<void> {
  memoryBooks = books;
  try {
    const storage = getSafeStorage();
    if (storage) {
      await storage.setItem(BOOKS_CACHE_KEY, JSON.stringify(books));
    }
  } catch (e) {
    // Ignore
  }
}

export async function loadCachedBooks(): Promise<BibleBookSummary[] | null> {
  if (memoryBooks && memoryBooks.length > 0) return memoryBooks;
  try {
    const storage = getSafeStorage();
    if (storage) {
      const raw = await storage.getItem(BOOKS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryBooks = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export async function saveCachedChapter(bookCode: string, chapter: number, data: BibleChapter): Promise<void> {
  const key = `${bookCode.toUpperCase()}_${chapter}`;
  memoryChapters.set(key, data);
  try {
    const storage = getSafeStorage();
    if (storage) {
      await storage.setItem(`${CHAPTER_PREFIX}${key}`, JSON.stringify(data));
    }
  } catch (e) {
    // Ignore
  }
}

export async function loadCachedChapter(bookCode: string, chapter: number): Promise<BibleChapter | null> {
  const key = `${bookCode.toUpperCase()}_${chapter}`;
  const mem = memoryChapters.get(key);
  if (mem) return mem;
  try {
    const storage = getSafeStorage();
    if (storage) {
      const raw = await storage.getItem(`${CHAPTER_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryChapters.set(key, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export async function saveCachedPerlita(dateKey: string, perlita: Perlita): Promise<void> {
  memoryPerlitas.set(dateKey, perlita);
  try {
    const storage = getSafeStorage();
    if (storage) {
      await storage.setItem(`${PERLITA_PREFIX}${dateKey}`, JSON.stringify(perlita));
    }
  } catch (e) {
    // Ignore
  }
}

export async function loadCachedPerlita(dateKey: string): Promise<Perlita | null> {
  const mem = memoryPerlitas.get(dateKey);
  if (mem) return mem;
  try {
    const storage = getSafeStorage();
    if (storage) {
      const raw = await storage.getItem(`${PERLITA_PREFIX}${dateKey}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryPerlitas.set(dateKey, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Ignore
  }
  return null;
}
