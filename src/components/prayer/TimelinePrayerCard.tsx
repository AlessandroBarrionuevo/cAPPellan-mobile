import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Heart, MessageSquare, ChevronDown, Sparkles } from 'lucide-react-native';
import { Theme } from '../../theme/Theme';
import type { Prayer } from '../../types/prayer';
import type { Gratitude } from '../../types/gratitude';

export type TimelineCardItem = Prayer | Gratitude;

export interface TimelinePrayerCardProps {
  item: TimelineCardItem;
  index: number;
  isJoined: boolean;
  onPray: (id: number) => void;
  onOpenComments?: (item: any) => void;
  onPressCard?: (item: any) => void;
  showConnector?: boolean;
  variant?: 'prayer' | 'gratitude';
}

export const TimelinePrayerCard = React.memo(function TimelinePrayerCard({
  item,
  index,
  isJoined,
  onPray,
  onOpenComments,
  onPressCard,
  showConnector = true,
  variant = 'prayer',
}: TimelinePrayerCardProps) {
  const isGratitude = variant === 'gratitude';

  const displayTitle =
    item.title && !item.title.endsWith('...')
      ? item.title
      : item.isAnonymous
      ? (isGratitude ? 'Testimonio de Gratitud' : 'Petición en Cobertura')
      : (isGratitude ? `Gratitud de ${item.authorName || 'Camarada'}` : `Petición de ${item.authorName || 'Camarada'}`);

  const authorSubtitle = isGratitude
    ? `${item.isAnonymous ? 'Oficial Reservado' : (item.authorName || 'Camarada')} • Testimonio`
    : `${item.isAnonymous ? 'Oficial Reservado' : (item.authorName || 'Camarada')} • En Cobertura`;

  const dateFormatted = isGratitude
    ? `${new Date(item.createdAt).toLocaleDateString('es-AR')} • Testimonio de Fe`
    : `${new Date(item.createdAt).toLocaleDateString('es-AR')} • Activa`;

  // Bullets: description + date (or custom content if present)
  const bulletItems = useMemo(() => {
    if (Array.isArray(item.content) && item.content.length > 0) {
      return item.content;
    }
    const lines: string[] = [];
    if (item.description) {
      lines.push(item.description);
    }
    lines.push(dateFormatted);
    return lines;
  }, [item, dateFormatted]);

  const actionCount = isGratitude
    ? ((item as Gratitude).gratitudeCount ?? item.prayerCount ?? 0)
    : (item.prayerCount ?? 0);

  return (
    <View style={styles.timelineRow}>
      {/* 1. Left Column: Compact Number Circle + Connector Line */}
      <View style={styles.timelineCol}>
        <View style={[styles.timelineCircle, isGratitude && styles.timelineCircleGratitude]}>
          <Text style={styles.timelineNumberText}>{index + 1}</Text>
        </View>

        {showConnector && (
          <View style={styles.timelineConnectorWrap}>
            <View style={styles.timelineConnectorLine} />
            <View style={styles.timelineArrowBadge}>
              <ChevronDown size={10} color="#94A3B8" />
            </View>
            <View style={styles.timelineConnectorLine} />
          </View>
        )}
      </View>

      {/* 2. Right Column: White Rounded Card with Tap to View Modal */}
      <TouchableOpacity
        style={styles.timelineCard}
        activeOpacity={onPressCard ? 0.88 : 1}
        onPress={() => onPressCard?.(item)}
      >
        {/* Main Card Content */}
        <View style={styles.timelineCardBody}>
          <View style={styles.timelineCardHeader}>
            <View style={styles.timelineTitleCol}>
              <Text style={styles.timelineCardTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
              <Text
                style={[
                  styles.timelineCardAuthorSub,
                  isGratitude && styles.timelineCardAuthorSubGratitude,
                ]}
              >
                {authorSubtitle}
              </Text>
            </View>
          </View>

          {/* Bullet Points */}
          <View style={styles.timelineBulletsList}>
            {bulletItems.map((bullet, idx) => (
              <View key={idx} style={styles.timelineBulletRow}>
                <Text
                  style={[
                    styles.timelineBulletText,
                    idx === 0 && styles.timelineBulletTextPrimary,
                  ]}
                  numberOfLines={idx === 0 ? 3 : 1}
                >
                  {bullet}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Stacked Right Buttons: Action above, Comment with Counter below */}
        <View style={styles.timelineActionCol}>
          {/* Top Button: Heart for Prayer / Sparkles for Gratitude */}
          <TouchableOpacity
            style={[
              styles.timelineHeartBtn,
              isGratitude && styles.timelineGratitudeBtn,
              isJoined &&
                (isGratitude
                  ? styles.timelineGratitudeBtnActive
                  : styles.timelineHeartBtnActive),
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onPray(item.id);
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {isGratitude ? (
              <Sparkles
                size={17}
                color={isJoined ? '#D97706' : '#64748B'}
              />
            ) : (
              <Heart
                size={17}
                color={isJoined ? '#EF4444' : '#64748B'}
                fill={isJoined ? '#EF4444' : 'transparent'}
              />
            )}
            <Text
              style={[
                styles.timelineActionCount,
                isJoined &&
                  (isGratitude
                    ? styles.timelineActionCountGratitudeActive
                    : styles.timelineActionCountActive),
              ]}
            >
              {actionCount}
            </Text>
          </TouchableOpacity>

          {/* Bottom Button: Comment with Comment Counter */}
          <TouchableOpacity
            style={[
              styles.timelineCommentBtn,
              isGratitude && styles.timelineCommentBtnGratitude,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (onOpenComments) {
                onOpenComments(item);
              } else if (onPressCard) {
                onPressCard(item);
              }
            }}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MessageSquare
              size={16}
              color={isGratitude ? '#D97706' : Theme.colors.primary}
            />
            <Text
              style={[
                styles.timelineCommentCount,
                isGratitude && styles.timelineCommentCountGratitude,
              ]}
            >
              {item.commentCount ?? 0}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 4,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 12,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary, // App brand blue (#0c7ae0)
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timelineCircleGratitude: {
    backgroundColor: '#D97706', // Warm Amber for gratitude
  },
  timelineNumberText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  timelineConnectorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 36,
    position: 'relative',
  },
  timelineConnectorLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
  timelineArrowBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    padding: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  timelineCardBody: {
    flex: 1,
    paddingRight: 10,
  },
  timelineCardHeader: {
    marginBottom: 6,
  },
  timelineTitleCol: {
    flex: 1,
  },
  timelineCardTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  timelineCardAuthorSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  timelineCardAuthorSubGratitude: {
    color: '#D97706',
  },
  timelineBulletsList: {
    gap: 3,
    marginTop: 2,
  },
  timelineBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  timelineBulletDot: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  timelineBulletText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  timelineBulletTextPrimary: {
    color: '#1E293B',
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  timelineActionCol: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  timelineHeartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  timelineHeartBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  timelineGratitudeBtn: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  timelineGratitudeBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  timelineActionCount: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  timelineActionCountActive: {
    color: '#EF4444',
  },
  timelineActionCountGratitudeActive: {
    color: '#D97706',
  },
  timelineCommentBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  timelineCommentBtnGratitude: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  timelineCommentCount: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: Theme.colors.primary,
    marginTop: 1,
  },
  timelineCommentCountGratitude: {
    color: '#D97706',
  },
});

export default TimelinePrayerCard;
