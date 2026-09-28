import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  Play,
  Pause,
  Square,
  ExternalLink,
  Headphones,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Check,
} from 'lucide-react-native';
import { Theme } from '../../theme/Theme';
import type { ContentItem } from '../../types/api';
import { formatRelativeTime } from './ContentCard';

export interface SpotifyPlayerCardProps {
  content: ContentItem;
  canManage?: boolean;
  onLikeToggle: (id: number) => void;
  onOpenDetail: (content: ContentItem) => void;
  onOpenComments?: (content: ContentItem) => void;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (content: ContentItem) => void;
  isLiking?: boolean;
}

const WAVEFORM_BARS = [8, 14, 22, 16, 26, 12, 28, 18, 10, 24, 15, 20, 10, 16, 22, 14];

export const SpotifyPlayerCard = React.memo(function SpotifyPlayerCard({
  content,
  canManage = false,
  onLikeToggle,
  onOpenDetail,
  onOpenComments,
  onEdit,
  onDelete,
  isLiking = false,
}: SpotifyPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOpenSpotify = async () => {
    if (!content.mediaUrl) {
      onOpenDetail(content);
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(content.mediaUrl);
      if (canOpen) {
        await Linking.openURL(content.mediaUrl);
      } else {
        onOpenDetail(content);
      }
    } catch {
      onOpenDetail(content);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
    if (!isPlaying && content.mediaUrl) {
      handleOpenSpotify();
    }
  };

  const handleMoreOptions = () => {
    const options: any[] = [
      { text: 'Abrir en Spotify', onPress: handleOpenSpotify },
      {
        text: 'Ver Comentarios',
        onPress: () => (onOpenComments ? onOpenComments(content) : onOpenDetail(content)),
      },
      { text: 'Ver Detalle Completo', onPress: () => onOpenDetail(content) },
    ];
    if (canManage && onEdit) {
      options.push({ text: 'Editar Publicación', onPress: () => onEdit(content) });
    }
    if (canManage && onDelete) {
      options.push({ text: 'Eliminar', style: 'destructive', onPress: () => onDelete(content) });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(content.title, 'Opciones de reproducción', options);
  };

  return (
    <View style={styles.cardContainer}>
      {/* ==================================================================== */}
      {/* 1. TOP AUTHOR HEADER (MATCHES OTHER POSTS IDENTITY)                  */}
      {/* ==================================================================== */}
      <View style={styles.topAuthorHeader}>
        <View style={styles.topAuthorLeft}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitial}>C</Text>
            </View>
          </View>

          <View style={styles.topTextCol}>
            <View style={styles.usernameRow}>
              <Text style={styles.usernameText}>capellania</Text>
              <View style={styles.verifiedBadge}>
                <Check size={9} color="#FFFFFF" strokeWidth={3.5} />
              </View>
            </View>
            <Text style={styles.subtitleCategory} numberOfLines={1}>
              Spotify • Podcast & Audio Devocional
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={handleMoreOptions}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreHorizontal size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* 2. PLAYER BODY: BLUE & WHITE RECORDER DESIGN                          */}
      {/* ==================================================================== */}
      {/* Overline Badge Pill */}
      <View style={styles.badgeRow}>
        <View style={styles.badgePill}>
          <Headphones size={12} color="#0c7ae0" />
          <Text style={styles.overlineText}>SPOTIFY AUDIO & PODCAST</Text>
        </View>
      </View>

      {/* Main Title (Headline) */}
      <TouchableOpacity activeOpacity={0.88} onPress={() => onOpenDetail(content)}>
        <Text style={styles.titleText} numberOfLines={2}>
          {content.title}
        </Text>
      </TouchableOpacity>

      {/* Subtitle / Description */}
      {content.description ? (
        <Text style={styles.descriptionText} numberOfLines={3}>
          {content.description}
        </Text>
      ) : null}

      {/* Timestamp / Needle Tracker Indicator */}
      <View style={styles.timestampRow}>
        <Text style={styles.timestampText}>
          {isPlaying ? '0:23:04' : '0:14:20'}
        </Text>
      </View>

      {/* Waveform Soundwave Box */}
      <TouchableOpacity
        style={styles.waveformContainer}
        activeOpacity={0.9}
        onPress={handleOpenSpotify}
      >
        {/* Left Waveform Bars (Played soundwave in Primary Blue) */}
        <View style={styles.waveformBarsRow}>
          {WAVEFORM_BARS.map((height, idx) => (
            <View
              key={idx}
              style={[
                styles.waveformBar,
                { height: isPlaying ? height : Math.max(6, height * 0.7) },
              ]}
            />
          ))}
        </View>

        {/* Center Needle Indicator in Primary Blue */}
        <View style={styles.needleWrapper}>
          <View style={styles.needleHeadDot} />
          <View style={styles.needleLine} />
        </View>

        {/* Right Unplayed Scrubber Line */}
        <View style={styles.unplayedScrubberLine} />
      </TouchableOpacity>

      {/* ==================================================================== */}
      {/* 3. BOTTOM CONTROLS BAR: CONTROLS CAPSULE + ACTION BUTTONS            */}
      {/* ==================================================================== */}
      <View style={styles.bottomControlsBar}>
        {/* Left Controls Capsule: Play, Pause, Stop */}
        <View style={styles.leftControlsCapsule}>
          {/* Play Triangle */}
          <TouchableOpacity
            style={styles.controlSubBtn}
            onPress={handleTogglePlay}
            activeOpacity={0.7}
          >
            <Play
              size={15}
              color={!isPlaying ? '#0c7ae0' : '#94A3B8'}
              fill={!isPlaying ? '#0c7ae0' : '#94A3B8'}
            />
          </TouchableOpacity>

          {/* Pause / Play Primary Blue Circle */}
          <TouchableOpacity
            style={[styles.pauseCircleBtn, isPlaying && styles.pauseCircleBtnActive]}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          {/* Stop Square */}
          <TouchableOpacity
            style={styles.controlSubBtn}
            onPress={() => setIsPlaying(false)}
            activeOpacity={0.7}
          >
            <Square size={13} color="#94A3B8" fill="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Right Controls: Like with Count, Comment with Count, Spotify Link */}
        <View style={styles.rightControlsRow}>
          {/* Heart / Like Button with Count */}
          <TouchableOpacity
            style={styles.actionWithCountBtn}
            onPress={() => onLikeToggle(content.id)}
            disabled={isLiking}
            activeOpacity={0.8}
          >
            <Heart
              size={17}
              color={content.isLikedByMe ? '#EF4444' : '#64748B'}
              fill={content.isLikedByMe ? '#EF4444' : 'transparent'}
            />
            <Text style={[styles.actionCountText, content.isLikedByMe && { color: '#EF4444' }]}>
              {content.likesCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment Button with Count */}
          <TouchableOpacity
            style={styles.actionWithCountBtn}
            onPress={() => (onOpenComments ? onOpenComments(content) : onOpenDetail(content))}
            activeOpacity={0.8}
          >
            <MessageCircle size={17} color="#0c7ae0" />
            <Text style={styles.actionCountText}>
              {content.commentsCount ?? 0}
            </Text>
          </TouchableOpacity>

          {/* Spotify External Button in Primary Blue */}
          <TouchableOpacity
            style={styles.blueSpotifyBtn}
            onPress={handleOpenSpotify}
            activeOpacity={0.8}
          >
            <ExternalLink size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 4. SOCIAL FOOTER: STATS SUMMARY & RELATIVE TIMESTAMP                 */}
      {/* ==================================================================== */}
      <View style={styles.socialFooter}>
        <View style={styles.statsSummaryRow}>
          <Text style={styles.statsSummaryText}>
            <Text style={styles.boldUsername}>{content.likesCount || 0}</Text> me gusta
            {'   •   '}
            <Text style={styles.boldUsername}>{content.commentsCount ?? 0}</Text> comentarios
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => (onOpenComments ? onOpenComments(content) : onOpenDetail(content))}
          activeOpacity={0.7}
        >
          <Text style={styles.viewCommentsLinkText}>
            Ver los {content.commentsCount ?? 0} comentarios
          </Text>
        </TouchableOpacity>

        <Text style={styles.timeAgoText}>{formatRelativeTime(content.createdAt)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Top Author Header
  topAuthorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  topTextCol: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  usernameText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleCategory: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Overline Badge
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  overlineText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: '#0c7ae0',
    letterSpacing: 0.6,
  },

  // Title & Description
  titleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 22,
    color: '#0F2438',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 8,
  },
  descriptionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 16,
  },

  // Timestamp
  timestampRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  timestampText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#0c7ae0',
    letterSpacing: 0.6,
  },

  // Waveform Box
  waveformContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  waveformBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveformBar: {
    width: 2.5,
    backgroundColor: '#0c7ae0',
    borderRadius: 2,
  },
  needleWrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
    position: 'relative',
    height: 34,
    justifyContent: 'center',
  },
  needleHeadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0c7ae0',
    position: 'absolute',
    top: 0,
  },
  needleLine: {
    width: 2,
    height: 30,
    backgroundColor: '#0c7ae0',
    marginTop: 4,
  },
  unplayedScrubberLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    borderRadius: 1,
  },

  // Bottom Controls
  bottomControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  leftControlsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  controlSubBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0c7ae0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseCircleBtnActive: {
    backgroundColor: '#0284C7',
  },
  rightControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionWithCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionCountText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#334155',
  },
  blueSpotifyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0c7ae0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  // Social Footer
  socialFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsSummaryRow: {
    marginBottom: 4,
  },
  statsSummaryText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#475569',
  },
  boldUsername: {
    fontFamily: Theme.fonts.headlineBold,
    color: '#0F172A',
  },
  viewCommentsLinkText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#0c7ae0',
    marginBottom: 4,
  },
  timeAgoText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
  },
});

export default SpotifyPlayerCard;
