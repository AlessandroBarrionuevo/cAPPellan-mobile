import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { ModernSocialContentCard } from '../content/ModernSocialContentCard';
import { Tv, Plus } from 'lucide-react-native';
import type { ContentItem } from '../../types/api';

interface ContentFeaturedWidgetProps {
  contents: ContentItem[];
  isLoading?: boolean;
  onLikeToggle: (contentId: number) => void;
  onOpenDetail?: (content: ContentItem) => void;
  onOpenComments: (content: ContentItem) => void;
  onNavigateToContent?: () => void;
}

export function ContentFeaturedWidget({
  contents,
  isLoading = false,
  onLikeToggle,
  onOpenDetail,
  onOpenComments,
  onNavigateToContent,
}: ContentFeaturedWidgetProps) {
  const displayedContents = contents.slice(0, 3);

  return (
    <View style={styles.contentWidgetSection}>
      <View style={styles.contentSectionHeader}>
        <View style={styles.contentSectionTitleCol}>
          <View style={styles.contentBadgeRow}>
            <Tv size={14} color="#0c7ae0" />
            <Text style={styles.contentBadgeText}>MULTIMEDIA& REFLEXIONES</Text>
          </View>
        </View>
        <Text style={styles.contentSectionTitle}>Contenidos Destacados</Text>
      </View>

      {isLoading && contents.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0c7ae0" />
          <Text style={styles.loadingText}>Cargando contenidos pastorales...</Text>
        </View>
      ) : (
        /* List of 3 Content Cards */
        <View style={styles.contentCardsList}>
          {displayedContents.map((item) => (
            <View key={item.id} style={styles.contentCardItemWrapper}>
              <ModernSocialContentCard
                content={item}
                onLikeToggle={onLikeToggle}
                onOpenDetail={() => {
                  if (onOpenDetail) {
                    onOpenDetail(item);
                  } else if (onNavigateToContent) {
                    onNavigateToContent();
                  }
                }}
                onOpenComments={onOpenComments}
              />
            </View>
          ))}
        </View>
      )}

      {/* '+ Ver más' button using timelineAddBtnRow format */}
      {onNavigateToContent && (
        <TouchableOpacity
          style={styles.timelineAddBtnRow}
          onPress={onNavigateToContent}
          activeOpacity={0.8}
        >
          <View style={styles.timelineAddCircle}>
            <Plus size={14} color={Theme.colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.timelineAddLabel}>Ver más contenidos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contentWidgetSection: {
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
  contentSectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap:6,
  },
  contentSectionTitleCol: {
    flexDirection: 'column',
    alignContent: 'space-between',
  },
  contentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contentBadgeText: {
    ...globalStyles.labelCaps,
    color: '#0c7ae0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  contentSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.3,
  },
  contentCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0c7ae0',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  contentCardsList: {
    gap: 14,
  },
  contentCardItemWrapper: {
    width: '100%',
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
    marginTop: 4,
  },
  timelineAddCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineAddLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.primary,
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
});
