import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  X,
  FileText,
  Tag as TagIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  CloudCheck,
  CloudUpload,
} from 'lucide-react-native';
import { useAuthStore } from '../../lib/stores/auth';
import {
  fetchBlogTags,
  fetchBlogDraft,
  saveBlogDraft,
  discardBlogDraft,
  publishBlogDraft,
} from '../../lib/api/blogs';
import {
  saveLocalBlogDraft,
  loadLocalBlogDraft,
  clearLocalBlogDraft,
} from '../../lib/storage/blogDraftStorage';
import { canCreateTag } from '../../lib/blogPermissions';
import { TagCreateModal } from './TagCreateModal';
import type { BlogPostItem, BlogDetail, BlogTag, BlogDraft } from '../../types/blog';

// Pre-seeded fallback tags in case backend is initializing
const DEFAULT_FALLBACK_TAGS: BlogTag[] = [
  { id: 1, name: 'anécdota', slug: 'anecdota' },
  { id: 2, name: 'descargo', slug: 'descargo' },
  { id: 3, name: 'espiritual', slug: 'espiritual' },
  { id: 4, name: 'reflexión', slug: 'reflexion' },
  { id: 5, name: 'historia de combate', slug: 'historia-de-combate' },
  { id: 6, name: 'prédica', slug: 'predica' },
  { id: 7, name: 'testimonio', slug: 'testimonio' },
];

interface BlogFormModalProps {
  visible: boolean;
  initialBlog?: BlogPostItem | BlogDetail | null;
  onClose: () => void;
  onSuccess: (savedBlog: BlogDetail) => void;
}

