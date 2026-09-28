import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Heart,
  MessageCircle,
  Headphones,
  Tv,
  Image as ImageIcon,
  Video as VideoIcon,
  ShieldCheck,
  ExternalLink,
  Edit2,
  Trash2,
  Play,
} from 'lucide-react-native';
import type { ContentItem, ContentType } from '../../types/api';

interface ContentCardProps {
  content: ContentItem;
  canManage?: boolean;
  onLikeToggle: (id: number) => void;
  onOpenDetail: (content: ContentItem) => void;
  onOpenComments?: (content: ContentItem) => void;
  onEdit?: (content: ContentItem) => void;
  onDelete?: (content: ContentItem) => void;
  isLiking?: boolean;
}

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `Hace ${diffInWeeks} ${diffInWeeks === 1 ? 'sem' : 'sems'}`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

const TYPE_META: Record<
  ContentType,
  { label: string; icon: any; color: string; bg: string }
> = {
  SPOTIFY: {
    label: 'Spotify Audio',
    icon: Headphones,
    color: '#059669',
    bg: '#ECFDF5',
  },
  YOUTUBE: {
    label: 'YouTube Video',
    icon: Tv,
    color: '#DC2626',
    bg: '#FEF2F2',
  },
  IMAGE: {
    label: 'Reflexión Visual',
    icon: ImageIcon,
    color: '#0284C7',
    bg: '#F0F9FF',
  },
  VIDEO: {
    label: 'Video Institucional',
    icon: VideoIcon,
    color: '#4F46E5',
    bg: '#EEF2FF',
  },
};

const WAVEFORM_HEIGHTS = [8, 14, 22, 16, 26, 12, 28, 18, 10, 24, 15, 20, 10, 16,8, 14, 22, 16, 26, 12, 28, 18, 10, 24, 15, 20, 10, 16];

