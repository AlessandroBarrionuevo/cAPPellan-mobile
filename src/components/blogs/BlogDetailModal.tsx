import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  Bookmark,
} from 'lucide-react-native';
import { useAuthStore } from '../../lib/stores/auth';
import { useAppInsets } from '../../lib/safeArea';
import {
  fetchBlogDetail,
  toggleBlogLike,
  fetchBlogComments,
  createBlogComment,
  deleteBlogComment,
} from '../../lib/api/blogs';
import {
  canEditBlog,
  canDeleteBlog,
  canDeleteComment,
} from '../../lib/blogPermissions';
import { formatRelativeTime, getRoleBadgeConfig, getAuthorInitials } from './BlogCard';
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

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=1200';

function formatArticleDate(dateString?: string): string {
  if (!dateString) return 'Hoy';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Hoy';
  return d.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function calculateReadingTime(text?: string): number {
  if (!text) return 3;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

function formatReadCount(likesCount: number = 0): string {
  const base = likesCount * 18 + 120;
  if (base >= 1000) {
    return `${(base / 1000).toFixed(1)}k`;
  }
  return String(base);
}

export function BlogDetailModal({
  visible,
  blog: initialItem,
  onClose,
  onLikeChanged,
  onEditBlog,
  onDeleteBlog,
}: BlogDetailModalProps) {
  const insets = useAppInsets();
  const user = useAuthStore((state) => state.user);

  const [detail, setDetail] = useState<BlogDetail | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
    } catch {
      // Retain fallback detail from initialItem
    } finally {
      setIsLoadingDetail(false);
      setIsLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (visible && initialItem) {
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

  const currentBlog = detail || initialItem;

  // Split content into clean editorial paragraphs
  const paragraphs = useMemo(() => {
    if (!currentBlog) return [];
    const rawContent = detail?.content || currentBlog.summary || '';
    if (!rawContent) return [];
    return rawContent
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [detail?.content, currentBlog]);

  if (!visible || !initialItem || !currentBlog) return null;

  const isLiked = Boolean(currentBlog.isLikedByMe);
  const roleConfig = getRoleBadgeConfig(currentBlog.authorRole);
  const canEdit = canEditBlog(user, currentBlog);
  const canDelete = canDeleteBlog(user, currentBlog);

  const readingTime = calculateReadingTime(detail?.content || currentBlog.summary);
  const readCount = formatReadCount(currentBlog.likesCount);
  const primaryTag = currentBlog.tags?.[0]?.name || 'Reflexión Pastoral';
  const authorAvatarUri =
    currentBlog.authorAvatarUrl ||
    (user && user.userId === currentBlog.authorId ? user.avatarUrl : null);
  const heroImageUri = currentBlog.coverImageUrl || DEFAULT_HERO_IMAGE;

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

  // 3. Create Comment
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

  // 4. Delete Comment
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
        {/* Floating Top Nav Controls over Hero Image */}
        <View style={[styles.floatingTopBar, { top: Math.max(insets.top, 14) }]}>
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.floatingRightRow}>
            {canEdit && onEditBlog && detail && (
              <TouchableOpacity
                style={styles.floatingCircleBtn}
                onPress={() => onEditBlog(detail)}
                activeOpacity={0.8}
              >
                <Edit2 size={17} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {canDelete && onDeleteBlog && detail && (
              <TouchableOpacity
                style={[styles.floatingCircleBtn, styles.deleteCircleBtn]}
                onPress={() => onDeleteBlog(detail)}
                activeOpacity={0.8}
              >
                <Trash2 size={17} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.floatingCircleBtn}
              onPress={() => setIsBookmarked((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Bookmark
                size={17}
                color="#FFFFFF"
                fill={isBookmarked ? '#FFFFFF' : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================================================== */}
          {/* 1. HERO TOP COVER IMAGE (MATCHING REFERENCE DESIGN)                  */}
          {/* ==================================================================== */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: heroImageUri }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Subtle top vignette gradient for legibility */}
            <View style={styles.heroTopVignette} pointerEvents="none" />
          </View>

          {/* ==================================================================== */}
          {/* 2. OVERLAPPING WHITE ARTICLE SHEET                                   */}
          {/* ==================================================================== */}
          <View style={styles.articleSheet}>
            {/* Category Tag Pill (e.g. Design / Reflexión) */}
            <View style={styles.categoryPillsRow}>
              <View style={styles.primaryCategoryPill}>
                <Text style={styles.primaryCategoryPillText}>{primaryTag}</Text>
              </View>
              {currentBlog.tags && currentBlog.tags.length > 1 && (
                <View style={styles.secondaryCategoryPill}>
                  <Text style={styles.secondaryCategoryPillText}>
                    #{currentBlog.tags[1].name}
                  </Text>
                </View>
              )}
            </View>

            {/* Article Headline Title (Large Serif/Editorial Typography) */}
            <Text style={styles.editorialTitle}>{currentBlog.title}</Text>

            {/* Author & Publication Metadata Row */}
            <View style={styles.authorMetaBar}>
              {authorAvatarUri ? (
                <Image
                  source={{ uri: authorAvatarUri }}
                  style={styles.authorAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.authorAvatarDefault}>
                  <Text style={styles.authorAvatarInitials}>
                    {getAuthorInitials(currentBlog.authorName)}
                  </Text>
                </View>
              )}

              <View style={styles.authorMetaCol}>
                {/* Author Name • Follow / Rol */}
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorNameText} numberOfLines={1}>
                    {currentBlog.authorName || 'Autor Institucional'}
                  </Text>
                  <Text style={styles.authorMetaDot}>•</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.followActionText}>
                      {roleConfig.label}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date • Reading time • Read Count */}
                <View style={styles.publicationSubRow}>
                  <Text style={styles.publicationDateText}>
                    {formatArticleDate(currentBlog.createdAt)}
                  </Text>
                  <Text style={styles.authorMetaDot}>•</Text>
                  <Text style={styles.publicationSubText}>
                    {readingTime} min de lectura
                  </Text>
                  <Text style={styles.authorMetaDot}>•</Text>
                  <View style={styles.readCountGroup}>
                    <Eye size={12} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.publicationSubText}>
                      {readCount} leyeron esto
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Thin Divider Line */}
            <View style={styles.metaDividerLine} />

            {/* ==================================================================== */}
            {/* 3. EDITORIAL ARTICLE BODY (CLEAN SPACIOUS PARAGRAPHS)               */}
            {/* ==================================================================== */}
            {isLoadingDetail && !detail?.content ? (
              <View style={styles.contentLoading}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando crónica completa...</Text>
              </View>
            ) : paragraphs.length > 0 ? (
              <View style={styles.paragraphsContainer}>
                {paragraphs.map((paragraph, index) => (
                  <Text key={index} style={styles.editorialParagraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.editorialParagraph}>
                {currentBlog.summary || 'Sin contenido disponible en este momento.'}
              </Text>
            )}

            {/* ==================================================================== */}
            {/* 4. POST-ARTICLE INTERACTION BAR: LIKES & COMMENTS STATS              */}
            {/* ==================================================================== */}
            <View style={styles.interactionSection}>
              {/* Like Button */}
              <TouchableOpacity
                style={[styles.likeActionPill, isLiked && styles.likeActionPillActive]}
                onPress={handleLikeToggle}
                disabled={isLiking}
                activeOpacity={0.8}
              >
                <Heart
                  size={19}
                  color={isLiked ? '#EF4444' : '#0F2438'}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                />
                <Text
                  style={[
                    styles.likeActionPillText,
                    isLiked && styles.likeActionPillTextActive,
                  ]}
                >
                  {currentBlog.likesCount || 0} Me gusta
                </Text>
              </TouchableOpacity>

              {/* Comments Badge Pill */}
              <View style={styles.commentsCountPill}>
                <MessageCircle size={18} color="#0c7ae0" />
                <Text style={styles.commentsCountPillText}>
                  {comments.length} Comentarios
                </Text>
              </View>
            </View>

            {/* ==================================================================== */}
            {/* 5. COMMENTS SECTION                                                 */}
            {/* ==================================================================== */}
            <View style={styles.commentsSection}>
              <View style={styles.commentsSectionHeader}>
                <Text style={styles.commentsSectionTitle}>
                  Comentarios y Reflexiones ({comments.length})
                </Text>
              </View>

              {isLoadingComments ? (
                <ActivityIndicator
                  size="small"
                  color={Theme.colors.primary}
                  style={{ marginVertical: 18 }}
                />
              ) : comments.length === 0 ? (
                <View style={styles.emptyCommentsCard}>
                  <MessageCircle size={28} color="#94A3B8" />
                  <Text style={styles.emptyCommentsTitle}>Aún no hay comentarios</Text>
                  <Text style={styles.emptyCommentsSubtitle}>
                    Sé el primero en dejar una palabra de aliento o reflexión fraterna.
                  </Text>
                </View>
              ) : (
                comments.map((comment) => {
                  const commentRole = getRoleBadgeConfig(comment.authorRole);
                  const canDel = canDeleteComment(user, comment);

                  return (
                    <View key={comment.id} style={styles.commentItemCard}>
                      <View style={styles.commentItemTopRow}>
                        <View style={styles.commentItemAuthorLeft}>
                          <View style={styles.commentAvatarMiniCircle}>
                            <Text style={styles.commentAvatarMiniInitial}>
                              {(comment.authorName || 'C')[0].toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.commentItemAuthorMeta}>
                            <View style={styles.commentItemAuthorBadgeRow}>
                              <Text style={styles.commentItemAuthorName}>
                                {comment.authorName}
                              </Text>
                              <View
                                style={[
                                  styles.commentRolePill,
                                  { backgroundColor: commentRole.bg },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.commentRolePillText,
                                    { color: commentRole.text },
                                  ]}
                                >
                                  {commentRole.label}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.commentItemTime}>
                              {formatRelativeTime(comment.createdAt)}
                            </Text>
                          </View>
                        </View>

                        {canDel && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={15} color={Theme.colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.commentItemContent}>
                        {comment.content}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        {/* ==================================================================== */}
        {/* 6. STICKY POST COMMENT INPUT BAR                                     */}
        {/* ==================================================================== */}
        <View style={styles.stickyInputBar}>
          {user && (
            <View style={styles.commentingNoticeRow}>
              <ShieldCheck size={12} color="#0c7ae0" style={{ marginRight: 4 }} />
              <Text style={styles.commentingNoticeText}>
                Comentando como: <Text style={{ fontWeight: '700' }}>{user.username}</Text>
              </Text>
            </View>
          )}

          <View style={styles.inputInnerRow}>
            <TextInput
              style={styles.commentTextInput}
              placeholder={
                user
                  ? 'Escribir una reflexión o comentario...'
                  : 'Iniciá sesión para comentar'
              }
              placeholderTextColor="#94A3B8"
              value={newCommentText}
              onChangeText={setNewCommentText}
              editable={Boolean(user)}
              multiline
              maxLength={400}
            />

            <TouchableOpacity
              style={[
                styles.sendCommentBtn,
                (!newCommentText.trim() || isSubmittingComment || !user) &&
                  styles.sendCommentBtnDisabled,
              ]}
              onPress={handleCreateComment}
              disabled={!newCommentText.trim() || isSubmittingComment || !user}
              activeOpacity={0.8}
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

  // Floating Header Controls
  floatingTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircleBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.75)',
  },
  floatingRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Hero Cover Image
  heroImageWrapper: {
    width: '100%',
    height: 270,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },

  // Overlapping White Article Sheet
  articleSheet: {
    marginTop: -32,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Category Tag Pills
  categoryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  primaryCategoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  primaryCategoryPillText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  secondaryCategoryPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryCategoryPillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#64748B',
  },

  // Editorial Title (Serif / Medium article feel)
  editorialTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 26,
    lineHeight: 34,
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 16,
  },

  // Author & Metadata Row
  authorMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  authorAvatarDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitials: {
    fontSize: 16,
    fontFamily: Theme.fonts.headlineBold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  authorMetaCol: {
    flex: 1,
    justifyContent: 'center',
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  authorNameText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: '#0F172A',
    letterSpacing: 0.1,
  },
  authorMetaDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  followActionText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
    letterSpacing: 0.2,
  },
  publicationSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  publicationDateText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#64748B',
  },
  publicationSubText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#64748B',
  },
  readCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaDividerLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 22,
  },

  // Editorial Body Paragraphs
  paragraphsContainer: {
    marginBottom: 24,
  },
  editorialParagraph: {
    fontFamily: Theme.fonts.body,
    fontSize: 16.5,
    lineHeight: 27,
    color: '#334155',
    marginBottom: 20,
    letterSpacing: 0.15,
  },
  contentLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
  },

  // Interactions Bar (Likes & Comments Count)
  interactionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  likeActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  likeActionPillActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  likeActionPillText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0F2438',
  },
  likeActionPillTextActive: {
    color: '#DC2626',
  },
  commentsCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  commentsCountPillText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
  },

  // Comments Section
  commentsSection: {
    marginTop: 8,
  },
  commentsSectionHeader: {
    marginBottom: 14,
  },
  commentsSectionTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    color: '#0F2438',
    letterSpacing: -0.2,
  },
  emptyCommentsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyCommentsTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14.5,
    color: '#334155',
  },
  emptyCommentsSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },
  commentItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentItemAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  commentAvatarMiniCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarMiniInitial: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  commentItemAuthorMeta: {
    flex: 1,
  },
  commentItemAuthorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentItemAuthorName: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0F2438',
  },
  commentRolePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  commentRolePillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
  },
  commentItemTime: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  commentItemContent: {
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
  },

  // Sticky Bottom Comment Input Bar
  stickyInputBar: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  commentingNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  commentingNoticeText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: '#0F2438',
    maxHeight: 90,
  },
  sendCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCommentBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
});

export default BlogDetailModal;
