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
import {
  getGratitudes,
  createGratitude,
  thankGratitude,
  getGratitudeComments,
  addGratitudeComment,
} from '../lib/api/gratitudes';
import type {
  Prayer,
  PaginatedPrayersResponse,
  CreatePrayerRequest,
  PrayerComment,
} from '../types/prayer';
import type {
  Gratitude,
  PaginatedGratitudesResponse,
  CreateGratitudeRequest,
  GratitudeComment,
} from '../types/gratitude';
import {
  TimelinePrayerCard,
  TimelineCardItem,
} from '../components/prayer/TimelinePrayerCard';
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
  Check,
  X,
  Heart,
  Plus,
  Sparkles,
} from 'lucide-react-native';

const PRAYER_FILTERS = [
  { id: 'all', label: 'Todos los Pedidos' },
  { id: 'fuerzas', label: 'Fuerzas en Servicio' },
  { id: 'familias', label: 'Familias & Salud' },
  { id: 'mis_pedidos', label: 'Mis Peticiones' },
];

const GRATITUDE_FILTERS = [
  { id: 'all', label: 'Todas las Gratitudes' },
  { id: 'servicio', label: 'Protección en Turno' },
  { id: 'sanidad', label: 'Sanidad & Provisión' },
  { id: 'mis_gratitudes', label: 'Mis Testimonios' },
];

// ============================================================================
// CREATE PRAYER CARD (ORACIÓN)
// ============================================================================
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

      <View style={styles.quoteRow}>
        <Text style={styles.scriptureQuote}>
          «Llevad los unos las cargas de los otros, y cumplid así la ley de Cristo.»{' '}
          <Text style={styles.scriptureRef}>GÁLATAS 6:2</Text>
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
// CREATE GRATITUDE CARD (GRATITUD)
// ============================================================================
interface GratitudeCreateCardProps {
  onSubmit: (title: string, description: string, isAnonymous: boolean) => Promise<void>;
  isSubmitting: boolean;
}

const GratitudeCreateCard = React.memo(function GratitudeCreateCard({
  onSubmit,
  isSubmitting,
}: GratitudeCreateCardProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim() || isSubmitting) return;
    await onSubmit(title.trim(), description.trim(), isAnonymous);
    setTitle('');
    setDescription('');
  };

  return (
    <TacticalCard style={styles.createCard} padding={14}>
      <View style={styles.createHeaderRow}>
        <Text style={styles.createTitle}>Compartir un Testimonio</Text>
        <TouchableOpacity
          style={styles.anonToggle}
          onPress={() => setIsAnonymous((p) => !p)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={[styles.anonBox, isAnonymous && styles.anonBoxActiveGratitude]}>
            {isAnonymous && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.anonText}>Anónimo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quoteRow}>
        <Text style={styles.scriptureQuote}>
          «Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.»{' '}
          <Text style={[styles.scriptureRef, { color: '#D97706' }]}>1 TESALONICENSES 5:18</Text>
        </Text>
      </View>

      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.gratitudeTitleInput}
          placeholder="Título (ej. Agradecido por nuevo destino o sanidad)..."
          placeholderTextColor="#8A92A0"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.textArea, { minHeight: 56 }]}
          placeholder="Describe lo que Dios ha hecho, tu testimonio o motivo de acción de gracias..."
          placeholderTextColor="#8A92A0"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.createFooterRow}>
          <TouchableOpacity
            style={[
              styles.submitGratitudeBtn,
              (!description.trim() || isSubmitting) && styles.submitGratitudeBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!description.trim() || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitGratitudeBtnText}>Publicar Gratitud</Text>
                <Sparkles size={13} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TacticalCard>
  );
});

// Re-export TimelinePrayerCard for external consumers if needed
export { TimelinePrayerCard };

// ============================================================================
// MAIN COMMUNITY SCREEN (ORACIÓN & GRATITUD)
// ============================================================================
interface PrayerWallScreenProps {
  initialTab?: 'prayer' | 'gratitude';
}

