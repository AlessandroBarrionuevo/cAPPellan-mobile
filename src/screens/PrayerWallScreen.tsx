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
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { useAuthStore } from '../lib/stores/auth';
import { getPrayerComments, addPrayerComment } from '../lib/api/prayers';
import type {
  Prayer,
  PaginatedPrayersResponse,
  CreatePrayerRequest,
  PrayerComment,
} from '../types/prayer';
import {
  TacticalCard,
  TacticalButton,
  FilterPills,
} from '../components/common';
import {
  HeartHandshake,
  Send,
  Lock,
  MessageSquare,
  Share2,
  User,
  Check,
  X,
  Heart,
  Plus,
  ChevronRight,
  ChevronDown,
  Sparkles,
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

// ============================================================================
// 1. CLASSIC PRAYER CARD COMPONENT (PRESERVED INTACT AS REQUESTED)
// ============================================================================
interface ClassicPrayerCardProps {
  item: Prayer;
  isJoined: boolean;
  onPray: (id: number) => void;
  onShare: (item: Prayer) => void;
  onOpenComments: (item: Prayer) => void;
}

export const ClassicPrayerCard = React.memo(function ClassicPrayerCard({
  item,
  isJoined,
  onPray,
  onShare,
  onOpenComments,
}: ClassicPrayerCardProps) {
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
          onPress={() => onShare(item)}
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
          onPress={() => onPray(item.id)}
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
          onPress={() => onOpenComments(item)}
          activeOpacity={0.8}
        >
          <MessageSquare size={15} color={Theme.colors.tacticalNavy} />
          <Text style={styles.commentActionText}>Aliento & Oración</Text>
        </TouchableOpacity>
      </View>
    </TacticalCard>
  );
});

// ============================================================================
// 2. NEW TIMELINE PRAYER CARD COMPONENT (DESIGN REFERENCE MATCH)
// ============================================================================
interface TimelinePrayerCardProps {
  item: Prayer;
  index: number;
  isJoined: boolean;
  onPray: (id: number) => void;
  onOpenComments: (item: Prayer) => void;
}

