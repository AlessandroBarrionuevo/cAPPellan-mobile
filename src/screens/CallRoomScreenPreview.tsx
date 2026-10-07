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
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Clock,
  FlipHorizontal,
  Lock,
  Radio,
  Check,
  X,
  Phone,
  Sparkles,
} from 'lucide-react-native';

export interface CallRoomScreenPreviewProps {
  onCallEnded: () => void;
}

/**
 * End Call Confirmation Modal ("el de finalizar la llamada")
 * Beautiful white-background confirmation card with shaped buttons and duration summary.
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
          {/* Warning Icon Badge */}
          <View style={confirmStyles.iconRing}>
            <View style={confirmStyles.iconInner}>
              <PhoneOff size={28} color="#DC2626" strokeWidth={2.4} />
            </View>
          </View>

          <Text style={confirmStyles.title}>¿Finalizar Llamada Pastoral?</Text>
          <Text style={confirmStyles.message}>
            Se cerrará la sala y se dará por concluida la conversación pastoral en curso.
          </Text>

          {/* Session Duration Summary Badge */}
          <View style={confirmStyles.durationPill}>
            <Clock size={13} color="#0C7AE0" />
            <Text style={confirmStyles.durationText}>
              Tiempo transcurrido: <Text style={confirmStyles.durationBold}>{durationText}</Text>
            </Text>
          </View>

          {/* Shaped Actions */}
          <View style={confirmStyles.buttonRow}>
            <TouchableOpacity
              style={confirmStyles.cancelButton}
              onPress={onCancel}
              disabled={isEnding}
              activeOpacity={0.8}
            >
              <Text style={confirmStyles.cancelButtonText}>Continuar en llamada</Text>
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
                  <Text style={confirmStyles.endButtonText}>Finalizar y Salir</Text>
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
 * Inner component active inside LiveKitRoom context
 */