export default function PrayerWallScreen({ initialTab = 'prayer' }: PrayerWallScreenProps) {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  // Active Tab: 'prayer' | 'gratitude'
  const [activeTab, setActiveTab] = useState<'prayer' | 'gratitude'>(initialTab);

  // Filter states
  const [prayerFilter, setPrayerFilter] = useState('all');
  const [gratitudeFilter, setGratitudeFilter] = useState('all');

  // Prayers Data State
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(true);
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);
  const [joinedPrayers, setJoinedPrayers] = useState<Set<number>>(new Set());

  // Gratitudes Data State
  const [gratitudes, setGratitudes] = useState<Gratitude[]>([]);
  const [isLoadingGratitudes, setIsLoadingGratitudes] = useState(true);
  const [isSubmittingGratitude, setIsSubmittingGratitude] = useState(false);
  const [thankedGratitudes, setThankedGratitudes] = useState<Set<number>>(new Set());

  // Shared refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal to Elevate Item via bottom button (+ Pedir / + Agradecer)
  const [showBottomModal, setShowBottomModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalAnonymous, setModalAnonymous] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  // Detail Modal State (When Card is tapped)
  const [selectedDetail, setSelectedDetail] = useState<{
    item: TimelineCardItem;
    type: 'prayer' | 'gratitude';
  } | null>(null);

  // Comments Modal State
  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    item: TimelineCardItem;
    type: 'prayer' | 'gratitude';
  } | null>(null);
  const [comments, setComments] = useState<Array<PrayerComment | GratitudeComment>>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================
  const fetchPrayers = useCallback(async () => {
    try {
      setIsLoadingPrayers(true);
      const res = await request<PaginatedPrayersResponse>(
        `${ENDPOINTS.PRAYERS}?page=0&size=20`
      );
      if (res && Array.isArray(res.content)) {
        setPrayers(res.content);
      }
    } catch (e: any) {
      console.warn('[PrayerWall] Could not fetch prayers:', e);
    } finally {
      setIsLoadingPrayers(false);
    }
  }, []);

  const fetchGratitudes = useCallback(async () => {
    try {
      setIsLoadingGratitudes(true);
      const res = await getGratitudes(0, 20);
      if (res && Array.isArray(res.content)) {
        setGratitudes(res.content);
      }
    } catch (e: any) {
      console.warn('[PrayerWall] Could not fetch gratitudes:', e);
    } finally {
      setIsLoadingGratitudes(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
    fetchGratitudes();
  }, [fetchPrayers, fetchGratitudes]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchPrayers(), fetchGratitudes()]);
    setIsRefreshing(false);
  };

  // ==========================================================================
  // HANDLERS: PRAY & THANK
  // ==========================================================================
  const handlePray = async (prayerId: number) => {
    if (joinedPrayers.has(prayerId)) return;

    setJoinedPrayers((prev) => new Set(prev).add(prayerId));
    setPrayers((prev) =>
      prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount + 1 } : p))
    );
    setSelectedDetail((prev) =>
      prev && prev.type === 'prayer' && prev.item.id === prayerId
        ? {
            ...prev,
            item: {
              ...prev.item,
              prayerCount: (prev.item.prayerCount ?? 0) + 1,
            },
          }
        : prev
    );

    try {
      await request<Prayer>(ENDPOINTS.PRAYER_PRAY(prayerId), { method: 'POST' });
    } catch {
      setJoinedPrayers((prev) => {
        const next = new Set(prev);
        next.delete(prayerId);
        return next;
      });
      setPrayers((prev) =>
        prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount - 1 } : p))
      );
      setSelectedDetail((prev) =>
        prev && prev.type === 'prayer' && prev.item.id === prayerId
          ? {
              ...prev,
              item: {
                ...prev.item,
                prayerCount: Math.max(0, (prev.item.prayerCount ?? 1) - 1),
              },
            }
          : prev
      );
    }
  };

  const handleThank = async (gratitudeId: number) => {
    if (thankedGratitudes.has(gratitudeId)) return;

    setThankedGratitudes((prev) => new Set(prev).add(gratitudeId));
    setGratitudes((prev) =>
      prev.map((g) =>
        g.id === gratitudeId
          ? {
              ...g,
              gratitudeCount: (g.gratitudeCount ?? 0) + 1,
              prayerCount: (g.prayerCount ?? 0) + 1,
            }
          : g
      )
    );
    setSelectedDetail((prev) =>
      prev && prev.type === 'gratitude' && prev.item.id === gratitudeId
        ? {
            ...prev,
            item: {
              ...prev.item,
              gratitudeCount: ((prev.item as Gratitude).gratitudeCount ?? 0) + 1,
              prayerCount: (prev.item.prayerCount ?? 0) + 1,
            } as Gratitude,
          }
        : prev
    );

    try {
      await thankGratitude(gratitudeId);
    } catch {
      setThankedGratitudes((prev) => {
        const next = new Set(prev);
        next.delete(gratitudeId);
        return next;
      });
      setGratitudes((prev) =>
        prev.map((g) =>
          g.id === gratitudeId
            ? {
                ...g,
                gratitudeCount: Math.max(0, (g.gratitudeCount ?? 1) - 1),
                prayerCount: Math.max(0, (g.prayerCount ?? 1) - 1),
              }
            : g
        )
      );
      setSelectedDetail((prev) =>
        prev && prev.type === 'gratitude' && prev.item.id === gratitudeId
          ? {
              ...prev,
              item: {
                ...prev.item,
                gratitudeCount: Math.max(0, ((prev.item as Gratitude).gratitudeCount ?? 1) - 1),
                prayerCount: Math.max(0, (prev.item.prayerCount ?? 1) - 1),
              } as Gratitude,
            }
          : prev
      );
    }
  };

  // ==========================================================================
  // HANDLERS: SUBMIT POSTS
  // ==========================================================================
  const handleSubmitPrayer = useCallback(
    async (text: string, isAnonymous: boolean) => {
      setIsSubmittingPrayer(true);
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
          'Tu pedido de oración ha sido publicado bajo amparo y cobertura pastoral.'
        );
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo publicar la petición.');
      } finally {
        setIsSubmittingPrayer(false);
      }
    },
    [user?.username]
  );

  const handleSubmitGratitude = useCallback(
    async (title: string, description: string, isAnonymous: boolean) => {
      setIsSubmittingGratitude(true);
      try {
        const payload: CreateGratitudeRequest = {
          title: title.trim() || description.slice(0, 40) + '...',
          description: description.trim(),
          content: [],
          authorName: isAnonymous ? 'Oficial Reservado' : user?.username || 'Anónimo',
          isAnonymous,
        };

        const created = await createGratitude(payload);
        setGratitudes((prev) => [created, ...prev]);
        Alert.alert(
          'Gratitud Compartida',
          'Tu testimonio de gratitud ha sido publicado para edificación de la comunidad.'
        );
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo publicar la gratitud.');
      } finally {
        setIsSubmittingGratitude(false);
      }
    },
    [user?.username]
  );

  const handleSubmitBottomModal = async () => {
    if (!modalDesc.trim() || isSubmittingModal) return;
    setIsSubmittingModal(true);
    try {
      if (activeTab === 'prayer') {
        await handleSubmitPrayer(modalDesc, modalAnonymous);
      } else {
        await handleSubmitGratitude(modalTitle, modalDesc, modalAnonymous);
      }
      setModalTitle('');
      setModalDesc('');
      setShowBottomModal(false);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  // ==========================================================================
  // HANDLERS: COMMENTS
  // ==========================================================================
  const handleOpenComments = async (
    item: TimelineCardItem,
    type: 'prayer' | 'gratitude'
  ) => {
    setActiveCommentTarget({ item, type });
    setCommentText('');
    setIsLoadingComments(true);
    try {
      if (type === 'prayer') {
        const list = await getPrayerComments(item.id);
        setComments(list);
      } else {
        const list = await getGratitudeComments(item.id);
        setComments(list);
      }
    } catch {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!activeCommentTarget || !commentText.trim() || isPostingComment) return;
    setIsPostingComment(true);
    try {
      const { item, type } = activeCommentTarget;
      if (type === 'prayer') {
        const created = await addPrayerComment(item.id, commentText.trim());
        setComments((prev) => [...prev, created]);
        setPrayers((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p
          )
        );
      } else {
        const created = await addGratitudeComment(item.id, commentText.trim());
        setComments((prev) => [...prev, created]);
        setGratitudes((prev) =>
          prev.map((g) =>
            g.id === item.id ? { ...g, commentCount: (g.commentCount ?? 0) + 1 } : g
          )
        );
      }
      setSelectedDetail((prev) =>
        prev && prev.item.id === activeCommentTarget.item.id
          ? {
              ...prev,
              item: {
                ...prev.item,
                commentCount: (prev.item.commentCount ?? 0) + 1,
              },
            }
          : prev
      );
      setCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo publicar el comentario.');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleShare = async (item: TimelineCardItem) => {
    try {
      const isGratitude = activeTab === 'gratitude';
      await Share.share({
        message: `${isGratitude ? 'Testimonio de Gratitud' : 'Petición de Oración'}: "${item.description}"\n\nCapellanAPP · Fraternidad y Cobertura Mutua`,
      });
    } catch {
      // Ignored
    }
  };

  // ==========================================================================
  // FILTERING
  // ==========================================================================
  const filteredPrayers = useMemo(() => {
    if (prayerFilter === 'mis_pedidos') {
      return prayers.filter((p) => p.authorName === user?.username);
    }
    return prayers;
  }, [prayers, prayerFilter, user]);

  const filteredGratitudes = useMemo(() => {
    if (gratitudeFilter === 'mis_gratitudes') {
      return gratitudes.filter((g) => g.authorName === user?.username);
    }
    return gratitudes;
  }, [gratitudes, gratitudeFilter, user]);

  const isTablet = width > 500;

  // ==========================================================================
  // LIST HEADER
  // ==========================================================================
  const listHeader = useMemo(
    () => (
      <View style={styles.headerContent}>
        {/* 1. Header Card */}
        <TacticalCard style={styles.headerCard} padding={14}>
          <View style={styles.brandRow}>
            <Text style={styles.titleContent}>
              {activeTab === 'prayer' ? 'Muro de oración' : 'Muro de gratitud'}
            </Text>
            <Text style={styles.brandSubtitle}>
              {activeTab === 'prayer'
                ? 'Fraternidad, Oración y Cobertura Mutua'
                : 'Celebración, Testimonios y Bendiciones Recibidas'}
            </Text>
          </View>
        </TacticalCard>

        {/* 2. Isolated Create Card */}
        {activeTab === 'prayer' ? (
          <PrayerCreateCard
            onSubmit={handleSubmitPrayer}
            isSubmitting={isSubmittingPrayer}
          />
        ) : (
          <GratitudeCreateCard
            onSubmit={handleSubmitGratitude}
            isSubmitting={isSubmittingGratitude}
          />
        )}

        {/* 3. Community Wall Header & Switch Button in line 460 */}
        <View style={styles.headerCardTextCol}>
          <View style={styles.brandRow}>
            <Text style={styles.secondTitleContent}>
              {activeTab === 'prayer'
                ? 'Pedidos de la comunidad'
                : 'Testimonios y Agradecimientos'}
            </Text>
          </View>

          {/* Switch Button between Oración and Gratitud (replaces old/new switch) */}
          <View style={styles.viewModeToggleRow}>
            <TouchableOpacity
              style={[
                styles.viewModeTab,
                activeTab === 'prayer' && styles.viewModeTabActive,
              ]}
              onPress={() => setActiveTab('prayer')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewModeTabText,
                  activeTab === 'prayer' && styles.viewModeTabTextActive,
                ]}
              >
                Oración
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeTab,
                activeTab === 'gratitude' && styles.viewModeTabActive,
              ]}
              onPress={() => setActiveTab('gratitude')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewModeTabText,
                  activeTab === 'gratitude' && styles.viewModeTabTextActiveGratitude,
                ]}
              >
                Gratitud
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <FilterPills
            items={activeTab === 'prayer' ? PRAYER_FILTERS : GRATITUDE_FILTERS}
            selectedId={activeTab === 'prayer' ? prayerFilter : gratitudeFilter}
            onSelect={activeTab === 'prayer' ? setPrayerFilter : setGratitudeFilter}
            style={styles.filterPills}
          />
        </View>
      </View>
    ),
    [
      activeTab,
      prayerFilter,
      gratitudeFilter,
      handleSubmitPrayer,
      handleSubmitGratitude,
      isSubmittingPrayer,
      isSubmittingGratitude,
    ]
  );

  // ==========================================================================
  // LIST FOOTER (+ Pedir / + Agradecer)
  // ==========================================================================
  const listFooter = useMemo(() => {
    const isGratitude = activeTab === 'gratitude';
    return (
      <TouchableOpacity
        style={styles.timelineAddBtnRow}
        onPress={() => {
          setModalTitle('');
          setModalDesc('');
          setModalAnonymous(false);
          setShowBottomModal(true);
        }}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.timelineAddCircle,
            isGratitude && styles.timelineAddCircleGratitude,
          ]}
        >
          <Plus
            size={14}
            color={isGratitude ? '#D97706' : Theme.colors.primary}
            strokeWidth={2.5}
          />
        </View>
        <Text
          style={[
            styles.timelineAddLabel,
            isGratitude && styles.timelineAddLabelGratitude,
          ]}
        >
          {isGratitude ? 'Agradecer' : 'Pedir'}
        </Text>
      </TouchableOpacity>
    );
  }, [activeTab]);

  // ==========================================================================
  // ITEM RENDERER (ALWAYS TIMELINE CARDS)
  // ==========================================================================
  const renderItem = useCallback(
    ({ item, index }: { item: TimelineCardItem; index: number }) => {
      if (activeTab === 'prayer') {
        const isJoined = joinedPrayers.has(item.id);
        return (
          <TimelinePrayerCard
            item={item}
            index={index}
            isJoined={isJoined}
            variant="prayer"
            onPray={handlePray}
            onOpenComments={(p) => handleOpenComments(p, 'prayer')}
            onPressCard={(p) => setSelectedDetail({ item: p, type: 'prayer' })}
          />
        );
      }

      const isThanked = thankedGratitudes.has(item.id);
      return (
        <TimelinePrayerCard
          item={item}
          index={index}
          isJoined={isThanked}
          variant="gratitude"
          onPray={handleThank}
          onOpenComments={(g) => handleOpenComments(g, 'gratitude')}
          onPressCard={(g) => setSelectedDetail({ item: g, type: 'gratitude' })}
        />
      );
    },
    [activeTab, joinedPrayers, thankedGratitudes, handlePray, handleThank]
  );

  const currentLoading =
    activeTab === 'prayer' ? isLoadingPrayers : isLoadingGratitudes;
  const currentData = activeTab === 'prayer' ? filteredPrayers : filteredGratitudes;

  return (
    <View style={styles.container}>
      <FlatList
        data={currentData}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
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
          !currentLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'prayer'
                  ? 'No hay peticiones registradas aún. Sé el primero en elevar una intención.'
                  : 'No hay testimonios registrados aún. Sé el primero en compartir un agradecimiento.'}
              </Text>
            </View>
          ) : (
            <ActivityIndicator
              style={{ marginTop: 24 }}
              color={activeTab === 'prayer' ? Theme.colors.tacticalNavy : '#D97706'}
            />
          )
        }
      />

      {/* MODAL: BOTTOM '+ PEDIR' / '+ AGRADECER' ACTION */}
      <Modal
        visible={showBottomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBottomModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.newPrayerModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {activeTab === 'prayer' ? 'Elevar Petición' : 'Compartir Gratitud'}
                </Text>
                <Text style={styles.modalSub}>
                  {activeTab === 'prayer'
                    ? 'Publica tu intención para que la comunidad ore contigo'
                    : 'Testifica de la bondad de Dios para edificar a la comunidad'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBottomModal(false)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.anonToggleRowModal}>
              <TouchableOpacity
                style={styles.anonToggle}
                onPress={() => setModalAnonymous((p) => !p)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.anonBox,
                    modalAnonymous &&
                      (activeTab === 'prayer'
                        ? styles.anonBoxActive
                        : styles.anonBoxActiveGratitude),
                  ]}
                >
                  {modalAnonymous && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.anonText}>Publicar como Anónimo</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'gratitude' && (
              <TextInput
                style={styles.modalTitleInput}
                placeholder="Título del agradecimiento..."
                placeholderTextColor="#94A3B8"
                value={modalTitle}
                onChangeText={setModalTitle}
              />
            )}

            <TextInput
              style={styles.modalPrayerTextInput}
              placeholder={
                activeTab === 'prayer'
                  ? 'Escribe tu petición de oración o motivo de intercesión...'
                  : 'Describe el testimonio, bendición recibida o motivo de gratitud...'
              }
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              value={modalDesc}
              onChangeText={setModalDesc}
              textAlignVertical="top"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBottomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  activeTab === 'gratitude' && styles.modalSubmitBtnGratitude,
                  (!modalDesc.trim() || isSubmittingModal) && styles.modalSubmitBtnDisabled,
                ]}
                onPress={handleSubmitBottomModal}
                disabled={!modalDesc.trim() || isSubmittingModal}
              >
                {isSubmittingModal ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    {activeTab === 'prayer' ? (
                      <>
                        <Send size={14} color="#FFFFFF" />
                        <Text style={styles.modalSubmitText}>Pedir Oración</Text>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} color="#FFFFFF" />
                        <Text style={styles.modalSubmitText}>Dar Gracias</Text>
                      </>
                    )}
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FULL DETAIL MODAL (WHEN CARD IS TAPPED) */}
      <Modal
        visible={Boolean(selectedDetail)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.detailModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={styles.detailBadgeRow}>
                  {selectedDetail?.type === 'prayer' ? (
                    <>
                      <HeartHandshake size={14} color="#0c7ae0" />
                      <Text style={styles.detailBadgeText}>PETICIÓN EN COBERTURA</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} color="#D97706" />
                      <Text style={[styles.detailBadgeText, { color: '#D97706' }]}>
                        TESTIMONIO DE GRATITUD
                      </Text>
                    </>
                  )}
                </View>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedDetail?.item.title ||
                    (selectedDetail?.type === 'prayer'
                      ? 'Petición Comunitaria'
                      : 'Testimonio de Fe')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDetail(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailModalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailAuthorCard}>
                <View
                  style={[
                    styles.detailAuthorAvatar,
                    selectedDetail?.type === 'gratitude' && styles.detailAuthorAvatarGratitude,
                  ]}
                >
                  <Text style={styles.detailAuthorAvatarText}>
                    {(selectedDetail?.item.authorName || 'O')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailAuthorName}>
                    {selectedDetail?.item.isAnonymous
                      ? 'Oficial Reservado'
                      : selectedDetail?.item.authorName || 'Camarada en Servicio'}
                  </Text>
                  <Text style={styles.detailAuthorDate}>
                    {selectedDetail?.item.createdAt
                      ? new Date(selectedDetail.item.createdAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Activa'}{' '}
                    • {selectedDetail?.type === 'prayer' ? 'Amparo Pastoral' : 'Acción de Gracias'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailActiveBadge,
                    selectedDetail?.type === 'gratitude' && styles.detailActiveBadgeGratitude,
                  ]}
                >
                  <Text
                    style={[
                      styles.detailActiveBadgeText,
                      selectedDetail?.type === 'gratitude' && styles.detailActiveBadgeTextGratitude,
                    ]}
                  >
                    {selectedDetail?.type === 'prayer' ? 'ACTIVA' : 'TESTIMONIO'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailBodyBox}>
                <Text style={styles.detailBodyText}>
                  {selectedDetail?.item.description}
                </Text>
              </View>

              {Array.isArray(selectedDetail?.item.content) &&
                selectedDetail.item.content.length > 0 && (
                  <View style={styles.detailContentList}>
                    {selectedDetail.item.content.map((bullet, idx) => (
                      <View key={idx} style={styles.detailBulletRow}>
                        <View style={styles.detailBulletDot} />
                        <Text style={styles.detailBulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
            </ScrollView>

            {selectedDetail && (
              <View style={styles.detailBottomActionBar}>
                {selectedDetail.type === 'prayer' ? (
                  <TouchableOpacity
                    style={[
                      styles.detailPrayBtn,
                      joinedPrayers.has(selectedDetail.item.id) && styles.detailPrayBtnActive,
                    ]}
                    onPress={() => handlePray(selectedDetail.item.id)}
                    activeOpacity={0.8}
                  >
                    <Heart
                      size={18}
                      color={
                        joinedPrayers.has(selectedDetail.item.id) ? '#EF4444' : '#0c7ae0'
                      }
                      fill={
                        joinedPrayers.has(selectedDetail.item.id) ? '#EF4444' : 'transparent'
                      }
                    />
                    <Text
                      style={[
                        styles.detailPrayBtnText,
                        joinedPrayers.has(selectedDetail.item.id) &&
                          styles.detailPrayBtnTextActive,
                      ]}
                    >
                      {joinedPrayers.has(selectedDetail.item.id)
                        ? `En oración (${selectedDetail.item.prayerCount})`
                        : `Unirme en oración (${selectedDetail.item.prayerCount})`}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.detailThankBtn,
                      thankedGratitudes.has(selectedDetail.item.id) &&
                        styles.detailThankBtnActive,
                    ]}
                    onPress={() => handleThank(selectedDetail.item.id)}
                    activeOpacity={0.8}
                  >
                    <Sparkles
                      size={18}
                      color={
                        thankedGratitudes.has(selectedDetail.item.id) ? '#D97706' : '#64748B'
                      }
                    />
                    <Text
                      style={[
                        styles.detailThankBtnText,
                        thankedGratitudes.has(selectedDetail.item.id) &&
                          styles.detailThankBtnTextActive,
                      ]}
                    >
                      {thankedGratitudes.has(selectedDetail.item.id)
                        ? `Amén / Gracias (${(selectedDetail.item as Gratitude).gratitudeCount ?? selectedDetail.item.prayerCount})`
                        : `Doy gracias (${(selectedDetail.item as Gratitude).gratitudeCount ?? selectedDetail.item.prayerCount})`}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.detailCommentBtn}
                  onPress={() => {
                    const target = selectedDetail;
                    setSelectedDetail(null);
                    handleOpenComments(target.item, target.type);
                  }}
                  activeOpacity={0.8}
                >
                  <MessageSquare
                    size={17}
                    color={selectedDetail.type === 'prayer' ? '#0c7ae0' : '#D97706'}
                  />
                  <Text style={styles.detailCommentBtnText}>
                    {selectedDetail.item.commentCount ?? 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailShareBtn}
                  onPress={() => handleShare(selectedDetail.item)}
                  activeOpacity={0.8}
                >
                  <Share2 size={17} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* COMMENTS MODAL (SUPPORTING BOTH PRAYER & GRATITUDE) */}
      <Modal
        visible={Boolean(activeCommentTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveCommentTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.commentsModalCard, globalStyles.shadowMd]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>
                  {activeCommentTarget?.type === 'prayer'
                    ? 'Palabras de Aliento & Oración'
                    : 'Palabras de Celebración & Fe'}
                </Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {activeCommentTarget?.item.title || activeCommentTarget?.item.description}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveCommentTarget(null)}>
                <X size={20} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {isLoadingComments ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator
                    size="small"
                    color={
                      activeCommentTarget?.type === 'prayer'
                        ? Theme.colors.tacticalNavy
                        : '#D97706'
                    }
                  />
                  <Text style={styles.commentsLoadingText}>Cargando mensajes de bendición...</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.commentsEmpty}>
                  <Text style={styles.commentsEmptyTitle}>Aún no hay comentarios</Text>
                  <Text style={styles.commentsEmptyText}>
                    {activeCommentTarget?.type === 'prayer'
                      ? 'Sé el primero en dejar palabras de fortaleza para esta petición.'
                      : 'Sé el primero en celebrar y agradecer junto a este testimonio.'}
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentTimelineCard}>
                    <View style={styles.commentCardHeader}>
                      <View style={styles.commentAuthorLeft}>
                        <View
                          style={[
                            styles.commentInitialCircle,
                            activeCommentTarget?.type === 'gratitude' &&
                              styles.commentInitialCircleGratitude,
                          ]}
                        >
                          <Text
                            style={[
                              styles.commentInitialText,
                              activeCommentTarget?.type === 'gratitude' &&
                                styles.commentInitialTextGratitude,
                            ]}
                          >
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
                            • {activeCommentTarget?.type === 'prayer' ? 'En Cobertura' : 'Comunidad'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.commentBodyText}>{comment.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Post Comment Input Bar */}
            {user ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder={
                    activeCommentTarget?.type === 'prayer'
                      ? 'Escribí palabras de fe o aliento...'
                      : 'Escribí palabras de celebración o gratitud...'
                  }
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  style={[
                    styles.commentSendBtn,
                    activeCommentTarget?.type === 'gratitude' && styles.commentSendBtnGratitude,
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
                  Iniciá sesión para publicar palabras de aliento o celebración.
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
  anonBoxActiveGratitude: {
    backgroundColor: '#D97706',
  },
  anonText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  quoteRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  scriptureQuote: {
    ...globalStyles.bodySm,
    fontSize: 11,
    fontStyle: 'italic',
    color: Theme.colors.onSurfaceVariant,
  },
  scriptureRef: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    fontStyle: 'normal',
    color: Theme.colors.secondary,
  },
  textAreaContainer: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 10,
  },
  gratitudeTitleInput: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  submitGratitudeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.roundness.md,
  },
  submitGratitudeBtnDisabled: {
    opacity: 0.5,
  },
  submitGratitudeBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // View Mode Switcher: Oración vs Gratitud
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
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
        elevation: 1.5,
      },
    }),
  },
  viewModeTabText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  viewModeTabTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#0c7ae0',
    fontWeight: '700',
  },
  viewModeTabTextActiveGratitude: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#D97706',
    fontWeight: '700',
  },

  // Timeline list & footer
  timelineAddBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 6,
    marginBottom: 20,
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
  },
  timelineAddCircleGratitude: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  timelineAddLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: Theme.colors.primary,
    letterSpacing: 0.2,
  },
  timelineAddLabelGratitude: {
    color: '#D97706',
  },

  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
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
    marginBottom: 10,
  },
  modalTitleInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalPrayerTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 120,
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
    backgroundColor: '#0c7ae0',
  },
  modalSubmitBtnGratitude: {
    backgroundColor: '#D97706',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Detail Modal Styles
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
  detailAuthorAvatarGratitude: {
    backgroundColor: '#D97706',
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
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  detailActiveBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailActiveBadgeGratitude: {
    backgroundColor: '#FEF3C7',
  },
  detailActiveBadgeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#0c7ae0',
  },
  detailActiveBadgeTextGratitude: {
    color: '#D97706',
  },
  detailBodyBox: {
    backgroundColor: '#F8FAFC',
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
    gap: 6,
    marginTop: 4,
  },
  detailBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailBulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#94A3B8',
    marginTop: 7,
  },
  detailBulletText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  detailBottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  detailPrayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailPrayBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  detailPrayBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#0c7ae0',
  },
  detailPrayBtnTextActive: {
    color: '#EF4444',
  },
  detailThankBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  detailThankBtnActive: {
    backgroundColor: '#FDE68A',
    borderColor: '#F59E0B',
  },
  detailThankBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#D97706',
  },
  detailThankBtnTextActive: {
    color: '#B45309',
  },
  detailCommentBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  detailCommentBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#475569',
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
    maxHeight: '85%',
  },
  commentsList: {
    flex: 1,
    marginVertical: 10,
  },
  commentsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  commentsLoadingText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Theme.fonts.body,
  },
  commentsEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginTop: 4,
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
  commentInitialCircleGratitude: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  commentInitialText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0c7ae0',
  },
  commentInitialTextGratitude: {
    color: '#D97706',
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
  commentSendBtnGratitude: {
    backgroundColor: '#D97706',
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
