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
  KeyboardAvoidingView,
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
import { TimelinePrayerCard } from '../components/prayer/TimelinePrayerCard';
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
  onPressCard?: (item: Prayer) => void;
}

export const ClassicPrayerCard = React.memo(function ClassicPrayerCard({
  item,
  isJoined,
  onPray,
  onShare,
  onOpenComments,
  onPressCard,
}: ClassicPrayerCardProps) {
  return (
    <TacticalCard style={styles.prayerCard} variant="accentBorder" padding={14}>
      <TouchableOpacity
        activeOpacity={onPressCard ? 0.85 : 1}
        onPress={() => onPressCard?.(item)}
      >
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
            onPress={(e) => {
              e.stopPropagation();
              onShare(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 size={16} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.prayerDescription}>{item.description}</Text>
      </TouchableOpacity>

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
          <Text style={styles.commentActionText}>
            {item.commentCount ? `Aliento (${item.commentCount})` : 'Aliento & Oración'}
          </Text>
        </TouchableOpacity>
      </View>
    </TacticalCard>
  );
});

// ============================================================================
// 2. TIMELINE PRAYER CARD COMPONENT (RE-EXPORTED FROM SHARED COMPONENT)
// ============================================================================
export { TimelinePrayerCard } from '../components/prayer/TimelinePrayerCard';

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

  // Prayer Detail Modal State (When Card is tapped)
  const [selectedPrayerDetail, setSelectedPrayerDetail] = useState<Prayer | null>(null);

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
      // Optimistically update comment count in list and detail
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === activePrayerForComments.id
            ? { ...p, commentCount: (p.commentCount ?? 0) + 1 }
            : p
        )
      );
      setSelectedPrayerDetail((prev) =>
        prev && prev.id === activePrayerForComments.id
          ? { ...prev, commentCount: (prev.commentCount ?? 0) + 1 }
          : prev
      );
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
    setSelectedPrayerDetail((prev) =>
      prev && prev.id === prayerId ? { ...prev, prayerCount: prev.prayerCount + 1 } : prev
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
      setSelectedPrayerDetail((prev) =>
        prev && prev.id === prayerId ? { ...prev, prayerCount: prev.prayerCount - 1 } : prev
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
            onPressCard={(p) => setSelectedPrayerDetail(p)}
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
          onPressCard={(p) => setSelectedPrayerDetail(p)}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
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
              numberOfLines={6}
              value={pedirText}
              onChangeText={setPedirText}
              textAlignVertical="top"
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
        </KeyboardAvoidingView>
      </Modal>

      {/* FULL PRAYER DETAIL MODAL (WHEN CARD IS TAPPED) */}
      <Modal
        visible={Boolean(selectedPrayerDetail)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPrayerDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.detailModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.detailBadgeRow}>
                  <HeartHandshake size={14} color="#0c7ae0" />
                  <Text style={styles.detailBadgeText}>PETICIÓN EN COBERTURA</Text>
                </View>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedPrayerDetail?.title || 'Petición Comunitaria'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedPrayerDetail(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailAuthorCard}>
                <View style={styles.detailAuthorAvatar}>
                  <Text style={styles.detailAuthorAvatarText}>
                    {(selectedPrayerDetail?.authorName || 'O')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailAuthorName}>
                    {selectedPrayerDetail?.isAnonymous
                      ? 'Oficial Reservado'
                      : selectedPrayerDetail?.authorName || 'Camarada en Servicio'}
                  </Text>
                  <Text style={styles.detailAuthorDate}>
                    {selectedPrayerDetail?.createdAt
                      ? new Date(selectedPrayerDetail.createdAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Activa'}{' '}
                    • Amparo Pastoral
                  </Text>
                </View>
                <View style={styles.detailActiveBadge}>
                  <Text style={styles.detailActiveBadgeText}>ACTIVA</Text>
                </View>
              </View>

              <View style={styles.detailBodyBox}>
                <Text style={styles.detailBodyText}>
                  {selectedPrayerDetail?.description}
                </Text>
              </View>

              {Array.isArray(selectedPrayerDetail?.content) &&
                selectedPrayerDetail.content.length > 0 && (
                  <View style={styles.detailContentList}>
                    {selectedPrayerDetail.content.map((bullet, idx) => (
                      <View key={idx} style={styles.detailBulletRow}>
                        <View style={styles.detailBulletDot} />
                        <Text style={styles.detailBulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </ScrollView>

            {selectedPrayerDetail && (
              <View style={styles.detailBottomActionBar}>
                <TouchableOpacity
                  style={[
                    styles.detailPrayBtn,
                    joinedIds.has(selectedPrayerDetail.id) && styles.detailPrayBtnActive,
                  ]}
                  onPress={() => handlePray(selectedPrayerDetail.id)}
                  activeOpacity={0.8}
                >
                  <Heart
                    size={18}
                    color={joinedIds.has(selectedPrayerDetail.id) ? '#EF4444' : '#0c7ae0'}
                    fill={joinedIds.has(selectedPrayerDetail.id) ? '#EF4444' : 'transparent'}
                  />
                  <Text
                    style={[
                      styles.detailPrayBtnText,
                      joinedIds.has(selectedPrayerDetail.id) && styles.detailPrayBtnTextActive,
                    ]}
                  >
                    {joinedIds.has(selectedPrayerDetail.id)
                      ? `En oración (${selectedPrayerDetail.prayerCount})`
                      : `Unirme en oración (${selectedPrayerDetail.prayerCount})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailCommentBtn}
                  onPress={() => {
                    const prayer = selectedPrayerDetail;
                    setSelectedPrayerDetail(null);
                    handleOpenComments(prayer);
                  }}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={17} color="#0c7ae0" />
                  <Text style={styles.detailCommentBtnText}>
                    {selectedPrayerDetail.commentCount ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailShareBtn}
                  onPress={() => handleShare(selectedPrayerDetail)}
                  activeOpacity={0.8}
                >
                  <Share2 size={17} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
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

            {/* Comments List formatted like cards */}
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
                  <View key={comment.id} style={styles.commentTimelineCard}>
                    <View style={styles.commentCardHeader}>
                      <View style={styles.commentAuthorLeft}>
                        <View style={styles.commentInitialCircle}>
                          <Text style={styles.commentInitialText}>
                            {(comment.authorName || 'C')[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.commentTitleCol}>
                          <View style={styles.commentNameBadgeRow}>
                            <Text style={styles.commentAuthorName} numberOfLines={1}>
                              {comment.authorName}
                            </Text>
                            <View style={styles.commentRoleBadge}>
                              <Text style={styles.commentRoleText}>
                                {comment.authorRole || 'Camarada'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.commentCardAuthorSub}>
                            {new Date(comment.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • En Cobertura
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.commentBodyText}>{comment.content}</Text>
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
        </KeyboardAvoidingView>
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
    height: '70%',
    maxHeight: '75%',
    minHeight: 380,
    justifyContent: 'space-between',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: '#0F172A',
    flex: 1,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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

  // Detail Modal Styles (When Card is tapped)
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '75%',
    maxHeight: '85%',
    justifyContent: 'space-between',
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailBadgeText: {
    ...globalStyles.labelCaps,
    color: '#0c7ae0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalScroll: {
    flex: 1,
    marginVertical: 12,
  },
  detailAuthorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 14,
  },
  detailAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAuthorAvatarText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  detailAuthorName: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  detailAuthorDate: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  detailActiveBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailActiveBadgeText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9.5,
    color: '#0c7ae0',
  },
  detailBodyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailBodyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: '#1E293B',
  },
  detailContentList: {
    gap: 8,
    marginBottom: 14,
  },
  detailBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 6,
  },
  detailBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0c7ae0',
    marginTop: 7,
  },
  detailBulletText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  detailBottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailPrayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailPrayBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  detailPrayBtnText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
  },
  detailPrayBtnTextActive: {
    color: '#EF4444',
  },
  detailCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  detailCommentBtnText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
  },
  detailShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Comments Modal
  commentsModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '75%',
    maxHeight: '80%',
    justifyContent: 'space-between',
  },
  commentsList: {
    flex: 1,
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
  commentTimelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  commentCardHeader: {
    marginBottom: 6,
  },
  commentAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInitialCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitialText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
  },
  commentTitleCol: {
    flex: 1,
  },
  commentNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthorName: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0F172A',
  },
  commentRoleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentRoleText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9,
    color: '#475569',
  },
  commentCardAuthorSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  commentBodyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 18,
    marginTop: 2,
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
