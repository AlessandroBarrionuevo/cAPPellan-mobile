import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { BIBLE_DATA } from '../data/bibleData';
import {
  TacticalCard,
  FilterPills,
} from '../components/common';
import {
  BookOpen,
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
  Check,
} from 'lucide-react-native';

const THEMATIC_MOMENTS = [
  { id: 'peligro', label: 'En Peligro', bookId: 'salmos', chapter: 91 },
  { id: 'noche', label: 'Paz en la Noche', bookId: 'salmos', chapter: 23 },
  { id: 'justicia', label: 'Valor y Justicia', bookId: 'proverbios', chapter: 3 },
  { id: 'duelo', label: 'Duelo y Pérdida', bookId: 'juan', chapter: 14 },
  { id: 'hogar', label: 'Protección del Hogar', bookId: 'filipenses', chapter: 4 },
];

export default function LecturaScreen() {
  const { width } = useWindowDimensions();

  // Bible State
  const [selectedBookIndex, setSelectedBookIndex] = useState(1); // Default to Salmos (index 1 in bibleData)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(1); // Default to Salmo 91
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number>(2);
  const [highlightedVerses, setHighlightedVerses] = useState<Set<number>>(new Set([2]));
  const [savedToLogbook, setSavedToLogbook] = useState<Set<number>>(new Set([2]));

  // Reader Settings
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [isTacticalRed, setIsTacticalRed] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const currentBook = BIBLE_DATA[selectedBookIndex] || BIBLE_DATA[0];
  const currentChapter =
    currentBook.chapters[selectedChapterIndex] || currentBook.chapters[0];

  const handleSelectThematic = (shortcutId: string) => {
    const moment = THEMATIC_MOMENTS.find((m) => m.id === shortcutId);
    if (!moment) return;

    const bookIdx = BIBLE_DATA.findIndex((b) => b.id === moment.bookId);
    if (bookIdx !== -1) {
      const chapIdx = BIBLE_DATA[bookIdx].chapters.findIndex(
        (c) => c.chapter === moment.chapter
      );
      setSelectedBookIndex(bookIdx);
      setSelectedChapterIndex(chapIdx !== -1 ? chapIdx : 0);
      setSelectedVerseNumber(1);
    }
  };

  const toggleHighlight = (verseNum: number) => {
    setHighlightedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const toggleLogbook = (verseNum: number) => {
    setSavedToLogbook((prev) => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const handleShareVerse = async (verseNum: number, verseText: string) => {
    try {
      await Share.share({
        message: `«${verseText}» — ${currentBook.name} ${currentChapter.chapter}:${verseNum}\n\nCapellanAPP · Manual de Vida y Servicio`,
      });
    } catch (e) {
      // Ignored
    }
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
    currentChapter.verses.find((v) => v.num === selectedVerseNumber)?.text || '';

  // Theme overrides for Tactical Red Dim Mode
  const bg = isTacticalRed ? Theme.colors.tacticalRedBg : Theme.colors.background;
  const sanctuaryBg = isTacticalRed
    ? Theme.colors.tacticalRedSurface
    : Theme.colors.surfaceContainerLowest;
  const textColor = isTacticalRed ? Theme.colors.tacticalRedText : Theme.colors.onSurface;
  const subtextColor = isTacticalRed ? '#B91C1C' : Theme.colors.onSurfaceVariant;

  return (
    <View style={[styles.outerWrapper, { backgroundColor: bg }]}>
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
                {currentBook.name} {currentChapter.chapter} · RVR 1960
              </Text>
            </View>
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
                <Text style={[styles.selectorValue, { color: textColor }]}>
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
                  Cap. {currentChapter.chapter}
                </Text>
                <ChevronDown size={14} color={subtextColor} />
              </View>
            </TouchableOpacity>

            <View style={styles.selectorCol}>
              <Text style={[styles.selectorLabel, { color: subtextColor }]}>VERSIÓN</Text>
              <Text style={[styles.selectorValue, { color: textColor }]}>RVR 1960</Text>
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentsRow}>
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
                <Shield size={12} color={isTacticalRed ? Theme.colors.tacticalRedText : Theme.colors.tacticalNavy} />
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
                {currentBook.name} {currentChapter.chapter}
              </Text>
              <View style={styles.sanctuaryBadge}>
                <Text style={styles.sanctuaryBadgeText}>MORADA SEGURA</Text>
              </View>
            </View>
            <Text style={[styles.sanctuaryMeta, { color: subtextColor }]}>
              TEXTO ÍNTEGRO
            </Text>
          </View>

          {/* Verses Stream */}
          <View style={styles.versesStream}>
            {currentChapter.verses.map((v) => {
              const isSelected = selectedVerseNumber === v.num;
              const isHighlighted = highlightedVerses.has(v.num);
              const isSaved = savedToLogbook.has(v.num);

              return (
                <TouchableOpacity
                  key={v.num}
                  style={[
                    styles.verseBlock,
                    isSelected &&
                      (isTacticalRed ? styles.verseBlockRedSelected : styles.verseBlockSelected),
                    isHighlighted && !isSelected && styles.verseBlockHighlighted,
                  ]}
                  onPress={() => setSelectedVerseNumber(v.num)}
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
                      {v.num}{' '}
                    </Text>
                    {v.text}
                  </Text>

                  {isSaved && (
                    <View style={styles.savedMarkerRow}>
                      <View style={styles.savedMarkerDot} />
                      <Text style={[styles.savedMarkerText, { color: subtextColor }]}>
                        SUBRAYADO PERSONAL • GUARDADO EN BITÁCORA
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Verse Tactical Tools Panel */}
          {selectedVerseNumber && (
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
          )}

          {/* Field Chaplain Pastoral Reflection Note */}
          <View style={styles.pastoralNote}>
            <ShieldCheck size={20} color={Theme.colors.secondary} style={{ marginTop: 2 }} />
            <View style={styles.pastoralNoteContent}>
              <Text style={[styles.pastoralNoteTitle, { color: textColor }]}>
                Nota Pastoral del Capellán de Turno
              </Text>
              <Text style={[styles.pastoralNoteText, { color: subtextColor }]}>
                «El término hebreo <Text style={{ fontStyle: 'italic' }}>Metzudá</Text> (castillo/fortaleza) designa una posición elevada e inexpugnable. Cuando estés en guardia, mantén tu espíritu en esta misma convicción: no dependes únicamente del blindaje exterior, sino del resguardo supremo.»
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

      {/* Discreet Floating Sticky Reading Toolbar */}
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
              {isTacticalRed ? 'Modo Normal' : 'Luz Roja'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Book & Chapter Picker Modal */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Pasaje</Text>
              <TouchableOpacity onPress={() => setShowPickerModal(false)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>LIBROS</Text>
            <ScrollView style={styles.modalBooksList} horizontal showsHorizontalScrollIndicator={false}>
              {BIBLE_DATA.map((book, idx) => (
                <TouchableOpacity
                  key={book.id}
                  style={[
                    styles.bookChip,
                    selectedBookIndex === idx && styles.bookChipActive,
                  ]}
                  onPress={() => {
                    setSelectedBookIndex(idx);
                    setSelectedChapterIndex(0);
                  }}
                >
                  <Text
                    style={[
                      styles.bookChipText,
                      selectedBookIndex === idx && styles.bookChipTextActive,
                    ]}
                  >
                    {book.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalSectionTitle}>CAPÍTULOS</Text>
            <ScrollView style={styles.modalChaptersGrid}>
              <View style={styles.chaptersGridInner}>
                {currentBook.chapters.map((chap, idx) => (
                  <TouchableOpacity
                    key={chap.chapter}
                    style={[
                      styles.chapterSquare,
                      selectedChapterIndex === idx && styles.chapterSquareActive,
                    ]}
                    onPress={() => {
                      setSelectedChapterIndex(idx);
                      setSelectedVerseNumber(1);
                      setShowPickerModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.chapterSquareText,
                        selectedChapterIndex === idx && styles.chapterSquareTextActive,
                      ]}
                    >
                      {chap.chapter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 480,
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
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  modalSectionTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginBottom: 8,
    marginTop: 4,
  },
  modalBooksList: {
    marginBottom: 14,
  },
  bookChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    marginRight: 8,
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
});
