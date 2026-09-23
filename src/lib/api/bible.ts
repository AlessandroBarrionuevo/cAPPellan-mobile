import { request } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  Perlita,
  BibleBookSummary,
  BibleBookDetail,
  BibleChapter,
  BibleVerse,
  BibleMetadata,
  BibleSearchResult,
} from '../../types/bible';
import {
  saveCachedBooks,
  loadCachedBooks,
  saveCachedChapter,
  loadCachedChapter,
  saveCachedPerlita,
  loadCachedPerlita,
} from '../storage/bibleStorage';

/**
 * Section 10.1.1: Get deterministic Perlita del Día.
 */
export async function getPerlitaDelDia(date?: string): Promise<Perlita> {
  const todayKey = date || new Date().toISOString().split('T')[0];
  try {
    const data = await request<Perlita>(ENDPOINTS.PERLITA_DEL_DIA(date));
    if (data) {
      await saveCachedPerlita(todayKey, data);
      return data;
    }
  } catch (error) {
    const cached = await loadCachedPerlita(todayKey);
    if (cached) return cached;
    throw error;
  }
  const cached = await loadCachedPerlita(todayKey);
  if (cached) return cached;
  throw new Error('No se pudo obtener la Perlita del Día.');
}

/**
 * Section 10.1.2: Get a random devotional verse.
 */
export async function getRandomPerlita(): Promise<Perlita> {
  return request<Perlita>(ENDPOINTS.PERLITA_RANDOM);
}

/**
 * Section 10.2.1: Get translation metadata and copyright.
 */
export async function getBibleMetadata(): Promise<BibleMetadata> {
  return request<BibleMetadata>(ENDPOINTS.BIBLE_METADATA);
}

/**
 * Section 10.2.2: List canonical books (66 books).
 */
export async function getBibleBooks(): Promise<BibleBookSummary[]> {
  try {
    const data = await request<BibleBookSummary[]>(ENDPOINTS.BIBLE_BOOKS);
    if (Array.isArray(data) && data.length > 0) {
      await saveCachedBooks(data);
      return data;
    }
  } catch (error) {
    const cached = await loadCachedBooks();
    if (cached && cached.length > 0) return cached;
    throw error;
  }
  const cached = await loadCachedBooks();
  if (cached && cached.length > 0) return cached;
  return [];
}

/**
 * Section 10.2.3: Get book details with chapter counts.
 */
export async function getBibleBook(bookCodeOrName: string): Promise<BibleBookDetail> {
  return request<BibleBookDetail>(ENDPOINTS.BIBLE_BOOK(bookCodeOrName));
}

/**
 * Section 10.2.4: Get verses for a specific chapter.
 */
export async function getBibleChapter(bookCode: string, chapter: number): Promise<BibleChapter> {
  try {
    const data = await request<BibleChapter>(ENDPOINTS.BIBLE_CHAPTER(bookCode, chapter));
    if (data && Array.isArray(data.verses)) {
      await saveCachedChapter(bookCode, chapter, data);
      return data;
    }
  } catch (error) {
    const cached = await loadCachedChapter(bookCode, chapter);
    if (cached) return cached;
    throw error;
  }
  const cached = await loadCachedChapter(bookCode, chapter);
  if (cached) return cached;
  throw new Error(`No se pudo cargar el capítulo ${chapter} de ${bookCode}.`);
}

/**
 * Section 10.2.5: Get a single verse or verse range.
 */
export async function getBibleVerse(bookCode: string, chapter: number, verse: string): Promise<BibleVerse> {
  return request<BibleVerse>(ENDPOINTS.BIBLE_VERSE(bookCode, chapter, verse));
}

/**
 * Section 10.2.6: Search scriptures by keyword.
 */
export async function searchBible(
  query: string,
  testament?: 'OT' | 'NT',
  limit = 50
): Promise<BibleSearchResult> {
  return request<BibleSearchResult>(ENDPOINTS.BIBLE_SEARCH(query, testament, limit));
}
