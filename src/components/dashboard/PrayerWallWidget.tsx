import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { TimelinePrayerCard } from '../prayer/TimelinePrayerCard';
import { HeartHandshake, Plus, Sparkles } from 'lucide-react-native';
import type { Prayer } from '../../types/prayer';
import type { Gratitude } from '../../types/gratitude';

export interface PrayerWallWidgetProps {
  prayers: Prayer[];
  gratitudes?: Gratitude[];
  isLoading?: boolean;
  isLoadingGratitudes?: boolean;
  prayedIds: Set<number>;
  thankedIds?: Set<number>;
  onPray: (prayerId: number) => void;
  onThank?: (gratitudeId: number) => void;
  onNavigateToPrayers?: (initialTab?: 'prayer' | 'gratitude') => void;
  initialTab?: 'prayer' | 'gratitude';
}

export function PrayerWallWidget({
  prayers,
  gratitudes = [],
  isLoading = false,
  isLoadingGratitudes = false,
  prayedIds,
  thankedIds = new Set(),
  onPray,
  onThank,
  onNavigateToPrayers,
  initialTab = 'prayer',
}: PrayerWallWidgetProps) {
  const [activeTab, setActiveTab] = useState<'prayer' | 'gratitude'>(initialTab);

  const displayedPrayers = prayers.slice(0, 3);
  const displayedGratitudes = gratitudes.slice(0, 3);

  const currentLoading = activeTab === 'prayer' ? isLoading : isLoadingGratitudes;
  const currentList = activeTab === 'prayer' ? displayedPrayers : displayedGratitudes;

  return (
    <View style={styles.prayerWidgetSection}>
      {/* Header with Title and Mode Indicator */}
      <View style={styles.prayerSectionHeader}>
        <View style={styles.prayerSectionTitleCol}>
          <View style={styles.prayerBadgeRow}>
            {activeTab === 'prayer' ? (
              <>
                <HeartHandshake size={14} color="#0c7ae0" />
                <Text style={styles.prayerBadgeText}>COMUNIDAD EN ORACIÓN</Text>
              </>
            ) : (
              <>
                <Sparkles size={14} color="#D97706" />
                <Text style={[styles.prayerBadgeText, styles.gratitudeBadgeText]}>
                  MURO DE GRATITUD
                </Text>
              </>
            )}
          </View>
          <Text style={styles.prayerSectionTitle}>
            {activeTab === 'prayer' ? 'Muro de Oración' : 'Muro de Gratitud'}
          </Text>
        </View>
      </View>

      {/* Switcher Button: Oración vs Gratitud */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[
            styles.viewModeTab,
            activeTab === 'prayer' && styles.viewModeTabActive,
          ]}
          onPress={() => setActiveTab('prayer')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeTabText,
              activeTab === 'prayer' && styles.viewModeTabTextActive,
            ]}
          >
            Oración
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeTab,
            activeTab === 'gratitude' && styles.viewModeTabActive,
          ]}
          onPress={() => setActiveTab('gratitude')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeTabText,
              activeTab === 'gratitude' && styles.viewModeTabTextActiveGratitude,
            ]}
          >
            Gratitud
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      {currentLoading && currentList.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={activeTab === 'prayer' ? '#0c7ae0' : '#D97706'}
          />
          <Text style={styles.loadingText}>
            {activeTab === 'prayer'
              ? 'Cargando peticiones comunitarias...'
              : 'Cargando testimonios de gratitud...'}
          </Text>
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'prayer'
              ? 'No hay peticiones comunitarias registradas.'
              : 'No hay testimonios de gratitud aún. Sé el primero en compartir.'}
          </Text>
        </View>
      ) : (
        /* Timeline Cards List */
        <View style={styles.prayerTimelineList}>
          {activeTab === 'prayer'
            ? displayedPrayers.map((item, index) => {
                const isJoined = prayedIds.has(item.id);
                return (
                  <TimelinePrayerCard
                    key={`prayer-${item.id}`}
                    item={item}
                    index={index}
                    isJoined={isJoined}
                    variant="prayer"
                    onPray={onPray}
                    onPressCard={() => onNavigateToPrayers?.('prayer')}
                    onOpenComments={() => onNavigateToPrayers?.('prayer')}
                    showConnector={index < displayedPrayers.length - 1}
                  />
                );
              })
            : displayedGratitudes.map((item, index) => {
                const isThanked = thankedIds.has(item.id);
                return (
                  <TimelinePrayerCard
                    key={`gratitude-${item.id}`}
                    item={item}
                    index={index}
                    isJoined={isThanked}
                    variant="gratitude"
                    onPray={(id) => (onThank ? onThank(id) : onPray(id))}
                    onPressCard={() => onNavigateToPrayers?.('gratitude')}
                    onOpenComments={() => onNavigateToPrayers?.('gratitude')}
                    showConnector={index < displayedGratitudes.length - 1}
                  />
                );
              })}
        </View>
      )}

      {/* '+ Ver más' button using timelineAddBtnRow format */}
      {onNavigateToPrayers && (
        <TouchableOpacity
          style={styles.timelineAddBtnRow}
          onPress={() => onNavigateToPrayers(activeTab)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.timelineAddCircle,
              activeTab === 'gratitude' && styles.timelineAddCircleGratitude,
            ]}
          >
            <Plus
              size={14}
              color={activeTab === 'gratitude' ? '#D97706' : Theme.colors.primary}
              strokeWidth={2.5}
            />
          </View>
          <Text
            style={[
              styles.timelineAddLabel,
              activeTab === 'gratitude' && styles.timelineAddLabelGratitude,
            ]}
          >
            Ver más
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prayerWidgetSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  prayerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  prayerSectionTitleCol: {
    gap: 2,
  },
  prayerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerBadgeText: {
    ...globalStyles.labelCaps,
    color: '#0c7ae0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  gratitudeBadgeText: {
    color: '#D97706',
  },
  prayerSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.3,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 4,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  viewModeTabText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  viewModeTabTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#0c7ae0',
    fontWeight: '700',
  },
  viewModeTabTextActiveGratitude: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#D97706',
    fontWeight: '700',
  },
  prayerTimelineList: {
    gap: 0,
  },
  timelineAddBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 2,
  },
  timelineAddCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineAddCircleGratitude: {
    backgroundColor: '#FEF3C7',
  },
  timelineAddLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.primary,
  },
  timelineAddLabelGratitude: {
    color: '#D97706',
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Theme.fonts.body,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.fonts.body,
    textAlign: 'center',
    lineHeight: 18,
  },
});