export const ContentCard = React.memo(function ContentCard({
  content,
  canManage = false,
  onLikeToggle,
  onOpenDetail,
  onOpenComments,
  onEdit,
  onDelete,
  isLiking = false,
}: ContentCardProps) {
  const meta = TYPE_META[content.type] || TYPE_META.IMAGE;
  const TypeIcon = meta.icon;
  const youtubeId = content.type === 'YOUTUBE' ? getYouTubeId(content.mediaUrl) : null;
  const youtubeThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : null;

  const handleOpenMedia = async () => {
    if (!content.mediaUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(content.mediaUrl);
      if (canOpen) {
        await Linking.openURL(content.mediaUrl);
      } else {
        Alert.alert('Aviso', 'No se pudo abrir el enlace multimedia en este dispositivo.');
      }
    } catch {
      // Ignore
    }
  };

  return (
    <View style={[styles.card, globalStyles.shadowSm]}>
      {/* 1. Header: Author & Type Badge */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatarCrest}>
            <Text style={styles.avatarText}>CDP</Text>
          </View>
          <View style={styles.authorMeta}>
            <View style={styles.authorTitleRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                Capellanía Institucional
              </Text>
              <ShieldCheck size={14} color={Theme.colors.primary} />
            </View>
            <Text style={styles.timeText}>{formatRelativeTime(content.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
            <TypeIcon size={12} color={meta.color} />
            <Text style={[styles.typeBadgeText, { color: meta.color }]}>
              {meta.label}
            </Text>
          </View>

          {canManage ? (
            <View style={styles.manageActionsRow}>
              {onEdit ? (
                <Pressable
                  style={styles.manageBtn}
                  onPress={() => onEdit(content)}
                  hitSlop={8}
                >
                  <Edit2 size={15} color={Theme.colors.secondary} />
                </Pressable>
              ) : null}
              {onDelete ? (
                <Pressable
                  style={styles.manageBtn}
                  onPress={() => onDelete(content)}
                  hitSlop={8}
                >
                  <Trash2 size={15} color={Theme.colors.error} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {/* 2. Title & Description */}
      <Pressable onPress={() => onOpenDetail(content)}>
        <Text style={styles.title}>{content.title}</Text>
        {content.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {content.description}
          </Text>
        ) : null}
      </Pressable>

      {/* 3. Media Preview Box */}
      <View style={styles.mediaContainer}>
        {/* SPOTIFY AUDIO */}
        {content.type === 'SPOTIFY' ? (
          <Pressable style={styles.spotifyCard} onPress={handleOpenMedia}>
            <View style={styles.spotifyTop}>
              <View style={styles.spotifyIconCircle}>
                <Headphones size={20} color="#059669" />
              </View>
              <View style={styles.spotifyInfo}>
                <Text style={styles.spotifyTag}>RECOMENDACION</Text>
                <Text style={styles.spotifyTitle} numberOfLines={1}>
                  Escuchar en Spotify
                </Text>
              </View>
              <ExternalLink size={16} color="#059669" />
            </View>

            {/* Soundwave Simulation */}
            <View style={styles.waveformRow}>
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    { height: h },
                    i < 6 ? styles.waveformPlayed : styles.waveformMuted,
                  ]}
                />
              ))}
            </View>
          </Pressable>
        ) : null}

        {/* YOUTUBE VIDEO */}
        {content.type === 'YOUTUBE' ? (
          <Pressable style={styles.youtubeCard} onPress={handleOpenMedia}>
            {youtubeThumbnail ? (
              <Image
                source={{ uri: youtubeThumbnail }}
                style={styles.youtubeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.youtubePlaceholder} />
            )}
            <View style={styles.youtubeOverlay} />
            <View style={styles.youtubePlayCircle}>
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={styles.youtubeBottomBar}>
              <Text style={styles.youtubeBottomText} numberOfLines={1}>
                Ver en YouTube
              </Text>
              <ExternalLink size={14} color="#FFFFFF" />
            </View>
          </Pressable>
        ) : null}

        {/* IMAGE / PHOTO */}
        {content.type === 'IMAGE' ? (
          <Pressable onPress={() => onOpenDetail(content)}>
            <Image
              source={{ uri: content.mediaUrl }}
              style={styles.imageMedia}
              resizeMode="cover"
            />
          </Pressable>
        ) : null}

        {/* DIRECT VIDEO */}
        {content.type === 'VIDEO' ? (
          <Pressable style={styles.videoCard} onPress={handleOpenMedia}>
            <View style={styles.videoPlaceholder}>
              <VideoIcon size={32} color="#FFFFFF" />
              <Text style={styles.videoActionText}>Reproducir Video</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {/* 4. Social Interaction Bar */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {/* Atomic Like Button */}
          <Pressable
            style={[
              styles.likeBtn,
              content.isLikedByMe && styles.likeBtnActive,
            ]}
            onPress={() => onLikeToggle(content.id)}
            disabled={isLiking}
          >
            <Heart
              size={17}
              color={content.isLikedByMe ? '#DC2626' : Theme.colors.secondary}
              fill={content.isLikedByMe ? '#DC2626' : 'transparent'}
            />
            <Text
              style={[
                styles.likeCount,
                content.isLikedByMe && styles.likeCountActive,
              ]}
            >
              {content.likesCount || 0}
            </Text>
          </Pressable>

          {/* Comment Button with count */}
          <Pressable
            style={styles.actionBtn}
            onPress={() => (onOpenComments ? onOpenComments(content) : onOpenDetail(content))}
          >
            <MessageCircle size={16} color={Theme.colors.secondary} />
            <Text style={styles.actionBtnText}>{content.commentsCount ?? 0}</Text>
          </Pressable>
        </View>

        {/* Detail Trigger */}
        <Pressable
          style={styles.detailLink}
          onPress={() => onOpenDetail(content)}
        >
          <Text style={styles.detailLinkText}>Ver Detalle</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap:10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarCrest: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.primary,
  },
  authorMeta: {
    flex: 1,
  },
  authorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  timeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.outline,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width:'100%',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    gap: 4,
  },
  typeBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
  },
  manageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:"space-between",
    gap: 4,
    marginLeft: 4,
  },
  manageBtn: {
    padding: 6,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    lineHeight: 23,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  description: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  mediaContainer: {
    borderRadius: Theme.roundness.lg,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceContainerLow,
    marginBottom: 14,
  },
  spotifyCard: {
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: Theme.roundness.lg,
  },
  spotifyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  spotifyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  spotifyInfo: {
    flex: 1,
  },
  spotifyTag: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: '#059669',
  },
  spotifyTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#064E3B',
    marginTop: 2,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#BBF7D0',
    width:'100%'
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
  },
  waveformPlayed: {
    backgroundColor: '#059669',
  },
  waveformMuted: {
    backgroundColor: '#A7F3D0',
  },
  spotifyActionLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: '#059669',
    marginLeft: 8,
  },
  youtubeCard: {
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.roundness.lg,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  youtubeImage: {
    ...StyleSheet.absoluteFillObject,
  },
  youtubePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
  },
  youtubeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  youtubePlayCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(220, 38, 38, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadowMd,
  },
  youtubeBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  youtubeBottomText: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 9,
    flex: 1,
    marginRight: 6,
  },
  imageMedia: {
    width: '100%',
    height: 200,
    borderRadius: Theme.roundness.lg,
  },
  videoCard: {
    height: 160,
    backgroundColor: '#0F172A',
    borderRadius: Theme.roundness.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  videoActionText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF2F6',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  likeBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  likeCount: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  likeCountActive: {
    color: '#DC2626',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  actionBtnText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.secondary,
  },
  detailLink: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  detailLinkText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.primary,
  },
});
