import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import {
  TacticalCard,
  TacticalButton,
} from '../components/common';
import {
  BookOpen,
  Sparkles,
  ChevronDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  X,
  Highlighter,
  FileText,
  Shield,
  ShieldCheck,
  Search,
  ArrowRight,
  RefreshCw,
} from 'lucide-react-native';
import {
  getBibleBooks,
  getBibleChapter,
  getPerlitaDelDia,
  getRandomPerlita,
  searchBible,
} from '../lib/api/bible';
import type {
  BibleBookSummary,
  BibleChapter,
  BibleVerse,
  Perlita,
} from '../types/bible';

const THEMATIC_MOMENTS = [
  { id: 'peligro', label: 'En Peligro', bookCode: 'PSA', chapter: 91 },
  { id: 'noche', label: 'Paz en la Noche', bookCode: 'PSA', chapter: 23 },
  { id: 'justicia', label: 'Valor y Justicia', bookCode: 'PRO', chapter: 3 },
  { id: 'duelo', label: 'Duelo y Pérdida', bookCode: 'JHN', chapter: 14 },
  { id: 'hogar', label: 'Protección del Hogar', bookCode: 'PHP', chapter: 4 },
];

export default function LecturaScreen() {
  const { width } = useWindowDimensions();

  // Primary Tab: 'biblia' | 'perlitas'
  const [activeTab, setActiveTab] = useState<'biblia' | 'perlitas'>('biblia');

  // --- Bible State ---
  const [books, setBooks] = useState<BibleBookSummary[]>([]);
  const [selectedBookCode, setSelectedBookCode] = useState<string>('PSA'); // Default: Salmos
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(23); // Default: Salmo 23
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);

  // Verse Interaction State
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<string | null>('1');
  const [highlightedVerses, setHighlightedVerses] = useState<Set<string>>(new Set(['1']));
  const [savedToLogbook, setSavedToLogbook] = useState<Set<string>>(new Set(['1']));

  // Reader Settings
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isTacticalRed, setIsTacticalRed] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Modals
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Full-Text Scripture Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleVerse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // --- Perlita State ---
  const [perlita, setPerlita] = useState<Perlita | null>(null);
  const [isLoadingPerlita, setIsLoadingPerlita] = useState(false);
  const [perlitaError, setPerlitaError] = useState<string | null>(null);
  const [isRandomPerlita, setIsRandomPerlita] = useState(false);
  const [savedPerlitas, setSavedPerlitas] = useState<Set<string>>(new Set());

  // 1. Initial Load of Books
  useEffect(() => {
    let isMounted = true;
    getBibleBooks()
      .then((data) => {
        if (!isMounted) return;
        setBooks(data);
      })
      .catch((err) => {
        console.warn('Error loading bible books:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Chapter Verses when selectedBookCode or selectedChapterNumber changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingChapter(true);
    setChapterError(null);

    getBibleChapter(selectedBookCode, selectedChapterNumber)
      .then((data) => {
        if (!isMounted) return;
        setChapterData(data);
        setIsLoadingChapter(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setChapterError(err?.message || 'Error al cargar capítulo bíblico');
        setIsLoadingChapter(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBookCode, selectedChapterNumber]);

  // 3. Load Perlita del Día on mount
  useEffect(() => {
    loadDailyPerlita();
  }, []);

  const loadDailyPerlita = async () => {
    setIsLoadingPerlita(true);
    setPerlitaError(null);
    setIsRandomPerlita(false);
    try {
      const data = await getPerlitaDelDia();
      setPerlita(data);
    } catch (err: any) {
      setPerlitaError(err?.message || 'No se pudo conectar con el servicio devocional.');
    } finally {
      setIsLoadingPerlita(false);
    }
  };

  const handleFetchRandomPerlita = async () => {
    setIsLoadingPerlita(true);
    setPerlitaError(null);
    try {
      const data = await getRandomPerlita();
      setPerlita(data);
      setIsRandomPerlita(true);
    } catch (err: any) {
      setPerlitaError(err?.message || 'Error al generar perlita aleatoria.');
    } finally {
      setIsLoadingPerlita(false);
    }
  };

  // Find Current Book Object
  const currentBook = useMemo(() => {
    return (
      books.find((b) => b.code.toUpperCase() === selectedBookCode.toUpperCase()) || {
        code: selectedBookCode,
        name: selectedBookCode === 'PSA' ? 'Salmos' : selectedBookCode,
        shortName: selectedBookCode === 'PSA' ? 'Salmos' : selectedBookCode,
        longName: selectedBookCode === 'PSA' ? 'Salmos' : selectedBookCode,
        abbr: selectedBookCode === 'PSA' ? 'Sal' : selectedBookCode,
        testament: 'OT' as const,
        order: 19,
        totalChapters: 150,
        totalVerses: 2527,
      }
    );
  }, [books, selectedBookCode]);

  // Filtered books for picker
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesTestament =
        testamentFilter === 'ALL' ? true : b.testament === testamentFilter;
      const matchesSearch = bookSearchQuery.trim()
        ? b.name.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
          b.abbr.toLowerCase().includes(bookSearchQuery.toLowerCase())
        : true;
      return matchesTestament && matchesSearch;
    });
  }, [books, testamentFilter, bookSearchQuery]);

  const handleSelectThematic = (shortcutId: string) => {
    const moment = THEMATIC_MOMENTS.find((m) => m.id === shortcutId);
    if (!moment) return;
    setSelectedBookCode(moment.bookCode);
    setSelectedChapterNumber(moment.chapter);
    setSelectedVerseNumber('1');
  };

  const toggleHighlight = (verseNum: string) => {
    setHighlightedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const toggleLogbook = (verseNum: string) => {
    setSavedToLogbook((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const togglePerlitaSaved = (ref: string) => {
    setSavedPerlitas((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const handleShareVerse = async (verseNum: string, verseText: string) => {
    try {
      await Share.share({
        message: `«${verseText}» — ${currentBook.name} ${selectedChapterNumber}:${verseNum}\n\nTraducción Oficial PDDPT (CC BY 4.0)\nCapellanAPP · Manual de Vida y Servicio`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleSharePerlita = async (item: Perlita) => {
    try {
      await Share.share({
        message: `«${item.text}»\n— ${item.reference} (${item.translation})\n\n${item.attribution || ''}\nCompartido desde CapellanAPP`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleNavigatePerlitaToBible = (item: Perlita) => {
    if (item.bookCode) {
      setSelectedBookCode(item.bookCode);
    } else if (item.book) {
      const matched = books.find(
        (b) => b.name.toLowerCase() === item.book?.toLowerCase()
      );
      if (matched) setSelectedBookCode(matched.code);
    }
    if (item.chapter) {
      setSelectedChapterNumber(item.chapter);
    }
    if (item.verse) {
      setSelectedVerseNumber(item.verse);
    }
    setActiveTab('biblia');
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchBible(searchQuery.trim());
      setSearchResults(res.results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (verse: BibleVerse) => {
    setSelectedBookCode(verse.bookCode);
    if (verse.chapter) {
      setSelectedChapterNumber(verse.chapter);
    }
    setSelectedVerseNumber(verse.verse);
    setShowSearchModal(false);
  };

  const increaseFontSize = () => {
    if (fontSizeMultiplier < 1.35) {
      setFontSizeMultiplier((prev) => +(prev + 0.1).toFixed(1));
    }
  };

  const decreaseFontSize = () => {
    if (fontSizeMultiplier > 0.85) {
      setFontSizeMultiplier((prev) => +(prev - 0.1).toFixed(1));
    }
  };

  const isTablet = width > 500;

  const currentVerseText =
    chapterData?.verses.find((v) => v.verse === selectedVerseNumber)?.text || '';

  // Theme overrides for Tactical Red Dim Mode
  const bg = isTacticalRed ? Theme.colors.tacticalRedBg : Theme.colors.background;
  const sanctuaryBg = isTacticalRed
    ? Theme.colors.tacticalRedSurface
    : Theme.colors.surfaceContainerLowest;
  const textColor = isTacticalRed ? Theme.colors.tacticalRedText : Theme.colors.onSurface;
  const subtextColor = isTacticalRed ? '#B91C1C' : Theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.outerWrapper, { backgroundColor: bg }]}>
      {/* 1. Header Segmented Navigation Bar (Biblia vs Perlita) */}
      <View style={[styles.segmentedTabBar, { backgroundColor: isTacticalRed ? '#2B0B0B' : '#FFFFFF' }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'biblia' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('biblia')}
          activeOpacity={0.8}
        >
          <BookOpen
            size={16}
            color={activeTab === 'biblia' ? '#FFFFFF' : Theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'biblia' && styles.segmentBtnTextActive,
            ]}
          >
            Biblia PDDPT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'perlitas' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('perlitas')}
          activeOpacity={0.8}
        >
          <Sparkles
            size={16}
            color={activeTab === 'perlitas' ? '#FFFFFF' : Theme.colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'perlitas' && styles.segmentBtnTextActive,
            ]}
          >
            Perlita del Día
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. BODY CONTENT: BIBLIA */}
      {activeTab === 'biblia' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Operational Context Banner */}
          <TacticalCard
            style={isTacticalRed ? styles.tacticalRedCard : styles.contextCard}
            variant={isTacticalRed ? 'lowest' : 'low'}
            padding={14}
          >
            <View style={styles.contextRow}>
              <View
                style={[
                  styles.contextIcon,
                  {
                    backgroundColor: isTacticalRed
                      ? Theme.colors.tacticalRedAccent
                      : Theme.colors.tacticalNavy,
                  },
                ]}
              >
                <BookOpen size={18} color="#FFFFFF" />
              </View>
              <View style={styles.contextTextWrapper}>
                <Text style={[styles.contextTitle, { color: textColor }]}>
                  Manual de Vida y Servicio
                </Text>
                <Text style={[styles.contextSubtitle, { color: subtextColor }]}>
                  {currentBook.name} {selectedChapterNumber} · Traducción Oficial PDDPT
                </Text>
              </View>

              {/* Search Scripture Action Icon */}
              <TouchableOpacity
                style={styles.searchIconButton}
                onPress={() => setShowSearchModal(true)}
                activeOpacity={0.7}
              >
                <Search size={18} color={isTacticalRed ? textColor : Theme.colors.tacticalNavy} />
              </TouchableOpacity>
            </View>
          </TacticalCard>

          {/* Scripture Selector Bar */}
          <TacticalCard
            style={isTacticalRed ? styles.tacticalRedCard : styles.selectorCard}
            padding={10}
          >
            <View style={styles.selectorGrid}>
              <TouchableOpacity
                style={styles.selectorCol}
                onPress={() => setShowPickerModal(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectorLabel, { color: subtextColor }]}>LIBRO</Text>
                <View style={styles.selectorValueRow}>
                  <Text style={[styles.selectorValue, { color: textColor }]} numberOfLines={1}>
                    {currentBook.name}
                  </Text>
                  <ChevronDown size={14} color={subtextColor} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectorCol}
                onPress={() => setShowPickerModal(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectorLabel, { color: subtextColor }]}>CAPÍTULO</Text>
                <View style={styles.selectorValueRow}>
                  <Text style={[styles.selectorValue, { color: textColor }]}>
                    Cap. {selectedChapterNumber}
                  </Text>
                  <ChevronDown size={14} color={subtextColor} />
                </View>
              </TouchableOpacity>

              <View style={styles.selectorCol}>
                <Text style={[styles.selectorLabel, { color: subtextColor }]}>VERSIÓN</Text>
                <Text style={[styles.selectorValue, { color: textColor }]}>PDDPT</Text>
              </View>
            </View>
          </TacticalCard>

          {/* Quick Topic Pills (Operational Moments) */}
          <View style={styles.momentsSection}>
            <View style={styles.momentsHeader}>
              <Text style={[styles.momentsTitle, { color: subtextColor }]}>
                PASAJES POR MOMENTO OPERATIVO
              </Text>
              <Text style={[styles.momentsCount, { color: subtextColor }]}>
                5 CATEGORÍAS
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.momentsRow}
            >
              {THEMATIC_MOMENTS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => handleSelectThematic(m.id)}
                  style={[
                    styles.momentPill,
                    isTacticalRed ? styles.momentPillRed : styles.momentPillNormal,
                  ]}
                  activeOpacity={0.8}
                >
                  <Shield
                    size={12}
                    color={
                      isTacticalRed
                        ? Theme.colors.tacticalRedText
                        : Theme.colors.tacticalNavy
                    }
                  />
                  <Text
                    style={[
                      styles.momentText,
                      {
                        color: isTacticalRed
                          ? Theme.colors.tacticalRedText
                          : Theme.colors.onSurface,
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Serene Scripture Reading Sanctuary */}
          <View style={[styles.sanctuaryCard, { backgroundColor: sanctuaryBg }]}>
            <View style={styles.sanctuaryHeader}>
              <View style={styles.sanctuaryHeaderLeft}>
                <Text style={[styles.sanctuaryTitle, { color: textColor }]}>
                  {currentBook.name} {selectedChapterNumber}
                </Text>
                <View style={styles.sanctuaryBadge}>
                  <Text style={styles.sanctuaryBadgeText}>CANON PDDPT</Text>
                </View>
              </View>
              <Text style={[styles.sanctuaryMeta, { color: subtextColor }]}>
                TEXTO ÍNTEGRO
              </Text>
            </View>

            {/* Verses Stream with Loading / Error Handlers */}
            {isLoadingChapter ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={isTacticalRed ? Theme.colors.tacticalRedText : Theme.colors.tacticalNavy}
                />
                <Text style={[styles.loadingText, { color: subtextColor }]}>
                  Consultando sagradas escrituras...
                </Text>
              </View>
            ) : chapterError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{chapterError}</Text>
                <TacticalButton
                  title="Reintentar"
                  onPress={() => {
                    setIsLoadingChapter(true);
                    getBibleChapter(selectedBookCode, selectedChapterNumber)
                      .then((d) => setChapterData(d))
                      .catch((e) => setChapterError(e.message))
                      .finally(() => setIsLoadingChapter(false));
                  }}
                  variant="surface"
                  size="sm"
                  style={{ marginTop: 8 }}
                />
              </View>
            ) : (
              <View style={styles.versesStream}>
                {chapterData?.verses.map((v) => {
                  const isSelected = selectedVerseNumber === v.verse;
                  const isHighlighted = highlightedVerses.has(v.verse);
                  const isSaved = savedToLogbook.has(v.verse);

                  return (
                    <TouchableOpacity
                      key={v.verse}
                      style={[
                        styles.verseBlock,
                        isSelected &&
                          (isTacticalRed
                            ? styles.verseBlockRedSelected
                            : styles.verseBlockSelected),
                        isHighlighted && !isSelected && styles.verseBlockHighlighted,
                      ]}
                      onPress={() => setSelectedVerseNumber(v.verse)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.verseText,
                          {
                            fontSize: 16 * fontSizeMultiplier,
                            lineHeight: 28 * fontSizeMultiplier,
                            color: textColor,
                          },
                        ]}
                      >
                        <Text style={[styles.verseSuperscript, { color: subtextColor }]}>
                          {v.verse}{' '}
                        </Text>
                        {v.text}
                      </Text>

                      {isSaved && (
                        <View style={styles.savedMarkerRow}>
                          <View style={styles.savedMarkerDot} />
                          <Text
                            style={[styles.savedMarkerText, { color: subtextColor }]}
                          >
                            SUBRAYADO PERSONAL • GUARDADO EN BITÁCORA
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Active Verse Tactical Tools Panel */}
            {selectedVerseNumber && currentVerseText ? (
              <View style={styles.toolsPanel}>
                <View style={styles.toolsPanelHeader}>
                  <Text style={[styles.toolsPanelTitle, { color: textColor }]}>
                    Herramientas sobre Versículo {selectedVerseNumber}
                  </Text>
                </View>

                <View style={styles.toolsButtonsRow}>
                  {/* Tool 1: Subrayar */}
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => toggleHighlight(selectedVerseNumber)}
                  >
                    <Highlighter size={16} color={Theme.colors.secondary} />
                    <Text style={styles.toolBtnText}>Subrayar</Text>
                  </TouchableOpacity>

                  {/* Tool 2: En Bitácora */}
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => toggleLogbook(selectedVerseNumber)}
                  >
                    <FileText size={16} color={Theme.colors.secondary} />
                    <Text style={styles.toolBtnText}>En Bitácora</Text>
                  </TouchableOpacity>

                  {/* Tool 3: Compartir / Con Unidad */}
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() =>
                      handleShareVerse(selectedVerseNumber, currentVerseText)
                    }
                  >
                    <Share2 size={16} color={Theme.colors.secondary} />
                    <Text style={styles.toolBtnText}>Con Unidad</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Attribution Footnote */}
            <View style={styles.attributionFootnote}>
              <Text style={[styles.attributionText, { color: subtextColor }]}>
                Palabra de Dios para ti (PDDPT) © 2020 Asociación Bíblica Latinoamericana. Licencia CC BY 4.0. Distribución vía eBible.org
              </Text>
            </View>

            {/* Field Chaplain Pastoral Reflection Note */}
            <View style={styles.pastoralNote}>
              <ShieldCheck
                size={20}
                color={Theme.colors.secondary}
                style={{ marginTop: 2 }}
              />
              <View style={styles.pastoralNoteContent}>
                <Text style={[styles.pastoralNoteTitle, { color: textColor }]}>
                  Nota Pastoral del Capellán de Turno
                </Text>
                <Text style={[styles.pastoralNoteText, { color: subtextColor }]}>
                  «El término hebreo <Text style={{ fontStyle: 'italic' }}>Metzudá</Text>{' '}
                  (castillo/fortaleza) designa una posición elevada e inexpugnable.
                  Cuando estés en guardia, mantén tu espíritu en esta misma convicción: no
                  dependes únicamente del blindaje exterior, sino del resguardo supremo.»
                </Text>
              </View>
            </View>
          </View>

          {/* Quiet Visual Sanctuary Anchor: Duty & Faith */}
          <View style={styles.dutyCard}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-9WmQRdN7IY2SAMdCvGcfkCMgrhSOIjkFdQ0n0qNy9bfSrC7MhRlUD5k3uWmdqZyHhwmeuimbMqeL-GZjA3QNJjdBNOYs7atVSU50vWb5R4rHcNDHulYMQbHOvgieDTQnNXl6-kwK5Gd22C1j_tpfnnSDXm1NolkP9x7VF26fcog-_KQRO_QR0BJEx0Ecp1eCtGwH-xIukFOGld48rO9LB_4DoC-Lfxuh6_OcvivbzuUWbD-QCK0l9A',
              }}
              style={styles.dutyImage}
              resizeMode="cover"
            />
            <View style={styles.dutyOverlay} />
            <View style={styles.dutyContent}>
              <View>
                <Text style={styles.dutyTag}>GUARDA EN SERVICIO</Text>
                <Text style={styles.dutyHeading}>«Bajo sus alas estarás seguro»</Text>
              </View>
              <ShieldCheck size={20} color="#D4E3FF" />
            </View>
          </View>
        </ScrollView>
      )}

      {/* 3. BODY CONTENT: PERLITAS DEL DÍA */}
      {activeTab === 'perlitas' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.tabletContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <TacticalCard style={styles.perlitaHeaderCard} padding={16}>
            <View style={styles.perlitaTagRow}>
              <View style={styles.serenityBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.serenityBadgeText}>
                  {isRandomPerlita ? 'PERLITA DEVOCIONAL ALEATORIA' : 'PERLITA DETERMINÍSTICA DEL DÍA'}
                </Text>
              </View>
              <Sparkles size={18} color={Theme.colors.secondary} />
            </View>

            <Text style={styles.perlitaMainTitle}>
              {isRandomPerlita ? 'Inspiración al Instante' : 'Versículo Diario de Guardia'}
            </Text>
            <Text style={styles.perlitaSub}>
              {isRandomPerlita
                ? 'Un versículo extraído del canon PDDPT para renovar el ánimo y la templanza en cualquier momento de la vigilia.'
                : 'Misma palabra devocional asignada a todos los miembros de la fuerza hoy, renovada diariamente a medianoche sin IA ni demoras.'}
            </Text>
          </TacticalCard>

          {/* Main Devotional Pearl Display */}
          {isLoadingPerlita ? (
            <TacticalCard style={styles.pearlLoadingCard} padding={32}>
              <ActivityIndicator size="large" color={Theme.colors.tacticalNavy} />
              <Text style={styles.pearlLoadingText}>Obteniendo versículo devocional...</Text>
            </TacticalCard>
          ) : perlitaError ? (
            <TacticalCard style={styles.errorContainer} padding={20}>
              <Text style={styles.errorText}>{perlitaError}</Text>
              <TacticalButton
                title="Reintentar"
                onPress={loadDailyPerlita}
                variant="primary"
                size="sm"
                style={{ marginTop: 12 }}
              />
            </TacticalCard>
          ) : perlita ? (
            <TacticalCard style={styles.devotionalCard} padding={20}>
              <View style={styles.devotionalDateRow}>
                <Text style={styles.devotionalDate}>{perlita.date}</Text>
                <View style={styles.pddptPill}>
                  <Text style={styles.pddptPillText}>{perlita.translation}</Text>
                </View>
              </View>

              <Text style={styles.devotionalQuote}>
                “{perlita.text}”
              </Text>

              <View style={styles.devotionalFooter}>
                <Text style={styles.devotionalReference}>
                  {perlita.reference}
                </Text>
                <Text style={styles.devotionalAttribution}>
                  {perlita.attribution ||
                    'Palabra de Dios para ti © 2020 Asociación Bíblica Latinoamericana'}
                </Text>
              </View>

              {/* Devotional Action Row */}
              <View style={styles.devotionalActions}>
                <TouchableOpacity
                  style={styles.devotionalActionBtn}
                  onPress={() => handleNavigatePerlitaToBible(perlita)}
                  activeOpacity={0.8}
                >
                  <BookOpen size={16} color={Theme.colors.tacticalNavy} />
                  <Text style={styles.devotionalActionText}>Leer Capítulo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devotionalActionBtn}
                  onPress={() => handleSharePerlita(perlita)}
                  activeOpacity={0.8}
                >
                  <Share2 size={16} color={Theme.colors.tacticalNavy} />
                  <Text style={styles.devotionalActionText}>Compartir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.devotionalActionBtn}
                  onPress={() => togglePerlitaSaved(perlita.reference)}
                  activeOpacity={0.8}
                >
                  {savedPerlitas.has(perlita.reference) ? (
                    <BookmarkCheck size={16} color={Theme.colors.secondary} />
                  ) : (
                    <Bookmark size={16} color={Theme.colors.tacticalNavy} />
                  )}
                  <Text style={styles.devotionalActionText}>
                    {savedPerlitas.has(perlita.reference) ? 'Guardado' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Secondary Refresh / Reset Controls */}
              <View style={styles.pearlRefreshControls}>
                <TacticalButton
                  title="Nueva Perlita Aleatoria"
                  onPress={handleFetchRandomPerlita}
                  variant="outline"
                  size="md"
                  leftIcon={<RefreshCw size={16} color={Theme.colors.tacticalNavy} />}
                  style={{ flex: 1 }}
                />

                {isRandomPerlita && (
                  <TacticalButton
                    title="Volver a la del Día"
                    onPress={loadDailyPerlita}
                    variant="surface"
                    size="md"
                    leftIcon={<RotateCcw size={16} color={Theme.colors.onSurfaceVariant} />}
                    style={{ flex: 1 }}
                  />
                )}
              </View>
            </TacticalCard>
          ) : null}

          {/* Inspirational Visual Quote Banner */}
          <View style={styles.inspirationalBanner}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvFOIfa5_YX7m-gBZvZ3Ccq4L5LnEbceandEwWrlBibzdXJ41R7hGFDI3kaBlZm9VdcJuIxxOr95LolJf1jV0bF9IH33mCFaUVG6nGxB7j1CP0Z0wTMAyNCdjugOagn7NiQHlopUkAJxSrR8c9hyfW1gi5ku5Kj2UBBYOSRGbh3NkgVY0j3fUwfu40SJNYNRpsK3UWledP1nlh0cy8-2KxzOCg0Ov6WvklJL6MhwjsN9OazjGei-dotw',
              }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTag}>SOSTÉN ESPIRITUAL EN EL PUESTO</Text>
              <Text style={styles.bannerQuote}>
                «La palabra de aliento a tiempo sostiene al centinela en la noche más fría.»
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 4. Discreet Floating Sticky Reading Toolbar (Only in Bible Tab) */}
      {activeTab === 'biblia' && (
        <View style={styles.floatingToolbarWrapper}>
          <View
            style={[
              styles.floatingToolbar,
              isTacticalRed ? styles.toolbarRed : styles.toolbarNavy,
            ]}
          >
            {/* Audio Narrator Button */}
            <TouchableOpacity
              style={styles.toolbarBtn}
              onPress={() => setIsAudioPlaying((p) => !p)}
              activeOpacity={0.8}
            >
              {isAudioPlaying ? (
                <VolumeX size={17} color="#FFFFFF" />
              ) : (
                <Volume2 size={17} color="#FFFFFF" />
              )}
              <View>
                <Text style={styles.toolbarBtnMicro}>AUDIO</Text>
                <Text style={styles.toolbarBtnText}>
                  {isAudioPlaying ? 'Pausar' : 'Narración'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Font Size Adjusters */}
            <View style={styles.fontSizeGroup}>
              <TouchableOpacity
                style={styles.fontAdjustBtn}
                onPress={decreaseFontSize}
                activeOpacity={0.7}
              >
                <Text style={styles.fontAdjustText}>A-</Text>
              </TouchableOpacity>
              <View style={styles.fontDivider} />
              <TouchableOpacity
                style={styles.fontAdjustBtn}
                onPress={increaseFontSize}
                activeOpacity={0.7}
              >
                <Text style={styles.fontAdjustText}>A+</Text>
              </TouchableOpacity>
            </View>

            {/* Tactical Red Dim / Night Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.redModeBtn,
                isTacticalRed && styles.redModeBtnActive,
              ]}
              onPress={() => setIsTacticalRed((r) => !r)}
              activeOpacity={0.8}
            >
              <Eye size={16} color="#FFFFFF" />
              <Text style={styles.redModeText}>
                {isTacticalRed ? 'Normal' : 'Luz Roja'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. Book & Chapter Picker Modal (66 Canonical Books) */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Canon Bíblico PDDPT</Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Search Books Input */}
            <View style={styles.bookSearchInputWrapper}>
              <Search size={16} color={Theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.bookSearchInput}
                placeholder="Buscar libro (ej. Salmos, Juan, Romanos)..."
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                value={bookSearchQuery}
                onChangeText={setBookSearchQuery}
                autoCorrect={false}
              />
              {bookSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBookSearchQuery('')}>
                  <X size={16} color={Theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>

            {/* Testament Filter Tabs */}
            <View style={styles.testamentFiltersRow}>
              <TouchableOpacity
                style={[
                  styles.testamentFilterBtn,
                  testamentFilter === 'ALL' && styles.testamentFilterBtnActive,
                ]}
                onPress={() => setTestamentFilter('ALL')}
              >
                <Text
                  style={[
                    styles.testamentFilterText,
                    testamentFilter === 'ALL' && styles.testamentFilterTextActive,
                  ]}
                >
                  Todos ({books.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testamentFilterBtn,
                  testamentFilter === 'OT' && styles.testamentFilterBtnActive,
                ]}
                onPress={() => setTestamentFilter('OT')}
              >
                <Text
                  style={[
                    styles.testamentFilterText,
                    testamentFilter === 'OT' && styles.testamentFilterTextActive,
                  ]}
                >
                  Antiguo (39)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testamentFilterBtn,
                  testamentFilter === 'NT' && styles.testamentFilterBtnActive,
                ]}
                onPress={() => setTestamentFilter('NT')}
              >
                <Text
                  style={[
                    styles.testamentFilterText,
                    testamentFilter === 'NT' && styles.testamentFilterTextActive,
                  ]}
                >
                  Nuevo (27)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Books Chips Row */}
            <Text style={styles.modalSectionTitle}>LIBROS CANÓNICOS</Text>
            <ScrollView
              style={styles.modalBooksList}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {filteredBooks.map((book) => {
                const isSelected =
                  selectedBookCode.toUpperCase() === book.code.toUpperCase();
                return (
                  <TouchableOpacity
                    key={book.code}
                    style={[styles.bookChip, isSelected && styles.bookChipActive]}
                    onPress={() => {
                      setSelectedBookCode(book.code);
                      setSelectedChapterNumber(1);
                      setSelectedVerseNumber('1');
                    }}
                  >
                    <Text
                      style={[
                        styles.bookChipText,
                        isSelected && styles.bookChipTextActive,
                      ]}
                    >
                      {book.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Chapters Grid for Currently Selected Book */}
            <Text style={styles.modalSectionTitle}>
              CAPÍTULOS DE {currentBook.name.toUpperCase()} ({currentBook.totalChapters})
            </Text>
            <ScrollView style={styles.modalChaptersGrid}>
              <View style={styles.chaptersGridInner}>
                {Array.from({ length: currentBook.totalChapters }, (_, i) => i + 1).map(
                  (chapNum) => {
                    const isSelected = selectedChapterNumber === chapNum;
                    return (
                      <TouchableOpacity
                        key={chapNum}
                        style={[
                          styles.chapterSquare,
                          isSelected && styles.chapterSquareActive,
                        ]}
                        onPress={() => {
                          setSelectedChapterNumber(chapNum);
                          setSelectedVerseNumber('1');
                          setShowPickerModal(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.chapterSquareText,
                            isSelected && styles.chapterSquareTextActive,
                          ]}
                        >
                          {chapNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 6. Scripture Full-Text Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '85%' }, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscador de las Escrituras</Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarRow}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Ingresá palabra o frase (ej. paz, pastor, esperanza)..."
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoFocus
              />
              <TacticalButton
                title={isSearching ? '...' : 'Buscar'}
                onPress={handleSearchSubmit}
                loading={isSearching}
                variant="primary"
                size="sm"
                style={{ minWidth: 70 }}
              />
            </View>

            <ScrollView style={styles.searchResultsList} showsVerticalScrollIndicator={false}>
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />
                  <Text style={styles.loadingText}>Buscando en los 66 libros...</Text>
                </View>
              ) : hasSearched && searchResults.length === 0 ? (
                <View style={styles.emptyResultsContainer}>
                  <Text style={styles.emptyResultsTitle}>Sin coincidencias</Text>
                  <Text style={styles.emptyResultsSubtitle}>
                    Probá con términos bíblicos alternativos (ej. amor, justicia, escudo).
                  </Text>
                </View>
              ) : (
                searchResults.map((verse, idx) => (
                  <TouchableOpacity
                    key={`${verse.bookCode}_${verse.chapter}_${verse.verse}_${idx}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(verse)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.searchResultTop}>
                      <Text style={styles.searchResultRef}>{verse.reference}</Text>
                      <ArrowRight size={14} color={Theme.colors.secondary} />
                    </View>
                    <Text style={styles.searchResultSnippet} numberOfLines={2}>
                      «{verse.text}»
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
  },
  segmentedTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerLow,
    gap: 8,
  },
  segmentBtnActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  segmentBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  contextCard: {
    marginBottom: 10,
  },
  tacticalRedCard: {
    backgroundColor: Theme.colors.tacticalRedSurface,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contextTextWrapper: {
    flex: 1,
  },
  contextTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
  },
  contextSubtitle: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    marginTop: 2,
  },
  searchIconButton: {
    padding: 8,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainer,
  },
  selectorCard: {
    marginBottom: 12,
  },
  selectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorCol: {
    flex: 1,
    paddingHorizontal: 6,
  },
  selectorLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    marginBottom: 2,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectorValue: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
  },
  momentsSection: {
    marginBottom: 14,
  },
  momentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  momentsTitle: {
    ...globalStyles.labelCaps,
    fontSize: 9,
  },
  momentsCount: {
    ...globalStyles.labelCaps,
    fontSize: 9,
  },
  momentsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  momentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    gap: 6,
  },
  momentPillNormal: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  momentPillRed: {
    backgroundColor: Theme.colors.tacticalRedSurface,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  momentText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
  },
  sanctuaryCard: {
    borderRadius: Theme.roundness.xl,
    padding: 16,
    marginBottom: 16,
    ...globalStyles.shadowSm,
  },
  sanctuaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    marginBottom: 14,
  },
  sanctuaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sanctuaryTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
  },
  sanctuaryBadge: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  sanctuaryBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.secondary,
  },
  sanctuaryMeta: {
    ...globalStyles.labelCaps,
    fontSize: 9,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    ...globalStyles.bodySm,
    fontSize: 11,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: Theme.colors.errorContainer,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  versesStream: {
    gap: 10,
  },
  verseBlock: {
    padding: 8,
    borderRadius: Theme.roundness.md,
  },
  verseBlockSelected: {
    backgroundColor: Theme.colors.secondaryContainer,
  },
  verseBlockRedSelected: {
    backgroundColor: '#3B1212',
  },
  verseBlockHighlighted: {
    backgroundColor: '#FEF3C7',
  },
  verseText: {
    fontFamily: Theme.fonts.headline,
  },
  verseSuperscript: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
  },
  savedMarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  savedMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.secondary,
  },
  savedMarkerText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
  },
  toolsPanel: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 10,
    marginTop: 12,
  },
  toolsPanelHeader: {
    marginBottom: 8,
  },
  toolsPanelTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
  },
  toolsButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingVertical: 8,
    borderRadius: Theme.roundness.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toolBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurface,
  },
  attributionFootnote: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  attributionText: {
    ...globalStyles.bodySm,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  pastoralNote: {
    flexDirection: 'row',
    backgroundColor: '#EBF3FB',
    borderRadius: Theme.roundness.md,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  pastoralNoteContent: {
    flex: 1,
  },
  pastoralNoteTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    marginBottom: 3,
  },
  pastoralNoteText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
  },
  dutyCard: {
    height: 120,
    borderRadius: Theme.roundness.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  dutyImage: {
    ...StyleSheet.absoluteFillObject,
  },
  dutyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 28, 44, 0.65)',
  },
  dutyContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 14,
  },
  dutyTag: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  dutyHeading: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 2,
  },
  // Perlita Specific Styles
  perlitaHeaderCard: {
    marginBottom: 16,
  },
  perlitaTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  serenityBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.onSurface,
  },
  perlitaMainTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  perlitaSub: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  pearlLoadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pearlLoadingText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  devotionalCard: {
    marginBottom: 16,
  },
  devotionalDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  devotionalDate: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
  },
  pddptPill: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pddptPillText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurface,
  },
  devotionalQuote: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    lineHeight: 28,
    color: Theme.colors.onSurface,
    marginBottom: 14,
  },
  devotionalFooter: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    marginBottom: 16,
  },
  devotionalReference: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.tacticalNavy,
    marginBottom: 4,
  },
  devotionalAttribution: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 14,
  },
  devotionalActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  devotionalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    gap: 6,
  },
  devotionalActionText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurface,
  },
  pearlRefreshControls: {
    flexDirection: 'row',
    gap: 10,
  },
  inspirationalBanner: {
    height: 120,
    borderRadius: Theme.roundness.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 30, 48, 0.65)',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  bannerTag: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: '#D4E3FF',
    marginBottom: 2,
  },
  bannerQuote: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  // Floating Toolbar
  floatingToolbarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  floatingToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 440,
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.xl,
    ...globalStyles.shadowMd,
  },
  toolbarNavy: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  toolbarRed: {
    backgroundColor: '#7F1D1D',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.sm,
  },
  toolbarBtnMicro: {
    ...globalStyles.labelCaps,
    fontSize: 7,
    color: '#CBD5E1',
  },
  toolbarBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  fontSizeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Theme.roundness.sm,
    paddingHorizontal: 4,
  },
  fontAdjustBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  fontAdjustText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  fontDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  redModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.sm,
  },
  redModeBtnActive: {
    backgroundColor: Theme.colors.error,
  },
  redModeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  bookSearchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    borderRadius: Theme.roundness.md,
    marginBottom: 12,
    gap: 8,
    height: 40,
  },
  bookSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  testamentFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  testamentFilterBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
  },
  testamentFilterBtnActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  testamentFilterText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  testamentFilterTextActive: {
    color: '#FFFFFF',
  },
  modalSectionTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginBottom: 8,
    marginTop: 4,
  },
  modalBooksList: {
    maxHeight: 48,
    marginBottom: 14,
  },
  bookChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    marginRight: 8,
    height: 38,
    justifyContent: 'center',
  },
  bookChipActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  bookChipText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  bookChipTextActive: {
    color: '#FFFFFF',
  },
  modalChaptersGrid: {
    maxHeight: 180,
  },
  chaptersGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chapterSquare: {
    width: 44,
    height: 44,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterSquareActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  chapterSquareText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  chapterSquareTextActive: {
    color: '#FFFFFF',
  },
  // Search Modal
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modalSearchInput: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Theme.colors.onSurface,
    height: 42,
  },
  searchResultsList: {
    maxHeight: 340,
  },
  emptyResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyResultsTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  emptyResultsSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  searchResultItem: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  searchResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.tacticalNavy,
  },
  searchResultSnippet: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
});
