import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Share,
  Alert,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { useAuthStore } from '../lib/stores/auth';
import { getPrayerComments, addPrayerComment } from '../lib/api/prayers';
import type { Prayer, PaginatedPrayersResponse, CreatePrayerRequest, PrayerComment } from '../types/prayer';
import {
  TacticalCard,
  TacticalButton,
  FilterPills,
  InstitutionalEmblem,
} from '../components/common';
import {
  HeartHandshake,
  Send,
  Lock,
  MessageSquare,
  Share2,
  Shield,
  User,
  Check,
  X,
} from 'lucide-react-native';

const PRAYER_FILTERS = [
  { id: 'all', label: 'Todos los Pedidos' },
  { id: 'fuerzas', label: 'Fuerzas en Servicio' },
  { id: 'familias', label: 'Familias & Salud' },
  { id: 'mis_pedidos', label: 'Mis Peticiones' },
];

interface PrayerCreateCardProps {
  onSubmit: (text: string, isAnonymous: boolean) => Promise<void>;
  isSubmitting: boolean;
}

const PrayerCreateCard = React.memo(function PrayerCreateCard({
  onSubmit,
  isSubmitting,
}: PrayerCreateCardProps) {
  const [text, setText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    await onSubmit(text, isAnonymous);
    setText('');
  };

  return (
    <TacticalCard style={styles.createCard} padding={14}>
      <View style={styles.createHeaderRow}>
        <Text style={styles.createTitle}>Elevar una Petición</Text>
        <TouchableOpacity
          style={styles.anonToggle}
          onPress={() => setIsAnonymous((p) => !p)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.anonBox, isAnonymous && styles.anonBoxActive]}>
            {isAnonymous && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.anonText}>Anónimo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.galatiansQuoteRow}>
        <Text style={styles.galatiansQuote}>
          «Llevad los unos las cargas de los otros, y cumplid así la ley de Cristo.»{' '}
          <Text style={styles.galatiansRef}>GÁLATAS 6:2</Text>
        </Text>
      </View>

      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Comparte una intención confidencial, vigilia u oración para tu guardia o camaradas..."
          placeholderTextColor="#8A92A0"
          multiline
          numberOfLines={3}
          value={text}
          onChangeText={setText}
        />

        <View style={styles.createFooterRow}>
          <TacticalButton
            title="Publicar Petición"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!text.trim()}
            variant="primary"
            size="sm"
            rightIcon={<Send size={13} color="#FFFFFF" />}
            style={styles.submitPrayerBtn}
          />
        </View>
      </View>


    </TacticalCard>
  );
});

