import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Video,
  MessageSquare,
  ShieldAlert,
  X,
  Lock,
  Activity,
  FileText,
} from 'lucide-react-native';
import type { CallResponse, SessionType } from '../../types/api';

const MOOD_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'Tranquilo', color: '#10B981' },
  2: { label: 'Inquieto', color: '#06B6D4' },
  3: { label: 'Preocupado', color: '#F59E0B' },
  4: { label: 'Angustiado / Enojado', color: '#F97316' },
  5: { label: 'Muy angustiado / Muy enojado', color: '#EF4444' },
};

const REASON_MAP: Record<string, string> = {
  FAMILIAR: 'Familiar',
  TRABAJO: 'Trabajo / Servicio',
  ECONOMICO: 'Económico',
  FE: 'Fe / Espiritual',
  OTRO: 'Otro',
};

export interface IncomingSessionModalProps {
  visible: boolean;
  session: CallResponse | null;
  onAccept: (sessionType: SessionType) => void;
  onReject: () => void;
}

export default function IncomingSessionModal({
  visible,
  session,
  onAccept,
  onReject,
}: IncomingSessionModalProps) {
  const { width } = useWindowDimensions();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [secondsWaiting, setSecondsWaiting] = useState(1);

  useEffect(() => {
    if (visible) {
      setSecondsWaiting(1);
      const timer = setInterval(() => {
        setSecondsWaiting((s) => s + 1);
      }, 1000);

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();

      return () => {
        clearInterval(timer);
        loop.stop();
      };
    }
  }, [visible, pulseAnim]);

  if (!session) return null;

  const sessionType: SessionType = session.sessionType || 'CHAT';
  const isVideo = sessionType === 'VIDEO';
  const isTablet = width > 500;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, isTablet && styles.tabletContainer]}>
          {/* Top Alert Beacon */}
          <View style={styles.alertBar}>
            <View style={styles.beaconBadge}>
              <Animated.View
                style={[
                  styles.beaconDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.beaconText}>DESPACHO INMEDIATO · ENTRANTE</Text>
            </View>
            <Text style={styles.timerText}>{secondsWaiting}s en espera</Text>
          </View>

          {/* Icon & Title */}
          <View style={styles.centerSection}>
            <View style={[styles.iconCircle, isVideo ? styles.iconCircleVideo : styles.iconCircleChat]}>
              {isVideo ? (
                <Video size={28} color="#FFFFFF" />
              ) : (
                <MessageSquare size={28} color="#FFFFFF" />
              )}
            </View>

            <Text style={styles.title}>Consulta Reservada en Espera</Text>

            <View style={styles.sessionTypeBadge}>
              <Text style={styles.sessionTypeBadgeText}>
                Modalidad: {isVideo ? 'Videollamada Encriptada' : 'Chat Escrito 1:1'}
              </Text>
            </View>

            {/* Triage Preview */}
            {session.intake ? (
              <View style={styles.triageCard}>
                <View style={styles.triageHeader}>
                  <Activity size={13} color="#FBBF24" />
                  <Text style={styles.triageHeaderText}>TRIAGE PREVIO DEL CONSULTANTE</Text>
                </View>

                <View style={styles.triageBadgesRow}>
                  {session.intake.moodScore ? (
                    <View
                      style={[
                        styles.triageMoodBadge,
                        {
                          borderColor: MOOD_MAP[session.intake.moodScore]?.color || '#F59E0B',
                          backgroundColor: `${MOOD_MAP[session.intake.moodScore]?.color || '#F59E0B'}18`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.triageMoodDot,
                          { backgroundColor: MOOD_MAP[session.intake.moodScore]?.color || '#F59E0B' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.triageMoodText,
                          { color: MOOD_MAP[session.intake.moodScore]?.color || '#F59E0B' },
                        ]}
                      >
                        Ánimo: {session.intake.moodScore}/5 · {MOOD_MAP[session.intake.moodScore]?.label}
                      </Text>
                    </View>
                  ) : null}

                  {session.intake.reason ? (
                    <View style={styles.triageReasonBadge}>
                      <Text style={styles.triageReasonText}>
                        Motivo: {REASON_MAP[session.intake.reason] || session.intake.reason}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {session.intake.notes ? (
                  <View style={styles.triageNotesBox}>
                    <FileText size={12} color="#CBD5E1" />
                    <Text style={styles.triageNotesText} numberOfLines={3}>
                      "{session.intake.notes}"
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <Text style={styles.description}>
                Personal militar en servicio solicita contención pastoral inmediata. La sesión está protegida bajo el Secreto Ministerial Art. 34-B.
              </Text>
            )}
          </View>

          {/* Guarantee disclaimer */}
          <View style={styles.guaranteeBox}>
            <Lock size={14} color="#9A805B" />
            <Text style={styles.guaranteeBoxText}>
              Canal de comunicación cifrado de extremo a extremo
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.acceptBtn, isVideo ? styles.acceptBtnVideo : styles.acceptBtnChat]}
              onPress={() => onAccept(sessionType)}
              activeOpacity={0.88}
            >
              {isVideo ? (
                <Video size={20} color="#FFFFFF" />
              ) : (
                <MessageSquare size={20} color="#FFFFFF" />
              )}
              <Text style={styles.acceptBtnText}>
                {isVideo ? 'Aceptar y Conectar Videollamada' : 'Aceptar y Abrir Chat 1:1'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={onReject}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>Reasignar guardia / Postergar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: Theme.roundness.xl,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    ...globalStyles.shadowMd,
  },
  tabletContainer: {
    maxWidth: 460,
  },
  alertBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  beaconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  beaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FBBF24',
  },
  beaconText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconCircleVideo: {
    backgroundColor: '#059669',
  },
  iconCircleChat: {
    backgroundColor: '#2563EB',
  },
  title: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  sessionTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sessionTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDE68A',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Theme.roundness.sm,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guaranteeBoxText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  actionsContainer: {
    gap: 10,
  },
  acceptBtn: {
    minHeight: 48,
    borderRadius: Theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  acceptBtnVideo: {
    backgroundColor: '#059669',
  },
  acceptBtnChat: {
    backgroundColor: '#0284C7',
  },
  acceptBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  rejectBtn: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  triageCard: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginTop: 10,
    marginBottom: 8,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  triageHeaderText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  triageBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  triageMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  triageMoodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  triageMoodText: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
  },
  triageReasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  triageReasonText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  triageNotesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 4,
  },
  triageNotesText: {
    flex: 1,
    fontSize: 11,
    color: '#E2E8F0',
    fontStyle: 'italic',
    lineHeight: 15,
  },
});
