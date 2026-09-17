import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { Search, Play, BookOpen, ChevronRight } from 'lucide-react-native';

export default function ContentScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Theme.colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar reflexiones, podcasts, sermones..."
            placeholderTextColor={Theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      {/* Featured Podcasts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Podcasts Destacados</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>VER TODOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardsGrid}>
          {/* Podcast Card 1 */}
          <View style={[styles.card, globalStyles.shadowSoft]}>
            <View style={styles.cardImageContainer}>
              <View style={[styles.cardImagePlaceholder, { backgroundColor: '#e2f0fd' }]} />
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>SERIE DE AUDIO</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>12 Oct, 2023</Text>
                <Text style={styles.cardMetaText}>45 min</Text>
              </View>
              <Text style={styles.cardTitle}>Encontrando Paz en el Caos</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                Una reflexión guiada para atravesar tiempos turbulentos apoyándose en la fe.
              </Text>
              <TouchableOpacity style={styles.cardAction}>
                <Play size={16} color={Theme.colors.secondary} style={styles.actionIcon} />
                <Text style={styles.actionText}>ESCUCHAR AHORA</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Podcast Card 2 */}
          <View style={[styles.card, globalStyles.shadowSoft]}>
            <View style={styles.cardImageContainer}>
              <View style={[styles.cardImagePlaceholder, { backgroundColor: '#e6fffa' }]} />
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>ENTREVISTA</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>05 Oct, 2023</Text>
                <Text style={styles.cardMetaText}>38 min</Text>
              </View>
              <Text style={styles.cardTitle}>Las Raíces de la Alegría</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                Conversaciones con capellanes sobre cómo cultivar paz sostenible día a día.
              </Text>
              <TouchableOpacity style={styles.cardAction}>
                <Play size={16} color={Theme.colors.secondary} style={styles.actionIcon} />
                <Text style={styles.actionText}>ESCUCHAR AHORA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Sermons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reflexiones Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>VER TODAS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {/* Sermon Item 1 */}
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIconContainer}>
              <BookOpen size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Caminando por el Valle</Text>
              <Text style={styles.listItemSubtitle}>Capellanía • Basado en Salmos 23</Text>
            </View>
            <View style={styles.listItemMeta}>
              <Text style={styles.listItemDate}>15 Oct</Text>
              <ChevronRight size={20} color={Theme.colors.outline} />
            </View>
          </TouchableOpacity>

          {/* Sermon Item 2 */}
          <TouchableOpacity style={styles.listItem}>
            <View style={styles.listIconContainer}>
              <BookOpen size={24} color={Theme.colors.primary} />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Gracia en lo Cotidiano</Text>
              <Text style={styles.listItemSubtitle}>Capellanía • Acompañamiento diario</Text>
            </View>
            <View style={styles.listItemMeta}>
              <Text style={styles.listItemDate}>08 Oct</Text>
              <ChevronRight size={20} color={Theme.colors.outline} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Theme.spacing.stackMd,
    paddingBottom: 120,
  },
  searchSection: {
    marginBottom: Theme.spacing.stackLg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    borderRadius: 9999,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  section: {
    marginBottom: Theme.spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.stackMd,
  },
  sectionTitle: {
    ...globalStyles.headlineLgMobile,
    color: Theme.colors.primary,
  },
  viewAllText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
  },
  cardsGrid: {
    gap: Theme.spacing.gutter,
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: Theme.spacing.stackSm,
    left: Theme.spacing.stackSm,
    backgroundColor: Theme.colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  badgeText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.primary,
  },
  cardContent: {
    padding: Theme.spacing.stackMd,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardMetaText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  cardTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    lineHeight: 28,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  cardDescription: {
    ...globalStyles.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: Theme.spacing.stackMd,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
  },
  listContainer: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EEFF',
  },
  listIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  listItemSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  listItemMeta: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  listItemDate: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
});