export default function PrayerWallScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Joined prayers set for optimistic updates
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());

  // Section 5.4 & 5.5: Prayer Comments Modal State
  const [activePrayerForComments, setActivePrayerForComments] = useState<Prayer | null>(null);
  const [comments, setComments] = useState<PrayerComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const handleOpenComments = async (prayer: Prayer) => {
    setActivePrayerForComments(prayer);
    setCommentText('');
    setIsLoadingComments(true);
    try {
      const list = await getPrayerComments(prayer.id);
      setComments(list);
    } catch (e) {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!activePrayerForComments || !commentText.trim() || isPostingComment) return;
    setIsPostingComment(true);
    try {
      const created = await addPrayerComment(activePrayerForComments.id, commentText.trim());
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo publicar la palabra de aliento.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchPrayers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await request<PaginatedPrayersResponse>(
        `${ENDPOINTS.PRAYERS}?page=0&size=20`
      );

      if (res && Array.isArray(res.content)) {
        setPrayers(res.content);
      }
    } catch (e: any) {
      console.warn('[PrayerWall] Could not fetch prayers:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPrayers();
  };

  const handlePray = async (prayerId: number) => {
    if (joinedIds.has(prayerId)) return;

    // Optimistic update
    setJoinedIds((prev) => new Set(prev).add(prayerId));
    setPrayers((prev) =>
      prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount + 1 } : p))
    );

    try {
      await request<Prayer>(ENDPOINTS.PRAYER_PRAY(prayerId), {
        method: 'POST',
      });
    } catch (err: any) {
      // Revert if error
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(prayerId);
        return next;
      });
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount - 1 } : p))
      );
    }
  };

  const handleShare = async (prayer: Prayer) => {
    try {
      await Share.share({
        message: `Petición de Oración: "${prayer.description}"\n\nCapellanAPP · Fraternidad y Cobertura Mutua`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleSubmitPrayer = useCallback(
    async (text: string, isAnonymous: boolean) => {
      setIsSubmitting(true);
      try {
        const payload: CreatePrayerRequest = {
          title: text.slice(0, 40) + '...',
          description: text.trim(),
          authorName: isAnonymous ? 'Oficial Reservado' : user?.username || 'Anónimo',
          isAnonymous,
        };

        const created = await request<Prayer>(ENDPOINTS.PRAYERS, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setPrayers((prev) => [created, ...prev]);
        Alert.alert(
          'Petición Elevada',
          'Tu pedido de oración ha sido publicado bajo amparo y secreto pastoral.'
        );
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo publicar la petición.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.username]
  );

  const isTablet = width > 500;

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContent}>

        {/* 1. Header Card */}
        <TacticalCard style={styles.headerCard} padding={14}>
          <View style={styles.brandRow}>
            <Text style={styles.titleContent}>Muro de oración</Text>
            <Text style={styles.brandSubtitle}>
              Fraternidad, Oración y Cobertura Mutua
            </Text>
          </View>
        </TacticalCard>

        {/* 2. Elevar una Petición Isolated Component */}
        <PrayerCreateCard
          onSubmit={handleSubmitPrayer}
          isSubmitting={isSubmitting}
        />

        {/* 3. Comunity wall & Filter Pills */}

        <View style={styles.headerCardTextCol}>
          <View style={styles.brandRow}>
            <Text style={styles.secondTitleContent}>Pedidos de la comunidad</Text>
          </View>
          <FilterPills
            items={PRAYER_FILTERS}
            selectedId={selectedFilter}
            onSelect={setSelectedFilter}
            style={styles.filterPills}
          />
        </View>
      </View>
    ),
    [selectedFilter, handleSubmitPrayer, isSubmitting]
  );

  const renderPrayerItem = useCallback(
    ({ item }: { item: Prayer }) => {
      const isJoined = joinedIds.has(item.id);

      return (
        <TacticalCard style={styles.prayerCard} variant="accentBorder" padding={14}>
          <View style={styles.prayerCardHeader}>
            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <User size={15} color={Theme.colors.tacticalNavy} />
              </View>
              <View style={styles.authorCol}>
                <Text style={styles.authorName}>
                  {item.isAnonymous ? 'Oficial Reservado' : item.authorName}
                </Text>
                <Text style={styles.authorTime}>
                  {new Date(item.createdAt).toLocaleDateString('es-AR')} • En Cobertura
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleShare(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={16} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.prayerDescription}>{item.description}</Text>

          <View style={styles.prayerCardActions}>
            <TouchableOpacity
              style={[
                styles.joinPrayBtn,
                isJoined && styles.joinPrayBtnActive,
              ]}
              onPress={() => handlePray(item.id)}
              activeOpacity={0.8}
            >
              <HeartHandshake
                size={17}
                color={isJoined ? '#FFFFFF' : Theme.colors.tacticalNavy}
              />
              <Text
                style={[
                  styles.joinPrayText,
                  isJoined && styles.joinPrayTextActive,
                ]}
              >
                {isJoined ? 'Orando' : 'Unirme en Oración'}
              </Text>
              <View
                style={[
                  styles.prayerCountBadge,
                  isJoined && styles.prayerCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.prayerCountText,
                    isJoined && styles.prayerCountTextActive,
                  ]}
                >
                  {item.prayerCount}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => handleOpenComments(item)}
              activeOpacity={0.8}
            >
              <MessageSquare size={15} color={Theme.colors.tacticalNavy} />
              <Text style={styles.commentActionText}>Aliento & Oración</Text>
            </TouchableOpacity>
          </View>
        </TacticalCard>
      );
    },
    [joinedIds, handlePray, handleShare, handleOpenComments]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={prayers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPrayerItem}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay peticiones registradas aún. Sé el primero en elevar una intención.
              </Text>
            </View>
          ) : (
            <ActivityIndicator style={{ marginTop: 24 }} color={Theme.colors.tacticalNavy} />
          )
        }
      />

      {/* Prayer Comments Modal (Section 5.4 & 5.5) */}
      <Modal
        visible={Boolean(activePrayerForComments)}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePrayerForComments(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.commentsModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>Palabras de Aliento & Oración</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {activePrayerForComments?.title || activePrayerForComments?.description}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActivePrayerForComments(null)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {isLoadingComments ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />
                  <Text style={styles.commentsLoadingText}>Cargando mensajes de bendición...</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.commentsEmpty}>
                  <Text style={styles.commentsEmptyTitle}>Aún no hay comentarios</Text>
                  <Text style={styles.commentsEmptyText}>
                    Sé el primero en dejar palabras de fortaleza para esta petición.
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
                        <View style={styles.commentRoleBadge}>
                          <Text style={styles.commentRoleText}>{comment.authorRole}</Text>
                        </View>
                      </View>
                      <Text style={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Post Comment Input Bar (Section 5.4) */}
            {user ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Escribí palabras de fe o aliento..."
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  style={[
                    styles.commentSendBtn,
                    (!commentText.trim() || isPostingComment) && styles.commentSendBtnDisabled,
                  ]}
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || isPostingComment}
                  activeOpacity={0.8}
                >
                  {isPostingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={15} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.commentAnonNote}>
                <Lock size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.commentAnonNoteText}>
                  Iniciá sesión para publicar palabras de aliento a esta petición.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerContent: {
    marginBottom: 12,
  },
  headerCard: {
    marginBottom: 12,
  },
  headerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemWrapper: {
    width: 48,
    height: 48,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...globalStyles.shadowSm,
  },
  headerCardTextCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  brandTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  titleContent: {
    fontFamily: Theme.fonts.headline,
    fontSize: 32,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  secondTitleContent: {
    fontFamily: Theme.fonts.headline,
    fontSize: 24,
    color: Theme.colors.onSurface,
    marginBottom: 8,
    marginTop: 8,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.tacticalNavy,
  },
  brandSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  filterPills: {
    paddingBottom: 10,
  },
  createCard: {
    marginBottom: 16,
  },
  createHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  createTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anonBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonBoxActive: {
    backgroundColor: Theme.colors.secondary,
  },
  anonText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  textAreaContainer: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 10,
  },
  textArea: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  createFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  encryptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptedText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  submitPrayerBtn: {
    width: 'auto',
    paddingHorizontal: 14,
  },
  galatiansQuoteRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  galatiansQuote: {
    ...globalStyles.bodySm,
    fontSize: 11,
    fontStyle: 'italic',
    color: Theme.colors.onSurfaceVariant,
  },
  galatiansRef: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    fontStyle: 'normal',
    color: Theme.colors.secondary,
  },
  prayerCard: {
    marginBottom: 12,
  },
  prayerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorCol: {
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  authorTime: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  prayerDescription: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: Theme.colors.onSurface,
    marginBottom: 12,
  },
  prayerCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinPrayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.roundness.md,
    gap: 6,
  },
  joinPrayBtnActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  joinPrayText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.tacticalNavy,
  },
  joinPrayTextActive: {
    color: '#FFFFFF',
  },
  prayerCountBadge: {
    backgroundColor: 'rgba(37, 82, 126, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.roundness.full,
  },
  prayerCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  prayerCountText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: Theme.colors.tacticalNavy,
  },
  prayerCountTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.roundness.md,
    gap: 6,
  },
  commentActionText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.tacticalNavy,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsModalCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  modalSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  commentsList: {
    maxHeight: 320,
    marginBottom: 14,
  },
  commentsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  commentsLoadingText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  commentsEmpty: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 4,
  },
  commentsEmptyTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  commentsEmptyText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  commentCard: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthorName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  commentRoleBadge: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  commentRoleText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.secondary,
  },
  commentTime: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.onSurfaceVariant,
  },
  commentContent: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.onSurface,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Theme.colors.onSurface,
    maxHeight: 80,
  },
  commentSendBtn: {
    width: 38,
    height: 38,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendBtnDisabled: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  commentAnonNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.roundness.md,
    gap: 8,
    marginTop: 6,
  },
  commentAnonNoteText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    flex: 1,
  },
});
