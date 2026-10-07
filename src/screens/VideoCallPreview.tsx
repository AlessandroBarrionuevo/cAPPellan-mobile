import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Animated,
  Easing,
  useWindowDimensions,
  PanResponder,
  StatusBar,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAppInsets } from '../lib/safeArea';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { useChaplainStore } from '../lib/stores/chaplain';
import { request, setClientToken } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { ENV } from '../config/env';
import { requestMediaPermissions } from '../lib/permissions';
import { InstitutionalEmblem } from '../components/common';
import { decodeRoomToken } from '../lib/jwt';
import { CloudflareCallRoom } from '../modules/cloudflare-calls';
import {
  LiveKitRoom,
  VideoTrack,
  AudioSession,
  useTracks,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useConnectionState,
} from '@livekit/react-native';
import { Track, ConnectionState, ParticipantEvent } from 'livekit-client';
import type { CallResponse } from '../types/api';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  SlidersHorizontal,
  MoreVertical,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Lock,
  Volume2,
  ChevronUp,
  X,
  Radio,
  Sparkles,
} from 'lucide-react-native';

export interface VideoCallPreviewProps {
  onCallEnded: () => void;
  onOpenChat?: () => void;
}

/**
 * End Call Confirmation Modal
 */
function EndCallConfirmationModal({
  visible,
  durationText,
  isEnding,
  onCancel,
  onConfirmEnd,
}: {
  visible: boolean;
  durationText: string;
  isEnding: boolean;
  onCancel: () => void;
  onConfirmEnd: () => void;
}) {
  const { width } = useWindowDimensions();
  const isTablet = width > 520;
  const modalScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      modalScale.setValue(0.92);
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, modalScale]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={confirmStyles.backdrop}>
        <Animated.View
          style={[
            confirmStyles.card,
            isTablet && confirmStyles.tabletCard,
            { transform: [{ scale: modalScale }] },
          ]}
        >
          <View style={confirmStyles.iconRing}>
            <View style={confirmStyles.iconInner}>
              <PhoneOff size={28} color="#EF4444" strokeWidth={2.4} />
            </View>
          </View>

          <Text style={confirmStyles.title}>¿Finalizar Videollamada?</Text>
          <Text style={confirmStyles.message}>
            Se cerrará la sala y se dará por concluida la conversación pastoral en curso.
          </Text>

          <View style={confirmStyles.durationPill}>
            <Clock size={13} color="#94A3B8" />
            <Text style={confirmStyles.durationText}>
              Tiempo transcurrido: <Text style={confirmStyles.durationBold}>{durationText}</Text>
            </Text>
          </View>

          <View style={confirmStyles.buttonRow}>
            <TouchableOpacity
              style={confirmStyles.cancelButton}
              onPress={onCancel}
              disabled={isEnding}
              activeOpacity={0.8}
            >
              <Text style={confirmStyles.cancelButtonText}>Continuar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[confirmStyles.endButton, isEnding && { opacity: 0.7 }]}
              onPress={onConfirmEnd}
              disabled={isEnding}
              activeOpacity={0.88}
            >
              {isEnding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <PhoneOff size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={confirmStyles.endButtonText}>Finalizar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Settings & More Options Sheet Modal
 */
function MoreOptionsModal({
  visible,
  isCameraEnabled,
  isMicrophoneEnabled,
  onToggleCamera,
  onToggleMic,
  onFlipCamera,
  onClose,
}: {
  visible: boolean;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onFlipCamera: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableOpacity
        style={optionsStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={optionsStyles.card}>
          <View style={optionsStyles.headerRow}>
            <View style={optionsStyles.headerTitleRow}>
              <SlidersHorizontal size={18} color="#FFFFFF" />
              <Text style={optionsStyles.headerTitle}>Ajustes de Videollamada</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={optionsStyles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Quick Controls */}
          <View style={optionsStyles.actionsRow}>
            <TouchableOpacity
              style={[
                optionsStyles.actionItem,
                isCameraEnabled && optionsStyles.actionItemActive,
              ]}
              onPress={onToggleCamera}
            >
              {isCameraEnabled ? (
                <VideoIcon size={20} color="#38BDF8" />
              ) : (
                <VideoOff size={20} color="#94A3B8" />
              )}
              <Text style={optionsStyles.actionLabel}>
                {isCameraEnabled ? 'Cámara Activada' : 'Cámara Apagada'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                optionsStyles.actionItem,
                isMicrophoneEnabled && optionsStyles.actionItemActive,
              ]}
              onPress={onToggleMic}
            >
              {isMicrophoneEnabled ? (
                <Mic size={20} color="#10B981" />
              ) : (
                <MicOff size={20} color="#EF4444" />
              )}
              <Text style={optionsStyles.actionLabel}>
                {isMicrophoneEnabled ? 'Micrófono Activo' : 'Mic Silenciado'}
              </Text>
            </TouchableOpacity>
          </View>

          {isCameraEnabled && (
            <TouchableOpacity
              style={optionsStyles.flipRowBtn}
              onPress={onFlipCamera}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={optionsStyles.flipRowText}>Alternar Cámara Frontal / Trasera</Text>
            </TouchableOpacity>
          )}

          {/* Security & Confidentiality Reassurance */}
          <View style={optionsStyles.securityCard}>
            <View style={optionsStyles.securityHeader}>
              <ShieldCheck size={16} color="#6EE7B7" />
              <Text style={optionsStyles.securityTitle}>Enlace Cifrado de Extremo a Extremo</Text>
            </View>
            <Text style={optionsStyles.securityDesc}>
              Bajo reserva ministerial y secreto pastoral. Ningún video ni audio es grabado sin consentimiento previo.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * Inner Active Call Room Viewport
 */
function ActiveVideoCallViewport({
  onCallEnded,
  onOpenChat,
  isEnding,
  setIsEnding,
}: {
  onCallEnded: () => void;
  onOpenChat?: () => void;
  isEnding: boolean;
  setIsEnding: (val: boolean) => void;
}) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const [callDuration, setCallDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showEndModal, setShowEndModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);

  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera]);

  const currentSession = useCallStore((state) => state.currentSession);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const user = useAuthStore((state) => state.user);

  const session = currentSession || assignedCall;
  const isChaplainRole =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'SUPERUSER';

  const hasRemote = remoteParticipants.length > 0;
  const remoteParticipant = hasRemote ? remoteParticipants[0] : null;
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  useEffect(() => {
    if (!remoteParticipant) {
      setIsRemoteSpeaking(false);
      return;
    }

    setIsRemoteSpeaking(Boolean(remoteParticipant.isSpeaking));
    const handleSpeaking = (speaking: boolean) => {
      setIsRemoteSpeaking(speaking);
    };

    remoteParticipant.on(ParticipantEvent.IsSpeakingChanged, handleSpeaking);
    return () => {
      remoteParticipant.off(ParticipantEvent.IsSpeakingChanged, handleSpeaking);
    };
  }, [remoteParticipant]);

  // Duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimerHMS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find camera tracks
  const remoteVideoTrack = useMemo(() => {
    return tracks.find(
      (t) =>
        t.participant.identity !== localParticipant.identity &&
        t.source === Track.Source.Camera &&
        t.publication &&
        !t.publication.isMuted
    );
  }, [tracks, localParticipant.identity]);

  const localVideoTrack = useMemo(() => {
    return tracks.find(
      (t) =>
        t.participant.identity === localParticipant.identity &&
        t.source === Track.Source.Camera &&
        t.publication &&
        !t.publication.isMuted
    );
  }, [tracks, localParticipant.identity]);

  const handleToggleMic = useCallback(async () => {
    try {
      if (!isMicrophoneEnabled) {
        const { microphone } = await requestMediaPermissions(false);
        if (!microphone) return;
      }
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.warn('[VideoCallPreview] Error toggling mic:', err);
    }
  }, [isMicrophoneEnabled, localParticipant]);

  const handleToggleCamera = useCallback(async () => {
    try {
      if (!isCameraEnabled) {
        const { camera } = await requestMediaPermissions(true);
        if (!camera) return;
      }
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.warn('[VideoCallPreview] Error toggling camera:', err);
    }
  }, [isCameraEnabled, localParticipant]);

  const handleFlipCamera = useCallback(async () => {
    try {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setCameraEnabled(true, { facingMode: nextFacing });
      setFacingMode(nextFacing);
    } catch (err) {
      console.warn('[VideoCallPreview] Error flipping camera:', err);
    }
  }, [facingMode, localParticipant]);

  const handleExecuteEndCall = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      if (Platform.OS !== 'web') {
        await AudioSession.stopAudioSession();
      }
    } catch {
      // Audio session cleanup
    }

    try {
      await room.disconnect();
    } catch {
      // Disconnect errors cleanup
    }

    if (isChaplainRole && session?.sessionId) {
      try {
        await request(ENDPOINTS.CALL_END(session.sessionId), { method: 'POST' });
      } catch (err: any) {
        if (err?.status !== 409 && err?.status !== 403) {
          console.warn('[VideoCallPreview] Backend session end returned:', err);
        }
      }
    }

    useCallStore.getState().setCallStatus('ENDED');
    setShowEndModal(false);
    onCallEnded();
  }, [isEnding, setIsEnding, room, session?.sessionId, isChaplainRole, onCallEnded]);

  // Gestures for swipe up to show chat
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy < -25 && Math.abs(gestureState.dx) < 40;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -40) {
            if (onOpenChat) {
              onOpenChat();
            }
          }
        },
      }),
    [onOpenChat]
  );

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. MAIN BACKGROUND: Fullscreen Remote Video OR Contextual Pastoral Fallback */}
      {remoteVideoTrack ? (
        <View style={StyleSheet.absoluteFillObject}>
          <VideoTrack
            trackRef={remoteVideoTrack}
            style={StyleSheet.absoluteFillObject}
            objectFit="cover"
          />
          {/* Subtle gradient vignette at top and bottom for readability */}
          <View style={styles.topVignette} pointerEvents="none" />
          <View style={styles.bottomVignette} pointerEvents="none" />
        </View>
      ) : (
        /* Fallbacks when remote participant has camera turned OFF */
        <View style={styles.fallbackBackground}>
          {isChaplainRole ? (
            /* FALLBACK FOR CHAPLAIN:
               Person (consultante/basic) has camera off.
               App logo in center + inspiring phrase for chaplain. */
            <View style={styles.fallbackCenterContent}>
              <View style={styles.emblemContainer}>
                <InstitutionalEmblem size={96} />
              </View>

              <View style={styles.chaplainInspireBox}>
                <Sparkles size={18} color="#FBBF24" style={{ marginBottom: 6 }} />
                <Text style={styles.chaplainInspireQuote}>
                  «El Señor es mi pastor, nada me faltará. Tu presencia y escucha atenta son instrumentos de paz y luz en medio de la prueba.»
                </Text>
                <Text style={styles.chaplainInspireSub}>
                  Ministerio Pastoral • Enlace de audio activo y reservado
                </Text>
              </View>
            </View>
          ) : (
            /* FALLBACK FOR BASIC USER:
               Chaplain has camera off.
               Top: info of who they are talking to (Chaplain's name).
               Middle: App logo.
               Bottom: Motivating phrase for basic. */
            <View style={[styles.fallbackBasicContainer, { paddingTop: insets.top + 54 }]}>
              
              {/* Top: Logo of the application */}
              <View style={styles.basicMiddleEmblemBox}>
                <InstitutionalEmblem size={110} />
              </View>

              {/* Middle: Who the user is talking with */}
              <View style={styles.basicTopPartnerCard}>
                <View style={styles.basicOnlineDot} />
                <View>
                  <Text style={styles.basicPartnerName}>
                    {session?.livekitRoomName?.includes('chaplain') || !session
                      ? 'Capellán de Guardia'
                      : 'Capellán de Guardia'}
                  </Text>
                  <Text style={styles.basicPartnerSub}>
                    {isRemoteSpeaking ? 'Hablando ahora • En vivo' : 'Acompañamiento Pastoral Activo'}
                  </Text>
                </View>
              </View>

              {/* Motivating phrase for the basic user */}
              <View style={styles.basicMotivateBox}>
                <Text style={styles.basicMotivateVerse}>
                  «Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.»
                </Text>
                <Text style={styles.basicMotivateRef}>— Mateo 11:28</Text>
                <Text style={styles.basicMotivateNote}>
                  Estás en un canal seguro bajo secreto pastoral e inviolabilidad ministerial.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 2. TOP OVERLAY: Left Timer Badge & Pastoral Questions Guide */}
      <View
        style={[
          styles.topHeaderArea,
          {
            paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 8),
          },
        ]}
      >
        <View style={styles.topHeaderLeft}>
          {/* Timer pill badge: [ 🔴 00:08:23 ] */}
          <View style={styles.timerPill}>
            <View style={styles.timerRedDot} />
            <Text style={styles.timerText}>{formatTimerHMS(callDuration)}</Text>
          </View>

          {/* Contextual questions / pastoral inquiry guide matching image design */}
          <View style={styles.inquiryBox}>
            <Text style={styles.inquiryHeader}>
              {isChaplainRole ? 'Total 6 preguntas • Guía pastoral' : ''}
            </Text>
            <Text style={styles.inquiryLineActive}>
              {isChaplainRole
                ? '3 ¿Cuál es el motivo central que te trae hoy?'
                : ''}
            </Text>
            <Text style={styles.inquiryLineSecondary}>
              {isChaplainRole
                ? '4 ¿Podés compartir cómo te sentís espiritualmente?'
                : ''}
            </Text>
          </View>
        </View>

        {/* 3. TOP RIGHT: Picture-in-Picture (PiP) Local Video Card with Flip Button */}
        {isCameraEnabled && localVideoTrack ? (
          <View style={styles.pipWrapper}>
            <View style={styles.pipCard}>
              <VideoTrack
                trackRef={localVideoTrack}
                mirror={facingMode === 'user'}
                style={styles.pipVideo}
                objectFit="cover"
              />
            </View>

            {/* Vibrant circular camera flip button overlaid at the bottom center of PiP (Matching Image) */}
            <TouchableOpacity
              style={styles.pipFlipCircleBtn}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pipCameraOffChip}
            onPress={handleToggleCamera}
            activeOpacity={0.8}
          >
            <VideoOff size={14} color="#CBD5E1" />
            <Text style={styles.pipCameraOffText}>Vos (Cámara off)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. BOTTOM FLOATING CONTROLS DOCK (Matching screenshot layout & styling) */}
      <View
        style={[
          styles.bottomDockContainer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* Floating circular control buttons */}
        <View style={styles.dockActionsRow}>
          
          {/* 1. Microphone Toggle Button (Dark translucent circle) */}
          <TouchableOpacity
            style={[
              styles.dockCircleBtn,
              !isMicrophoneEnabled && styles.dockCircleBtnMuted,
            ]}
            onPress={handleToggleMic}
            activeOpacity={0.8}
          >
            {isMicrophoneEnabled ? (
              <Mic size={24} color="#FFFFFF" strokeWidth={2.2} />
            ) : (
              <MicOff size={24} color="#EF4444" strokeWidth={2.2} />
            )}
          </TouchableOpacity>


          {/* 2. Camera / Sliders Settings Button (Dark translucent circle matching image sliders icon) */}
          <TouchableOpacity
            style={[
              styles.dockCircleBtn,
              isCameraEnabled && styles.dockCircleBtnCameraActive,
            ]}
            onPress={handleToggleCamera}
            onLongPress={() => setShowMoreModal(true)}
            activeOpacity={0.8}
          >
            {isCameraEnabled ? (
              <VideoIcon size={22} color="#94A3B8" strokeWidth={2.2} />
              // <Video size={22} color="#94A3B8" strokeWidth={2.2} />
            ) : (
              <SlidersHorizontal size={22} color="#FFFFFF" strokeWidth={2.2} />
            )}
          </TouchableOpacity>

          {/* 3. More Options Button (Dark translucent circle with three vertical dots) */}
          <TouchableOpacity
            style={styles.dockCircleBtn}
            onPress={() => setShowMoreModal(true)}
            activeOpacity={0.8}
          >
            <MoreVertical size={22} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* 4. End Call Button (Red circle with white phone off icon) */}
          <TouchableOpacity
            style={styles.dockEndCallBtn}
            onPress={() => setShowEndModal(true)}
            activeOpacity={0.85}
          >
            <PhoneOff size={26} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {/* Swipe up to show chat hint */}
        <TouchableOpacity
          style={styles.swipeHintContainer}
          onPress={() => onOpenChat && onOpenChat()}
          activeOpacity={0.7}
        >
          {/* <Text style={styles.swipeHintText}>Swipe up to show chat</Text> */}
          <View style={styles.homeIndicatorBar} />
        </TouchableOpacity>
      </View>

      {/* Confirmation & Settings Modals */}
      <EndCallConfirmationModal
        visible={showEndModal}
        durationText={formatTimerHMS(callDuration)}
        isEnding={isEnding}
        onCancel={() => setShowEndModal(false)}
        onConfirmEnd={handleExecuteEndCall}
      />

      <MoreOptionsModal
        visible={showMoreModal}
        isCameraEnabled={Boolean(isCameraEnabled)}
        isMicrophoneEnabled={Boolean(isMicrophoneEnabled)}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onFlipCamera={handleFlipCamera}
        onClose={() => setShowMoreModal(false)}
      />
    </View>
  );
}

