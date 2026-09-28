import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { FilterPills, TacticalButton } from '../components/common';
import {
  Search,
  X,
  Plus,
  Tv,
  Sparkles,
  FileQuestion,
  RefreshCw,
} from 'lucide-react-native';
import { useAuthStore } from '../lib/stores/auth';
import {
  fetchContents,
  toggleContentLike,
  deleteContent,
} from '../lib/api/content';
import {
  ContentCard,
  ModernSocialContentCard,
  ContentDetailModal,
  ContentCommentsModal,
  ContentFormModal,
} from '../components/content';
import type { ContentItem, ContentType } from '../types/api';

const FILTER_CATEGORIES = [
  { id: 'ALL', label: 'Todos' },
  { id: 'SPOTIFY', label: 'Spotify / Audio' },
  { id: 'YOUTUBE', label: 'YouTube Videos' },
  { id: 'IMAGE', label: 'Imágenes' },
  { id: 'VIDEO', label: 'Videos' },
];

export default function ContentScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const canManage =
    user?.role === 'CHAPLAIN_CONTENT_LEADER' || user?.role === 'SUPERUSER';

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Mode: 'modern' (new Instagram/TikTok cutout card design) | 'classic' (original cards)
  const [viewMode, setViewMode] = useState<'modern' | 'classic'>('modern');

  // Comments Modal
  const [activeContentForComments, setActiveContentForComments] = useState<ContentItem | null>(null);

  // Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<ContentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form Modal (Create / Edit)
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadContents = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      try {
        const typeParam = selectedType === 'ALL' ? undefined : (selectedType as ContentType);
        const data = await fetchContents(typeParam);
        setContents(data || []);
      } catch (err: any) {
        // Keep existing on network drop
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedType]
  );

  useEffect(() => {
    loadContents(true);
  }, [loadContents]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadContents(false);
  }, [loadContents]);

  // Client-side instantaneous title and description filter
  const filteredContents = useMemo(() => {
    if (!searchQuery.trim()) return contents;
    const q = searchQuery.toLowerCase();
    return contents.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [contents, searchQuery]);

  // Atomic like toggle with optimistic state update
  const handleLikeToggle = useCallback(
    async (id: number) => {
      if (!isAuthenticated) {
        Alert.alert(
          'Iniciar Sesión Requerido',
          'Para interactuar y dar Me Gusta a los contenidos, necesitás ingresar con tu cuenta.'
        );
        return;
      }

      setContents((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const currentLiked = !!item.isLikedByMe;
          const nextLiked = !currentLiked;
          const nextCount = Math.max(0, item.likesCount + (nextLiked ? 1 : -1));
          return {
            ...item,
            isLikedByMe: nextLiked,
            likesCount: nextCount,
          };
        })
      );

      try {
        const res = await toggleContentLike(id);
        setContents((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              isLikedByMe: res.liked,
              likesCount: res.likesCount,
            };
          })
        );
      } catch {
        // Rollback on failure
        loadContents(false);
      }
    },
    [isAuthenticated, loadContents]
  );

  const handleOpenDetail = useCallback((item: ContentItem) => {
    setSelectedDetail(item);
    setIsDetailOpen(true);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingContent(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: ContentItem) => {
    setEditingContent(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (item: ContentItem) => {
      Alert.alert(
        '¿Eliminar Contenido?',
        `Esta acción eliminará de forma permanente "${item.title}". No se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteContent(item.id);
                setContents((prev) => prev.filter((c) => c.id !== item.id));
              } catch (err: any) {
                Alert.alert('Error', err.message || 'No se pudo eliminar el contenido.');
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleFormSuccess = useCallback((savedItem: ContentItem) => {
    setContents((prev) => {
      const exists = prev.some((c) => c.id === savedItem.id);
      if (exists) {
        return prev.map((c) => (c.id === savedItem.id ? savedItem : c));
      }
      return [savedItem, ...prev];
    });
  }, []);

  const handleDetailLikeChanged = useCallback(
    (id: number, newCount: number, liked: boolean) => {
      setContents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likesCount: newCount, isLikedByMe: liked } : c))
      );
    },
    []
  );

  const isTablet = width > 500;

  const renderHeader = () => (
    <View style={styles.headerBlock}>
      {/* 1. Hero / Editorial Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <Tv size={14} color={Theme.colors.primary} />
          <Text style={styles.heroBadgeText}>PANEL EDITORIAL & MULTIMEDIA</Text>
        </View>
        <Text style={styles.heroTitle}>Contenido y Reflexión</Text>
        <Text style={styles.heroSubtitle}>
          Recursos de audio en Spotify, prédicas en video y mensajes de fe para acompañar a la comunidad.
        </Text>

        {canManage ? (
          <View style={styles.heroActionRow}>
            <TacticalButton
              title="Publicar Contenido"
              onPress={handleOpenCreate}
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} color="#FFFFFF" />}
              style={styles.newContentBtn}
            />
          </View>
        ) : null}
      </View>

      {/* 2. Tactical Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={Theme.colors.onSurfaceVariant} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título o reflexión pastoral..."
          placeholderTextColor="#8A92A0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={18} color={Theme.colors.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      {/* 2.5 View Mode Switcher: Moderno (New Social Cutout) vs Clásico (Original) */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === 'modern' && styles.viewModeTabActive,
          ]}
          onPress={() => setViewMode('modern')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeTabText,
              viewMode === 'modern' && styles.viewModeTabTextActive,
            ]}
          >
            Diseño Moderno
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewModeTab,
            viewMode === 'classic' && styles.viewModeTabActive,
          ]}
          onPress={() => setViewMode('classic')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.viewModeTabText,
              viewMode === 'classic' && styles.viewModeTabTextActive,
            ]}
          >
            Diseño Clásico
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Filter Pills */}
      <FilterPills
        items={FILTER_CATEGORIES}
        selectedId={selectedType}
        onSelect={(id) => setSelectedType(id)}
        style={styles.filterPills}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando publicaciones...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyBox}>
        <View style={styles.emptyIconCircle}>
          <FileQuestion size={32} color={Theme.colors.secondary} />
        </View>
        <Text style={styles.emptyTitle}>No hay contenidos disponibles</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? 'No encontramos publicaciones que coincidan con tu búsqueda.'
            : 'Pronto compartiremos nuevos recursos en esta categoría.'}
        </Text>
        {canManage ? (
          <TacticalButton
            title="Crear Primera Publicación"
            onPress={handleOpenCreate}
            variant="primary"
            size="sm"
            leftIcon={<Plus size={16} color="#FFFFFF" />}
            style={{ marginTop: 14 }}
          />
        ) : (
          <TacticalButton
            title="Reintentar Carga"
            onPress={() => loadContents(true)}
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} color={Theme.colors.secondary} />}
            style={{ marginTop: 14 }}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredContents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          if (viewMode === 'classic') {
            return (
              <ContentCard
                content={item}
                canManage={canManage}
                onLikeToggle={handleLikeToggle}
                onOpenDetail={handleOpenDetail}
                onOpenComments={setActiveContentForComments}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            );
          }

          return (
            <ModernSocialContentCard
              content={item}
              canManage={canManage}
              onLikeToggle={handleLikeToggle}
              onOpenDetail={handleOpenDetail}
              onOpenComments={setActiveContentForComments}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          );
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Theme.colors.primary}
            colors={[Theme.colors.primary]}
          />
        }
        // Performance properties per vercel-react-native-skills
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Content Detail Modal */}
      <ContentDetailModal
        visible={isDetailOpen}
        content={selectedDetail}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetail(null);
        }}
        onLikeChanged={handleDetailLikeChanged}
        onOpenComments={setActiveContentForComments}
      />

      {/* Content Comments Modal */}
      <ContentCommentsModal
        visible={Boolean(activeContentForComments)}
        content={activeContentForComments}
        onClose={() => setActiveContentForComments(null)}
        onCommentAdded={(contentId, newCount) => {
          setContents((prev) =>
            prev.map((c) => (c.id === contentId ? { ...c, commentsCount: newCount } : c))
          );
          if (activeContentForComments && activeContentForComments.id === contentId) {
            setActiveContentForComments((prev) =>
              prev ? { ...prev, commentsCount: newCount } : null
            );
          }
        }}
      />

      {/* Content Create / Edit Modal */}
      <ContentFormModal
        visible={isFormOpen}
        initialContent={editingContent}
        onClose={() => {
          setIsFormOpen(false);
          setEditingContent(null);
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
  listContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 12,
    paddingBottom: 110,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerBlock: {
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    ...globalStyles.shadowSm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.primary,
  },
  heroTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 20,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
  },
  heroActionRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  newContentBtn: {
    alignSelf: 'flex-start',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.lg,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...globalStyles.shadowSm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  filterPills: {
    paddingBottom: 6,
  },
  // View Mode Switcher Styles (Matches Prayer Wall Screen)
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  viewModeTabText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
  },
  viewModeTabTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#0F172A',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  emptyBox: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
