import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import {
  Search,
  X,
  Plus,
  HeartHandshake,
  BookOpen,
  Filter,
  FileEdit,
  Sparkles,
  Shield,
} from 'lucide-react-native';
import { useAuthStore } from '../lib/stores/auth';
import {
  fetchBlogs,
  fetchBlogTags,
  fetchBlogDraft,
  toggleBlogLike,
  shareBlog,
  deleteBlog,
} from '../lib/api/blogs';
import {
  BlogCard,
  BlogDetailModal,
  BlogFormModal,
} from '../components/blogs';
import {
  canCreateBlog,
  canEditBlog,
  canDeleteBlog,
} from '../lib/blogPermissions';
import { loadLocalBlogDraft } from '../lib/storage/blogDraftStorage';
import type { BlogPostItem, BlogDetail, BlogTag } from '../types/blog';

const DEFAULT_TAGS: BlogTag[] = [
  { id: 1, name: 'anécdota', slug: 'anecdota' },
  { id: 2, name: 'descargo', slug: 'descargo' },
  { id: 3, name: 'espiritual', slug: 'espiritual' },
  { id: 4, name: 'reflexión', slug: 'reflexion' },
  { id: 5, name: 'historia de combate', slug: 'historia-de-combate' },
  { id: 6, name: 'prédica', slug: 'predica' },
  { id: 7, name: 'testimonio', slug: 'testimonio' },
];