/**
 * Main VideoCallPreview Screen Orchestrator
 * (Preserves 100% of underlying initialization, permission, and token logic)
 */
export default function VideoCallPreview({ onCallEnded, onOpenChat }: VideoCallPreviewProps) {
  const insets = useAppInsets();
  const [isEnding, setIsEnding] = useState(false);
  const isEndingRef = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepError, setPrepError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const handleUpdateIsEnding = useCallback((val: boolean) => {
    isEndingRef.current = val;
    setIsEnding(val);
  }, []);

  const initRoom = useCallback(async () => {
    setIsPreparing(true);
    setPrepError(null);

    try {
      if (Platform.OS !== 'web') {
        const { NativeModules } = require('react-native');
        if (!NativeModules.WebRTCModule) {
          throw new Error(
            'El ejecutable en tu dispositivo no incluye el módulo nativo de WebRTC. Es necesario compilar un Development Build con EAS para activar llamadas.'
          );
        }
      }

      const perms = await requestMediaPermissions(true);
      if (!perms.microphone) {
        throw new Error('El permiso de micrófono es requerido para ingresar a la sala pastoral.');
      }

      if (Platform.OS !== 'web') {
        try {
          await AudioSession.startAudioSession();
        } catch (e) {
          console.warn('[VideoCallPreview] AudioSession start warning:', e);
        }
      }

      const currentSession = useCallStore.getState().currentSession;
      const assignedCall = useChaplainStore.getState().assignedCall;
      const session = currentSession || assignedCall;

      if (session?.token) {
        setToken(session.token);
      } else if (session?.sessionId) {
        const res = await request<CallResponse>(
          ENDPOINTS.CALLS_RECONNECT(session.sessionId),
          { method: 'POST' }
        );
        if (res.token) {
          setToken(res.token);
          if (res.clientToken) setClientToken(res.clientToken);
        } else {
          throw new Error('No se recibió el token de enlace para la sala.');
        }
      } else {
        throw new Error('No se encontró una sesión activa para ingresar a la sala.');
      }
    } catch (err: any) {
      console.error('[VideoCallPreview] Initialization error:', err);
      setPrepError(err.message || 'Error al iniciar la conexión');
    } finally {
      setIsPreparing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      initRoom();
    }

    return () => {
      if (Platform.OS !== 'web') {
        AudioSession.stopAudioSession().catch(() => {});
      }
    };
  }, [initRoom]);

  const user = useAuthStore((state) => state.user);
  const currentSession = useCallStore((state) => state.currentSession);
  const assignedCall = useChaplainStore((state) => state.assignedCall);

  const isChaplainRole =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'SUPERUSER';

  const decodedToken = useMemo(() => {
    return token ? decodeRoomToken(token) : null;
  }, [token]);

  const provider = decodedToken?.provider || 'livekit';

  const handleLiveKitError = useCallback((err: Error) => {
    console.warn('[VideoCallPreview] LiveKit Error:', err);
  }, []);

  const handleDisconnected = useCallback((reason?: any) => {
    console.log('[VideoCallPreview] LiveKit disconnected, reason:', reason);
    if (!isEndingRef.current) {
      isEndingRef.current = true;
      useCallStore.getState().setCallStatus('ENDED');
      onCallEnded();
    }
  }, [onCallEnded]);

  if (isPreparing) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingTitle}>Estableciendo enlace de video...</Text>
        <Text style={styles.loadingSub}>
          Conectando a la sala pastoral encriptada
        </Text>
      </View>
    );
  }

  if (prepError || !token) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <AlertTriangle size={48} color="#EF4444" />
        <Text style={styles.loadingTitle}>Fallo de Enlace</Text>
        <Text style={styles.loadingSub}>{prepError || 'Token de acceso no disponible'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initRoom}>
          <RotateCcw size={18} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={styles.retryButtonText}>Reintentar enlace</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onCallEnded}>
          <Text style={styles.closeButtonText}>Volver al panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cloudflare Calls fallback compatibility
  if (provider === 'cloudflare') {
    const cfAppId =
      decodedToken?.appId ||
      currentSession?.callsAppId ||
      assignedCall?.callsAppId ||
      ENV.CLOUDFLARE_CALLS_APP_ID;

    if (!cfAppId) {
      return (
        <View
          style={[
            styles.loadingContainer,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.loadingTitle}>Configuración Requerida</Text>
          <Text style={styles.loadingSub}>
            No se detectó el App ID para Cloudflare Calls.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initRoom}>
            <RotateCcw size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Reintentar enlace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onCallEnded}>
            <Text style={styles.closeButtonText}>Volver al panel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <CloudflareCallRoom
        config={{
          appId: cfAppId,
          token: token,
          apiUrl: ENV.CLOUDFLARE_CALLS_API_URL,
        }}
        initialVideo={true}
        onCallEnded={onCallEnded}
        isChaplainRole={isChaplainRole}
      />
    );
  }

  // LiveKit provider
  return (
    <LiveKitRoom
      serverUrl={ENV.LIVEKIT_WS_URL}
      token={token}
      connect={true}
      audio={true}
      video={true}
      onError={handleLiveKitError}
      onDisconnected={handleDisconnected}
    >
      <ActiveVideoCallViewport
        onCallEnded={onCallEnded}
        onOpenChat={onOpenChat}
        isEnding={isEnding}
        setIsEnding={handleUpdateIsEnding}
      />
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#090D14',
    position: 'relative',
    justifyContent: 'space-between',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D131F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 340,
  },
  emblemContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  chaplainInspireBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chaplainInspireQuote: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  chaplainInspireSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  fallbackBasicContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 140,
  },
  basicTopPartnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 10,
    marginBottom: 50,
  },
  basicOnlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  basicPartnerName: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  basicPartnerSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#94A3B8',
  },
  basicMiddleEmblemBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  basicMotivateBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    maxWidth: 350,
    marginBottom: 30,
  },
  basicMotivateVerse: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  basicMotivateRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12.5,
    color: '#38BDF8',
    marginBottom: 20,
  },
  basicMotivateNote: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  topHeaderArea: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  topHeaderLeft: {
    flex: 1,
    maxWidth: 240,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 7,
    marginBottom: 10,
  },
  timerRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  inquiryBox: {
    gap: 3,
  },
  inquiryHeader: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  inquiryLineActive: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  inquiryLineSecondary: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pipWrapper: {
    position: 'relative',
    width: 104,
    height: 148,
    alignItems: 'center',
  },
  pipCard: {
    width: 104,
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: '#1E293B',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  pipFlipCircleBtn: {
    position: 'absolute',
    bottom: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#F43F5E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pipCameraOffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  pipCameraOffText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#CBD5E1',
  },
  bottomDockContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  dockActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  dockEndCallBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dockCircleBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dockCircleBtnMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  dockCircleBtnCameraActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swipeHintContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  swipeHintText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.2,
  },
  homeIndicatorBar: {
    width: 134,
    height: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090D14',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingTitle: {
    fontFamily: Theme.fonts.headlineBold,
    color: '#FFFFFF',
    fontSize: 19,
    marginTop: 10,
    textAlign: 'center',
  },
  loadingSub: {
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C7AE0',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 10,
    marginTop: 6,
  },
  closeButtonText: {
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});

const confirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletCard: {
    maxWidth: 420,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 19,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20,
  },
  durationText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#CBD5E1',
  },
  durationBold: {
    fontFamily: Theme.fonts.headlineBold,
    color: '#38BDF8',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13.5,
    color: '#CBD5E1',
  },
  endButton: {
    flex: 1.2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});

const optionsStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  flipRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  flipRowText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  securityCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#6EE7B7',
  },
  securityDesc: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
});
