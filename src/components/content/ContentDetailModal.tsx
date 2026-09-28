import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  X,
  Heart,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Headphones,
  Tv,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
} from 'lucide-react-native';
import { fetchContentDetail, toggleContentLike } from '../../lib/api/content';
import { getYouTubeId, formatRelativeTime } from './ContentCard';
import type { ContentItem } from '../../types/api';

interface ContentDetailModalProps {
  visible: boolean;
  content: ContentItem | null;
  onClose: () => void;
  onLikeChanged?: (id: number, newCount: number, liked: boolean) => void;
  onOpenComments?: (content: ContentItem) => void;
}

export function ContentDetailModal({
  visible,
  content: initialContent,
  onClose,
  onLikeChanged,
  onOpenComments,
}: ContentDetailModalProps) {
  const [content, setContent] = useState<ContentItem | null>(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (visible && initialContent) {
      setContent(initialContent);
      loadFreshDetail(initialContent.id);
    }
  }, [visible, initialContent?.id]);

  const loadFreshDetail = async (id: number) => {
    try {
      setIsLoading(true);
      const fresh = await fetchContentDetail(id);
      if (fresh) {
        setContent(fresh);
      }
    } catch {
      // Retain initial content if error occurs
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible || !content) return null;

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
        Alert.alert('Aviso', 'No se puede abrir el enlace multimedia en este dispositivo.');
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic update
    const prevLiked = !!content.isLikedByMe;
    const prevCount = content.likesCount || 0;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setContent({
      ...content,
      isLikedByMe: nextLiked,
      likesCount: nextCount,
    });

    try {
      const res = await toggleContentLike(content.id);
      setContent((prev) =>
        prev
          ? {
              ...prev,
              isLikedByMe: res.liked,
              likesCount: res.likesCount,
            }
          : prev
      );
      if (onLikeChanged) {
        onLikeChanged(content.id, res.likesCount, res.liked);
      }
    } catch (err: any) {
      // Revert on error
      setContent({
        ...content,
        isLikedByMe: prevLiked,
        likesCount: prevCount,
      });
      Alert.alert(
        'Iniciar Sesión Requerido',
        'Para reaccionar a los contenidos institucionales, necesitás tener tu sesión activa.'
      );
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Top Bar with Close */}
          <View style={styles.topBar}>
            <View style={styles.topBadge}>
              <ShieldCheck size={14} color={Theme.colors.primary} />
              <Text style={styles.topBadgeText}>RECURSO PASTORAL OFICIAL</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={Theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Title */}
            <Text style={styles.title}>{content.title}</Text>

            {/* Author Attribution */}
            <View style={styles.authorBox}>
              <View style={styles.authorCrest}>
                <Text style={styles.authorCrestText}>CP</Text>
              </View>
              <View style={styles.authorMeta}>
                <Text style={styles.authorName}>Capellanía Institucional</Text>
                <Text style={styles.authorTime}>
                  Publicado {formatRelativeTime(content.createdAt)}
                </Text>
              </View>
            </View>

            {/* Media Presentation */}
            <View style={styles.mediaFrame}>
              {content.type === 'SPOTIFY' ? (
                <Pressable style={styles.spotifyBanner} onPress={handleOpenMedia}>
                  <View style={styles.spotifyIconCircle}>
                    <Headphones size={24} color="#059669" />
                  </View>
                  <View style={styles.spotifyTextCol}>
                    <Text style={styles.spotifyCategory}>PODCAST / AUDIO</Text>
                    <Text style={styles.spotifyMainTitle} numberOfLines={2}>
                      {content.title}
                    </Text>
                    <View style={styles.spotifyActionRow}>
                      <Text style={styles.spotifyActionText}>Abrir en Spotify</Text>
                      <ExternalLink size={14} color="#059669" />
                    </View>
                  </View>
                </Pressable>
              ) : null}

              {content.type === 'YOUTUBE' ? (
                <Pressable style={styles.youtubeBanner} onPress={handleOpenMedia}>
                  {youtubeThumbnail ? (
                    <Image
                      source={{ uri: youtubeThumbnail }}
                      style={styles.youtubeHeroImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.youtubeHeroPlaceholder} />
                  )}
                  <View style={styles.youtubeOverlay} />
                  <View style={styles.youtubePlayCircle}>
                    <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                  </View>
                  <View style={styles.youtubeBottomInfo}>
                    <Text style={styles.youtubeBottomLabel}>Ver transmisión en YouTube</Text>
                    <ExternalLink size={14} color="#FFFFFF" />
                  </View>
                </Pressable>
              ) : null}

              {content.type === 'IMAGE' ? (
                <Image
                  source={{ uri: content.mediaUrl }}
                  style={styles.fullImage}
                  resizeMode="cover"
                />
              ) : null}

              {content.type === 'VIDEO' ? (
                <Pressable style={styles.videoBanner} onPress={handleOpenMedia}>
                  <VideoIcon size={40} color="#FFFFFF" />
                  <Text style={styles.videoBannerText}>Reproducir Video Institucional</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Full Pastoral Reflection / Notes */}
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionHeading}>Reflexión y Orientación</Text>
              <Text style={styles.reflectionBody}>{content.description}</Text>
            </View>
          </ScrollView>

          {/* Action Bottom Bar */}
          <View style={styles.bottomBar}>
            <Pressable
              style={[
                styles.likeButton,
                content.isLikedByMe && styles.likeButtonActive,
              ]}
              onPress={handleToggleLike}
              disabled={isLiking}
            >
              <Heart
                size={18}
                color={content.isLikedByMe ? '#DC2626' : Theme.colors.secondary}
                fill={content.isLikedByMe ? '#DC2626' : 'transparent'}
              />
              <Text
                style={[
                  styles.likeButtonText,
                  content.isLikedByMe && styles.likeButtonTextActive,
                ]}
              >
                {content.isLikedByMe ? 'Te gusta' : 'Me gusta'} ({content.likesCount || 0})
              </Text>
            </Pressable>

            <Pressable
              style={styles.commentButton}
              onPress={() => {
                onClose();
                if (onOpenComments) {
                  onOpenComments(content);
                }
              }}
            >
              <MessageCircle size={18} color={Theme.colors.secondary} />
              <Text style={styles.commentButtonText}>
                Comentarios ({content.commentsCount ?? 0})
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 28, 44, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 16,
    ...globalStyles.shadowMd,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECF2',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  topBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 22,
    lineHeight: 28,
    color: Theme.colors.onSurface,
    marginBottom: 12,
  },
  authorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.roundness.lg,
    marginBottom: 18,
  },
  authorCrest: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorCrestText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  authorTime: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.outline,
  },
  mediaFrame: {
    borderRadius: Theme.roundness.xl,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceContainerLow,
    marginBottom: 20,
  },
  spotifyBanner: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: Theme.roundness.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  spotifyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyTextCol: {
    flex: 1,
  },
  spotifyCategory: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: '#059669',
  },
  spotifyMainTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#064E3B',
    marginTop: 2,
    marginBottom: 6,
  },
  spotifyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spotifyActionText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: '#059669',
  },
  youtubeBanner: {
    height: 210,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  youtubeHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  youtubeHeroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E293B',
  },
  youtubeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  youtubePlayCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadowMd,
  },
  youtubeBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  youtubeBottomLabel: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 10,
  },
  fullImage: {
    width: '100%',
    height: 240,
  },
  videoBanner: {
    height: 180,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoBannerText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  reflectionSection: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  reflectionHeading: {
    ...globalStyles.labelCaps,
    fontSize: 11,
    color: Theme.colors.secondary,
    marginBottom: 8,
  },
  reflectionBody: {
    ...globalStyles.bodyMd,
    fontSize: 14,
    lineHeight: 22,
    color: Theme.colors.onSurface,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECF2',
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  likeButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  likeButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.secondary,
  },
  likeButtonTextActive: {
    color: '#DC2626',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  commentButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.secondary,
  },
});