export default function BlogFeedScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const [blogs, setBlogs] = useState<BlogPostItem[]>([]);
  const [tags, setTags] = useState<BlogTag[]>(DEFAULT_TAGS);
  const [selectedTagSlug, setSelectedTagSlug] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Draft badge state
  const [hasActiveDraft, setHasActiveDraft] = useState(false);

  // Modals state
  const [selectedBlogForDetail, setSelectedBlogForDetail] = useState<BlogPostItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [editingBlog, setEditingBlog] = useState<BlogPostItem | BlogDetail | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Check for drafts on mount & whenever form closes
  const checkDraft = useCallback(async () => {
    if (!user) {
      setHasActiveDraft(false);
      return;
    }
    try {
      const remoteDraft = await fetchBlogDraft();
      if (
        remoteDraft &&
        (remoteDraft.title || remoteDraft.content || remoteDraft.summary)
      ) {
        setHasActiveDraft(true);
        return;
      }
    } catch {
      // Ignore network hiccup
    }

    const localDraft = await loadLocalBlogDraft(user.userId);
    setHasActiveDraft(
      Boolean(
        localDraft && (localDraft.title || localDraft.content || localDraft.summary)
      )
    );
  }, [user]);

  useEffect(() => {
    checkDraft();
  }, [checkDraft, isFormOpen]);

  // 2. Fetch tags list
  useEffect(() => {
    void fetchBlogTags()
      .then((serverTags) => {
        if (serverTags && serverTags.length > 0) {
          setTags(serverTags);
        }
      })
      .catch(() => {
        // Fallback default tags remain active
      });
  }, []);

  // 3. Load blogs page
  const loadPage = useCallback(
    async (pageToLoad: number, isRefresh: boolean = false) => {
      try {
        if (pageToLoad === 0) {
          if (!isRefresh) setIsLoadingInitial(true);
        } else {
          setIsLoadingMore(true);
        }

        const tagParam = selectedTagSlug === 'ALL' ? undefined : selectedTagSlug;
        const response = await fetchBlogs({
          tag: tagParam,
          page: pageToLoad,
          size: 10,
        });

        const newItems = response?.content || [];
        const total = response?.page?.totalPages || 1;

        if (pageToLoad === 0) {
          setBlogs(newItems);
        } else {
          setBlogs((prev) => {
            // Deduplicate items
            const existingIds = new Set(prev.map((b) => b.id));
            const fresh = newItems.filter((b) => !existingIds.has(b.id));
            return [...prev, ...fresh];
          });
        }

        setCurrentPage(pageToLoad);
        setTotalPages(total);
      } catch (err: any) {
        // Retain existing state on transient error
      } finally {
        setIsLoadingInitial(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [selectedTagSlug]
  );

  // Reload when tag filter changes
  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPage(0, true);
  }, [loadPage]);

  // Infinite scroll
  const handleEndReached = useCallback(() => {
    if (isLoadingMore || isLoadingInitial || isRefreshing) return;
    if (currentPage + 1 < totalPages) {
      loadPage(currentPage + 1, false);
    }
  }, [currentPage, totalPages, isLoadingMore, isLoadingInitial, isRefreshing, loadPage]);

  // 4. Like toggle with optimistic update on feed
  const handleLikePress = useCallback(
    async (targetBlog: BlogPostItem) => {
      if (!user) {
        Alert.alert('Sesión Requerida', 'Debés iniciar sesión para dar me gusta.');
        return;
      }

      const previousLiked = Boolean(targetBlog.isLikedByMe);
      const previousCount = targetBlog.likesCount;
      const nextLiked = !previousLiked;
      const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

      // Optimistic feed update
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === targetBlog.id
            ? { ...b, isLikedByMe: nextLiked, likesCount: nextCount }
            : b
        )
      );

      try {
        const res = await toggleBlogLike(targetBlog.id);
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === targetBlog.id
              ? { ...b, isLikedByMe: res.liked, likesCount: res.likesCount }
              : b
          )
        );
      } catch {
        // Rollback
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === targetBlog.id
              ? { ...b, isLikedByMe: previousLiked, likesCount: previousCount }
              : b
          )
        );
      }
    },
    [user]
  );

  // 5. Native Share
  const handleSharePress = useCallback(async (targetBlog: BlogPostItem) => {
    try {
      const res = await shareBlog(targetBlog.id);
      const newCount = res.sharesCount || targetBlog.sharesCount + 1;

      setBlogs((prev) =>
        prev.map((b) => (b.id === targetBlog.id ? { ...b, sharesCount: newCount } : b))
      );

      await Share.share({
        title: targetBlog.title,
        message: `${targetBlog.title}\n\n${targetBlog.summary || ''}\n\nLeé más en la app institucional cAPPellan: ${res.shareUrl || ''}`,
        url: res.shareUrl,
      });
    } catch {
      // Ignored
    }
  }, []);

  // 6. Delete blog
  const handleDeletePress = useCallback(
    (targetBlog: BlogPostItem) => {
      Alert.alert(
        'Eliminar Crónica',
        `¿Confirmás la eliminación de "${targetBlog.title}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteBlog(targetBlog.id);
                setBlogs((prev) => prev.filter((b) => b.id !== targetBlog.id));
                if (selectedBlogForDetail?.id === targetBlog.id) {
                  setIsDetailOpen(false);
                  setSelectedBlogForDetail(null);
                }
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'No se pudo eliminar la crónica.');
              }
            },
          },
        ]
      );
    },
    [selectedBlogForDetail?.id]
  );

  // 7. Client-side title search filter
  const filteredBlogs = useMemo(() => {
    if (!searchQuery.trim()) return blogs;
    const q = searchQuery.toLowerCase();
    return blogs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.summary && b.summary.toLowerCase().includes(q)) ||
        b.authorName.toLowerCase().includes(q)
    );
  }, [blogs, searchQuery]);

  // Open detail
  const handleOpenDetail = useCallback((item: BlogPostItem) => {
    setSelectedBlogForDetail(item);
    setIsDetailOpen(true);
  }, []);

  // Open edit
  const handleOpenEdit = useCallback((item: BlogPostItem) => {
    setEditingBlog(item);
    setIsFormOpen(true);
  }, []);

  // Open create
  const handleOpenCreate = () => {
    if (!user) {
      Alert.alert('Acceso Requerido', 'Iniciá sesión para publicar en la comunidad.');
      return;
    }
    setEditingBlog(null);
    setIsFormOpen(true);
  };

  // Sync like change from detail modal
  const handleDetailLikeChanged = useCallback(
    (id: number, newCount: number, liked: boolean) => {
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, likesCount: newCount, isLikedByMe: liked } : b
        )
      );
    },
    []
  );

  // Sync share change from detail modal
  const handleDetailShareSuccess = useCallback((id: number, newCount: number) => {
    setBlogs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, sharesCount: newCount } : b))
    );
  }, []);

  // Success saving from form modal
  const handleFormSuccess = useCallback((saved: BlogDetail) => {
    setBlogs((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    checkDraft();
  }, [checkDraft]);

  return (
    <View style={styles.container}>
      {/* Top Action & Search Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#8A92A0" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar crónicas o autor..."
            placeholderTextColor="#8A92A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#8A92A0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Create Button (Available to all registered, including BASIC) */}
        <TouchableOpacity
          style={styles.createBlogBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.createBlogBtnText}>Publicar</Text>
          {hasActiveDraft && (
            <View
              style={styles.draftBadgeDot}
              accessibilityLabel="Borrador pendiente"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Horizontal Tags Filter Bar */}
      <View style={styles.tagsFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsFilterScroll}
        >
          {/* "Todos" pill */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedTagSlug === 'ALL' && styles.filterPillActive,
            ]}
            onPress={() => setSelectedTagSlug('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedTagSlug === 'ALL' && styles.filterPillTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {/* Seeded and server tags */}
          {tags.map((tag) => {
            const isActive = selectedTagSlug === tag.slug;
            return (
              <TouchableOpacity
                key={tag.slug || tag.name}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedTagSlug(tag.slug)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  #{tag.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Blog Feed List */}
      {isLoadingInitial ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loaderText}>Cargando crónicas ministeriales...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBlogs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BlogCard
              blog={item}
              canEdit={canEditBlog(user, item)}
              canDelete={canDeleteBlog(user, item)}
              onPress={handleOpenDetail}
              onLikePress={handleLikePress}
              onSharePress={handleSharePress}
              onCommentPress={handleOpenDetail}
              onEditPress={handleOpenEdit}
              onDeletePress={handleDeletePress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          removeClippedSubviews={true}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="#C5C6CA" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No hay crónicas publicadas</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTagSlug !== 'ALL'
                  ? 'No se encontraron publicaciones con esta etiqueta.'
                  : 'Sé el primero en compartir un testimonio, descargo o reflexión con el cuerpo institucional.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={handleOpenCreate}
              >
                <FileEdit size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Escribir una Crónica</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Full Detail Modal */}
      <BlogDetailModal
        visible={isDetailOpen}
        blog={selectedBlogForDetail}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedBlogForDetail(null);
        }}
        onLikeChanged={handleDetailLikeChanged}
        onShareSuccess={handleDetailShareSuccess}
        onEditBlog={(blog) => {
          setIsDetailOpen(false);
          setEditingBlog(blog);
          setIsFormOpen(true);
        }}
        onDeleteBlog={(blog) => {
          handleDeletePress(blog);
        }}
      />

      {/* Create / Edit Form Modal */}
      <BlogFormModal
        visible={isFormOpen}
        initialBlog={editingBlog}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBlog(null);
          checkDraft();
        }}
        onSuccess={handleFormSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
    paddingVertical: 0,
  },
  createBlogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: Theme.roundness.full,
    position: 'relative',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  createBlogBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  draftBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // Amber indicator for draft
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tagsFilterWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  tagsFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primaryDark,
    borderColor: Theme.colors.primaryDark,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 28,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Theme.roundness.full,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
