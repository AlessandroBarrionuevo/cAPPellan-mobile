/**
 * Cloudflare Calls Fullscreen Room Component
 * Standalone, decoupled implementation adhering to CapellanAPP tactical design.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
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
import { Theme, globalStyles } from '../../../theme/Theme';
import { useAppInsets } from '../../../lib/safeArea';
import { InstitutionalEmblem } from '../../../components/common';
import { CloudflareVideoView } from './CloudflareVideoView';
import { useCloudflareRoom } from '../hooks/useCloudflareRoom';
import type { CloudflareCallsConfig } from '../types';

export interface CloudflareCallRoomProps {
  config: CloudflareCallsConfig;
  initialVideo?: boolean;
  onCallEnded: () => void;
  isChaplainRole?: boolean;
}

export const CloudflareCallRoom: React.FC<CloudflareCallRoomProps> = ({
  config,
  initialVideo = false,
  onCallEnded,
  isChaplainRole = false,
}) => {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 500;
  const [isEnding, setIsEnding] = useState(false);

  const {
    connectionState,
    localStream,
    remoteStream,
    hasRemoteVideo,
    hasLocalVideo,
    isMicrophoneEnabled,
    isCameraEnabled,
    facingMode,
    isRemoteSpeaking,
    callDuration,
    error,
    toggleMicrophone,
    toggleCamera,
    flipCamera,
    endCall,
  } = useCloudflareRoom({
    config,
    initialVideo,
    onCallEnded: () => {
      onCallEnded();
    },
  });

  // Pulse animation for pastoral audio avatar halo
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

  const handleEndCall = () => {
    if (isEnding) return;
    setIsEnding(true);
    endCall();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';
  const isConnecting = connectionState === 'connecting' || connectionState === 'idle';

  if (error) {
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
        <Text style={styles.loadingTitle}>Fallo de Enlace Cloudflare</Text>
        <Text style={styles.loadingSub}>{error}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCallEnded}>
          <Text style={styles.closeButtonText}>Volver al panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              ? 'Enlace Seguro (Cloudflare Calls)'
              : 'Conectando a SFU...'}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Clock size={13} color="#94A3B8" />
          <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
        </View>
      </View>

      {/* 2. Main Stage Viewport (Remote Video or Pastoral Audio Focus) */}
      <View style={[styles.stageWrapper, isTablet && styles.tabletContent]}>
        {hasRemoteVideo ? (
          <View style={styles.remoteVideoCard}>
            <CloudflareVideoView
              stream={remoteStream}
              objectFit="cover"
              zOrder={0}
              style={styles.remoteVideo}
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
              {isConnecting
                ? 'Conectando con el túnel Anycast de Cloudflare...'
                : isRemoteSpeaking
                ? 'Transmitiendo audio pastoral...'
                : 'Canal de audio en línea'}
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
        {hasLocalVideo ? (
          <View style={styles.pipContainer}>
            <CloudflareVideoView
              stream={localStream}
              mirror={facingMode === 'user'}
              zOrder={1}
              style={styles.pipVideo}
            />
            <View style={styles.pipHeader}>
              <TouchableOpacity
                style={styles.pipFlipBtn}
                onPress={flipCamera}
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
            onPress={toggleMicrophone}
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
            onPress={toggleCamera}
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
              onPress={flipCamera}
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
};

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
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginTop: 12,
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.2)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotReconnecting: {
    backgroundColor: '#F59E0B',
  },
  statusDotConnecting: {
    backgroundColor: '#38BDF8',
  },
  secureText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  stageWrapper: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    position: 'relative',
    justifyContent: 'center',
  },
  remoteVideoCard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteInfoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: '#64748B',
  },
  remoteSpeakingDotActive: {
    backgroundColor: '#10B981',
  },
  remoteOverlayName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  remoteOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  remoteOverlayBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  audioStageCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avatarStageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  speakingHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(110, 231, 183, 0.35)',
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(110, 231, 183, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleSpeaking: {
    borderColor: '#6EE7B7',
  },
  chaplainTitle: {
    ...globalStyles.headlineMd,
    color: '#FFFFFF',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  chaplainBranchSubtitle: {
    ...globalStyles.bodySm,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
  },
  secrecyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  secrecyPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  pipContainer: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
    elevation: 8,
  },
  pipVideo: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 5,
    borderRadius: 12,
  },
  pipBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  localAudioOnlyChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 20,
  },
  localAudioOnlyText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  dockWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  dockBtnMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dockBtnCameraOn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  dockBtnLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  dockBtnLabelMuted: {
    color: '#EF4444',
  },
  dockBtnLabelCameraOn: {
    color: '#38BDF8',
  },
  dockEndBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  dockFlipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dockFlipLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
});
