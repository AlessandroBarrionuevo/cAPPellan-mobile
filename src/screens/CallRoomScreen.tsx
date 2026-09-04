import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { useChaplainStore } from '../lib/stores/chaplain';
import { request } from '../lib/api/client';
import { ENV } from '../config/env';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react-native';

interface CallRoomScreenProps {
  onCallEnded: () => void;
}

export default function CallRoomScreen({ onCallEnded }: CallRoomScreenProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const currentSession = useCallStore((state) => state.currentSession);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const user = useAuthStore((state) => state.user);

  const session = currentSession || assignedCall;
  const isChaplainRole =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'SUPERUSER';

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    if (!session?.sessionId) {
      onCallEnded();
      return;
    }

    setIsEnding(true);
    try {
      if (isChaplainRole) {
        await request(ENDPOINTS.CALL_END(session.sessionId), { method: 'POST' });
      }
    } catch (err: any) {
      // 409 means already ended
      if (err?.status !== 409) {
        console.warn('Could not end session on backend', err);
      }
    } finally {
      setIsEnding(false);
      useCallStore.getState().setCallStatus('ENDED');
      onCallEnded();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Room Info & Timer */}
      <View style={styles.topBar}>
        <View style={styles.secureBadge}>
          <ShieldCheck size={16} color={Theme.colors.secondary} />
          <Text style={styles.secureText}>Llamada Segura y Privada</Text>
        </View>
        <Text style={styles.timerText}>{formatDuration(callDuration)}</Text>
      </View>

      {/* Main Video/Avatar View (1:1 Layout) */}
      <View style={styles.mediaContainer}>
        {/* Remote Participant View */}
        <View style={styles.participantCard}>
          <View style={styles.avatarPlaceholder}>
            <UserIcon size={56} color={Theme.colors.primary} />
          </View>
          <Text style={styles.participantName}>
            {isChaplainRole ? 'Usuario en consulta' : 'Capellán de Guardia'}
          </Text>
          <Text style={styles.participantStatus}>Audio Conectado</Text>
        </View>

        {/* Local Participant Preview Pill */}
        <View style={styles.localPreviewPill}>
          <Text style={styles.localPreviewText}>
            Vos ({user?.username || 'Usuario'}) • {isMicOn ? 'Mic Activo' : 'Silenciado'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls Bar */}
      <View style={styles.controlsBar}>
        {/* Toggle Mic */}
        <TouchableOpacity
          style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
          onPress={() => setIsMicOn(!isMicOn)}
          activeOpacity={0.8}
        >
          {isMicOn ? (
            <Mic size={24} color={Theme.colors.primary} />
          ) : (
            <MicOff size={24} color={Theme.colors.error} />
          )}
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.endCallButton, isEnding && { opacity: 0.7 }]}
          onPress={handleEndCall}
          disabled={isEnding}
          activeOpacity={0.85}
        >
          {isEnding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <PhoneOff size={28} color="#FFF" />
          )}
        </TouchableOpacity>

        {/* Toggle Camera */}
        <TouchableOpacity
          style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
          onPress={() => setIsCameraOn(!isCameraOn)}
          activeOpacity={0.8}
        >
          {isCameraOn ? (
            <VideoIcon size={24} color={Theme.colors.primary} />
          ) : (
            <VideoOff size={24} color={Theme.colors.outline} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1A28', // Dark serene ambiance for call screen
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 106, 99, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
    gap: 6,
  },
  secureText: {
    ...globalStyles.bodySm,
    color: '#79F7EA',
    fontSize: 12,
  },
  timerText: {
    ...globalStyles.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  mediaContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  participantCard: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.roundness.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E4EEF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  participantName: {
    ...globalStyles.headlineMd,
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 4,
  },
  participantStatus: {
    ...globalStyles.bodySm,
    color: '#A9C6E8',
  },
  localPreviewPill: {
    position: 'absolute',
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  localPreviewText: {
    ...globalStyles.bodySm,
    color: '#FFFFFF',
    fontSize: 12,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 28,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonOff: {
    backgroundColor: '#2A3644',
  },
  endCallButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
