import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Heart,
  MessageSquare,
  Share2,
  Edit2,
  Trash2,
  User,
  Shield,
  Tag,
  Clock,
  BookOpen,
} from 'lucide-react-native';
import type { BlogPostItem } from '../../types/blog';
import type { AppRole } from '../../types/api';

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

interface BlogCardProps {
  blog: BlogPostItem;
  canEdit: boolean;
  canDelete: boolean;
  onPress: (blog: BlogPostItem) => void;
  onLikePress: (blog: BlogPostItem) => void;
  onSharePress: (blog: BlogPostItem) => void;
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
  onSharePress,
  onCommentPress,
  onEditPress,
  onDeletePress,
}: BlogCardProps) {
  const roleConfig = getRoleBadgeConfig(blog.authorRole);
  const isLiked = Boolean(blog.isLikedByMe);

  return (
    <Pressable
      style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
      onPress={() => onPress(blog)}
    >
      {/* Top Meta: Author and Time */}
      <View style={styles.topRow}>
        <View style={styles.authorGroup}>
          <View style={styles.avatarMini}>
            <Shield size={14} color={Theme.colors.primary} />
          </View>
          <View style={styles.authorInfoCol}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {blog.authorName || 'Autor'}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
                <Text style={[styles.roleBadgeText, { color: roleConfig.text }]}>
                  {roleConfig.label}
                </Text>
              </View>
            </View>
            <View style={styles.timeRow}>
              <Clock size={11} color="#8A92A0" style={{ marginRight: 3 }} />
              <Text style={styles.timeText}>{formatRelativeTime(blog.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls for Author / Moderator */}
        {(canEdit || canDelete) && (
          <View style={styles.moderationActions}>
            {canEdit && onEditPress && (
              <TouchableOpacity
                onPress={() => onEditPress(blog)}
                style={styles.modActionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit2 size={15} color={Theme.colors.secondary} />
              </TouchableOpacity>
            )}
            {canDelete && onDeletePress && (
              <TouchableOpacity
                onPress={() => onDeletePress(blog)}
                style={styles.modActionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={15} color={Theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tags Chips */}
      {blog.tags && blog.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {blog.tags.map((tag) => (
            <View key={tag.slug || tag.name} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Main Content: Title & Summary */}
      <Text style={styles.title} numberOfLines={2}>
        {blog.title}
      </Text>

      {Boolean(blog.summary) && (
        <Text style={styles.summary} numberOfLines={3}>
          {blog.summary}
        </Text>
      )}

      {/* Footer Metrics & Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.metricsLeft}>
          {/* Like Button */}
          <TouchableOpacity
            style={[styles.metricBtn, isLiked && styles.metricBtnActive]}
            onPress={() => onLikePress(blog)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={17}
              color={isLiked ? '#DC2626' : Theme.colors.secondary}
              fill={isLiked ? '#DC2626' : 'transparent'}
            />
            <Text style={[styles.metricText, isLiked && styles.metricTextLiked]}>
              {blog.likesCount}
            </Text>
          </TouchableOpacity>

          {/* Comments Button */}
          <TouchableOpacity
            style={styles.metricBtn}
            onPress={() => onCommentPress(blog)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquare size={17} color={Theme.colors.secondary} />
            <Text style={styles.metricText}>{blog.commentsCount}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.metricBtn}
            onPress={() => onSharePress(blog)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={17} color={Theme.colors.secondary} />
            <Text style={styles.metricText}>{blog.sharesCount}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.readMorePrompt}>
          <Text style={styles.readMoreText}>Leer completa</Text>
          <BookOpen size={13} color={Theme.colors.primary} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    backgroundColor: '#FBFBFC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  authorInfoCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  authorName: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.onSurface,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: Theme.fonts.bodySemiBold,
    letterSpacing: 0.4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  timeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#8A92A0',
  },
  moderationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modActionBtn: {
    padding: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: '#F1F4F8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
  },
  title: {
    fontSize: 17,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
    lineHeight: 23,
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  metricsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  metricBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  metricText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  metricTextLiked: {
    color: '#DC2626',
  },
  readMorePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
  },
});
