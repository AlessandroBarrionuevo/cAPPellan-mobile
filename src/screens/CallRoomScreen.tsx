import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
} from 'lucide-react-native';

interface CallRoomScreenProps {
  onCallEnded: () => void;
}

/**
 * Inner component active inside LiveKitRoom context
 */
function ActiveCallContent({
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

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pulse animation for active voice speaking in audio stage
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isRemoteSpeaking) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
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
      console.warn('[CallRoom] Error toggling microphone:', err);
    }
  }, [isMicrophoneEnabled, localParticipant]);

  const handleToggleCamera = useCallback(async () => {
    try {
      if (!isCameraEnabled) {
        const { camera } = await requestMediaPermissions(true);
        if (!camera) {
          Alert.alert(
            'Permiso Requerido',
            'Se necesita acceso a la cámara para transmitir video.'
          );
          return;
        }
      }
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.warn('[CallRoom] Error toggling camera:', err);
    }
  }, [isCameraEnabled, localParticipant]);

  const handleFlipCamera = useCallback(async () => {
    try {
      const nextFacing = facingMode === 'user' ? 'environment' : 'user';
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setCameraEnabled(true, { facingMode: nextFacing });
      setFacingMode(nextFacing);
    } catch (err) {
      console.warn('[CallRoom] Error flipping camera:', err);
    }
  }, [facingMode, localParticipant]);

  const handleEndCall = useCallback(async () => {
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

    // Only chaplain roles have authorization to terminate the session on backend during an active call.
    // Basic users/guests simply leave the room, leaving the session open for the chaplain to conclude.
    if (isChaplainRole && session?.sessionId) {
      try {
        await request(ENDPOINTS.CALL_END(session.sessionId), { method: 'POST' });
      } catch (err: any) {
        if (err?.status !== 409 && err?.status !== 403) {
          console.warn('[CallRoom] Backend session end returned:', err);
        }
      }
    }

    useCallStore.getState().setCallStatus('ENDED');
    onCallEnded();
  }, [isEnding, setIsEnding, room, session?.sessionId, isChaplainRole, onCallEnded]);

  const isConnected = connectionState === ConnectionState.Connected;
  const isReconnecting = connectionState === ConnectionState.Reconnecting;
  const isTablet = width > 500;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* 1. Tactical Top Bar: Security Badge & Elapsed Time */}
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
          <ShieldCheck size={14} color="#6EE7B7" />
          <Text style={styles.secureText}>
            {isReconnecting
              ? 'Reconectando...'
              : isConnected
              ? 'Enlace Seguro E2EE'
              : 'Conectando...'}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Clock size={13} color="#94A3B8" />
          <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
        </View>
      </View>

      {/* 2. Main Stage Viewport (Remote Video or Institutional Audio Focus) */}
      <View style={[styles.stageWrapper, isTablet && styles.tabletContent]}>
        {remoteVideoTrack ? (
          <View style={styles.remoteVideoCard}>
            <VideoTrack
              trackRef={remoteVideoTrack}
              style={styles.remoteVideo}
              objectFit="cover"
            />

            {/* Remote Participant Floating Overlay */}
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
                  <Volume2 size={13} color="#10B981" />
                ) : (
                  <Radio size={13} color="#94A3B8" />
                )}
                <Text style={styles.remoteOverlayBadgeText}>
                  {isRemoteSpeaking ? 'Hablando' : 'En vivo'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.audioStageCard}>
            {/* Animated Halo around Institutional Avatar */}
            <View style={styles.avatarStageWrapper}>
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
                      outputRange: [0.5, 0.2, 0],
                    }),
                  },
                  !isRemoteSpeaking && { opacity: 0 },
                ]}
              />

              <View
                style={[
                  styles.avatarCircle,
                  isRemoteSpeaking && styles.avatarCircleSpeaking,
                ]}
              >
                <InstitutionalEmblem size={70} />
              </View>
            </View>

            <Text style={styles.chaplainTitle}>
              {isChaplainRole ? 'Personal en Consulta' : 'Capellán de Guardia'}
            </Text>

            <Text style={styles.chaplainBranchSubtitle}>
              {hasRemote
                ? isRemoteSpeaking
                  ? 'Transmitiendo audio pastoral...'
                  : 'Canal de audio en línea'
                : 'Aguardando que el capellán se una a la sala...'}
            </Text>

            {/* Canonical Reassurance Pill */}
            <View style={styles.secrecyPill}>
              <Lock size={12} color="#94A3B8" />
              <Text style={styles.secrecyPillText}>
                Secreto Pastoral e Inviolabilidad Ministerial
              </Text>
            </View>
          </View>
        )}

        {/* 3. Floating Picture-in-Picture (PiP) Preview for Local Video */}
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
                <FlipHorizontal size={13} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.pipBadge}>
                <Text style={styles.pipBadgeText}>Vos</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.localAudioOnlyChip}>
            <Text style={styles.localAudioOnlyText}>
              Vos • {isMicrophoneEnabled ? 'Micrófono activo' : 'Silenciado'}
            </Text>
          </View>
        )}
      </View>

      {/* 4. Floating Tactical Bottom Control Dock */}
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
              <Mic size={22} color="#FFFFFF" />
            ) : (
              <MicOff size={22} color="#EF4444" />
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

          {/* End Call Button */}
          <TouchableOpacity
            style={[styles.dockEndBtn, isEnding && { opacity: 0.7 }]}
            onPress={handleEndCall}
            disabled={isEnding}
            activeOpacity={0.85}
          >
            {isEnding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <PhoneOff size={26} color="#FFFFFF" />
            )}
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
              <VideoIcon size={22} color="#38BDF8" />
            ) : (
              <VideoOff size={22} color="#94A3B8" />
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

          {/* Optional Quick Camera Flip if Camera is active */}
          {isCameraEnabled && (
            <TouchableOpacity
              style={styles.dockFlipBtn}
              onPress={handleFlipCamera}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color="#CBD5E1" />
              <Text style={styles.dockFlipLabel}>Rotar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Main CallRoomScreen orchestrator:
 * 1. Checks and requests Android media permissions at runtime
 * 2. Fetches/validates LiveKit JWT token
 * 3. Starts audio session
 * 4. Mounts LiveKitRoom
 */
export default function CallRoomScreen({ onCallEnded }: CallRoomScreenProps) {
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
      // 0. Verify WebRTC native module on mobile
      if (Platform.OS !== 'web') {
        const { NativeModules } = require('react-native');
        if (!NativeModules.WebRTCModule) {
          throw new Error(
            'El ejecutable en tu dispositivo no incluye el módulo nativo de WebRTC. ' +
            'Es necesario compilar un nuevo Development Build con EAS (`eas build -p android --profile development`) para activar las videollamadas.'
          );
        }
      }

      // 1. Explicitly request microphone & camera permissions BEFORE initiating WebRTC connection
      const perms = await requestMediaPermissions(true);
      if (!perms.microphone) {
        throw new Error('El permiso de micrófono es requerido para ingresar a la sala pastoral.');
      }

      // 2. Start audio session on native platforms
      if (Platform.OS !== 'web') {
        try {
          await AudioSession.startAudioSession();
        } catch (e) {
          console.warn('[CallRoom] AudioSession start warning:', e);
        }
      }

      // 3. Obtain LiveKit Token without binding to external store reference mutations
      const currentSession = useCallStore.getState().currentSession;
      const assignedCall = useChaplainStore.getState().assignedCall;
      const session = currentSession || assignedCall;

      if (session?.token) {
        setToken(session.token);
      } else if (session?.sessionId) {
        // Fallback: Reconnect to obtain a fresh token
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
      console.error('[CallRoom] Initialization error:', err);
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

  const handleLiveKitError = useCallback((err: Error) => {
    console.warn('[CallRoom] LiveKit Error:', err);
  }, []);

  const handleDisconnected = useCallback((reason?: any) => {
    console.log('[CallRoom] LiveKit disconnected, reason:', reason);
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
        <ActivityIndicator size="large" color="#6EE7B7" />
        <Text style={styles.loadingTitle}>Estableciendo enlace pastoral...</Text>
        <Text style={styles.loadingSub}>Verificando túnel cifrado y conectando con LiveKit</Text>
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
        <AlertTriangle size={48} color={Theme.colors.error} />
        <Text style={styles.loadingTitle}>Fallo de Enlace</Text>
        <Text style={styles.loadingSub}>{prepError || 'Token de acceso no disponible'}</Text>
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
    <LiveKitRoom
      serverUrl={ENV.LIVEKIT_WS_URL}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onError={handleLiveKitError}
      onDisconnected={handleDisconnected}
    >
      <ActiveCallContent
        onCallEnded={onCallEnded}
        isEnding={isEnding}
        setIsEnding={handleUpdateIsEnding}
      />
    </LiveKitRoom>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09111C',
    justifyContent: 'space-between',
  },
  tabletContent: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09111C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingTitle: {
    ...globalStyles.headlineMd,
    color: '#FFFFFF',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSub: {
    ...globalStyles.bodySm,
    color: '#94A3B8',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Theme.roundness.md,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  retryButtonText: {
    ...globalStyles.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 10,
    marginTop: 8,
  },
  closeButtonText: {
    ...globalStyles.bodySm,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.roundness.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotReconnecting: {
    backgroundColor: '#F59E0B',
  },
  statusDotConnecting: {
    backgroundColor: '#60A5FA',
  },
  secureText: {
    ...globalStyles.labelCaps,
    color: '#6EE7B7',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.roundness.full,
    gap: 6,
  },
  timerText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#F1F5F9',
    fontSize: 13,
  },
  stageWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  remoteInfoOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 31, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  remoteOverlayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remoteSpeakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  remoteSpeakingDotActive: {
    backgroundColor: '#10B981',
  },
  remoteOverlayName: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
  remoteOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
  },
  remoteOverlayBadgeText: {
    ...globalStyles.labelCaps,
    color: '#CBD5E1',
    fontSize: 9,
  },
  audioStageCard: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarStageWrapper: {
    position: 'relative',
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
    backgroundColor: '#10B981',
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...globalStyles.shadowSm,
  },
  avatarCircleSpeaking: {
    borderColor: '#10B981',
    borderWidth: 2.5,
  },
  chaplainTitle: {
    fontFamily: Theme.fonts.headline,
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  chaplainBranchSubtitle: {
    ...globalStyles.bodySm,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  secrecyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
  },
  secrecyPillText: {
    ...globalStyles.labelCaps,
    color: '#94A3B8',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  pipContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 104,
    height: 148,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: '#000000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pipBadgeText: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 8,
  },
  localAudioOnlyChip: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  localAudioOnlyText: {
    ...globalStyles.bodySm,
    color: '#E2E8F0',
    fontSize: 11,
  },
  dockWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 38,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...globalStyles.shadowSm,
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    paddingVertical: 4,
  },
  dockBtnMuted: {
    opacity: 0.9,
  },
  dockBtnCameraOn: {
    opacity: 1,
  },
  dockBtnLabel: {
    ...globalStyles.labelCaps,
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 4,
  },
  dockBtnLabelMuted: {
    color: '#EF4444',
  },
  dockBtnLabelCameraOn: {
    color: '#38BDF8',
  },
  dockEndBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  dockFlipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dockFlipLabel: {
    ...globalStyles.labelCaps,
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 4,
  },
});
