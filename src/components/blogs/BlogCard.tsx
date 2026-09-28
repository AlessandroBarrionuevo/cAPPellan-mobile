import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Theme } from '../../theme/Theme';
import {
  Heart,
  MessageCircle,
  MoreVertical,
} from 'lucide-react-native';
import type { BlogPostItem } from '../../types/blog';
import type { AppRole } from '../../types/api';
import { useAuthStore } from '../../lib/stores/auth';

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays}d`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function getRoleBadgeConfig(role: AppRole): { label: string; bg: string; text: string } {
  switch (role) {
    case 'SUPERUSER':
      return { label: 'COMANDO', bg: '#FEE2E2', text: '#991B1B' };
    case 'CHAPLAIN_LEADER':
      return { label: 'CAPELLÁN LÍDER', bg: '#FEF3C7', text: '#92400E' };
    case 'CHAPLAIN_CONTENT_LEADER':
      return { label: 'LÍDER CONTENIDOS', bg: '#EDE9FE', text: '#5B21B6' };
    case 'CHAPLAIN':
      return { label: 'CAPELLÁN', bg: '#DBEAFE', text: '#1E40AF' };
    case 'BASIC':
    default:
      return { label: 'PERSONAL', bg: '#F3F4F6', text: '#4B5563' };
  }
}

export function getAuthorInitials(name?: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function calculateReadingTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

const DEFAULT_BLOG_COVERS = [
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600',
];

export function getDeterministicBlogCover(id: number): string {
  return DEFAULT_BLOG_COVERS[Math.abs(id) % DEFAULT_BLOG_COVERS.length];
}

interface BlogCardProps {
  blog: BlogPostItem;
  canEdit: boolean;
  canDelete: boolean;
  onPress: (blog: BlogPostItem) => void;
  onLikePress: (blog: BlogPostItem) => void;
  onSharePress?: (blog: BlogPostItem) => void;
  onCommentPress: (blog: BlogPostItem) => void;
  onEditPress?: (blog: BlogPostItem) => void;
  onDeletePress?: (blog: BlogPostItem) => void;
}

export const BlogCard = React.memo(function BlogCard({
  blog,
  canEdit,
  canDelete,
  onPress,
  onLikePress,
  onCommentPress,
  onEditPress,
  onDeletePress,
}: BlogCardProps) {
  const user = useAuthStore((state) => state.user);
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const isLiked = Boolean(blog.isLikedByMe);
  const readingTime = calculateReadingTime(blog.summary);
  const primaryTag = blog.tags?.[0]?.name || 'Reflexión';

  // Resolved user avatar (real avatar if present, otherwise clean initials badge)
  const authorAvatarUri =
    blog.authorAvatarUrl ||
    (user && user.userId === blog.authorId ? user.avatarUrl : null);

  const coverImageUri =
    blog.coverImageUrl && !coverError
      ? blog.coverImageUrl
      : getDeterministicBlogCover(blog.id);

  const handleMoreOptions = () => {
    const options: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[] = [];

    if (canEdit && onEditPress) {
      options.push({
        text: 'Editar Crónica',
        onPress: () => onEditPress(blog),
      });
    }

    if (canDelete && onDeletePress) {
      options.push({
        text: 'Eliminar Crónica',
        style: 'destructive',
        onPress: () => onDeletePress(blog),
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    Alert.alert('Opciones de la Publicación', blog.title, options);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
      onPress={() => onPress(blog)}
    >
      {/* 1. Left: Cover Image Thumbnail (matching reference design) */}
      <View style={styles.thumbnailWrapper}>
        <Image
          source={{ uri: coverImageUri }}
          style={styles.thumbnailImage}
          resizeMode="cover"
          onError={() => setCoverError(true)}
        />
      </View>

      {/* 2. Center: Tag Pill, Bold Headline, Author Metadata */}
      <View style={styles.contentCol}>
        {/* Top: Category Tag Pill */}
        <View style={styles.tagPill}>
          <Text style={styles.tagPillText} numberOfLines={1}>
            {primaryTag}
          </Text>
        </View>

        {/* Title (2 lines max, bold headline font) */}
        <Text style={styles.title} numberOfLines={2}>
          {blog.title}
        </Text>

        {/* Author Metadata Row with dynamic avatar */}
        <View style={styles.authorRow}>
          {authorAvatarUri && !avatarError ? (
            <Image
              source={{ uri: authorAvatarUri }}
              style={styles.authorAvatarImg}
              resizeMode="cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={styles.authorAvatarDefault}>
              <Text style={styles.authorAvatarInitials}>
                {getAuthorInitials(blog.authorName)}
              </Text>
            </View>
          )}

          <View style={styles.authorTextCol}>
            <Text style={styles.authorNameText} numberOfLines={1}>
              {blog.authorName || 'Autor'}
            </Text>
            <Text style={styles.authorMetaSubText} numberOfLines={1}>
              {formatRelativeTime(blog.createdAt)} • {readingTime} min
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Right: Options Menu (Top) & Interactive Counter Buttons (Bottom) */}
      <View style={styles.rightCol}>
        {/* Options / Moderation Trigger */}
        {(canEdit || canDelete) ? (
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={handleMoreOptions}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <MoreVertical size={18} color="#64748B" />
          </TouchableOpacity>
        ) : (
          <View style={styles.moreBtnPlaceholder} />
        )}

        {/* Interactive Action Buttons with Counters (Replaces bookmark & share) */}
        <View style={styles.actionsCol}>
          {/* Like Button */}
          <TouchableOpacity
            style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
            onPress={(e) => {
              e.stopPropagation?.();
              onLikePress(blog);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Heart
              size={15}
              color={isLiked ? '#EF4444' : '#64748B'}
              fill={isLiked ? '#EF4444' : 'transparent'}
            />
            <Text style={[styles.actionCount, isLiked && styles.actionCountLiked]}>
              {blog.likesCount || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onCommentPress(blog);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <MessageCircle size={15} color="#64748B" />
            <Text style={styles.actionCount}>{blog.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEFF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    backgroundColor: '#F8FAFC',
  },

  // 1. Left Thumbnail
  thumbnailWrapper: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },

  // 2. Middle Content Column
  contentCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#475569',
  },
  title: {
    fontSize: 15,
    fontFamily: Theme.fonts.headlineBold,
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatarImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginRight: 7,
  },
  authorAvatarDefault: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  authorAvatarInitials: {
    fontSize: 10,
    fontFamily: Theme.fonts.headlineBold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  authorTextCol: {
    flex: 1,
  },
  authorNameText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#1E293B',
  },
  authorMetaSubText: {
    fontSize: 10.5,
    fontFamily: Theme.fonts.body,
    color: '#64748B',
    marginTop: 0.5,
  },

  // 3. Right Column: More Options & Action Counters
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 96,
    paddingLeft: 4,
  },
  moreBtn: {
    padding: 2,
  },
  moreBtnPlaceholder: {
    width: 22,
    height: 22,
  },
  actionsCol: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 7,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  actionBtnLiked: {
    backgroundColor: '#FEE2E2',
  },
  actionCount: {
    fontSize: 11.5,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#64748B',
    minWidth: 14,
  },
  actionCountLiked: {
    color: '#EF4444',
  },
});
