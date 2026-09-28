import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  Sliders,
} from 'lucide-react-native';
import { Theme } from '../theme/Theme';
import { useAppInsets } from '../lib/safeArea';
import {
  getBibleBooks,
  getBibleChapter,
} from '../lib/api/bible';
import { loadCachedChapter } from '../lib/storage/bibleStorage';
import { BIBLE_DATA } from '../data/bibleData';
import type {
  BibleBookSummary,
  BibleChapter,
} from '../types/bible';

interface BibleReaderPreviewProps {
  onBack?: () => void;
}

// Canonical 66 Books of the Christian Bible with accurate chapter counts (Total = 1,189 chapters)
interface CanonicalBook {
  code: string;
  name: string;
  testament: 'OT' | 'NT';
  order: number;
  totalChapters: number;
}

const CANONICAL_BOOKS: CanonicalBook[] = [
  // Antiguo Testamento (39 libros - 929 capítulos)
  { code: 'GEN', name: 'Génesis', testament: 'OT', order: 1, totalChapters: 50 },
  { code: 'EXO', name: 'Éxodo', testament: 'OT', order: 2, totalChapters: 40 },
  { code: 'LEV', name: 'Levítico', testament: 'OT', order: 3, totalChapters: 27 },
  { code: 'NUM', name: 'Números', testament: 'OT', order: 4, totalChapters: 36 },
  { code: 'DEU', name: 'Deuteronomio', testament: 'OT', order: 5, totalChapters: 34 },
  { code: 'JOS', name: 'Josué', testament: 'OT', order: 6, totalChapters: 24 },
  { code: 'JDG', name: 'Jueces', testament: 'OT', order: 7, totalChapters: 21 },
  { code: 'RUT', name: 'Rut', testament: 'OT', order: 8, totalChapters: 4 },
  { code: '1SA', name: '1 Samuel', testament: 'OT', order: 9, totalChapters: 31 },
  { code: '2SA', name: '2 Samuel', testament: 'OT', order: 10, totalChapters: 24 },
  { code: '1KI', name: '1 Reyes', testament: 'OT', order: 11, totalChapters: 22 },
  { code: '2KI', name: '2 Reyes', testament: 'OT', order: 12, totalChapters: 25 },
  { code: '1CH', name: '1 Crónicas', testament: 'OT', order: 13, totalChapters: 29 },
  { code: '2CH', name: '2 Crónicas', testament: 'OT', order: 14, totalChapters: 36 },
  { code: 'EZR', name: 'Esdras', testament: 'OT', order: 15, totalChapters: 10 },
  { code: 'NEH', name: 'Nehemías', testament: 'OT', order: 16, totalChapters: 13 },
  { code: 'EST', name: 'Ester', testament: 'OT', order: 17, totalChapters: 10 },
  { code: 'JOB', name: 'Job', testament: 'OT', order: 18, totalChapters: 42 },
  { code: 'PSA', name: 'Salmos', testament: 'OT', order: 19, totalChapters: 150 },
  { code: 'PRO', name: 'Proverbios', testament: 'OT', order: 20, totalChapters: 31 },
  { code: 'ECC', name: 'Eclesiastés', testament: 'OT', order: 21, totalChapters: 12 },
  { code: 'SNG', name: 'Cantares', testament: 'OT', order: 22, totalChapters: 8 },
  { code: 'ISA', name: 'Isaías', testament: 'OT', order: 23, totalChapters: 66 },
  { code: 'JER', name: 'Jeremías', testament: 'OT', order: 24, totalChapters: 52 },
  { code: 'LAM', name: 'Lamentaciones', testament: 'OT', order: 25, totalChapters: 5 },
  { code: 'EZK', name: 'Ezequiel', testament: 'OT', order: 26, totalChapters: 48 },
  { code: 'DAN', name: 'Daniel', testament: 'OT', order: 27, totalChapters: 12 },
  { code: 'HOS', name: 'Oseas', testament: 'OT', order: 28, totalChapters: 14 },
  { code: 'JOL', name: 'Joel', testament: 'OT', order: 29, totalChapters: 3 },
  { code: 'AMO', name: 'Amós', testament: 'OT', order: 30, totalChapters: 9 },
  { code: 'OBA', name: 'Abdías', testament: 'OT', order: 31, totalChapters: 1 },
  { code: 'JON', name: 'Jonás', testament: 'OT', order: 32, totalChapters: 4 },
  { code: 'MIC', name: 'Miqueas', testament: 'OT', order: 33, totalChapters: 7 },
  { code: 'NAM', name: 'Nahúm', testament: 'OT', order: 34, totalChapters: 3 },
  { code: 'HAB', name: 'Habacuc', testament: 'OT', order: 35, totalChapters: 3 },
  { code: 'ZEP', name: 'Sofonías', testament: 'OT', order: 36, totalChapters: 3 },
  { code: 'HAG', name: 'Hageo', testament: 'OT', order: 37, totalChapters: 2 },
  { code: 'ZEC', name: 'Zacarías', testament: 'OT', order: 38, totalChapters: 14 },
  { code: 'MAL', name: 'Malaquías', testament: 'OT', order: 39, totalChapters: 4 },

  // Nuevo Testamento (27 libros - 260 capítulos)
  { code: 'MAT', name: 'Mateo', testament: 'NT', order: 40, totalChapters: 28 },
  { code: 'MRK', name: 'Marcos', testament: 'NT', order: 41, totalChapters: 16 },
  { code: 'LUK', name: 'Lucas', testament: 'NT', order: 42, totalChapters: 24 },
  { code: 'JHN', name: 'Juan', testament: 'NT', order: 43, totalChapters: 21 },
  { code: 'ACT', name: 'Hechos', testament: 'NT', order: 44, totalChapters: 28 },
  { code: 'ROM', name: 'Romanos', testament: 'NT', order: 45, totalChapters: 16 },
  { code: '1CO', name: '1 Corintios', testament: 'NT', order: 46, totalChapters: 16 },
  { code: '2CO', name: '2 Corintios', testament: 'NT', order: 47, totalChapters: 13 },
  { code: 'GAL', name: 'Gálatas', testament: 'NT', order: 48, totalChapters: 6 },
  { code: 'EPH', name: 'Efesios', testament: 'NT', order: 49, totalChapters: 6 },
  { code: 'PHP', name: 'Filipenses', testament: 'NT', order: 50, totalChapters: 4 },
  { code: 'COL', name: 'Colosenses', testament: 'NT', order: 51, totalChapters: 4 },
  { code: '1TH', name: '1 Tesalonicenses', testament: 'NT', order: 52, totalChapters: 5 },
  { code: '2TH', name: '2 Tesalonicenses', testament: 'NT', order: 53, totalChapters: 3 },
  { code: '1TI', name: '1 Timoteo', testament: 'NT', order: 54, totalChapters: 6 },
  { code: '2TI', name: '2 Timoteo', testament: 'NT', order: 55, totalChapters: 4 },
  { code: 'TIT', name: 'Tito', testament: 'NT', order: 56, totalChapters: 3 },
  { code: 'PHM', name: 'Filemón', testament: 'NT', order: 57, totalChapters: 1 },
  { code: 'HEB', name: 'Hebreos', testament: 'NT', order: 58, totalChapters: 13 },
  { code: 'JAS', name: 'Santiago', testament: 'NT', order: 59, totalChapters: 5 },
  { code: '1PE', name: '1 Pedro', testament: 'NT', order: 60, totalChapters: 5 },
  { code: '2PE', name: '2 Pedro', testament: 'NT', order: 61, totalChapters: 3 },
  { code: '1JN', name: '1 Juan', testament: 'NT', order: 62, totalChapters: 5 },
  { code: '2JN', name: '2 Juan', testament: 'NT', order: 63, totalChapters: 1 },
  { code: '3JN', name: '3 Juan', testament: 'NT', order: 64, totalChapters: 1 },
  { code: 'JUD', name: 'Judas', testament: 'NT', order: 65, totalChapters: 1 },
  { code: 'REV', name: 'Apocalipsis', testament: 'NT', order: 66, totalChapters: 22 },
];