export function BlogFormModal({
  visible,
  initialBlog,
  onClose,
  onSuccess,
}: BlogFormModalProps) {
  const user = useAuthStore((state) => state.user);
  const isEditing = Boolean(initialBlog);
  const targetPostId = initialBlog ? initialBlog.id : null;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<BlogTag[]>(DEFAULT_FALLBACK_TAGS);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [draftLastSaved, setDraftLastSaved] = useState<string | null>(null);

  // Ref to always have latest state values in lifecycle listeners
  const currentFormRef = useRef({ title, summary, content, selectedTagSlugs });
  currentFormRef.current = { title, summary, content, selectedTagSlugs };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch live tags from server
  const loadTags = useCallback(async () => {
    try {
      const tags = await fetchBlogTags();
      if (tags && tags.length > 0) {
        setAvailableTags(tags);
      }
    } catch {
      // Fallback tags are already in place
    }
  }, []);

  // 2. Persist current draft to backend (PUT /blogs/draft) and local disk backup
  const persistDraftNow = useCallback(async () => {
    if (!user) return;
    const { title: t, summary: s, content: c, selectedTagSlugs: slugs } =
      currentFormRef.current;

    // Avoid upserting completely empty draft buffers if nothing was typed
    if (!t.trim() && !s.trim() && !c.trim() && slugs.length === 0) {
      return;
    }

    try {
      setIsAutoSaving(true);
      const savedDto = await saveBlogDraft({
        postId: targetPostId,
        title: t,
        summary: s,
        content: c,
        tagSlugs: slugs,
      });

      const updatedTime = savedDto?.updatedAt || new Date().toISOString();
      setDraftLastSaved(updatedTime);

      // Local backup for instant offline restore
      await saveLocalBlogDraft(user.userId, {
        postId: targetPostId,
        title: t,
        summary: s,
        content: c,
        tagSlugs: slugs,
        updatedAt: updatedTime,
      });
    } catch (err) {
      console.warn('[BlogFormModal] Error auto-saving draft to backend:', err);
    } finally {
      setIsAutoSaving(false);
    }
  }, [user, targetPostId]);

  // 3. Listen for AppState changes to guarantee background auto-saving to backend
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'background' || nextState === 'inactive') {
          void persistDraftNow();
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, [persistDraftNow]);

  // 4. Modal Visibility & Backend Draft Initialization (GET /blogs/draft)
  useEffect(() => {
    if (!visible) return;

    loadTags();

    const initFormWithBackendDraft = async () => {
      if (!user) return;

      try {
        // Fetch active draft buffer from backend
        const remoteDraft = await fetchBlogDraft();

        if (remoteDraft) {
          const matchesTargetPost =
            (targetPostId === null && (remoteDraft.postId === null || remoteDraft.postId === undefined)) ||
            (targetPostId !== null && remoteDraft.postId === targetPostId);

          if (matchesTargetPost && (remoteDraft.title || remoteDraft.content || remoteDraft.summary || remoteDraft.tagSlugs?.length > 0)) {
            // Restore from active backend draft
            setTitle(remoteDraft.title || '');
            setSummary(remoteDraft.summary || '');
            setContent(remoteDraft.content || '');
            setSelectedTagSlugs(remoteDraft.tagSlugs || []);
            setHasLoadedDraft(true);
            setDraftLastSaved(remoteDraft.updatedAt || null);
            return;
          }
        }
      } catch (err) {
        console.warn('[BlogFormModal] Could not fetch remote draft, trying local backup:', err);
      }

      // Fallback: If editing existing post and no matching draft buffer, load existing post fields
      if (initialBlog) {
        setTitle(initialBlog.title);
        setSummary(initialBlog.summary || '');
        setContent((initialBlog as BlogDetail).content || '');
        setSelectedTagSlugs(initialBlog.tags.map((t) => t.slug));
        setHasLoadedDraft(false);
        setDraftLastSaved(null);
      } else {
        // Fallback: Check local disk if network was unreachable
        const localDraft = await loadLocalBlogDraft(user.userId);
        if (localDraft && (!localDraft.postId) && (localDraft.title || localDraft.content || localDraft.summary)) {
          setTitle(localDraft.title || '');
          setSummary(localDraft.summary || '');
          setContent(localDraft.content || '');
          setSelectedTagSlugs(localDraft.tagSlugs || []);
          setHasLoadedDraft(true);
          setDraftLastSaved(localDraft.updatedAt || null);
        } else {
          setTitle('');
          setSummary('');
          setContent('');
          setSelectedTagSlugs([]);
          setHasLoadedDraft(false);
          setDraftLastSaved(null);
        }
      }
    };

    void initFormWithBackendDraft();
  }, [visible, initialBlog, user, targetPostId, loadTags]);

  // 5. Debounce auto-save when editing inputs (PUT /blogs/draft)
  const triggerDebouncedAutoSave = useCallback(() => {
    if (!user) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      void persistDraftNow();
    }, 750);
  }, [user, persistDraftNow]);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    triggerDebouncedAutoSave();
  };

  const handleSummaryChange = (text: string) => {
    setSummary(text);
    triggerDebouncedAutoSave();
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    triggerDebouncedAutoSave();
  };

  const toggleTagSlug = (slug: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    triggerDebouncedAutoSave();
  };

  // 6. Safe close: persist draft buffer before exiting
  const handleClose = async () => {
    await persistDraftNow();
    onClose();
  };

  // 7. Discard draft action (DELETE /blogs/draft)
  const handleDiscardDraft = () => {
    Alert.alert(
      'Descartar Borrador',
      '¿Estás seguro de que deseás descartar el borrador? Se borrará el contenido guardado en el servidor.',
      [
        { text: 'Continuar editando', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Delete draft buffer on backend
              await discardBlogDraft();
            } catch (err) {
              console.warn('[BlogFormModal] Error deleting backend draft:', err);
            }

            // 2. Clear local storage
            if (user) {
              await clearLocalBlogDraft(user.userId);
            }

            // 3. Reset form
            if (initialBlog) {
              setTitle(initialBlog.title);
              setSummary(initialBlog.summary || '');
              setContent((initialBlog as BlogDetail).content || '');
              setSelectedTagSlugs(initialBlog.tags.map((t) => t.slug));
            } else {
              setTitle('');
              setSummary('');
              setContent('');
              setSelectedTagSlugs([]);
            }
            setHasLoadedDraft(false);
            setDraftLastSaved(null);
          },
        },
      ]
    );
  };

  // 8. Submit handler: saves final state to buffer, then calls POST /blogs/draft/publish
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresá el título de la crónica.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Campo Requerido', 'Por favor escribí el contenido de la crónica.');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Flush exact current values to backend buffer (PUT /blogs/draft)
      await saveBlogDraft({
        postId: targetPostId,
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim(),
        tagSlugs: selectedTagSlugs,
      });

      // 2. Atomically publish the draft buffer (POST /blogs/draft/publish)
      const publishedBlog = await publishBlogDraft();

      // 3. Clear local storage cache
      if (user) {
        await clearLocalBlogDraft(user.userId);
      }

      onSuccess(publishedBlog);
      onClose();
    } catch (err: any) {
      Alert.alert(
        'Error al Publicar',
        err?.message || 'Ocurrió un inconveniente al procesar la publicación.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  const allowTagCreation = canCreateTag(user);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screenContainer}
      >
        {/* Modal Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Editar Crónica' : 'Publicar Crónica o Testimonio'}
            </Text>
            <Text style={styles.headerSub}>
              Comunidad ministerial y de servicio
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={22} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Identity Verification Notice (Non-Anonymous Rule) */}
          <View style={styles.identityNotice}>
            <ShieldCheck size={18} color={Theme.colors.primary} style={{ marginTop: 2 }} />
            <View style={styles.identityTextCol}>
              <Text style={styles.identityNoticeTitle}>AUTORÍA VERIFICADA</Text>
              <Text style={styles.identityNoticeDesc}>
                Esta crónica se publicará con tu identidad ministerial registrada:{' '}
                <Text style={styles.identityNameHighlight}>
                  {user?.username || 'Usuario'}
                </Text>{' '}
                ({user?.role || 'BASIC'}). No se admiten publicaciones anónimas.
              </Text>
            </View>
          </View>

          {/* Draft Status Banner (Synchronized with Backend Buffer) */}
          {(hasLoadedDraft || draftLastSaved) && (
            <View style={styles.draftBanner}>
              <View style={styles.draftBannerLeft}>
                <Clock size={16} color={Theme.colors.primary} />
                <Text style={styles.draftBannerText}>
                  {isAutoSaving
                    ? 'Guardando en la nube...'
                    : 'Borrador sincronizado con el servidor'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDiscardDraft}
                style={styles.discardDraftBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Trash2 size={13} color={Theme.colors.error} style={{ marginRight: 4 }} />
                <Text style={styles.discardDraftText}>Descartar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Title Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              TÍTULO <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: La Fe en el Frente de Combate..."
              placeholderTextColor="#8A92A0"
              value={title}
              onChangeText={handleTitleChange}
              maxLength={120}
            />
          </View>

          {/* Tags Selector */}
          <View style={styles.formGroup}>
            <View style={styles.tagsHeaderRow}>
              <Text style={styles.inputLabel}>ETIQUETAS TEMÁTICAS</Text>
              {allowTagCreation && (
                <TouchableOpacity
                  style={styles.createTagLink}
                  onPress={() => setIsTagModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color={Theme.colors.primary} style={{ marginRight: 2 }} />
                  <Text style={styles.createTagLinkText}>Nueva Etiqueta</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.tagHelpText}>
              Seleccioná las categorías que mejor definan este mensaje:
            </Text>
            <View style={styles.tagsChipContainer}>
              {availableTags.map((tag) => {
                const isSelected = selectedTagSlugs.includes(tag.slug);
                return (
                  <TouchableOpacity
                    key={tag.slug}
                    style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                    onPress={() => toggleTagSlug(tag.slug)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        isSelected && styles.tagChipTextSelected,
                      ]}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary Field (Optional) */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithHint}>
              <Text style={styles.inputLabel}>RESUMEN O COPETE</Text>
              <Text style={styles.optionalHint}>Opcional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.summaryInput]}
              placeholder="Breve introducción o extracto para el feed (máx. 200 caracteres)..."
              placeholderTextColor="#8A92A0"
              value={summary}
              onChangeText={handleSummaryChange}
              multiline
              numberOfLines={2}
              maxLength={250}
            />
          </View>

          {/* Main Content Field */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              CONTENIDO DEL ARTÍCULO <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.contentInput]}
              placeholder="Escribí aquí tu testimonio, anécdota militar, reflexión o mensaje pastoral..."
              placeholderTextColor="#8A92A0"
              value={content}
              onChangeText={handleContentChange}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Sticky Action Footer */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.footerCancelBtn}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Text style={styles.footerCancelText}>Cerrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.footerSubmitBtn,
              isSubmitting && styles.footerSubmitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.footerSubmitText}>
                {isEditing ? 'Guardar Cambios' : 'Publicar Crónica'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal for authorized tag creation */}
        <TagCreateModal
          visible={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          onTagCreated={(newTag) => {
            setAvailableTags((prev) => [...prev, newTag]);
            setSelectedTagSlugs((prev) => [...prev, newTag.slug]);
            triggerDebouncedAutoSave();
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outlineVariant,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  identityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F4F8',
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    padding: 12,
    marginBottom: 16,
  },
  identityTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  identityNoticeTitle: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
    letterSpacing: 0.8,
  },
  identityNoticeDesc: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  identityNameHighlight: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.onSurface,
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E9EEF4',
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  draftBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  draftBannerText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primaryDark,
  },
  discardDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  discardDraftText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.error,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  requiredStar: {
    color: Theme.colors.error,
  },
  labelWithHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalHint: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#8A92A0',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
  },
  summaryInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  contentInput: {
    minHeight: 220,
    lineHeight: 22,
  },
  tagsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createTagLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  createTagLinkText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.primary,
  },
  tagHelpText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    marginBottom: 10,
  },
  tagsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.roundness.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  tagChipText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.outlineVariant,
    gap: 12,
  },
  footerCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Theme.roundness.md,
  },
  footerCancelText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  footerSubmitBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Theme.roundness.md,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  footerSubmitBtnDisabled: {
    opacity: 0.6,
  },
  footerSubmitText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