function ActiveCallContentPreview({
  onCallEnded,
  isEnding,
  setIsEnding,
}: {
  onCallEnded: () => void;
  isEnding: boolean;
  setIsEnding: (val: boolean) => void;
}) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const [callDuration, setCallDuration] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showEndModal, setShowEndModal] = useState(false);

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

  // Audio wave animation values for voice stage
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.6)).current;
  const waveAnim3 = useRef(new Animated.Value(0.4)).current;
  const waveAnim4 = useRef(new Animated.Value(0.8)).current;
  const waveAnim5 = useRef(new Animated.Value(0.5)).current;

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

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Voice wave micro-animation loop when speaking
  useEffect(() => {
    if (isRemoteSpeaking) {
      const animateWave = (anim: Animated.Value, toValue: number, duration: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.25,
              duration,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const a1 = animateWave(waveAnim1, 1.1, 350);
      const a2 = animateWave(waveAnim2, 1.3, 420);
      const a3 = animateWave(waveAnim3, 1.5, 300);
      const a4 = animateWave(waveAnim4, 1.2, 480);
      const a5 = animateWave(waveAnim5, 1.4, 380);

      a1.start();
      a2.start();
      a3.start();
      a4.start();
      a5.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        a4.stop();
        a5.stop();
      };
    } else {
      waveAnim1.setValue(0.3);
      waveAnim2.setValue(0.5);
      waveAnim3.setValue(0.35);
      waveAnim4.setValue(0.6);
      waveAnim5.setValue(0.4);
    }
  }, [isRemoteSpeaking, waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5]);

  // Pulse halo animation for institutional avatar
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRemoteSpeaking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1300,
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
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isRemoteSpeaking, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      console.warn('[CallRoomPreview] Error toggling mic:', err);
    }
  }, [isMicrophoneEnabled, localParticipant]);

  const handleToggleCamera = useCallback(async () => {
    try {
      if (!isCameraEnabled) {
        const { camera } = await requestMediaPermissions(true);
        if (!camera) {
          return;
        }
      }
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.warn('[CallRoomPreview] Error toggling camera:', err);
    }
  }, [isCameraEnabled, localParticipant]);

  const handleFlipCamera = useCallback(async () => {
    try {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setCameraEnabled(true, { facingMode: nextFacing });
      setFacingMode(nextFacing);
    } catch (err) {
      console.warn('[CallRoomPreview] Error flipping camera:', err);
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
      // Ignore disconnect errors
    }

    if (isChaplainRole && session?.sessionId) {
      try {
        await request(ENDPOINTS.CALL_END(session.sessionId), { method: 'POST' });
      } catch (err: any) {
        if (err?.status !== 409 && err?.status !== 403) {
          console.warn('[CallRoomPreview] Backend session end returned:', err);
        }
      }
    }

    useCallStore.getState().setCallStatus('ENDED');
    setShowEndModal(false);
    onCallEnded();
  }, [isEnding, setIsEnding, room, session?.sessionId, isChaplainRole, onCallEnded]);

  const isConnected = connectionState === ConnectionState.Connected;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isTablet = width > 520;

  return (
    <View
      style={[
        styles.lightContainer,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* 1. Header Bar: Security Badge & Elapsed Time */}
      <View style={[styles.topBar, isTablet && styles.tabletContent]}>
        <View style={styles.secureBadge}>
          <View
            style={[
              styles.statusDot,
              isConnected
                ? styles.statusDotConnected
                : isReconnecting
                ? styles.statusDotReconnecting
                : styles.statusDotConnecting,
            ]}
          />
          <ShieldCheck size={14} color="#0C7AE0" strokeWidth={2.4} />
          <Text style={styles.secureText}>
            {isReconnecting
              ? 'Reconectando...'
              : isConnected
              ? 'Enlace Seguro E2EE'
              : 'Conectando...'}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Clock size={13} color="#0C7AE0" strokeWidth={2.2} />
          <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
        </View>
      </View>

      {/* 2. Main Stage Viewport (Videollamada or Audio Call stage) */}
      <View style={[styles.stageWrapper, isTablet && styles.tabletContent]}>
        {remoteVideoTrack ? (
          /* Video Stage ("el de videollamada") */
          <View style={styles.remoteVideoCard}>
            <VideoTrack
              trackRef={remoteVideoTrack}
              style={styles.remoteVideo}
              objectFit="cover"
            />

            {/* Remote Participant Floating Overlay Badge */}
            <View style={styles.remoteInfoOverlay}>
              <View style={styles.remoteOverlayLeft}>
                <View
                  style={[
                    styles.remoteSpeakingDot,
                    isRemoteSpeaking && styles.remoteSpeakingDotActive,
                  ]}
                />
                <Text style={styles.remoteOverlayName}>
                  {isChaplainRole ? 'Personal en Consulta' : 'Capellán de Guardia'}
                </Text>
              </View>

              <View style={styles.remoteOverlayBadge}>
                {isRemoteSpeaking ? (
                  <Volume2 size={13} color="#0C7AE0" strokeWidth={2.4} />
                ) : (
                  <Radio size={13} color="#64748B" />
                )}
                <Text style={styles.remoteOverlayBadgeText}>
                  {isRemoteSpeaking ? 'Hablando' : 'En vivo'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Audio Call Stage ("el de llamada") with White Card & Blue Accents */
          <View style={styles.audioStageCard}>
            <View style={styles.avatarStageWrapper}>
              {/* Pulsing Halo */}
              <Animated.View
                style={[
                  styles.speakingHalo,
                  {
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.45],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 0.6, 1],
                      outputRange: [0.4, 0.15, 0],
                    }),
                  },
                  !isRemoteSpeaking && { opacity: 0 },
                ]}
              />

              {/* Institutional Avatar Circle with Shaped Ring */}
              <View
                style={[
                  styles.avatarCircle,
                  isRemoteSpeaking && styles.avatarCircleSpeaking,
                ]}
              >
                <InstitutionalEmblem size={74} />
              </View>
            </View>

            <Text style={styles.chaplainTitle}>
              {isChaplainRole ? 'Personal en Consulta' : 'Capellán de Guardia'}
            </Text>

            <Text style={styles.chaplainBranchSubtitle}>
              {hasRemote
                ? isRemoteSpeaking
                  ? 'Transmitiendo audio pastoral...'
                  : 'Canal de audio en línea y reservado'
                : 'Aguardando que el capellán ingrese a la sala...'}
            </Text>

            {/* Voice Audio Waveform Micro-interaction */}
            <View style={styles.voiceWaveRow}>
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim1 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[styles.waveBar, styles.waveBarCenter, { transform: [{ scaleY: waveAnim3 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim4 }] }]} />
              <Animated.View style={[styles.waveBar, { transform: [{ scaleY: waveAnim5 }] }]} />
            </View>

            {/* Canonical Privacy Pill */}
            <View style={styles.secrecyPill}>
              <Lock size={12} color="#0C7AE0" strokeWidth={2.2} />
              <Text style={styles.secrecyPillText}>
                Secreto Pastoral e Inviolabilidad Ministerial
              </Text>
            </View>
          </View>
        )}

        {/* 3. Floating Picture-in-Picture (PiP) for Local Video */}
        {isCameraEnabled && localVideoTrack ? (
          <View style={styles.pipContainer}>
            <VideoTrack
              trackRef={localVideoTrack}
              mirror={facingMode === 'user'}
              style={styles.pipVideo}
              objectFit="cover"
            />
            <View style={styles.pipHeader}>
              <TouchableOpacity
                style={styles.pipFlipBtn}
                onPress={handleFlipCamera}
                activeOpacity={0.7}
              >
                <FlipHorizontal size={13} color="#FFFFFF" strokeWidth={2.2} />
              </TouchableOpacity>
              <View style={styles.pipBadge}>
                <Text style={styles.pipBadgeText}>Vos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.localAudioOnlyChip}>
            <View
              style={[
                styles.localMicStatusDot,
                { backgroundColor: isMicrophoneEnabled ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text style={styles.localAudioOnlyText}>
              Vos • {isMicrophoneEnabled ? 'Micrófono activo' : 'Silenciado'}
            </Text>
          </View>
        )}
      </View>

      {/* 4. Bottom Control Dock with Shaped Rounded Buttons */}
      <View style={[styles.dockWrapper, isTablet && styles.tabletContent]}>
        <View style={styles.dockContainer}>
          {/* Toggle Mic Button */}
          <TouchableOpacity
            style={[
              styles.dockBtn,
              !isMicrophoneEnabled && styles.dockBtnMuted,
            ]}
            onPress={handleToggleMic}
            activeOpacity={0.8}
          >
            {isMicrophoneEnabled ? (
              <Mic size={22} color="#0C7AE0" strokeWidth={2.2} />
            ) : (
              <MicOff size={22} color="#DC2626" strokeWidth={2.2} />
            )}
            <Text
              style={[
                styles.dockBtnLabel,
                !isMicrophoneEnabled && styles.dockBtnLabelMuted,
              ]}
            >
              {isMicrophoneEnabled ? 'Micrófono' : 'Silenciado'}
            </Text>
          </TouchableOpacity>

          {/* End Call Button with Shape & Glow -> Triggers Confirmation Modal */}
          <TouchableOpacity
            style={styles.dockEndBtn}
            onPress={() => setShowEndModal(true)}
            activeOpacity={0.85}
          >
            <PhoneOff size={26} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Toggle Camera Button */}
          <TouchableOpacity
            style={[
              styles.dockBtn,
              isCameraEnabled && styles.dockBtnCameraOn,
            ]}
            onPress={handleToggleCamera}
            activeOpacity={0.8}
          >
            {isCameraEnabled ? (
              <VideoIcon size={22} color="#0C7AE0" strokeWidth={2.2} />
            ) : (
              <VideoOff size={22} color="#94A3B8" strokeWidth={2.2} />
            )}
            <Text
              style={[
                styles.dockBtnLabel,
                isCameraEnabled && styles.dockBtnLabelCameraOn,
              ]}
            >
              {isCameraEnabled ? 'Cámara' : 'Sin cámara'}
            </Text>
          </TouchableOpacity>

          {/* Optional Quick Camera Flip */}
          {isCameraEnabled && (
            <TouchableOpacity
              style={styles.dockFlipBtn}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color="#0C7AE0" strokeWidth={2.2} />
              <Text style={styles.dockFlipLabel}>Rotar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5. End Call Confirmation Modal ("el de finalizar la llamada") */}
      <EndCallConfirmationModal
        visible={showEndModal}
        durationText={formatDuration(callDuration)}
        isEnding={isEnding}
        onCancel={() => setShowEndModal(false)}
        onConfirmEnd={handleExecuteEndCall}
      />
    </View>
  );
}