const TOTAL_BIBLE_CHAPTERS = 1189;

// Curated Scenic Backgrounds for Banner
const BANNER_PRESETS = [
  {
    id: 'sunrise',
    title: 'Amanecer en el Monte',
    uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'jerusalem',
    title: 'Piedras de Jerusalén',
    uri: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'galilee',
    title: 'Aguas de Galilea',
    uri: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'stars',
    title: 'Cielo Estrellado',
    uri: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'olives',
    title: 'Huerto de los Olivos',
    uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tactical',
    title: 'Azul Institucional Táctico',
    uri: '', // solid color gradient fallback
  },
];

export default function BibleReaderPreview({ onBack }: BibleReaderPreviewProps) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  // Books & Navigation State
  const [books, setBooks] = useState<BibleBookSummary[]>([]);
  const [selectedBookCode, setSelectedBookCode] = useState<string>('PSA'); // Salmos
  const [selectedBookName, setSelectedBookName] = useState<string>('Salmos');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(23); // Salmo 23
  const [totalChaptersInBook, setTotalChaptersInBook] = useState<number>(150);

  // Chapter Verses Data
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  // Verse Interaction & Bookmarks
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<string | null>('1');
  const [savedVerses, setSavedVerses] = useState<Set<string>>(new Set(['PSA-23-1']));

  // Banner State (Hero banner with customizable image)
  const [bannerImageUri, setBannerImageUri] = useState<string>(BANNER_PRESETS[0].uri);
  const [showBannerPickerModal, setShowBannerPickerModal] = useState<boolean>(false);

  // Full Scripture Selector Modal: Book, Chapter & Verse
  const [showFullSelectorModal, setShowFullSelectorModal] = useState<boolean>(false);
  const [selectorTab, setSelectorTab] = useState<'BOOK' | 'CHAPTER' | 'VERSE'>('BOOK');
  const [tempBookCode, setTempBookCode] = useState<string>('PSA');
  const [tempBookName, setTempBookName] = useState<string>('Salmos');
  const [tempTotalChapters, setTempTotalChapters] = useState<number>(150);
  const [tempChapterNumber, setTempChapterNumber] = useState<number>(23);
  const [tempTotalVerses, setTempTotalVerses] = useState<number>(6);

  // Search & Filters in Selector Modal
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  // Bookmarks Modal
  const [showBookmarksModal, setShowBookmarksModal] = useState(false);

  // Font Size Controller (Floating Collapsible Slider)
  const [fontSize, setFontSize] = useState<number>(16); // 13 to 24
  const [isFontSliderOpen, setIsFontSliderOpen] = useState<boolean>(false);

  // 1. Initial Load of Books
  useEffect(() => {
    let isMounted = true;
    getBibleBooks()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          const current = data.find((b) => b.code.toUpperCase() === selectedBookCode.toUpperCase());
          if (current) {
            setTotalChaptersInBook(current.totalChapters || 150);
            setSelectedBookName(current.name);
          }
        } else {
          fallbackToCanonicalBooks();
        }
      })
      .catch(() => {
        if (isMounted) {
          fallbackToCanonicalBooks();
        }
      });

    function fallbackToCanonicalBooks() {
      const canonicalSummaries: BibleBookSummary[] = CANONICAL_BOOKS.map((b) => ({
        code: b.code,
        name: b.name,
        shortName: b.name.slice(0, 4),
        longName: b.name,
        abbr: b.code,
        testament: b.testament,
        order: b.order,
        totalChapters: b.totalChapters,
        totalVerses: b.totalChapters * 25,
      }));
      setBooks(canonicalSummaries);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Chapter Verses (async API + AsyncStorage cache)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingChapter(true);
    setChapterError(null);

    getBibleChapter(selectedBookCode, selectedChapterNumber)
      .then((data) => {
        if (!isMounted) return;
        setChapterData(data);
        setIsLoadingChapter(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      })
      .catch(() => {
        if (!isMounted) return;
        // Fallback to local sample BIBLE_DATA if matches
        const localBook = BIBLE_DATA.find(
          (b) =>
            b.id.toLowerCase() === selectedBookName.toLowerCase() ||
            b.name.toLowerCase() === selectedBookName.toLowerCase()
        );
        const localChap = localBook?.chapters.find((c) => c.chapter === selectedChapterNumber);
        if (localChap) {
          const fallbackChapter: BibleChapter = {
            chapter: selectedChapterNumber,
            totalVerses: localChap.verses.length,
            verses: localChap.verses.map((v) => ({
              verse: String(v.num),
              text: v.text,
              reference: `${selectedBookName} ${selectedChapterNumber}:${v.num}`,
              bookCode: selectedBookCode,
              bookName: selectedBookName,
              chapter: selectedChapterNumber,
            })),
          };
          setChapterData(fallbackChapter);
        } else {
          setChapterError('Capítulo no disponible en modo offline.');
        }
        setIsLoadingChapter(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBookCode, selectedChapterNumber, selectedBookName]);

  // 3. Compute Position within the Entire Canonical Bible (1 to 1,189)
  const currentBookIndex = useMemo(() => {
    const idx = CANONICAL_BOOKS.findIndex(
      (b) => b.code.toUpperCase() === selectedBookCode.toUpperCase()
    );
    return idx >= 0 ? idx : 18; // default PSA (index 18)
  }, [selectedBookCode]);

  const currentGlobalChapter = useMemo(() => {
    const chaptersBefore = CANONICAL_BOOKS.slice(0, currentBookIndex).reduce(
      (acc, b) => acc + b.totalChapters,
      0
    );
    return chaptersBefore + selectedChapterNumber;
  }, [currentBookIndex, selectedChapterNumber]);

  const globalBibleProgressPercent = useMemo(() => {
    return Math.min(Math.max((currentGlobalChapter / TOTAL_BIBLE_CHAPTERS) * 100, 0.1), 100);
  }, [currentGlobalChapter]);

  // Chapter Navigation across the whole Bible
  const handleGlobalPrevChapter = () => {
    if (selectedChapterNumber > 1) {
      setSelectedChapterNumber((prev) => prev - 1);
      setSelectedVerseNumber('1');
    } else if (currentBookIndex > 0) {
      const prevBook = CANONICAL_BOOKS[currentBookIndex - 1];
      setSelectedBookCode(prevBook.code);
      setSelectedBookName(prevBook.name);
      setTotalChaptersInBook(prevBook.totalChapters);
      setSelectedChapterNumber(prevBook.totalChapters);
      setSelectedVerseNumber('1');
    }
  };

  const handleGlobalNextChapter = () => {
    if (selectedChapterNumber < totalChaptersInBook) {
      setSelectedChapterNumber((prev) => prev + 1);
      setSelectedVerseNumber('1');
    } else if (currentBookIndex < CANONICAL_BOOKS.length - 1) {
      const nextBook = CANONICAL_BOOKS[currentBookIndex + 1];
      setSelectedBookCode(nextBook.code);
      setSelectedBookName(nextBook.name);
      setTotalChaptersInBook(nextBook.totalChapters);
      setSelectedChapterNumber(1);
      setSelectedVerseNumber('1');
    }
  };

  // Open Full Selector Modal
  const handleOpenSelector = (initialTab: 'BOOK' | 'CHAPTER' | 'VERSE') => {
    setTempBookCode(selectedBookCode);
    setTempBookName(selectedBookName);
    setTempTotalChapters(totalChaptersInBook);
    setTempChapterNumber(selectedChapterNumber);
    setTempTotalVerses(chapterData?.verses?.length || 20);
    setSelectorTab(initialTab);
    setShowFullSelectorModal(true);
  };

  // When user selects a book in the modal
  const handleSelectBookInModal = (book: CanonicalBook | BibleBookSummary) => {
    setTempBookCode(book.code);
    setTempBookName(book.name);
    setTempTotalChapters(book.totalChapters || 1);
    setTempChapterNumber(1);
    setSelectorTab('CHAPTER');
  };

  // When user selects a chapter in the modal
  const handleSelectChapterInModal = async (chapNum: number) => {
    setTempChapterNumber(chapNum);
    // Preload chapter verses count from cache
    try {
      const cached = await loadCachedChapter(tempBookCode, chapNum);
      if (cached && Array.isArray(cached.verses)) {
        setTempTotalVerses(cached.verses.length);
      } else {
        setTempTotalVerses(25);
      }
    } catch {
      setTempTotalVerses(25);
    }
    setSelectorTab('VERSE');
  };

  // When user selects a verse in the modal
  const handleSelectVerseInModal = (verseNum: number) => {
    setSelectedBookCode(tempBookCode);
    setSelectedBookName(tempBookName);
    setTotalChaptersInBook(tempTotalChapters);
    setSelectedChapterNumber(tempChapterNumber);
    setSelectedVerseNumber(String(verseNum));
    setShowFullSelectorModal(false);
  };

  // Share Passage or Selected Verse
  const handleShare = async () => {
    const title = `${selectedBookName} ${selectedChapterNumber}:${selectedVerseNumber || 1}`;
    let messageText = '';
    if (selectedVerseNumber && chapterData) {
      const verse = chapterData.verses.find((v) => v.verse === selectedVerseNumber);
      if (verse) {
        messageText = `«${verse.text}»\n— ${selectedBookName} ${selectedChapterNumber}:${verse.verse} (RVR1960)\n\nCapellanAPP`;
      }
    } else if (chapterData) {
      messageText =
        `${selectedBookName} ${selectedChapterNumber} (RVR1960)\n\n` +
        chapterData.verses.slice(0, 5).map((v) => `${v.verse}. ${v.text}`).join('\n') +
        `...\n\nCapellanAPP`;
    }

    try {
      await Share.share({ message: messageText || `${title} - CapellanAPP` });
    } catch {}
  };

  // Toggle Bookmark for a Verse
  const toggleBookmark = (verseNum: string) => {
    const key = `${selectedBookCode}-${selectedChapterNumber}-${verseNum}`;
    setSavedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Display Books List for Selector Modal
  const displayBooks = books.length > 0 ? books : CANONICAL_BOOKS.map((b) => ({
    code: b.code,
    name: b.name,
    shortName: b.name.slice(0, 4),
    longName: b.name,
    abbr: b.code,
    testament: b.testament,
    order: b.order,
    totalChapters: b.totalChapters,
    totalVerses: b.totalChapters * 25,
  }));

  const filteredBooks = useMemo(() => {
    return displayBooks.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(bookSearchQuery.toLowerCase());
      const matchesTestament =
        testamentFilter === 'ALL' || b.testament === testamentFilter;
      return matchesSearch && matchesTestament;
    });
  }, [displayBooks, bookSearchQuery, testamentFilter]);

  const verseCount = chapterData?.verses?.length || 6;
  const estimatedReadMinutes = Math.max(Math.ceil(verseCount * 0.35), 1);
  const isTablet = width > 500;

  return (
    <View style={styles.screen}>
      {/* ==================================================================== */}
      {/* 1. HERO BANNER BACKGROUND WITH EDITABLE PHOTO & SCRIPTURE REFERENCE */}
      {/* ==================================================================== */}
      <View style={styles.bannerContainer}>
        {/* Background Image or Solid Tactical Blue Fallback */}
        {bannerImageUri ? (
          <Image
            source={{ uri: bannerImageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.solidBannerBg]} />
        )}

        {/* Dark Gradient Overlay for Ultra-Clean Text Legibility */}
        <View style={styles.bannerOverlay} />

        {/* Top Bar Floating Over Banner */}
        <View style={[styles.bannerTopBar, { paddingTop: Math.max(insets.top, 10) }]}>
          <TouchableOpacity
            style={styles.bannerIconButton}
            onPress={onBack}
            activeOpacity={0.75}
          >
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.bannerTopRight}>
            {/* Change Banner Image Button */}
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => setShowBannerPickerModal(true)}
              activeOpacity={0.75}
            >
              <ImageIcon size={19} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Bookmarks Modal Button */}
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={() => setShowBookmarksModal(true)}
              activeOpacity={0.75}
            >
              <Bookmark size={19} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity
              style={styles.bannerIconButton}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Share2 size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner Hero Content: Book, Chapter & Verse Typography + Fixed Chapter Slider */}
        <View style={styles.bannerHeroContent}>
          <TouchableOpacity
            onPress={() => handleOpenSelector('BOOK')}
            activeOpacity={0.85}
            style={styles.bannerTitleTouchable}
          >
            <Text style={styles.bannerTitleText} numberOfLines={1}>
              {selectedBookName.toUpperCase()} {selectedChapterNumber}
              {selectedVerseNumber ? `:${selectedVerseNumber}` : ':1'}
            </Text>

            <Text style={styles.bannerSubtitleText}>
              {selectedBookName} • Capítulo {selectedChapterNumber} • Versículo {selectedVerseNumber || '1'}
            </Text>

            <View style={styles.bannerSelectorHint}>
              <Text style={styles.bannerSelectorHintText}>Tocar para cambiar libro, cap. o versículo</Text>
              <ChevronRight size={13} color="#BAE6FD" />
            </View>
          </TouchableOpacity>

          {/* Fixed Chapter Slider in Banner */}
          <View style={styles.bannerSliderRow}>
            <TouchableOpacity
              style={[
                styles.bannerSliderArrowBtn,
                currentGlobalChapter <= 1 && styles.bannerSliderArrowDisabled,
              ]}
              onPress={handleGlobalPrevChapter}
              disabled={currentGlobalChapter <= 1}
              activeOpacity={0.7}
            >
              <ChevronLeft
                size={18}
                color={currentGlobalChapter <= 1 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <View style={styles.bannerProgressBarWrapper}>
              <View style={styles.bannerProgressBarTrack}>
                <View
                  style={[
                    styles.bannerProgressBarFill,
                    { width: `${globalBibleProgressPercent}%` },
                  ]}
                />
                <View
                  style={[
                    styles.bannerProgressThumb,
                    { left: `${Math.min(Math.max(globalBibleProgressPercent - 2, 0), 96)}%` },
                  ]}
                />
              </View>

              <View style={styles.bannerProgressLabelsRow}>
                <Text style={styles.bannerProgressLabelLeft}>
                  Cap. {selectedChapterNumber} de {totalChaptersInBook}
                </Text>
                <Text style={styles.bannerProgressLabelRight}>
                  {globalBibleProgressPercent.toFixed(1)}% Biblia
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.bannerSliderArrowBtn,
                currentGlobalChapter >= TOTAL_BIBLE_CHAPTERS && styles.bannerSliderArrowDisabled,
              ]}
              onPress={handleGlobalNextChapter}
              disabled={currentGlobalChapter >= TOTAL_BIBLE_CHAPTERS}
              activeOpacity={0.7}
            >
              <ChevronRight
                size={18}
                color={
                  currentGlobalChapter >= TOTAL_BIBLE_CHAPTERS
                    ? 'rgba(255,255,255,0.3)'
                    : '#FFFFFF'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 2. OVERLAPPING SHEET (CON BORDER RADIUS EN LOS COSTADOS, ENCIMADO)  */}
      {/* ==================================================================== */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.overlappingScrollView}
        contentContainerStyle={[
          styles.overlappingScrollContent,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Selector Pills Row */}
        <View style={styles.quickSelectorRow}>
          <TouchableOpacity
            style={styles.quickSelectorPill}
            onPress={() => handleOpenSelector('BOOK')}
            activeOpacity={0.75}
          >
            <BookOpen size={14} color={Theme.colors.primary} />
            <Text style={styles.quickSelectorText} numberOfLines={1}>
              {selectedBookName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickSelectorPill}
            onPress={() => handleOpenSelector('CHAPTER')}
            activeOpacity={0.75}
          >
            <Text style={styles.quickSelectorPrefix}>Cap.</Text>
            <Text style={styles.quickSelectorText}>
              {selectedChapterNumber} / {totalChaptersInBook}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickSelectorPill}
            onPress={() => handleOpenSelector('VERSE')}
            activeOpacity={0.75}
          >
            <Text style={styles.quickSelectorPrefix}>Vers.</Text>
            <Text style={styles.quickSelectorText}>
              {selectedVerseNumber || '1'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Pill Card (4 Columns) */}
        <View style={styles.statsPillCard}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>66</Text>
            <Text style={styles.statLabel}>Libros</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statVal}>{verseCount}</Text>
            <Text style={styles.statLabel}>Versículos</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statVal}>RVR60</Text>
            <Text style={styles.statLabel}>Versión</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statVal}>{estimatedReadMinutes} min</Text>
            <Text style={styles.statLabel}>Lectura</Text>
          </View>
        </View>

        {/* SCRIPTURE TEXT READING BODY */}
        <View style={styles.readingCard}>
          {isLoadingChapter ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando las Sagradas Escrituras...</Text>
            </View>
          ) : chapterError ? (
            <View style={styles.centerLoading}>
              <Text style={styles.errorText}>{chapterError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setSelectedChapterNumber(selectedChapterNumber)}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.versesWrapper}>
              <Text style={styles.chapterBadgeHeader}>
                {selectedBookName.toUpperCase()} · CAPÍTULO {selectedChapterNumber}
              </Text>

              {chapterData?.verses?.map((verse) => {
                const isSelected = selectedVerseNumber === verse.verse;
                const verseKey = `${selectedBookCode}-${selectedChapterNumber}-${verse.verse}`;
                const isSaved = savedVerses.has(verseKey);

                return (
                  <TouchableOpacity
                    key={verse.verse}
                    style={[
                      styles.verseRow,
                      isSelected && styles.verseRowSelected,
                    ]}
                    onPress={() =>
                      setSelectedVerseNumber(
                        isSelected ? null : verse.verse
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.verseNumber,
                        { fontSize: Math.max(fontSize - 4, 11) },
                      ]}
                    >
                      {verse.verse}
                    </Text>

                    <Text
                      style={[
                        styles.verseText,
                        {
                          fontSize: fontSize,
                          lineHeight: fontSize * 1.6,
                        },
                        isSelected && styles.verseTextSelected,
                      ]}
                    >
                      {verse.text}
                    </Text>

                    {isSelected && (
                      <TouchableOpacity
                        style={styles.verseBookmarkBtn}
                        onPress={() => toggleBookmark(verse.verse)}
                      >
                        {isSaved ? (
                          <BookmarkCheck size={18} color={Theme.colors.primary} />
                        ) : (
                          <Bookmark size={18} color="#94A3B8" />
                        )}
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ==================================================================== */}
      {/* 3. FLOATING COLLAPSIBLE FONT SIZE CONTROLLER (LEFT SIDE)             */}
      {/* ==================================================================== */}
      {!isFontSliderOpen ? (
        <TouchableOpacity
          style={styles.floatingZoomBtn}
          onPress={() => setIsFontSliderOpen(true)}
          activeOpacity={0.85}
        >
          <ZoomIn size={18} color={Theme.colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.verticalSliderContainer}>
          {/* Collapse Button */}
          <TouchableOpacity
            style={styles.fontCollapseBtn}
            onPress={() => setIsFontSliderOpen(false)}
            activeOpacity={0.8}
          >
            <ZoomOut size={16} color={Theme.colors.primary} />
          </TouchableOpacity>

          {/* Step Up A+ */}
          <TouchableOpacity
            style={styles.fontStepButton}
            onPress={() => setFontSize((prev) => Math.min(prev + 1, 24))}
          >
            <Text style={styles.fontStepText}>A+</Text>
          </TouchableOpacity>

          {/* Slider Track with fill */}
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { height: `${((fontSize - 13) / 11) * 100}%` },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                { bottom: `${((fontSize - 13) / 11) * 85}%` },
              ]}
            />
          </View>

          {/* Step Down A- */}
          <TouchableOpacity
            style={styles.fontStepButton}
            onPress={() => setFontSize((prev) => Math.max(prev - 1, 13))}
          >
            <Text style={styles.fontStepText}>A-</Text>
          </TouchableOpacity>

          {/* Indicator Value */}
          <Text style={styles.fontSizeIndicatorText}>{fontSize}</Text>
        </View>
      )}

      {/* ==================================================================== */}
      {/* 4. BOTTOM CONTROLS & GLOBAL BIBLE PROGRESS TRACKER                  */}
      {/* ==================================================================== */}
      <View style={[styles.bottomControlArea, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {/* BOTTOM NAVIGATION CAPSULE */}
        <View style={styles.capsuleNavRow}>
          {/* Left: Bookmarks / Guardados */}
          <TouchableOpacity
            style={styles.capsuleSideBtn}
            onPress={() => setShowBookmarksModal(true)}
            activeOpacity={0.75}
          >
            <Bookmark size={20} color={Theme.colors.primary} />
          </TouchableOpacity>

          {/* Center Navigation Pill: < Capítulo 23 / 150 > */}
          <View style={styles.centerNavigationPill}>
            <TouchableOpacity
              onPress={handleGlobalPrevChapter}
              disabled={currentGlobalChapter <= 1}
              style={[
                styles.navArrowBtn,
                currentGlobalChapter <= 1 && styles.navArrowDisabled,
              ]}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenSelector('CHAPTER')}
              style={styles.navChapterTitleBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.navChapterText}>
                {selectedBookName} {selectedChapterNumber} ({selectedChapterNumber}/{totalChaptersInBook})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGlobalNextChapter}
              disabled={currentGlobalChapter >= TOTAL_BIBLE_CHAPTERS}
              style={[
                styles.navArrowBtn,
                currentGlobalChapter >= TOTAL_BIBLE_CHAPTERS && styles.navArrowDisabled,
              ]}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Right: Book / Canon Selector */}
          <TouchableOpacity
            style={styles.capsuleSideBtn}
            onPress={() => handleOpenSelector('BOOK')}
            activeOpacity={0.75}
          >
            <BookOpen size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* MODAL 1: FULL SCRIPTURE SELECTOR (LIBRO, CAPÍTULO & VERSÍCULO)       */}
      {/* ==================================================================== */}
      <Modal
        visible={showFullSelectorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFullSelectorModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Selector Bíblico</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  {tempBookName} {tempChapterNumber} • Canon Completo RVR60
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFullSelectorModal(false)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* 3-Step Selector Tabs: [ 1. Libro | 2. Capítulo | 3. Versículo ] */}
            <View style={styles.selectorTabBar}>
              <TouchableOpacity
                style={[
                  styles.selectorTabItem,
                  selectorTab === 'BOOK' && styles.selectorTabItemActive,
                ]}
                onPress={() => setSelectorTab('BOOK')}
              >
                <Text
                  style={[
                    styles.selectorTabText,
                    selectorTab === 'BOOK' && styles.selectorTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  1. Libro ({tempBookName})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectorTabItem,
                  selectorTab === 'CHAPTER' && styles.selectorTabItemActive,
                ]}
                onPress={() => setSelectorTab('CHAPTER')}
              >
                <Text
                  style={[
                    styles.selectorTabText,
                    selectorTab === 'CHAPTER' && styles.selectorTabTextActive,
                  ]}
                >
                  2. Cap. ({tempChapterNumber})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.selectorTabItem,
                  selectorTab === 'VERSE' && styles.selectorTabItemActive,
                ]}
                onPress={() => setSelectorTab('VERSE')}
              >
                <Text
                  style={[
                    styles.selectorTabText,
                    selectorTab === 'VERSE' && styles.selectorTabTextActive,
                  ]}
                >
                  3. Versículo
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB CONTENT 1: BOOK PICKER */}
            {selectorTab === 'BOOK' && (
              <View style={styles.tabContentWrapper}>
                {/* Search Input */}
                <View style={styles.modalSearchBox}>
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Buscar libro (ej. Salmos, Juan, Romanos)..."
                    placeholderTextColor="#94A3B8"
                    value={bookSearchQuery}
                    onChangeText={setBookSearchQuery}
                  />
                </View>

                {/* Testament Filter Pills */}
                <View style={styles.testamentPillsRow}>
                  {(['ALL', 'OT', 'NT'] as const).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.testamentPill,
                        testamentFilter === filter && styles.testamentPillActive,
                      ]}
                      onPress={() => setTestamentFilter(filter)}
                    >
                      <Text
                        style={[
                          styles.testamentPillText,
                          testamentFilter === filter && styles.testamentPillTextActive,
                        ]}
                      >
                        {filter === 'ALL'
                          ? 'Todos (66)'
                          : filter === 'OT'
                          ? 'Antiguo T. (39)'
                          : 'Nuevo T. (27)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Books Grid */}
                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.booksGrid}>
                    {filteredBooks.map((book) => {
                      const isCurrent = book.code.toUpperCase() === tempBookCode.toUpperCase();
                      return (
                        <TouchableOpacity
                          key={book.code}
                          style={[
                            styles.bookGridItem,
                            isCurrent && styles.bookGridItemActive,
                          ]}
                          onPress={() => handleSelectBookInModal(book)}
                        >
                          <Text
                            style={[
                              styles.bookGridItemName,
                              isCurrent && styles.bookGridItemNameActive,
                            ]}
                          >
                            {book.name}
                          </Text>
                          <Text style={styles.bookGridItemMeta}>
                            {book.totalChapters || 1} caps
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* TAB CONTENT 2: CHAPTER PICKER */}
            {selectorTab === 'CHAPTER' && (
              <View style={styles.tabContentWrapper}>
                <View style={styles.selectorSubNotice}>
                  <Text style={styles.selectorSubNoticeText}>
                    Selecciona un capítulo de <Text style={{ fontFamily: Theme.fonts.headlineBold }}>{tempBookName}</Text> (1 al {tempTotalChapters}):
                  </Text>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.numbersGrid}>
                    {Array.from({ length: tempTotalChapters }, (_, idx) => idx + 1).map((chap) => {
                      const isCurrent = chap === tempChapterNumber;
                      return (
                        <TouchableOpacity
                          key={chap}
                          style={[
                            styles.numberGridItem,
                            isCurrent && styles.numberGridItemActive,
                          ]}
                          onPress={() => handleSelectChapterInModal(chap)}
                        >
                          <Text
                            style={[
                              styles.numberGridText,
                              isCurrent && styles.numberGridTextActive,
                            ]}
                          >
                            {chap}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* TAB CONTENT 3: VERSE PICKER */}
            {selectorTab === 'VERSE' && (
              <View style={styles.tabContentWrapper}>
                <View style={styles.selectorSubNotice}>
                  <Text style={styles.selectorSubNoticeText}>
                    Selecciona el versículo de inicio en <Text style={{ fontFamily: Theme.fonts.headlineBold }}>{tempBookName} {tempChapterNumber}</Text>:
                  </Text>
                </View>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.numbersGrid}>
                    {Array.from({ length: Math.max(tempTotalVerses, 1) }, (_, idx) => idx + 1).map((vers) => {
                      const isCurrent = String(vers) === selectedVerseNumber;
                      return (
                        <TouchableOpacity
                          key={vers}
                          style={[
                            styles.numberGridItem,
                            isCurrent && styles.numberGridItemActive,
                          ]}
                          onPress={() => handleSelectVerseInModal(vers)}
                        >
                          <Text
                            style={[
                              styles.numberGridText,
                              isCurrent && styles.numberGridTextActive,
                            ]}
                          >
                            {vers}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 2: BANNER IMAGE PICKER (CAMBIAR FONDO DEL BANNER)              */}
      {/* ==================================================================== */}
      <Modal
        visible={showBannerPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBannerPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeaderTitle}>Cambiar Fondo del Banner</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  Selecciona una imagen inspiracional o el color institucional
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBannerPickerModal(false)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.presetImagesGrid}>
                {BANNER_PRESETS.map((preset) => {
                  const isCurrent = bannerImageUri === preset.uri;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetCard,
                        isCurrent && styles.presetCardActive,
                      ]}
                      onPress={() => {
                        setBannerImageUri(preset.uri);
                        setShowBannerPickerModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.presetImageContainer}>
                        {preset.uri ? (
                          <Image
                            source={{ uri: preset.uri }}
                            style={styles.presetThumbnail}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.presetThumbnail, styles.solidBannerBg]} />
                        )}
                        {isCurrent && (
                          <View style={styles.presetCheckBadge}>
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.presetTitle, isCurrent && styles.presetTitleActive]}>
                        {preset.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL 3: BOOKMARKED VERSES                                           */}
      {/* ==================================================================== */}
      <Modal
        visible={showBookmarksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookmarksModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Versículos Guardados</Text>
              <TouchableOpacity onPress={() => setShowBookmarksModal(false)}>
                <X size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {savedVerses.size === 0 ? (
                <View style={styles.emptyBookmarks}>
                  <Bookmark size={32} color="#CBD5E1" />
                  <Text style={styles.emptyBookmarksText}>
                    No tenés versículos guardados aún. Tocá cualquier versículo mientras leés para guardarlo.
                  </Text>
                </View>
              ) : (
                Array.from(savedVerses).map((key) => {
                  const parts = key.split('-');
                  const refText = `${selectedBookName} ${parts[1]}:${parts[2]}`;
                  return (
                    <View key={key} style={styles.savedVerseCard}>
                      <View style={styles.savedVerseHeader}>
                        <Text style={styles.savedVerseRef}>{refText}</Text>
                        <TouchableOpacity onPress={() => toggleBookmark(parts[2])}>
                          <BookmarkCheck size={18} color={Theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.savedVerseSnippet}>
                        Guardado en tu bitácora personal de lectura bíblica.
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A', // Seamless dark backdrop for the banner
  },

  // ============================================================================
  // HERO BANNER STYLES
  // ============================================================================
  bannerContainer: {
    height: 310,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  solidBannerBg: {
    backgroundColor: '#0c7ae0',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 19, 35, 0.55)', // Semi-transparent dark contrast
  },
  bannerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  bannerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bannerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerHeroContent: {
    paddingHorizontal: 20,
    paddingBottom: 42, // Room for overlapping sheet
    alignItems: 'center',
    zIndex: 5,
  },
  bannerTitleTouchable: {
    alignItems: 'center',
    width: '100%',
  },
  bannerTagWrap: {
    backgroundColor: 'rgba(47, 147, 239, 0.25)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  bannerTagText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9,
    color: '#E0F2FE',
    letterSpacing: 1.2,
  },
  bannerTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bannerSubtitleText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#E2E8F0',
    marginTop: 2,
    textAlign: 'center',
  },
  bannerSelectorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bannerSelectorHintText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#BAE6FD',
  },
  bannerSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 390,
    marginTop: 12,
    gap: 8,
    paddingHorizontal: 4,
  },
  bannerSliderArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  bannerSliderArrowDisabled: {
    opacity: 0.35,
  },
  bannerProgressBarWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    position: 'relative',
    justifyContent: 'center',
  },
  bannerProgressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  bannerProgressThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    top: -4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  bannerProgressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bannerProgressLabelLeft: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#E0F2FE',
  },
  bannerProgressLabelRight: {
    fontFamily: Theme.fonts.body,
    fontSize: 9.5,
    color: '#BAE6FD',
  },

  // ============================================================================
  // OVERLAPPING SHEET STYLES (ENCIMADO CON BORDER RADIUS EN LOS COSTADOS)
  // ============================================================================
  overlappingScrollView: {
    flex: 1,
    marginTop: -28, // Overlaps the bottom of the banner
    zIndex: 20,
  },
  overlappingScrollContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FAFAF9', // Clean reading surface
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140, // Space for bottom capsule & progress bar
    minHeight: 600,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabletContent: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  // Quick Selector Pills Row
  quickSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quickSelectorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  quickSelectorPrefix: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: '#94A3B8',
  },
  quickSelectorText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#0F172A',
  },

  // Stats Pill Card (4 Columns)
  statsPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12.5,
    color: Theme.colors.primary, // App primary brand (#0c7ae0)
  },
  statLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#F1F5F9',
  },

  // Reading Card
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 340,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  centerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
    marginTop: 12,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  versesWrapper: {
    width: '100%',
  },
  chapterBadgeHeader: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: Theme.colors.primary,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 2,
  },
  verseRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  verseNumber: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
    width: 26,
    marginRight: 6,
    marginTop: 2,
  },
  verseText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    color: '#1E293B',
    lineHeight: 25,
  },
  verseTextSelected: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#0F172A',
  },
  verseBookmarkBtn: {
    padding: 4,
    marginLeft: 6,
  },

  // Floating Collapsible Font Controller
  floatingZoomBtn: {
    position: 'absolute',
    left: 12,
    top: 270,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    zIndex: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verticalSliderContainer: {
    position: 'absolute',
    left: 12,
    top: 250,
    width: 36,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    zIndex: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fontCollapseBtn: {
    padding: 2,
  },
  fontStepButton: {
    padding: 2,
  },
  fontStepText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: Theme.colors.primary,
  },
  sliderTrack: {
    width: 4,
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  sliderFill: {
    width: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    left: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fontSizeIndicatorText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: '#64748B',
  },

  // Bottom Progress & Navigation Controls
  bottomControlArea: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingHorizontal: 16,    
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  progressTrackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sliderStepArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderStepArrowDisabled: {
    opacity: 0.35,
    backgroundColor: '#F1F5F9',
  },
  progressBarWrapper: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 2.5,
  },
  progressThumb: {
    position: 'absolute',
    top: -4.5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  progressLabelWrap: {
    alignItems: 'flex-end',
    minWidth: 88,
  },
  progressLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: Theme.colors.primary,
  },
  progressSubLabel: {
    fontFamily: Theme.fonts.body,
    fontSize: 8.5,
    color: '#94A3B8',
  },
  capsuleNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    paddingBottom: 20,
    paddingTop: 8
  },
  capsuleSideBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  centerNavigationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 8,
    marginHorizontal: 10,
  },
  navArrowBtn: {
    padding: 6,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navChapterTitleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navChapterText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ============================================================================
  // MODALS & SELECTORS
  // ============================================================================
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // 3-Step Selector Tabs Bar
  selectorTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  selectorTabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTabItemActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectorTabText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
  },
  selectorTabTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
  },
  tabContentWrapper: {
    width: '100%',
  },
  selectorSubNotice: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  selectorSubNoticeText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#475569',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#0F172A',
  },
  testamentPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  testamentPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  testamentPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  testamentPillText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#64748B',
  },
  testamentPillTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  modalScrollBody: {
    maxHeight: 320,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  bookGridItem: {
    width: '31%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookGridItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Theme.colors.primary,
  },
  bookGridItemName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11.5,
    color: '#0F172A',
    textAlign: 'center',
  },
  bookGridItemNameActive: {
    color: Theme.colors.primary,
  },
  bookGridItemMeta: {
    fontFamily: Theme.fonts.body,
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Numbers Grid for Chapters & Verses
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  numberGridItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberGridItemActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  numberGridText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#1E293B',
  },
  numberGridTextActive: {
    color: '#FFFFFF',
  },

  // Preset Images Grid for Banner
  presetImagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  presetCard: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 4,
  },
  presetCardActive: {
    borderColor: Theme.colors.primary,
  },
  presetImageContainer: {
    width: '100%',
    height: 75,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  presetThumbnail: {
    width: '100%',
    height: '100%',
  },
  presetCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  presetTitleActive: {
    color: Theme.colors.primary,
  },

  // Bookmarks Modal
  emptyBookmarks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyBookmarksText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  savedVerseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedVerseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  savedVerseRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.primary,
  },
  savedVerseSnippet: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
  },
});
