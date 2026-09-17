import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  X,
  Heart,
  Share2,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Clock,
  Shield,
  Tag,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuthStore } from '../../lib/stores/auth';
import {
  fetchBlogDetail,
  toggleBlogLike,
  shareBlog,
  fetchBlogComments,
  createBlogComment,
  deleteBlogComment,
} from '../../lib/api/blogs';
import {
  canEditBlog,
  canDeleteBlog,
  canDeleteComment,
} from '../../lib/blogPermissions';
import { formatRelativeTime, getRoleBadgeConfig } from './BlogCard';
import type { BlogPostItem, BlogDetail, BlogComment } from '../../types/blog';

interface BlogDetailModalProps {
  visible: boolean;
  blog: BlogPostItem | null;
  onClose: () => void;
  onLikeChanged?: (id: number, newCount: number, liked: boolean) => void;
  onShareSuccess?: (id: number, newCount: number) => void;
  onEditBlog?: (blog: BlogDetail) => void;
  onDeleteBlog?: (blog: BlogDetail) => void;
}

export function BlogDetailModal({
  visible,
  blog: initialItem,
  onClose,
  onLikeChanged,
  onShareSuccess,
  onEditBlog,
  onDeleteBlog,
}: BlogDetailModalProps) {
  const user = useAuthStore((state) => state.user);

  const [detail, setDetail] = useState<BlogDetail | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 1. Fetch full details and comments
  const loadFullData = useCallback(async (idOrSlug: string | number, id: number) => {
    try {
      setIsLoadingDetail(true);
      setIsLoadingComments(true);

      const [freshDetail, commentsList] = await Promise.all([
        fetchBlogDetail(idOrSlug),
        fetchBlogComments(id),
      ]);

      if (freshDetail) {
        setDetail(freshDetail);
      }
      setComments(commentsList || []);
    } catch (err: any) {
      // Retain fallback detail from initialItem
    } finally {
      setIsLoadingDetail(false);
      setIsLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (visible && initialItem) {
      // Seed detail with initialItem data while full content loads
      setDetail({
        ...initialItem,
        content: '',
      });
      loadFullData(initialItem.slug || initialItem.id, initialItem.id);
    } else {
      setDetail(null);
      setComments([]);
      setNewCommentText('');
    }
  }, [visible, initialItem, loadFullData]);

  if (!visible || !initialItem) return null;

  const currentBlog = detail || initialItem;
  const isLiked = Boolean(currentBlog.isLikedByMe);
  const roleConfig = getRoleBadgeConfig(currentBlog.authorRole);

  const canEdit = canEditBlog(user, currentBlog);
  const canDelete = canDeleteBlog(user, currentBlog);

  // 2. Like toggle with optimistic update
  const handleLikeToggle = async () => {
    if (!user) {
      Alert.alert('Sesión Requerida', 'Debés iniciar sesión para dar me gusta.');
      return;
    }
    if (isLiking) return;

    const previousLiked = Boolean(currentBlog.isLikedByMe);
    const previousCount = currentBlog.likesCount;
    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    // Optimistic UI update
    setDetail((prev) =>
      prev ? { ...prev, isLikedByMe: nextLiked, likesCount: nextCount } : null
    );
    if (onLikeChanged) {
      onLikeChanged(currentBlog.id, nextCount, nextLiked);
    }

    try {
      setIsLiking(true);
      const res = await toggleBlogLike(currentBlog.id);
      setDetail((prev) =>
        prev
          ? { ...prev, isLikedByMe: res.liked, likesCount: res.likesCount }
          : null
      );
      if (onLikeChanged) {
        onLikeChanged(currentBlog.id, res.likesCount, res.liked);
      }
    } catch {
      // Rollback on network failure
      setDetail((prev) =>
        prev
          ? { ...prev, isLikedByMe: previousLiked, likesCount: previousCount }
          : null
      );
      if (onLikeChanged) {
        onLikeChanged(currentBlog.id, previousCount, previousLiked);
      }
    } finally {
      setIsLiking(false);
    }
  };

  // 3. Share with backend metric + native OS dialog
  const handleShare = async () => {
    if (isSharing) return;
    try {
      setIsSharing(true);
      const res = await shareBlog(currentBlog.id);
      const updatedShares = res.sharesCount || currentBlog.sharesCount + 1;

      setDetail((prev) =>
        prev ? { ...prev, sharesCount: updatedShares } : null
      );
      if (onShareSuccess) {
        onShareSuccess(currentBlog.id, updatedShares);
      }

      await Share.share({
        title: currentBlog.title,
        message: `${currentBlog.title}\n\n${currentBlog.summary || ''}\n\nLeé la crónica completa en cAPPellan: ${res.shareUrl || ''}`,
        url: res.shareUrl,
      });
    } catch {
      // Ignore dismissed share dialog
    } finally {
      setIsSharing(false);
    }
  };

  // 4. Create Comment
  const handleCreateComment = async () => {
    if (!user) {
      Alert.alert('Sesión Requerida', 'Debés iniciar sesión para comentar.');
      return;
    }
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    try {
      setIsSubmittingComment(true);
      const created = await createBlogComment(currentBlog.id, trimmed);
      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      setDetail((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo publicar el comentario.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 5. Delete Comment
  const handleDeleteComment = (comment: BlogComment) => {
    Alert.alert(
      'Eliminar Comentario',
      '¿Deseás borrar este comentario de forma permanente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBlogComment(comment.id);
              setComments((prev) => prev.filter((c) => c.id !== comment.id));
              setDetail((prev) =>
                prev
                  ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }
                  : null
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el comentario.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screenContainer}
      >
        {/* Top Sticky Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={Theme.colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            {canEdit && onEditBlog && detail && (
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => onEditBlog(detail)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Edit2 size={18} color={Theme.colors.primary} />
              </TouchableOpacity>
            )}
            {canDelete && onDeleteBlog && detail && (
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={() => onDeleteBlog(detail)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={18} color={Theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author Metadata Bar */}
          <View style={styles.authorHeader}>
            <View style={styles.authorAvatar}>
              <Shield size={18} color={Theme.colors.primary} />
            </View>
            <View style={styles.authorDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.authorNameText}>{currentBlog.authorName}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
                  <Text style={[styles.roleBadgeText, { color: roleConfig.text }]}>
                    {roleConfig.label}
                  </Text>
                </View>
              </View>
              <View style={styles.dateRow}>
                <Clock size={12} color="#8A92A0" style={{ marginRight: 4 }} />
                <Text style={styles.dateText}>
                  {formatRelativeTime(currentBlog.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          {currentBlog.tags && currentBlog.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {currentBlog.tags.map((tag) => (
                <View key={tag.slug || tag.name} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>#{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={styles.articleTitle}>{currentBlog.title}</Text>

          {/* Summary / Lead */}
          {Boolean(currentBlog.summary) && (
            <View style={styles.leadContainer}>
              <Text style={styles.leadText}>{currentBlog.summary}</Text>
            </View>
          )}

          {/* Body Content */}
          {isLoadingDetail && !detail?.content ? (
            <View style={styles.contentLoading}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando crónica completa...</Text>
            </View>
          ) : (
            <Text style={styles.articleBody}>{detail?.content || currentBlog.summary}</Text>
          )}

          {/* Metrics & Interaction Bar */}
          <View style={styles.socialBar}>
            <TouchableOpacity
              style={[styles.socialBtn, isLiked && styles.socialBtnLiked]}
              onPress={handleLikeToggle}
              disabled={isLiking}
              activeOpacity={0.7}
            >
              <Heart
                size={18}
                color={isLiked ? '#DC2626' : Theme.colors.secondary}
                fill={isLiked ? '#DC2626' : 'transparent'}
              />
              <Text style={[styles.socialBtnText, isLiked && styles.socialBtnTextLiked]}>
                {currentBlog.likesCount}{' '}
                {currentBlog.likesCount === 1 ? 'Me gusta' : 'Me gustas'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleShare}
              disabled={isSharing}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={Theme.colors.secondary} />
              <Text style={styles.socialBtnText}>
                {currentBlog.sharesCount} Compartidos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeaderRow}>
              <MessageSquare size={18} color={Theme.colors.primary} />
              <Text style={styles.commentsHeaderTitle}>
                Comentarios ({comments.length})
              </Text>
            </View>

            {isLoadingComments ? (
              <ActivityIndicator
                size="small"
                color={Theme.colors.primary}
                style={{ marginVertical: 16 }}
              />
            ) : comments.length === 0 ? (
              <View style={styles.emptyCommentsBox}>
                <Text style={styles.emptyCommentsText}>
                  No hay comentarios aún. ¡Dejá una palabra de aliento o reflexión fraterna!
                </Text>
              </View>
            ) : (
              comments.map((comment) => {
                const commentRole = getRoleBadgeConfig(comment.authorRole);
                const canDel = canDeleteComment(user, comment);

                return (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentTopRow}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthorName}>
                          {comment.authorName}
                        </Text>
                        <View
                          style={[
                            styles.roleBadgeMini,
                            { backgroundColor: commentRole.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeMiniText,
                              { color: commentRole.text },
                            ]}
                          >
                            {commentRole.label}
                          </Text>
                        </View>
                        <Text style={styles.commentTime}>
                          • {formatRelativeTime(comment.createdAt)}
                        </Text>
                      </View>

                      {canDel && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={14} color={Theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Comment Input Sticky Bar */}
        <View style={styles.commentInputContainer}>
          {user && (
            <View style={styles.commentUserNotice}>
              <ShieldCheck size={12} color={Theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.commentUserNoticeText}>
                Comentando como: <Text style={{ fontWeight: '600' }}>{user.username}</Text> ({user.role})
              </Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder={
                user
                  ? 'Escribir un comentario fraterno...'
                  : 'Iniciá sesión para comentar'
              }
              placeholderTextColor="#8A92A0"
              value={newCommentText}
              onChangeText={setNewCommentText}
              editable={Boolean(user)}
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!newCommentText.trim() || isSubmittingComment || !user) &&
                  styles.sendBtnDisabled,
              ]}
              onPress={handleCreateComment}
              disabled={!newCommentText.trim() || isSubmittingComment || !user}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerActionBtn: {
    padding: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  authorNameText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.onSurface,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.bodySemiBold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: '#8A92A0',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: '#F1F4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
  },
  articleTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
    lineHeight: 32,
    marginBottom: 12,
  },
  leadContainer: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.secondary,
    padding: 12,
    borderRadius: 4,
    marginBottom: 18,
  },
  leadText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
    lineHeight: 22,
  },
  contentLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
  },
  articleBody: {
    fontSize: 15,
    fontFamily: Theme.fonts.body,
    color: '#2D3748',
    lineHeight: 26,
    marginBottom: 24,
  },
  socialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EDF1F5',
    marginBottom: 24,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  socialBtnLiked: {
    backgroundColor: '#FEE2E2',
  },
  socialBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  socialBtnTextLiked: {
    color: '#DC2626',
  },
  commentsSection: {
    marginTop: 8,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  commentsHeaderTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
  },
  emptyCommentsBox: {
    padding: 18,
    backgroundColor: '#F8F9FB',
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: '#8A92A0',
    textAlign: 'center',
    lineHeight: 18,
  },
  commentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  commentAuthorName: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.onSurface,
  },
  roleBadgeMini: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  roleBadgeMiniText: {
    fontSize: 8.5,
    fontFamily: Theme.fonts.bodySemiBold,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#8A92A0',
  },
  commentContent: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
    lineHeight: 19,
  },
  commentInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF0F3',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  commentUserNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUserNoticeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C5C6CA',
  },
});
