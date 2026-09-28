import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Modal,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { BIBLE_DATA, Book, Chapter } from '../../data/bibleData';
import { PERLITAS_DATA, Perlita } from '../../data/perlitasData';
import {
  BookOpen,
  Sparkles,
  ChevronDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
  X,
} from 'lucide-react-native';

export default function LecturaScreen() {
  const [activeTab, setActiveTab] = useState<'biblia' | 'perlitas'>('biblia');

  // Bible State
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [showPickerModal, setShowPickerModal] = useState(false);

  // Perlitas State
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const currentBook = BIBLE_DATA[selectedBookIndex] || BIBLE_DATA[0];
  const currentChapter =
    currentBook.chapters[selectedChapterIndex] || currentBook.chapters[0];

  const handleSharePerlita = async (perlita: Perlita) => {
    try {
      await Share.share({
        message: `"${perlita.phrase}" — ${perlita.author}${
          perlita.verseReference ? ` (${perlita.verseReference})` : ''
        }\n\nCompartido desde CapellanAPP`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredPerlitas =
    selectedCategory === 'Todas'
      ? PERLITAS_DATA
      : PERLITAS_DATA.filter((p) => p.category === selectedCategory);

  const categories = ['Todas', 'Paz', 'Esperanza', 'Fortaleza', 'Gratitud', 'Propósito'];

  return (
    <View style={styles.container}>
      {/* Top Segmented Tabs */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'biblia' && styles.tabButtonActive]}
          onPress={() => setActiveTab('biblia')}
          activeOpacity={0.8}
        >
          <BookOpen
            size={18}
            color={activeTab === 'biblia' ? Theme.colors.primary : Theme.colors.outline}
            strokeWidth={activeTab === 'biblia' ? 2.5 : 2}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'biblia' && styles.tabButtonTextActive,
            ]}
          >
            Biblia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'perlitas' && styles.tabButtonActive]}
          onPress={() => setActiveTab('perlitas')}
          activeOpacity={0.8}
        >
          <Sparkles
            size={18}
            color={activeTab === 'perlitas' ? Theme.colors.primary : Theme.colors.outline}
            strokeWidth={activeTab === 'perlitas' ? 2.5 : 2}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'perlitas' && styles.tabButtonTextActive,
            ]}
          >
            Perlitas
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. SECCIÓN BIBLIA */}
      {activeTab === 'biblia' && (
        <View style={styles.contentFlex}>
          {/* Chapter Selector Header */}
          <View style={styles.selectorBar}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowPickerModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.selectorText}>
                {currentBook.name} {currentChapter.chapter}
              </Text>
              <ChevronDown size={18} color={Theme.colors.outline} />
            </TouchableOpacity>
          </View>

          {/* Verses Reading Area */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.chapterTitle}>
              {currentBook.name} {currentChapter.chapter}
            </Text>

            <View style={styles.versesContainer}>
              {currentChapter.verses.map((verse) => (
                <View key={verse.num} style={styles.verseRow}>
                  <Text style={styles.verseParagraph}>
                    <Text style={styles.verseNumber}>{verse.num} </Text>
                    <Text style={styles.verseText}>{verse.text}</Text>
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.endMark}>
              <View style={styles.dot} />
            </View>
          </ScrollView>

          {/* Modal selector for Book and Chapter */}
          <Modal visible={showPickerModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, globalStyles.shadowSoft]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Elegir Libro y Capítulo</Text>
                  <TouchableOpacity
                    onPress={() => setShowPickerModal(false)}
                    style={styles.closeBtn}
                  >
                    <X size={20} color={Theme.colors.outline} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {BIBLE_DATA.map((book, bIdx) => (
                    <View key={book.id} style={styles.bookPickerGroup}>
                      <Text style={styles.bookPickerTitle}>{book.name}</Text>
                      <View style={styles.chaptersGrid}>
                        {book.chapters.map((chap, cIdx) => {
                          const isSelected =
                            selectedBookIndex === bIdx &&
                            selectedChapterIndex === cIdx;
                          return (
                            <TouchableOpacity
                              key={chap.chapter}
                              style={[
                                styles.chapterChip,
                                isSelected && styles.chapterChipSelected,
                              ]}
                              onPress={() => {
                                setSelectedBookIndex(bIdx);
                                setSelectedChapterIndex(cIdx);
                                setShowPickerModal(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.chapterChipText,
                                  isSelected && styles.chapterChipTextSelected,
                                ]}
                              >
                                {chap.chapter}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* 2. SECCIÓN PERLITAS (FRASES MOTIVACIONALES) */}
      {activeTab === 'perlitas' && (
        <View style={styles.contentFlex}>
          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            style={styles.categoriesBar}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards List */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.perlitasScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredPerlitas.map((perlita) => {
              const isFav = favorites.has(perlita.id);
              return (
                <View
                  key={perlita.id}
                  style={[styles.perlitaCard, globalStyles.shadowSoft]}
                >
                  {/* Category & Verse Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {perlita.category}
                      </Text>
                    </View>
                    {perlita.verseReference && (
                      <Text style={styles.verseRefText}>
                        {perlita.verseReference}
                      </Text>
                    )}
                  </View>

                  {/* Main Quote Phrase */}
                  <Text style={styles.quoteText}>"{perlita.phrase}"</Text>

                  {/* Author / Source */}
                  <Text style={styles.authorText}>— {perlita.author}</Text>

                  {/* Action Buttons */}
                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSharePerlita(perlita)}
                      activeOpacity={0.7}
                    >
                      <Share2 size={18} color={Theme.colors.primary} />
                      <Text style={styles.actionButtonText}>Compartir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => toggleFavorite(perlita.id)}
                      activeOpacity={0.7}
                    >
                      {isFav ? (
                        <BookmarkCheck size={18} color={Theme.colors.secondary} />
                      ) : (
                        <Bookmark size={18} color={Theme.colors.outline} />
                      )}
                      <Text
                        style={[
                          styles.actionButtonText,
                          isFav && { color: Theme.colors.secondary, fontWeight: '700' },
                        ]}
                      >
                        {isFav ? 'Guardada' : 'Guardar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentFlex: {
    flex: 1,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    marginHorizontal: Theme.spacing.containerPadding,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: Theme.roundness.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Theme.roundness.sm,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  tabButtonText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  selectorBar: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(115, 117, 128, 0.08)',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  selectorText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.primary,
    marginRight: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding + 8,
    paddingTop: Theme.spacing.stackLg,
    paddingBottom: 120,
  },
  chapterTitle: {
    ...globalStyles.displayLg,
    textAlign: 'center',
    marginBottom: Theme.spacing.stackLg,
    fontSize: 28,
  },
  versesContainer: {
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  verseRow: {
    marginBottom: Theme.spacing.stackMd,
  },
  verseParagraph: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    lineHeight: 34,
    color: Theme.colors.onSurface,
  },
  verseNumber: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.outline,
  },
  verseText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    lineHeight: 34,
    color: Theme.colors.onSurface,
  },
  endMark: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.outline,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    color: Theme.colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  bookPickerGroup: {
    marginBottom: 20,
  },
  bookPickerTitle: {
    ...globalStyles.headlineMd,
    fontSize: 16,
    color: Theme.colors.primary,
    marginBottom: 10,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chapterChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterChipSelected: {
    backgroundColor: Theme.colors.primary,
  },
  chapterChipText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  chapterChipTextSelected: {
    color: '#FFFFFF',
  },
  categoriesBar: {
    maxHeight: 48,
    marginVertical: 6,
  },
  categoriesContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#F0F4F8',
  },
  categoryPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  categoryPillText: {
    ...globalStyles.bodySm,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  perlitasScrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 16,
  },
  perlitaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  categoryBadgeText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSecondaryContainer,
    fontSize: 10,
  },
  verseRefText: {
    ...globalStyles.bodySm,
    color: Theme.colors.outline,
    fontSize: 12,
    fontStyle: 'italic',
  },
  quoteText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    lineHeight: 28,
    color: Theme.colors.primary,
    marginBottom: 10,
  },
  authorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.primary,
  },
});
