import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  useWindowDimensions,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Phone,
  Video,
  MessageSquare,
  ShieldCheck,
  Eye,
  EyeOff,
  Timer,
  RotateCcw,
  Sparkles,
  BookOpen,
  Share2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  HeartHandshake,
  Heart,
  Plus,
  Tv,
} from 'lucide-react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { SseClient } from '../lib/api/sse';
import { requestMediaPermissions } from '../lib/permissions';
import { getPerlitaDelDia, getRandomPerlita } from '../lib/api/bible';
import { getChaplainTeam, getMyBasicProfile, updateMyBasicProfile } from '../lib/api/profiles';
import { fetchContents, toggleContentLike } from '../lib/api/content';
import type { Perlita } from '../types/bible';
import type {
  Session,
  SessionType,
  CallIntake,
  ChaplainTeamMember,
  BasicProfile,
  ContentItem,
} from '../types/api';
import type { Prayer, PaginatedPrayersResponse } from '../types/prayer';
import CallIntakeModal from '../components/duty/CallIntakeModal';
import { TacticalCard, TacticalButton, ConfidentialityBanner } from '../components/common';
import { useAppInsets } from '../lib/safeArea';
import { StatusBar } from 'expo-status-bar';
import BasicDashboard from './BasicDashboard';
import { TimelinePrayerCard } from '../components/prayer/TimelinePrayerCard';
import { ModernSocialContentCard, ContentCommentsModal } from '../components/content';

interface BasicDashboardPreviewProps {
  onJoinCall: () => void;
  onJoinChat: () => void;
  onNavigateToBible?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPrayers?: () => void;
  onNavigateToBlogs?: () => void;
}

const DEFAULT_PORTRAIT =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800';

const CHAPLAIN_ROSTER = [
  {
    id: 1,
    name: 'Cap. Mayor Morales',
    branch: 'Ejército',
    specialty: 'Especialista en estrés operativo y retorno',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBqDZ2JpvNoZkWZF0odAe80kpx0qGWzdevv88xrvcS6dpIguNmVQbkNPw2LjQpPdMsgsA0rItqZg37YqDbkoiXFTqTu5eIaE8YiaCmRx6xaodA-G3wkW4Uvik6qGtzF5M1R4X34VbuUhjYGrHIlh1tLp_zoffvUwN6UwMtQzrkIUySkwdS7qTr3mE0_c6nEIhQ9V-9laJcB-UM5JhyE0ikuJHNQ7tQWo_KSvEynMAfvI4NFfiV29rWPRA',
  },
  {
    id: 2,
    name: 'Cap. Álvarez',
    branch: 'Gendarmería / Policía',
    specialty: 'Acompañamiento en incidentes críticos',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqppq_I2-Lm4BfCj9e3SjR45iq5x2p7d61AHy9FGH494cOs8Ggqf-dz38wMU7fLnt1VJgtO9rfOmK8k9k9I_GbTBWWObLWnozWz_sxceQWKkxf6ysHPN7pGqcUY5Z2nN54FsXcB5A3ABrw4Xi4qMjWrjQi0GnvWuequ6qVpQolZyAZWM7kWC2qaP8s1M2KdlaANPx9_4CpUtXWjnUCeAaNbk8Im8CedKI5cKDiurLhAUavBL00hiMiqA',
  },
  {
    id: 3,
    name: 'Cap. Vázquez',
    branch: 'Familia & Duelo',
    specialty: 'Soporte a cónyuges, hijos y duelo moral',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwTrmGIGeW9DPei-OLCIoPxfQTy3wXtOp9K1jOual8wWrK20eiZzoxkHgtpMaHim8YMUmzaSf7bOFJ5VsQegmLY48XNZ8EncX2D19vq0Wb5xpKiMTzdRnhhC3Oko0x2s2xBsII43Fyq_0eW-Gka9tQ_2mUO0qEIyaYk4Yvv0jw5A2J4g-qgjSe-hBNwnjWpRkGR9voUvYM8tFmZIvqr1usUb2qMbPTphkYykqghpb-RZOh3e1YJK62cQ',
  },
];