/**
 * Main CallRoomScreenPreview orchestrator
 */
export default function CallRoomScreenPreview({ onCallEnded }: CallRoomScreenPreviewProps) {
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
          console.warn('[CallRoomPreview] AudioSession start warning:', e);
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
      console.error('[CallRoomPreview] Initialization error:', err);
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
    console.warn('[CallRoomPreview] LiveKit Error:', err);
  }, []);

  const handleDisconnected = useCallback((reason?: any) => {
    console.log('[CallRoomPreview] LiveKit disconnected, reason:', reason);
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
        <ActivityIndicator size="large" color="#0C7AE0" />
        <Text style={styles.loadingTitle}>Estableciendo enlace pastoral...</Text>
        <Text style={styles.loadingSub}>
          Verificando túnel cifrado y conectando con el servicio de llamada
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
        <AlertTriangle size={48} color="#DC2626" />
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
          <AlertTriangle size={48} color="#DC2626" />
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
        initialVideo={false}
        onCallEnded={onCallEnded}
        isChaplainRole={isChaplainRole}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={ENV.LIVEKIT_WS_URL}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onError={handleLiveKitError}
      onDisconnected={handleDisconnected}
    >
      <ActiveCallContentPreview
        onCallEnded={onCallEnded}
        isEnding={isEnding}
        setIsEnding={handleUpdateIsEnding}
      />
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  lightContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    justifyContent: 'space-between',
  },
  tabletContent: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingTitle: {
    fontFamily: Theme.fonts.headlineBold,
    color: '#0F2438',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSub: {
    fontFamily: Theme.fonts.body,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C7AE0',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 10,
    marginTop: 8,
  },
  closeButtonText: {
    fontFamily: Theme.fonts.body,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  topBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 7,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotReconnecting: {
    backgroundColor: '#F59E0B',
  },
  statusDotConnecting: {
    backgroundColor: '#0C7AE0',
  },
  secureText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11.5,
    color: '#0F2438',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  timerText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12.5,
    color: '#0C7AE0',
    letterSpacing: 0.4,
  },
  stageWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  remoteVideoCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  remoteInfoOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remoteOverlayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  remoteSpeakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  remoteSpeakingDotActive: {
    backgroundColor: '#0C7AE0',
  },
  remoteOverlayName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  remoteOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  remoteOverlayBadgeText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  audioStageCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarStageWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  speakingHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#60A5FA',
  },
  avatarCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#EFF6FF',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarCircleSpeaking: {
    borderColor: '#0C7AE0',
    backgroundColor: '#E0F2FE',
  },
  chaplainTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 21,
    color: '#0F2438',
    marginBottom: 4,
  },
  chaplainBranchSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
  },
  voiceWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    marginBottom: 20,
  },
  waveBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#0C7AE0',
  },
  waveBarCenter: {
    height: 36,
    backgroundColor: '#0284C7',
  },
  secrecyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 7,
  },
  secrecyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  pipContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 108,
    height: 148,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#0F172A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pipVideo: {
    width: '100%',
    height: '100%',
  },
  pipHeader: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipFlipBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pipBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  localAudioOnlyChip: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 7,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  localMicStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  localAudioOnlyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  dockWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
    minWidth: 64,
  },
  dockBtnMuted: {
    backgroundColor: '#FEF2F2',
  },
  dockBtnCameraOn: {
    backgroundColor: '#EFF6FF',
  },
  dockBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  dockBtnLabelMuted: {
    color: '#DC2626',
  },
  dockBtnLabelCameraOn: {
    color: '#0C7AE0',
  },
  dockEndBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dockFlipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    gap: 4,
  },
  dockFlipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0C7AE0',
  },
});

const confirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletCard: {
    maxWidth: 440,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 19,
    color: '#0F2438',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
    marginBottom: 20,
  },
  durationText: {
    fontSize: 12,
    color: '#334155',
  },
  durationBold: {
    fontWeight: '800',
    color: '#0C7AE0',
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  cancelButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#475569',
  },
  endButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  endButtonText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
