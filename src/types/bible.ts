export interface Perlita {
  date: string;
  translation: string;
  reference: string;
  text: string;
  book?: string;
  bookCode?: string;
  chapter?: number;
  verse?: string;
  attribution?: string;
}

export interface BibleBookSummary {
  code: string;
  name: string;
  shortName: string;
  longName: string;
  abbr: string;
  testament: 'OT' | 'NT';
  order: number;
  totalChapters: number;
  totalVerses: number;
}

export interface BibleVerse {
  verse: string;
  text: string;
  reference: string;
  bookCode: string;
  bookName: string;
  chapter?: number;
}

export interface BibleChapter {
  chapter: number;
  totalVerses: number;
  verses: BibleVerse[];
}

export interface BibleBookDetail extends BibleBookSummary {
  chapters: BibleChapter[];
}

export interface BibleMetadata {
  translation: string;
  name: string;
  nameEnglish: string;
  language: string;
  version: string;
  attribution: string;
  sourceUrl: string;
  totalBooks: number;
  totalVerses: number;
}

export interface BibleSearchResult {
  query: string;
  testament?: string;
  totalMatches: number;
  results: BibleVerse[];
}
