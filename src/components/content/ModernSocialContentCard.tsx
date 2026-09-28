import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Check,
  Play,
  Tv,
  Video as VideoIcon,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldCheck,
  Headphones,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react-native';
import type { ContentItem } from '../../types/api';
import { ContentCard, getYouTubeId, formatRelativeTime } from './ContentCard';
import { SpotifyPlayerCard } from './SpotifyPlayerCard';

export interface ModernSocialContentCardProps {
  content: ContentItem;
  canManage?: boolean;
  onLikeToggle: (id: number) => void;
  onOpenDetail: (content: ContentItem) => void;
  onOpenComments?: (content: ContentItem) => void;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (content: ContentItem) => void;
  isLiking?: boolean;
}

export const ModernSocialContentCard = React.memo(function ModernSocialContentCard({
  content,
  canManage = false,
  onLikeToggle,
  onOpenDetail,
  onOpenComments,
  onEdit,
  onDelete,
  isLiking = false,
}: ModernSocialContentCardProps) {
  // Requirement: For Spotify, use the dedicated recorder player design
  if (content.type === 'SPOTIFY') {
    return (
      <SpotifyPlayerCard
        content={content}
        canManage={canManage}
        onLikeToggle={onLikeToggle}
        onOpenDetail={onOpenDetail}
        onOpenComments={onOpenComments}
        onEdit={onEdit}
        onDelete={onDelete}
        isLiking={isLiking}
      />
    );
  }

  const youtubeId = content.type === 'YOUTUBE' ? getYouTubeId(content.mediaUrl) : null;
  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  const handleOpenMedia = async () => {
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

  const handleMoreOptions = () => {
    const options: any[] = [
      { text: 'Ver Detalle Completo', onPress: () => onOpenDetail(content) },
      {
        text: 'Ver Comentarios',
        onPress: () => (onOpenComments ? onOpenComments(content) : onOpenDetail(content)),
      },
    ];
    if (canManage && onEdit) {
      options.push({ text: 'Editar Publicación', onPress: () => onEdit(content) });
    }
    if (canManage && onDelete) {
      options.push({
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => onDelete(content),
      });
    }
    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert(content.title, 'Opciones de publicación', options);
  };

  const mediaSourceUri =
    content.type === 'YOUTUBE'
      ? youtubeThumbnail
      : content.mediaUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=800';

  return (
    <View style={styles.cardContainer}>
      {/* ==================================================================== */}
      {/* 1. MEDIA CONTAINER WITH BOTTOM-LEFT SHAPED CUTOUT                     */}
      {/* ==================================================================== */}
      <View style={styles.mediaBox}>
        {/* Main Media Image / Thumbnail */}
        <Pressable
          style={styles.mediaPressable}
          onPress={content.type === 'IMAGE' ? () => onOpenDetail(content) : handleOpenMedia}
        >
          {mediaSourceUri ? (
            <Image
              source={{ uri: mediaSourceUri }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <ImageIcon size={48} color="#94A3B8" />
            </View>
          )}

          {/* Video / YouTube Play Badge Overlay */}
          {(content.type === 'YOUTUBE' || content.type === 'VIDEO') && (
            <View style={styles.centerPlayCircle}>
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
            </View>
          )}
        </Pressable>

        {/* Top Header Overlay: Avatar, Verified Badge, More Button */}
        <View style={styles.topHeaderOverlay}>
          <View style={styles.topAuthorLeft}>
            {/* Story Gradient Ring Avatar */}
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
                {content.type === 'YOUTUBE'
                  ? 'YouTube • Prédica en Video'
                  : content.type === 'VIDEO'
                  ? 'Video Institucional • Cobertura'
                  : 'Reflexión Visual • Comunidad'}
              </Text>
            </View>
          </View>

          {/* More Options Button (Three dots) */}
          <TouchableOpacity
            style={styles.moreOptionsBtn}
            onPress={handleMoreOptions}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreHorizontal size={17} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Floating Mini Reaction Bubbles (Reference Image Touch) */}
        <View style={styles.floatingReactionWrap}>
          <View style={styles.miniReactionBubble}>
            <View style={styles.miniAvatar}>
              <Text style={styles.miniAvatarText}>O</Text>
            </View>
            <View style={styles.miniHeartBadge}>
              <Heart size={8} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* ================================================================== */}
        {/* SHAPE CUTOUT AT THE BOTTOM LEFT (ORGANIC S-CURVE NOTCH)           */}
        {/* ================================================================== */}
        <View style={styles.shapeCutoutOverlay} pointerEvents="box-none">
          {/* SVG Inverted Scallop Shape filled with Card White (#FFFFFF) */}
          <Svg
            width={166}
            height={52}
            viewBox="0 0 166 52"
            style={StyleSheet.absoluteFillObject}
          >
            <Path
              d="M 0,52 L 0,16 C 0,6 6,0 16,0 L 118,0 C 130,0 138,10 143,24 C 148,38 154,52 166,52 L 0,52 Z"
              fill="#FFFFFF"
            />
          </Svg>

          {/* 2 Action Icons: Like with Count & Comment with Count (Share removed) */}
          <View style={styles.cutoutActionsRow}>
            {/* 1. Me Gusta / Like Button with count */}
            <TouchableOpacity
              style={styles.cutoutBtnWithCount}
              onPress={() => onLikeToggle(content.id)}
              disabled={isLiking}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Heart
                size={20}
                color={content.isLikedByMe ? '#EF4444' : '#0F172A'}
                fill={content.isLikedByMe ? '#EF4444' : 'transparent'}
                strokeWidth={content.isLikedByMe ? 0 : 2}
              />
              <Text style={[styles.cutoutCountText, content.isLikedByMe && { color: '#EF4444' }]}>
                {content.likesCount || 0}
              </Text>
            </TouchableOpacity>

            {/* 2. Comentario / Detail Button with count */}
            <TouchableOpacity
              style={styles.cutoutBtnWithCount}
              onPress={() => (onOpenComments ? onOpenComments(content) : onOpenDetail(content))}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <MessageCircle size={20} color="#0F172A" strokeWidth={2} />
              <Text style={styles.cutoutCountText}>
                {content.commentsCount ?? 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lower Right: Stacked Overlapping Liked Avatars & Count on the Image */}
        <View style={styles.likedAvatarsFloatingRow} pointerEvents="box-none">
          <View style={styles.stackedAvatarsGroup}>
            <View style={[styles.likedAvatarCircle, { backgroundColor: '#0c7ae0', zIndex: 3 }]}>
              <Text style={styles.likedAvatarInitial}>C</Text>
            </View>
            <View style={[styles.likedAvatarCircle, { backgroundColor: '#10B981', zIndex: 2, marginLeft: -8 }]}>
              <Text style={styles.likedAvatarInitial}>M</Text>
            </View>
            <View style={[styles.likedAvatarCircle, { backgroundColor: '#F59E0B', zIndex: 1, marginLeft: -8 }]}>
              <Text style={styles.likedAvatarInitial}>A</Text>
            </View>
          </View>
          <Text style={styles.likedCountText}>
            {content.likesCount ? `${content.likesCount} Me gusta` : 'Sé el primero'}
          </Text>
        </View>
      </View>

      {/* ==================================================================== */}
      {/* 2. POST-MEDIA CAPTION, LIKES INFO & TIMESTAMPS                       */}
      {/* ==================================================================== */}
      <View style={styles.cardFooterArea}>
        {/* Likes & Comments Count Header */}
        <View style={styles.statsSummaryRow}>
          <Text style={styles.statsSummaryText}>
            <Text style={styles.boldUsername}>{content.likesCount || 0}</Text> me gusta
            {'   •   '}
            <Text style={styles.boldUsername}>{content.commentsCount ?? 0}</Text> comentarios
          </Text>
        </View>

        {/* Post Caption: Username bold + Title + Description */}
        <Pressable onPress={() => onOpenDetail(content)}>
          <Text style={styles.captionText} numberOfLines={2}>
            <Text style={styles.boldUsername}>@capellania </Text>
            {content.title}
            {content.description ? ` · ${content.description}` : ''}
          </Text>
        </Pressable>

        {/* View all comments link */}
        <TouchableOpacity
          onPress={() => (onOpenComments ? onOpenComments(content) : onOpenDetail(content))}
          activeOpacity={0.7}
          style={styles.viewCommentsLinkBtn}
        >
          <Text style={styles.viewCommentsLinkText}>
            Ver los {content.commentsCount ?? 0} comentarios
          </Text>
        </TouchableOpacity>

        {/* Relative Time */}
        <Text style={styles.timeAgoText}>{formatRelativeTime(content.createdAt)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
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

  // Media Container
  mediaBox: {
    position: 'relative',
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: 'hidden',
  },
  mediaPressable: {
    width: '100%',
    height: '100%',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayCircle: {
    position: 'absolute',
    top: '46%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Top Overlay
  topHeaderOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
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
    borderColor: '#A855F7', // Instagram-like gradient feel
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
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleCategory: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  moreOptionsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // Floating Reaction Bubble
  floatingReactionWrap: {
    position: 'absolute',
    bottom: 64,
    left: 18,
    zIndex: 8,
  },
  miniReactionBubble: {
    position: 'relative',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0c7ae0',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniHeartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  // ====================================================================
  // BOTTOM CUTOUT SHAPE (ORGANIC S-CURVE NOTCH)
  // ====================================================================
  shapeCutoutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 166,
    height: 52,
    zIndex: 20,
  },
  cutoutActionsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 156,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 12,
  },
  cutoutBtnWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cutoutCountText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12.5,
    color: '#0F172A',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Liked Avatars Floating on Right
  likedAvatarsFloatingRow: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  stackedAvatarsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedAvatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedAvatarInitial: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  likedCountText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ====================================================================
  // POST-MEDIA AREA (CAPTION & META)
  // ====================================================================
  cardFooterArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  statsSummaryRow: {
    marginBottom: 6,
  },
  statsSummaryText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#475569',
  },
  boldUsername: {
    fontFamily: Theme.fonts.headlineBold,
    color: '#0F172A',
  },
  captionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 4,
  },
  viewCommentsLinkBtn: {
    marginVertical: 4,
  },
  viewCommentsLinkText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#0c7ae0',
  },
  timeAgoText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default ModernSocialContentCard;