const FALLBACK_DASHBOARD_PRAYERS: Prayer[] = [
  {
    id: 101,
    title: 'Personal en Frontera Norte',
    description: 'Pedimos cobertura, fortaleza espiritual y protección para los efectivos en patrulla y sus familias.',
    content: ['Personal en despliegue operativo', 'Protección y paz en el hogar'],
    authorName: 'Oficial Reservado',
    isAnonymous: true,
    prayerCount: 24,
    commentCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 102,
    title: 'Recuperación de Salud',
    description: 'Petición de intercesión por la pronta recuperación del Sargento Morales tras intervención médica.',
    content: ['Salud y restauración física'],
    authorName: 'Suboficial R. Gómez',
    isAnonymous: false,
    prayerCount: 42,
    commentCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 103,
    title: 'Paz y Templanza en Guardia',
    description: 'Por sabiduría, discernimiento y serenidad para todos los camaradas de turno este fin de semana.',
    content: ['Serenidad en el servicio', 'Fortaleza moral'],
    authorName: 'Camarada en Servicio',
    isAnonymous: true,
    prayerCount: 19,
    commentCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const FALLBACK_DASHBOARD_CONTENTS: ContentItem[] = [
  {
    id: 201,
    title: 'Episodio 14: Fortaleza y Resiliencia en el Deber',
    description: 'Reflexión pastoral sobre la templanza espiritual en situaciones de alta presión y servicio abnegado.',
    mediaUrl: 'https://open.spotify.com/episode/3ZcyXfVn2e5h1p6z8Q1v9m',
    type: 'SPOTIFY',
    authorId: 1,
    likesCount: 58,
    commentsCount: 14,
    isLikedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 202,
    title: 'Ceremonia de Bendición y Palabras de Aliento',
    description: 'Acompañamiento pastoral a los cuadros y familias. Mensaje de esperanza y vocación militar.',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    type: 'YOUTUBE',
    authorId: 2,
    likesCount: 124,
    commentsCount: 32,
    isLikedByMe: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 203,
    title: 'Paz en la Tormenta: Reflexión Visual',
    description: '«No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.» Isaías 41:10.',
    mediaUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=800',
    type: 'IMAGE',
    authorId: 3,
    likesCount: 89,
    commentsCount: 19,
    isLikedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
];

export default function BasicDashboardPreview({
  onJoinCall,
  onJoinChat,
  onNavigateToBible,
  onNavigateToContent,
  onNavigateToPrayers,
  onNavigateToBlogs,
}: BasicDashboardPreviewProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();
  const [selectedType, setSelectedType] = useState<SessionType>('VIDEO');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showOriginalDashboard, setShowOriginalDashboard] = useState(false);

  // User Authentication & Profile
  const authUser = useAuthStore((state) => state.user);
  const [basicProfile, setBasicProfile] = useState<BasicProfile | null>(null);

  // Community Prayer Wall Widget State
  const [prayersList, setPrayersList] = useState<Prayer[]>(FALLBACK_DASHBOARD_PRAYERS);
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Set<number>>(new Set());

  // Multimedia & Content State
  const [contentList, setContentList] = useState<ContentItem[]>(FALLBACK_DASHBOARD_CONTENTS);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [activeContentForComments, setActiveContentForComments] = useState<ContentItem | null>(null);

  // Dynamic Perlita State
  const [perlita, setPerlita] = useState<Perlita | null>(null);
  const [isLoadingPerlita, setIsLoadingPerlita] = useState(false);
  const [isRandomPerlita, setIsRandomPerlita] = useState(false);

  // Chaplain Team State
  const [chaplainTeam, setChaplainTeam] = useState<ChaplainTeamMember[]>([]);

  // Call Store
  const currentSession = useCallStore((state) => state.currentSession);
  const callStatus = useCallStore((state) => state.callStatus);
  const error = useCallStore((state) => state.error);
  const requestCall = useCallStore((state) => state.requestCall);
  const resetCall = useCallStore((state) => state.resetCall);
  const endCall = useCallStore((state) => state.endCall);

  // Pulse animation for waiting room
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPerlita(true);

    getPerlitaDelDia()
      .then((data) => {
        if (isMounted) setPerlita(data);
      })
      .catch((err) => {
        console.warn('Error loading daily perlita in preview:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPerlita(false);
      });

    getChaplainTeam()
      .then((team) => {
        if (isMounted && Array.isArray(team) && team.length > 0) {
          setChaplainTeam(team);
        }
      })
      .catch((err) => {
        console.warn('Error loading chaplain team in preview:', err);
      });

    getMyBasicProfile()
      .then((profile) => {
        if (isMounted && profile) {
          setBasicProfile(profile);
          if (typeof profile.isAnonymous === 'boolean') {
            setIsAnonymous(profile.isAnonymous);
          }
        }
      })
      .catch(() => { });

    setIsLoadingPrayers(true);
    request<PaginatedPrayersResponse>(`${ENDPOINTS.PRAYERS}?page=0&size=5`)
      .then((res) => {
        if (isMounted && res && Array.isArray(res.content) && res.content.length > 0) {
          setPrayersList(res.content.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Error loading prayers in preview:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPrayers(false);
      });

    setIsLoadingContents(true);
    fetchContents()
      .then((items) => {
        if (isMounted && Array.isArray(items) && items.length > 0) {
          setContentList(items.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Error loading contents in preview dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingContents(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrayInDashboard = async (prayerId: number) => {
    if (prayedIds.has(prayerId)) return;
    setPrayedIds((prev) => new Set(prev).add(prayerId));
    setPrayersList((prev) =>
      prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount + 1 } : p))
    );
    try {
      await request(ENDPOINTS.PRAYER_PRAY(prayerId), { method: 'POST' });
    } catch {
      // Ignored for optimistic responsiveness
    }
  };

  const handleLikeContentInDashboard = async (contentId: number) => {
    setContentList((prev) =>
      prev.map((item) => {
        if (item.id === contentId) {
          const nextLiked = !item.isLikedByMe;
          return {
            ...item,
            isLikedByMe: nextLiked,
            likesCount: nextLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1),
          };
        }
        return item;
      })
    );

    try {
      const res = await toggleContentLike(contentId);
      setContentList((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? { ...item, isLikedByMe: res.liked, likesCount: res.likesCount }
            : item
        )
      );
    } catch (err) {
      console.warn('[BasicDashboardPreview] Failed to toggle like on content:', err);
    }
  };

  const handleToggleAnonymity = async () => {
    const nextVal = !isAnonymous;
    setIsAnonymous(nextVal);
    try {
      await updateMyBasicProfile({ isAnonymous: nextVal });
    } catch (err) {
      console.warn('[BasicDashboardPreview] Failed to persist anonymity change:', err);
    }
  };

  const handleRandomPerlitaInDashboard = async () => {
    setIsLoadingPerlita(true);
    try {
      const data = await getRandomPerlita();
      setPerlita(data);
      setIsRandomPerlita(true);
    } catch (err) {
      // Ignored
    } finally {
      setIsLoadingPerlita(false);
    }
  };

  const handleSharePerlitaInDashboard = async () => {
    if (!perlita) return;
    try {
      await Share.share({
        message: `«${perlita.text}» — ${perlita.reference} (${perlita.translation})\n\n${perlita.attribution || ''}\nCompartido desde CapellanAPP`,
      });
    } catch (e) {
      // Ignored
    }
  };

  const handleCancelRequest = async () => {
    if (currentSession?.sessionId) {
      await endCall(currentSession.sessionId);
    }
    resetCall();
  };

  useEffect(() => {
    if (callStatus === 'WAITING') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [callStatus, pulseAnim]);

  // Real-time Push Status (SSE) with Polling Fallback while WAITING
  useEffect(() => {
    if (callStatus !== 'WAITING' || !currentSession?.sessionId) return;

    let isFinished = false;

    const handleTransition = (
      newStatus: string,
      sessionType?: SessionType,
      livekitRoomName?: string
    ) => {
      if (isFinished) return;

      if (newStatus === 'IN_PROGRESS') {
        isFinished = true;
        useCallStore.getState().setCallStatus('IN_PROGRESS');
        useCallStore.getState().setSession({
          ...currentSession,
          sessionType: sessionType || currentSession.sessionType,
          livekitRoomName: livekitRoomName || currentSession.livekitRoomName,
        });
        const targetType = sessionType || currentSession.sessionType;
        if (targetType === 'CHAT') {
          onJoinChat();
        } else {
          onJoinCall();
        }
      } else if (newStatus === 'ENDED') {
        isFinished = true;
        useCallStore.getState().setCallStatus('ENDED');
      }
    };

    const sseUrl = ENDPOINTS.CALL_SSE_STATUS(
      currentSession.sessionId,
      currentSession.clientToken
    );
    const sse = new SseClient(sseUrl);

    sse.addEventListener('status-change', (data: any) => {
      if (data && data.status) {
        handleTransition(data.status, data.sessionType, data.livekitRoomName);
      }
    });

    sse.connect();

    const interval = setInterval(async () => {
      if (isFinished) return;
      try {
        const sessionDetail = await request<Session>(
          ENDPOINTS.CALL_DETAIL(currentSession.sessionId)
        );
        handleTransition(
          sessionDetail.status,
          sessionDetail.sessionType,
          sessionDetail.livekitRoomName
        );
      } catch (e) {
        // Retry
      }
    }, 5000);

    return () => {
      isFinished = true;
      sse.close();
      clearInterval(interval);
    };
  }, [callStatus, currentSession, onJoinCall, onJoinChat]);

  const handleStartCall = async (
    type: SessionType = selectedType,
    intake?: CallIntake
  ) => {
    try {
      if (type === 'VIDEO') {
        await requestMediaPermissions(false);
      }
      await requestCall(type, intake);
    } catch (err) {
      console.error('[BasicDashboardPreview] Failed to initiate call:', err);
    }
  };

  // WAITING ROOM SCREEN
  if (callStatus === 'WAITING') {
    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2.1],
    });
    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0.6, 0.25, 0],
    });

    const isChat = (currentSession?.sessionType || selectedType) === 'CHAT';

    return (
      <View style={styles.centeredContainer}>
        <TacticalCard style={styles.waitingCard} padding={24}>
          <View style={styles.pulseWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={styles.pulseInnerCircle}>
              {isChat ? (
                <MessageSquare size={30} color={Theme.colors.tacticalNavy} />
              ) : (
                <ShieldCheck size={32} color={Theme.colors.tacticalNavy} />
              )}
            </View>
          </View>

          <Text style={styles.waitingTitle}>
            {isChat ? 'Estableciendo enlace de chat...' : 'Estableciendo enlace pastoral...'}
          </Text>
          <Text style={styles.waitingSubtitle}>
            {isChat
              ? 'Tu solicitud de chat confidencial está en cola prioritaria. Un capellán de guardia responderá en breve.'
              : 'Tu llamado está en cola prioritaria. Un capellán de guardia responderá en breve.'}
          </Text>

          <View style={styles.waitBadge}>
            <Timer size={14} color={Theme.colors.tacticalNavy} />
            <Text style={styles.waitBadgeText}>Tiempo estimado: &lt; 30 segundos</Text>
          </View>

          <TacticalButton
            title="Cancelar solicitud"
            onPress={handleCancelRequest}
            variant="surface"
            size="md"
            leftIcon={<RotateCcw size={16} color={Theme.colors.onSurfaceVariant} />}
            style={styles.cancelButton}
          />
        </TacticalCard>
      </View>
    );
  }

  const isTablet = width > 500;
  const bannerWidth = isTablet ? 408 : width - 32;
  const bannerHeight = Math.round(bannerWidth / (1024 / 447));
  const displayUserEmail =
    authUser?.username || basicProfile?.username || 'usuario@fuerzas.gob.ar';

  if (showOriginalDashboard) {
    return (
      <View style={{ flex: 1 }}>
        <BasicDashboard
          onJoinCall={onJoinCall}
          onJoinChat={onJoinChat}
          onNavigateToBible={onNavigateToBible}
          onNavigateToContent={onNavigateToContent}
          onNavigateToPrayers={onNavigateToPrayers}
          onNavigateToBlogs={onNavigateToBlogs}
        />
        {/* Floating switch back button */}
        <TouchableOpacity
          style={[styles.floatingPreviewSwitchBtn, { top: insets.top + 8 }]}
          onPress={() => setShowOriginalDashboard(false)}
          activeOpacity={0.85}
        >
          <RotateCcw size={13} color="#FFFFFF" />
          <Text style={styles.floatingPreviewSwitchText}>Volver a Preview</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================================== */}
        {/* 1. TOP HEADER & CUTOUT HERO BANNER WITH CORNER ACTION BUTTONS        */}
        {/* ==================================================================== */}
        <View style={styles.heroSection}>
          <StatusBar style="dark" />

          {/* Top Header Bar: Circular App Logo + Account Email + Original Switch */}
          <View style={[styles.topHeaderBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.topHeaderUserRow}>
              <View style={styles.topHeaderLogoCircle}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.topHeaderLogoImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.topHeaderUserTextCol}>
                <Text style={styles.topHeaderGreeting}>Bienvenido</Text>
                <Text style={styles.topHeaderUserEmail} numberOfLines={1}>
                  {displayUserEmail}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.headerOriginalSwitchBtn}
              onPress={() => setShowOriginalDashboard(true)}
              activeOpacity={0.85}
            >
              <RotateCcw size={12} color="#0c7ae0" />
              <Text style={styles.headerOriginalSwitchText}>Original</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Banner with Cutout Shape & Corner Circular Action Buttons */}
          <View
            style={[
              styles.bannerCutoutCard,
              {
                width: 340,
                height: bannerHeight,
              },

            ]}
          >
            {/* Cutout Image with Custom Inward Curves */}
            <Image
              source={require('../../assets/bannerV2.png')}
              style={styles.bannerCutoutImage}
              resizeMode="cover"
            />

            {/* Centered Typography: Medium Title & Subtitle */}
            <View style={styles.bannerCenteredContent}>
              <Text style={styles.bannerMediumTitle}>Comunicate</Text>
              <Text style={styles.bannerCenteredSubtitle}>
                Estamos para vos en todo momento.
              </Text>
            </View>

            {/* Pill Action Buttons (Search-bar design: White background, blue circle with arrow) */}
            <View style={styles.bannerPillButtonsRow}>
              {/* Videollamada Pill Button */}
              <TouchableOpacity
                style={styles.actionPillButton}
                onPress={() => {
                  setSelectedType('VIDEO');
                  setShowIntakeModal(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.pillLeftContent}>
                  <View style={styles.pillBlueCircle}>
                    <Video size={20} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <Text style={styles.pillButtonLabel} numberOfLines={1}>
                    Llamar
                  </Text>
                </View>

              </TouchableOpacity>

              {/* Chat Pill Button */}
              <TouchableOpacity
                style={styles.actionPillButton}
                onPress={() => {
                  setSelectedType('CHAT');
                  setShowIntakeModal(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.pillLeftContent}>
                  <View style={styles.pillBlueCircle}>
                    <MessageSquare size={20} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <Text style={styles.pillButtonLabel} numberOfLines={1}>
                    Chat
                  </Text>
                </View>

              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ==================================================================== */}
        {/* 2. DASHBOARD WIDGETS IN EXACT ORIGINAL BASICDASHBOARD ORDER          */}
        {/* ==================================================================== */}
        <View style={styles.dashboardWidgetsArea}>
          {error && (
            <View style={styles.errorContainer}>
              <AlertTriangle size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 1. Stealth / Anonymous Mode Toggle Pill */}
          <TouchableOpacity
            style={styles.stealthToggle}
            onPress={handleToggleAnonymity}
            activeOpacity={0.8}
          >
            <View style={styles.stealthLeft}>
              {isAnonymous ? (
                <EyeOff size={18} color={Theme.colors.secondary} />
              ) : (
                <Eye size={18} color={Theme.colors.secondary} />
              )}
              <View style={styles.stealthTextCol}>
                <Text style={styles.stealthTitle}>
                  {isAnonymous ? 'Modo Anónimo Activado' : 'Identidad Visible en Ficha'}
                </Text>
                <Text style={styles.stealthSub}>
                  Cámara opcional, identidad y unidad ocultas
                </Text>
              </View>
            </View>

            {/* Switch knob */}
            <View
              style={[
                styles.switchTrack,
                isAnonymous ? styles.switchTrackOn : styles.switchTrackOff,
              ]}
            >
              <View
                style={[
                  styles.switchKnob,
                  isAnonymous ? styles.switchKnobOn : styles.switchKnobOff,
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* 2. Daily Devotional: Perlita del Día Widget */}
          <TacticalCard style={styles.reflectionCard} padding={16}>
            <View style={styles.reflectionHeader}>
              <View style={styles.reflectionBadgeRow}>
                <Sparkles size={14} color={Theme.colors.secondary} />
                <Text style={styles.reflectionBadge}>
                  {isRandomPerlita ? 'PERLITA DEVOCIONAL ALEATORIA' : 'PERLITA DEL DÍA'}
                </Text>
              </View>
              {perlita?.date && (
                <Text style={styles.reflectionToday}>{perlita.date}</Text>
              )}
            </View>

            {isLoadingPerlita ? (
              <View style={styles.widgetLoading}>
                <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />
                <Text style={styles.widgetLoadingText}>Cargando versículo del día...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.quoteText}>
                  “{perlita?.text || 'Yavé es mi Pastor. Nada me faltará.'}”
                </Text>

                <View style={styles.reflectionFooter}>
                  <View style={styles.widgetFooterTextCol}>
                    <Text style={styles.scriptureRef}>
                      {perlita?.reference || 'Salmos 23:1'}
                    </Text>
                  </View>

                  <View style={styles.widgetActionButtons}>
                    <TouchableOpacity
                      style={styles.widgetIconBtn}
                      onPress={handleRandomPerlitaInDashboard}
                      activeOpacity={0.8}
                      accessibilityLabel="Generar perlita aleatoria"
                    >
                      <RefreshCw size={14} color={Theme.colors.tacticalNavy} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.widgetIconBtn}
                      onPress={handleSharePerlitaInDashboard}
                      activeOpacity={0.8}
                      accessibilityLabel="Compartir versículo"
                    >
                      <Share2 size={14} color={Theme.colors.tacticalNavy} />
                    </TouchableOpacity>

                    {onNavigateToBible && (
                      <TouchableOpacity
                        style={styles.widgetBibleBtn}
                        onPress={onNavigateToBible}
                        activeOpacity={0.8}
                      >
                        <BookOpen size={13} color="#FFFFFF" />
                        <Text style={styles.widgetBibleBtnText}>Leer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}
          </TacticalCard>

          {/* 3. Community Intercession: Muro de Oración Widget */}
          <View style={styles.prayerWidgetSection}>
            <View style={styles.prayerSectionHeader}>
              <View style={styles.prayerSectionTitleCol}>
                <View style={styles.prayerBadgeRow}>
                  <HeartHandshake size={14} color="#0c7ae0" />
                  <Text style={styles.prayerBadgeText}>COMUNIDAD EN ORACIÓN</Text>
                </View>
                <Text style={styles.prayerSectionTitle}>Muro de Oración</Text>
              </View>
              <Text style={styles.prayerCountBadge}>3 ACTIVAS</Text>
            </View>

            {/* Timeline Prayer Cards List (using TimelinePrayerCard design) */}
            <View style={styles.prayerTimelineList}>
              {prayersList.slice(0, 3).map((item, index) => {
                const isJoined = prayedIds.has(item.id);
                return (
                  <TimelinePrayerCard
                    key={item.id}
                    item={item}
                    index={index}
                    isJoined={isJoined}
                    onPray={handlePrayInDashboard}
                    onPressCard={onNavigateToPrayers}
                    onOpenComments={onNavigateToPrayers}
                    showConnector={index < Math.min(prayersList.length, 3) - 1}
                  />
                );
              })}
            </View>

            {/* '+ Ver más' button using timelineAddBtnRow format */}
            {onNavigateToPrayers && (
              <TouchableOpacity
                style={styles.timelineAddBtnRow}
                onPress={onNavigateToPrayers}
                activeOpacity={0.8}
              >
                <View style={styles.timelineAddCircle}>
                  <Plus size={14} color={Theme.colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.timelineAddLabel}>Ver más</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 4. Multimedia & Reflections: Content Widget */}
          <View style={styles.contentWidgetSection}>
            <View style={styles.contentSectionHeader}>
              <View style={styles.contentSectionTitleCol}>
                <View style={styles.contentBadgeRow}>
                  <Tv size={14} color="#0c7ae0" />
                  <Text style={styles.contentBadgeText}>MULTIMEDIA & REFLEXIONES</Text>
                </View>
                <Text style={styles.contentSectionTitle}>Contenidos Destacados</Text>
              </View>
              <Text style={styles.contentCountBadge}>3 DESTACADOS</Text>
            </View>

            {/* List of 3 Content Cards */}
            <View style={styles.contentCardsList}>
              {contentList.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.contentCardItemWrapper}>
                  <ModernSocialContentCard
                    content={item}
                    onLikeToggle={handleLikeContentInDashboard}
                    onOpenDetail={() => onNavigateToContent?.()}
                    onOpenComments={setActiveContentForComments}
                  />
                </View>
              ))}
            </View>

            {/* '+ Ver más' button using timelineAddBtnRow format */}
            {onNavigateToContent && (
              <TouchableOpacity
                style={styles.timelineAddBtnRow}
                onPress={onNavigateToContent}
                activeOpacity={0.8}
              >
                <View style={styles.timelineAddCircle}>
                  <Plus size={14} color={Theme.colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.timelineAddLabel}>Ver más contenidos</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 5. Direct Selection: Roster of Chaplains in Guard */}
          <View style={styles.rosterSection}>
            <View style={styles.rosterSectionHeader}>
              <Text style={styles.rosterSectionTitle}>Nuestros Capellaness</Text>
              <Text style={styles.rosterSectionBadge}>
                {chaplainTeam.length > 0 ? `${chaplainTeam.length} EN EQUIPO` : '3 DISPONIBLES'}
              </Text>
            </View>

            <View style={styles.rosterList}>
              {(chaplainTeam.length > 0 ? chaplainTeam : CHAPLAIN_ROSTER).map((item: any) => {
                const id = item.userId || item.id;
                const name = item.fullName || item.name;
                const branch = item.militaryForce || item.branch || 'Capellanía';
                const specialty =
                  item.bio ||
                  item.specialty ||
                  (item.militaryRank ? `Rango: ${item.militaryRank}` : 'Asistencia pastoral y contención');
                const avatar =
                  item.avatarUrl ||
                  item.avatar ||
                  DEFAULT_PORTRAIT;
                const isOnline = item.status === 'ONLINE' || !item.status;

                return (
                  <TacticalCard
                    key={id}
                    style={styles.chaplainCard}
                    padding={10}
                  >
                    <View style={styles.chaplainRow}>
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{ uri: avatar }}
                          style={styles.avatarImage}
                        />
                        <View
                          style={[
                            styles.onlineDot,
                            !isOnline && { backgroundColor: '#94A3B8' },
                          ]}
                        />
                      </View>

                      <View style={styles.chaplainInfo}>
                        <View style={styles.branchTag}>
                          <Text style={styles.branchTagText}>{branch}</Text>
                        </View>
                        <View style={styles.chaplainNameRow}>
                          <Text style={styles.chaplainName}>{name}</Text>
                        </View>
                        <View>
                          <Text style={styles.chaplainSpecialty} numberOfLines={2}>
                            {specialty}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.chaplainActionButtons}>
                        <TouchableOpacity
                          style={styles.chatIconButton}
                          onPress={() => {
                            setSelectedType('CHAT');
                            setShowIntakeModal(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <MessageSquare size={16} color={Theme.colors.tacticalNavy} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.callIconButton}
                          onPress={() => {
                            setSelectedType('VIDEO');
                            setShowIntakeModal(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Video size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TacticalCard>
                );
              })}
            </View>
          </View>

          {/* 6. Confidentiality Protocol & Crisis Helpline Link */}
          <ConfidentialityBanner
            title="Secreto de Confesión & Sigilo Total"
            description="Protegido por normativa canónica, ética pastoral y estricta confidencialidad."
            style={styles.confidentialityBanner}
          />
        </View>
      </ScrollView>

      {/* CALL INTAKE MODAL (Real call launching logic) */}
      <CallIntakeModal
        visible={showIntakeModal}
        sessionType={selectedType}
        onClose={() => setShowIntakeModal(false)}
        isSubmitting={callStatus === 'REQUESTING'}
        onSubmit={async (intake?: CallIntake) => {
          setShowIntakeModal(false);
          await handleStartCall(selectedType, intake);
        }}
      />

      {/* CONTENT COMMENTS MODAL */}
      <ContentCommentsModal
        visible={Boolean(activeContentForComments)}
        content={activeContentForComments}
        onClose={() => setActiveContentForComments(null)}
        onCommentAdded={(contentId, newCount) => {
          setContentList((prev) =>
            prev.map((c) => (c.id === contentId ? { ...c, commentsCount: newCount } : c))
          );
          if (activeContentForComments && activeContentForComments.id === contentId) {
            setActiveContentForComments((prev) =>
              prev ? { ...prev, commentsCount: newCount } : null
            );
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  tabletContent: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },

  // 1. HERO BANNER
  heroSection: {
    width: '100%',
    marginBottom: 10,
    position: 'relative',
  },
  floatingPreviewSwitchBtn: {
    position: 'absolute',
    right: 14,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F2438',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
  },
  floatingPreviewSwitchText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  topHeaderUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  topHeaderLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  topHeaderLogoImg: {
    width: 26,
    height: 26,
  },
  topHeaderUserTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topHeaderGreeting: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 14,
  },
  topHeaderUserEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.2,
  },
  headerOriginalSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerOriginalSwitchText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#0c7ae0',
    fontWeight: '700',
  },
  bannerCutoutCard: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: 24,
    marginBottom: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerCutoutImage: {
    width: '100%',
    height: '130%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bannerCenteredContent: {
    width: '70%',
    position: 'absolute',
    top: 60,
    left: -10,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
  },
  bannerMediumTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bannerCenteredSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  bannerPillButtonsRow: {
    position: 'absolute',
    bottom: -70, //-70 para que quede medio al borde y -44 para que quede en el tope de abajo
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
    marginBottom: 0,
  },
  actionPillButton: {
    flex: 1,
    height: 43,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: 5,
    borderColor: 'black',
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  pillLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pillButtonLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: 0.8,
  },
  pillBlueCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',

  },

  // 2. DASHBOARD WIDGETS
  dashboardWidgetsArea: {
    marginTop: 14,
    paddingHorizontal: 16,
    gap: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorContainer,
    padding: 10,
    borderRadius: Theme.roundness.md,
    gap: 8,
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
    flex: 1,
  },
  stealthToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stealthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
    gap: 10,
  },
  stealthTextCol: {
    flex: 1,
  },
  stealthTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  stealthSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  switchTrackOff: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchKnobOn: {
    alignSelf: 'flex-end',
  },
  switchKnobOff: {
    alignSelf: 'flex-start',
  },

  // Capellanes de Guardia Roster
  rosterSection: {},
  rosterSectionHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  rosterSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  rosterSectionBadge: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 11,
  },
  rosterList: {
    gap: 10,
  },
  chaplainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chaplainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chaplainInfo: {
    flex: 1,
    minWidth: 0,
  },
  chaplainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chaplainName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  branchTag: {
    paddingVertical: 1,
    borderRadius: 3,
  },
  branchTagText: {
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.onSurfaceVariant,
  },
  chaplainSpecialty: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  chaplainActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 3. Muro de Oración Widget
  prayerWidgetSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  prayerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  prayerSectionTitleCol: {
    gap: 2,
  },
  prayerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerBadgeText: {
    ...globalStyles.labelCaps,
    color: '#0c7ae0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  prayerSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.3,
  },
  prayerCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0c7ae0',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  prayerTimelineList: {
    marginTop: 4,
  },
  timelineAddBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingVertical: 8,
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

  // 4. Multimedia & Reflections: Content Widget
  contentWidgetSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  contentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contentSectionTitleCol: {
    gap: 2,
  },
  contentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contentBadgeText: {
    ...globalStyles.labelCaps,
    color: '#0c7ae0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  contentSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.3,
  },
  contentCountBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0c7ae0',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  contentCardsList: {
    gap: 16,
  },
  contentCardItemWrapper: {
    width: '100%',
  },

  // Perlita del Día Card
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reflectionHeader: {
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reflectionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reflectionBadge: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  reflectionToday: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  widgetLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  widgetLoadingText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  quoteText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.colors.onSurface,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reflectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  widgetFooterTextCol: {
    flex: 1,
    minWidth: 0,
  },
  scriptureRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.tacticalNavy,
  },
  widgetActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetBibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Theme.roundness.sm,
    gap: 4,
  },
  widgetBibleBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  confidentialityBanner: {
    marginTop: 4,
  },

  // Waiting Room Styles
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  waitingCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  pulseWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.secondaryContainer,
  },
  pulseInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    gap: 6,
    marginBottom: 20,
  },
  waitBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  cancelButton: {
    width: '100%',
  },
});