export const TimelinePrayerCard = React.memo(function TimelinePrayerCard({
  item,
  index,
  isJoined,
  onPray,
  onOpenComments,
}: TimelinePrayerCardProps) {
  const displayTitle =
    item.title && !item.title.endsWith('...')
      ? item.title
      : item.isAnonymous
      ? 'Petición en Cobertura'
      : `Petición de ${item.authorName || 'Camarada'}`;

  const authorSubtitle = `${item.isAnonymous ? 'Oficial Reservado' : (item.authorName || 'Camarada')} • En Cobertura`;
  const dateFormatted = `${new Date(item.createdAt).toLocaleDateString('es-AR')} • Activa`;

  // Bullets: description + date (or custom content if present)
  const bulletItems = useMemo(() => {
    if (Array.isArray(item.content) && item.content.length > 0) {
      return item.content;
    }
    const lines: string[] = [];
    if (item.description) {
      lines.push(item.description);
    }
    lines.push(dateFormatted);
    return lines;
  }, [item, dateFormatted]);

  return (
    <View style={styles.timelineRow}>
      {/* 1. Left Column: Compact Blue Number Circle + Connector Line (No 'Petición' label) */}
      <View style={styles.timelineCol}>
        <View style={styles.timelineCircle}>
          <Text style={styles.timelineNumberText}>{index + 1}</Text>
        </View>

        {/* Vertical connector line with arrow to next item */}
        <View style={styles.timelineConnectorWrap}>
          <View style={styles.timelineConnectorLine} />
          <View style={styles.timelineArrowBadge}>
            <ChevronDown size={10} color="#94A3B8" />
          </View>
          <View style={styles.timelineConnectorLine} />
        </View>
      </View>

      {/* 2. Right Column: White Rounded Card with Harmonious Titles & Stacked Action Buttons */}
      <View style={styles.timelineCard}>
        {/* Main Card Content */}
        <View style={styles.timelineCardBody}>
          {/* Harmonious Header: Title + Author Subtitle (No star icon) */}
          <View style={styles.timelineCardHeader}>
            <View style={styles.timelineTitleCol}>
              <Text style={styles.timelineCardTitle} numberOfLines={1}>
                {displayTitle}
              </Text>
              <Text style={styles.timelineCardAuthorSub}>
                {authorSubtitle}
              </Text>
            </View>
          </View>

          {/* Bullet Points */}
          <View style={styles.timelineBulletsList}>
            {bulletItems.map((bullet, idx) => (
              <View key={idx} style={styles.timelineBulletRow}>
                <Text style={styles.timelineBulletDot}>•</Text>
                <Text
                  style={[
                    styles.timelineBulletText,
                    idx === 0 && styles.timelineBulletTextPrimary,
                  ]}
                  numberOfLines={idx === 0 ? 3 : 1}
                >
                  {bullet}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Stacked Right Buttons: Heart above, Comment below */}
        <View style={styles.timelineActionCol}>
          {/* Top Button: Heart / Me gusta */}
          <TouchableOpacity
            style={[
              styles.timelineHeartBtn,
              isJoined && styles.timelineHeartBtnActive,
            ]}
            onPress={() => onPray(item.id)}
            activeOpacity={0.75}
          >
            <Heart
              size={17}
              color={isJoined ? '#EF4444' : '#64748B'}
              fill={isJoined ? '#EF4444' : 'transparent'}
            />
            <Text
              style={[
                styles.timelineActionCount,
                isJoined && styles.timelineActionCountActive,
              ]}
            >
              {item.prayerCount}
            </Text>
          </TouchableOpacity>

          {/* Bottom Button: Comment */}
          <TouchableOpacity
            style={styles.timelineCommentBtn}
            onPress={() => onOpenComments(item)}
            activeOpacity={0.75}
          >
            <MessageSquare size={17} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

// ============================================================================
// 3. MAIN PRAYER WALL SCREEN
// ============================================================================
export default function PrayerWallScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Mode: 'timeline' (new design default) | 'classic' (original fallback)
  const [viewMode, setViewMode] = useState<'timeline' | 'classic'>('timeline');

  // Modal to Elevate Prayer via '+ Pedir' button
  const [showPedirModal, setShowPedirModal] = useState(false);
  const [pedirText, setPedirText] = useState('');
  const [pedirAnonymous, setPedirAnonymous] = useState(false);
  const [isSubmittingPedir, setIsSubmittingPedir] = useState(false);

  // Joined prayers set for optimistic updates
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());

  // Prayer Comments Modal State
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

  const handleSubmitPedirModal = async () => {
    if (!pedirText.trim() || isSubmittingPedir) return;
    setIsSubmittingPedir(true);
    try {
      await handleSubmitPrayer(pedirText, pedirAnonymous);
      setPedirText('');
      setShowPedirModal(false);
    } finally {
      setIsSubmittingPedir(false);
    }
  };

  const filteredPrayers = useMemo(() => {
    if (selectedFilter === 'mis_pedidos') {
      return prayers.filter(
        (p) => p.authorName === user?.username
      );
    }
    return prayers;
  }, [prayers, selectedFilter, user]);

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

        {/* 3. Community Wall Header & Filter Pills */}
        <View style={styles.headerCardTextCol}>
          <View style={styles.brandRow}>
            <Text style={styles.secondTitleContent}>Pedidos de la comunidad</Text>
          </View>

          {/* Mode Switcher: Timeline (New) vs Classic (Fallback) */}
          <View style={styles.viewModeToggleRow}>
            <TouchableOpacity
              style={[
                styles.viewModeTab,
                viewMode === 'timeline' && styles.viewModeTabActive,
              ]}
              onPress={() => setViewMode('timeline')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewModeTabText,
                  viewMode === 'timeline' && styles.viewModeTabTextActive,
                ]}
              >
                Línea de Peticiones
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
                Tarjetas Clásicas
              </Text>
            </TouchableOpacity>
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
    [selectedFilter, handleSubmitPrayer, isSubmitting, viewMode]
  );

  // Footer: '+ Pedir' button matching reference image
  const listFooter = useMemo(() => {
    if (viewMode !== 'timeline') return null;

    return (
      <TouchableOpacity
        style={styles.timelineAddBtnRow}
        onPress={() => setShowPedirModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.timelineAddCircle}>
          <Plus size={14} color={Theme.colors.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.timelineAddLabel}>Pedir</Text>
      </TouchableOpacity>
    );
  }, [viewMode]);

  const renderItem = useCallback(
    ({ item, index }: { item: Prayer; index: number }) => {
      const isJoined = joinedIds.has(item.id);

      if (viewMode === 'classic') {
        return (
          <ClassicPrayerCard
            item={item}
            isJoined={isJoined}
            onPray={handlePray}
            onShare={handleShare}
            onOpenComments={handleOpenComments}
          />
        );
      }

      return (
        <TimelinePrayerCard
          item={item}
          index={index}
          isJoined={isJoined}
          onPray={handlePray}
          onOpenComments={handleOpenComments}
        />
      );
    },
    [viewMode, joinedIds, handlePray, handleShare, handleOpenComments]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPrayers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
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

      {/* MODAL: ELEVAR PETICIÓN VIA '+ PEDIR' BUTTON */}
      <Modal
        visible={showPedirModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPedirModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.newPrayerModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Elevar Petición</Text>
                <Text style={styles.modalSub}>
                  Publica tu intención para que la comunidad ore contigo
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPedirModal(false)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.anonToggleRowModal}>
              <TouchableOpacity
                style={styles.anonToggle}
                onPress={() => setPedirAnonymous((p) => !p)}
                activeOpacity={0.8}
              >
                <View style={[styles.anonBox, pedirAnonymous && styles.anonBoxActive]}>
                  {pedirAnonymous && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.anonText}>Publicar como Anónimo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalPrayerTextInput}
              placeholder="Escribe tu petición de oración o motivo de intercesión..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={pedirText}
              onChangeText={setPedirText}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowPedirModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  (!pedirText.trim() || isSubmittingPedir) && styles.modalSubmitBtnDisabled,
                ]}
                onPress={handleSubmitPedirModal}
                disabled={!pedirText.trim() || isSubmittingPedir}
              >
                {isSubmittingPedir ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={14} color="#FFFFFF" />
                    <Text style={styles.modalSubmitText}>Pedir Oración</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#F8F9FA',
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
  headerCardTextCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
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
    justifyContent: 'flex-end',
    alignItems: 'center',
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

  // View Mode Switcher
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 6,
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
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  viewModeTabText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#64748B',
  },
  viewModeTabTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#0F172A',
  },

  // ============================================================================
  // TIMELINE POST STYLES (MATCHING REFERENCE DESIGN)
  // ============================================================================
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 2,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 12,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary, // App brand blue (#0c7ae0)
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timelineNumberText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  timelineConnectorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 36,
    position: 'relative',
  },
  timelineConnectorLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#CBD5E1',
  },
  timelineArrowBadge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    padding: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  timelineCardBody: {
    flex: 1,
    paddingRight: 10,
  },
  timelineCardHeader: {
    marginBottom: 6,
  },
  timelineTitleCol: {
    flex: 1,
  },
  timelineCardTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  timelineCardAuthorSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  timelineBulletsList: {
    gap: 3,
    marginTop: 2,
  },
  timelineBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  timelineBulletDot: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  timelineBulletText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  timelineBulletTextPrimary: {
    color: '#1E293B',
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  timelineActionCol: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  timelineHeartBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  timelineHeartBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  timelineActionCount: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  timelineActionCountActive: {
    color: '#EF4444',
  },
  timelineCommentBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineAddBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 10,
  },
  timelineAddCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  timelineAddLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: Theme.colors.primary,
    letterSpacing: 0.2,
  },

  // ============================================================================
  // CLASSIC PRAYER CARD STYLES (ORIGINAL)
  // ============================================================================
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

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  newPrayerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  modalSub: {
    ...globalStyles.bodySm,
    fontSize: 11.5,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  anonToggleRowModal: {
    marginBottom: 12,
  },
  modalPrayerTextInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#64748B',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2D5A43',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Comments Modal
  commentsModalCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
