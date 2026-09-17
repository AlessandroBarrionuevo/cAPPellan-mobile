import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { SseClient } from '../lib/api/sse';
import { requestMediaPermissions } from '../lib/permissions';
import type { Session, SessionType, CallIntake } from '../types/api';
import CallIntakeModal from '../components/duty/CallIntakeModal';
import {
  TacticalCard,
  TacticalButton,
  ConfidentialityBanner,
} from '../components/common';
import {
  Shield,
  ShieldCheck,
  Phone,
  Video,
  Eye,
  EyeOff,
  Timer,
  Play,
  Pause,
  AlertTriangle,
  HeartHandshake,
  RotateCcw,
  Sparkles,
  MessageSquare,
} from 'lucide-react-native';

interface BasicDashboardProps {
  onJoinCall: () => void;
  onJoinChat: () => void;
  onNavigateToBible?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPrayers?: () => void;
  onNavigateToBlogs?: () => void;
}

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

export default function BasicDashboard({
  onJoinCall,
  onJoinChat,
  onNavigateToBible,
  onNavigateToContent,
  onNavigateToPrayers,
  onNavigateToBlogs,
}: BasicDashboardProps) {
  const { width } = useWindowDimensions();
  const [selectedType, setSelectedType] = useState<SessionType>('VIDEO');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const currentSession = useCallStore((state) => state.currentSession);
  const callStatus = useCallStore((state) => state.callStatus);
  const error = useCallStore((state) => state.error);
  const requestCall = useCallStore((state) => state.requestCall);
  const resetCall = useCallStore((state) => state.resetCall);
  const endCall = useCallStore((state) => state.endCall);

  const handleCancelRequest = async () => {
    if (currentSession?.sessionId) {
      await endCall(currentSession.sessionId);
    }
    resetCall();
  };

  // Pulse animation for waiting room
  const pulseAnim = useRef(new Animated.Value(0)).current;

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

    // 1. Primary: Server-Sent Events stream for instant status update
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

    // 2. Secondary: Defensive polling fallback (relaxed to 5s)
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
        // Request microphone permission upfront so Android prompts the user immediately
        await requestMediaPermissions(false);
      }
      await requestCall(type, intake);
    } catch (e) {
      // Handled in store
    }
  };

  // 1. WAITING ROOM VIEW (Smooth Ripple)
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
                <HeartHandshake size={32} color={Theme.colors.tacticalNavy} />
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

  return (
    <>
      <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        isTablet && styles.tabletContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Primary Action Focus: Immediate Chaplain Dispatch Card */}
      <TacticalCard style={styles.dispatchCard} padding={18}>
        <View style={styles.dispatchHeader}>
          <View style={styles.waitTimerPill}>
            <Timer size={13} color={Theme.colors.onSurfaceVariant} />
            <Text style={styles.waitTimerText}>&lt; 30 seg</Text>
          </View>
          <View style={styles.dispatchHeaderLeft}>
            <View style={styles.badgePriorityRow}>
              <ShieldCheck size={16} color={Theme.colors.secondary} />
              <Text style={styles.badgePriorityText}>ATENCIÓN PASTORAL PRIORITARIA</Text>
            </View>
            <Text style={styles.dispatchTitle}>Presencia y Escucha en el Deber</Text>
          </View>
        </View>

        {/* Visual Anchor: Serene Dawn Mist Reflection */}
        <View style={styles.visualAnchorCard}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvFOIfa5_YX7m-gBZvZ3Ccq4L5LnEbceandEwWrlBibzdXJ41R7hGFDI3kaBlZm9VdcJuIxxOr95LolJf1jV0bF9IH33mCFaUVG6nGxB7j1CP0Z0wTMAyNCdjugOagn7NiQHlopUkAJxSrR8c9hyfW1gi5ku5Kj2UBBYOSRGbh3NkgVY0j3fUwfu40SJNYNRpsK3UWledP1nlh0cy8-2KxzOCg0Ov6WvklJL6MhwjsN9OazjGei-dotw',
            }}
            style={styles.anchorImage}
            resizeMode="cover"
          />
          <View style={styles.anchorOverlay} />

          <View style={styles.anchorContent}>
            <View style={styles.anchorTopRow}>
              <View style={styles.serenityBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.serenityBadgeText}>PAUSA DE GUARDIA</Text>
              </View>
              <Sparkles size={16} color="#FFFFFF" />
            </View>

            <View style={styles.anchorBottomText}>
              <Text style={styles.anchorHeading}>Espacio de Serenidad y Escucha</Text>
              <Text style={styles.anchorSub}>
                Templanza mental, silencio constructivo y asistencia confidencial en servicio
              </Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <AlertTriangle size={16} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 1-Tap Video Call CTA */}
        <TacticalButton
          title={
            callStatus === 'REQUESTING' && selectedType === 'VIDEO'
              ? 'Estableciendo enlace de video...'
              : 'Llamar a un capellán'
          }
          onPress={() => {
            setSelectedType('VIDEO');
            setShowIntakeModal(true);
          }}
          loading={callStatus === 'REQUESTING' && selectedType === 'VIDEO'}
          variant="primary"
          size="md"
          leftIcon={<Video size={24} color="#FFFFFF" />}
          style={styles.ctaButton}
        />

        {/* 1-Tap Confidential Written Chat CTA */}
        <TacticalButton
          title={
            callStatus === 'REQUESTING' && selectedType === 'CHAT'
              ? 'Iniciando chat confidencial...'
              : 'Iniciar Chat Confidencial'
          }
          onPress={() => {
            setSelectedType('CHAT');
            setShowIntakeModal(true);
          }}
          loading={callStatus === 'REQUESTING' && selectedType === 'CHAT'}
          variant="outline"
          size="md"
          leftIcon={<MessageSquare size={18} color={Theme.colors.tacticalNavy} />}
          style={styles.ctaChatButton}
        />

        {/* Stealth / Anonymous Mode Toggle Pill */}
        <TouchableOpacity
          style={styles.stealthToggle}
          onPress={() => setIsAnonymous((prev) => !prev)}
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
      </TacticalCard>

      {/* 2. Direct Selection: Roster of Chaplains in Guard */}
      <View style={styles.rosterSection}>
        <View style={styles.rosterSectionHeader}>
          <Text style={styles.rosterSectionTitle}>Capellanes de Guardia</Text>
          <Text style={styles.rosterSectionBadge}>3 DISPONIBLES</Text>
        </View>

        <View style={styles.rosterList}>
          {CHAPLAIN_ROSTER.map((chaplain) => (
            <TacticalCard
              key={chaplain.id}
              style={styles.chaplainCard}
              padding={10}
            >

              <View style={styles.chaplainRow}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: chaplain.avatar }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.chaplainInfo}>
                  <View style={styles.branchTag}>
                    <Text style={styles.branchTagText}>{chaplain.branch}</Text>
                  </View>
                  <View style={styles.chaplainNameRow}>
                    <Text style={styles.chaplainName}>{chaplain.name}</Text>
                  </View>
                  <View >
                    <Text style={styles.chaplainSpecialty} numberOfLines={2}>
                      {chaplain.specialty}
                    </Text>
                  </View>
                </View>

                {/* <View style={styles.chaplainActionButtons}>
                  <TouchableOpacity
                    style={styles.chatIconButton}
                    onPress={() => {
                      setSelectedType('CHAT');
                      handleStartCall('CHAT');
                    }}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel={`Chatear con ${chaplain.name}`}
                  >
                    <MessageSquare size={15} color={Theme.colors.tacticalNavy} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callIconButton}
                    onPress={() => {
                      setSelectedType('VIDEO');
                      handleStartCall('VIDEO');
                    }}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel={`Llamar a ${chaplain.name}`}
                  >
                    <Phone size={15} color="#FFFFFF" />
                  </TouchableOpacity>
                </View> */}
              </View>
            </TacticalCard>
          ))}
        </View>
      </View>

      {/* 3. Daily Reflection of Strength: Salmo 91:2 */}
      <TacticalCard style={styles.reflectionCard} padding={16}>
        <View style={styles.reflectionHeader}>
          <Text style={styles.reflectionBadge}>FORTALEZA DIARIA DEL GUARDIA</Text>
        </View>

        <Text style={styles.quoteText}>
          “Diré yo al Señor: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.”
        </Text>

        <View style={styles.reflectionFooter}>
          <Text style={styles.scriptureRef}>Salmo 91:2</Text>
          <TouchableOpacity
            style={styles.audioPrayerBtn}
            onPress={() => setIsPlayingAudio((prev) => !prev)}
            activeOpacity={0.8}
          >
            {isPlayingAudio ? (
              <Pause size={16} color={Theme.colors.tacticalNavy} />
            ) : (
              <Play size={16} color={Theme.colors.tacticalNavy} />
            )}
            <Text style={styles.audioPrayerText}>
              {isPlayingAudio ? 'Pausar (1:45)' : 'Oración Breve (2 min)'}
            </Text>
          </TouchableOpacity>
        </View>
      </TacticalCard>

      {/* 4. Confidentiality Protocol & Crisis Helpline Link */}
      <ConfidentialityBanner
        title="Secreto de Confesión & Sigilo Total"
        description="Protegido por normativa canónica, ética pastoral y estricta confidencialidad."
        style={styles.confidentialityBanner}
      />
    </ScrollView>

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Theme.colors.background,
  },
  waitingCard: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  pulseWrapper: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Theme.colors.secondaryContainer,
  },
  pulseInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...globalStyles.shadowSm,
  },
  waitingTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    color: Theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    gap: 6,
    marginBottom: 20,
  },
  waitBadgeText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSecondaryFixed,
    fontSize: 10,
  },
  cancelButton: {
    width: '100%',
  },
  dispatchCard: {
    marginBottom: 16,
  },
  dispatchHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 16,
  },
  dispatchHeaderLeft: {
    flex: 1,
    paddingRight: 8,
    gap: 6,
  },
  badgePriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  badgePriorityText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dispatchTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: Theme.colors.onSurface,
  },
  waitTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
    gap: 4,
  },
  waitTimerText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurface,
    fontSize: 10,
  },
  visualAnchorCard: {
    height: 200,
    borderRadius: Theme.roundness.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  anchorImage: {
    ...StyleSheet.absoluteFillObject,
  },
  anchorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 30, 48, 0.52)',
  },
  anchorContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  anchorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    gap: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6EE7B7',
  },
  serenityBadgeText: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  anchorBottomText: {
    gap: 2,
  },
  anchorHeading: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: '#FFFFFF',
  },
  anchorSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorContainer,
    padding: 10,
    borderRadius: Theme.roundness.md,
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
    flex: 1,
  },
  ctaButton: {
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  ctaChatButton: {
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: Theme.colors.tacticalNavy,
  },
  stealthToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.roundness.md,
  },
  stealthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
    gap: 8,
  },
  stealthTextCol: {
    flex: 1,
  },
  stealthTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  stealthSub: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
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
  rosterSection: {
    marginBottom: 16,
  },
  rosterSectionHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 6,
  },
  rosterSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  rosterSectionBadge: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 12,
  },
  rosterList: {
    gap: 8,
  },
  chaplainCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
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
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    paddingBottom: 2,
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
    gap: 6,
    marginLeft: 6,
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
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
  reflectionCard: {
    marginBottom: 16,
  },
  reflectionHeader: {
    gap: 4,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  quoteText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    lineHeight: 23,
    color: Theme.colors.onSurface,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  reflectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptureRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  audioPrayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.sm,
    gap: 6,
  },
  audioPrayerText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurface,
  },
  confidentialityBanner: {
    marginTop: 4,
  },
});
