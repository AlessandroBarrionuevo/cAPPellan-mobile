import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Phone,
  Video,
  MessageSquare,
  X,
  Lock,
  Activity,
  FileText,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import type { CallResponse, SessionType } from '../../types/api';

const MOOD_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'En Calma', color: '#059669', bg: '#ECFDF5' },
  2: { label: 'Inquieto', color: '#0284C7', bg: '#F0F9FF' },
  3: { label: 'Preocupado', color: '#0C7AE0', bg: '#EFF6FF' },
  4: { label: 'Angustiado', color: '#EA580C', bg: '#FFF7ED' },
  5: { label: 'En Crisis', color: '#DC2626', bg: '#FEF2F2' },
};

const REASON_MAP: Record<string, string> = {
  FAMILIAR: 'Familiar / Pareja',
  TRABAJO: 'Servicio / Operativo',
  ECONOMICO: 'Económico / Legal',
  FE: 'Espiritual / Fe',
  OTRO: 'Situación Personal',
};

export interface IncomingSessionModalPreviewProps {
  visible: boolean;
  session: CallResponse | null;
  onAccept: (sessionType: SessionType) => void;
  onReject: () => void;
}

export default function IncomingSessionModalPreview({
  visible,
  session,
  onAccept,
  onReject,
}: IncomingSessionModalPreviewProps) {
  const { width } = useWindowDimensions();
  const [secondsWaiting, setSecondsWaiting] = useState(1);

  // Micro-interaction animations
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const enterScale = useRef(new Animated.Value(0.92)).current;
  const enterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSecondsWaiting(1);
      const timer = setInterval(() => {
        setSecondsWaiting((s) => s + 1);
      }, 1000);

      enterScale.setValue(0.92);
      enterOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(enterScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(enterOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const loop1 = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim1, {
            toValue: 1.35,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim1, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const loop2 = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim2, {
            toValue: 1.55,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ])
      );

      loop1.start();
      loop2.start();

      return () => {
        clearInterval(timer);
        loop1.stop();
        loop2.stop();
      };
    }
  }, [visible, pulseAnim1, pulseAnim2, enterScale, enterOpacity]);

  if (!session || !visible) return null;

  const sessionType: SessionType = session.sessionType || 'VIDEO';
  const isVideo = sessionType === 'VIDEO';
  const isTablet = width > 540;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            isTablet && styles.tabletContainer,
            {
              transform: [{ scale: enterScale }],
              opacity: enterOpacity,
            },
          ]}
        >
          {/* Top Urgent Alert Banner */}
          <View style={styles.alertHeader}>
            <View style={styles.beaconBadge}>
              <View style={styles.beaconDot} />
              <Text style={styles.beaconText}>SOLICITUD ENTRANTE DE GUARDIA</Text>
            </View>
            <View style={styles.timerBadge}>
              <Clock size={12} color="#0C7AE0" />
              <Text style={styles.timerText}>{secondsWaiting}s en espera</Text>
            </View>
          </View>

          {/* Central Call Radar & Avatar Section */}
          <View style={styles.centerSection}>
            <View style={styles.radarWrapper}>
              {/* Ripple Ring 2 */}
              <Animated.View
                style={[
                  styles.rippleRing2,
                  {
                    transform: [{ scale: pulseAnim2 }],
                    opacity: pulseAnim2.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [0.35, 0],
                    }),
                  },
                ]}
              />

              {/* Ripple Ring 1 */}
              <Animated.View
                style={[
                  styles.rippleRing1,
                  {
                    transform: [{ scale: pulseAnim1 }],
                    opacity: pulseAnim1.interpolate({
                      inputRange: [1, 1.35],
                      outputRange: [0.5, 0],
                    }),
                  },
                ]}
              />

              {/* Main Call Icon Shaped Circle */}
              <View
                style={[
                  styles.mainIconCircle,
                  isVideo ? styles.iconCircleVideo : styles.iconCircleVoice,
                ]}
              >
                {isVideo ? (
                  <Video size={32} color="#FFFFFF" strokeWidth={2.4} />
                ) : (
                  <Phone size={32} color="#FFFFFF" strokeWidth={2.4} />
                )}
              </View>
            </View>

            <Text style={styles.title}>Consulta de Guardia en Espera</Text>

            <View style={styles.modalityTag}>
              <Text style={styles.modalityTagText}>
                {isVideo ? 'Videollamada Pastoral Cifrada' : 'Llamada de Voz Directa'}
              </Text>
            </View>

            {/* Triage Preview Card */}
            {session.intake ? (
              <View style={styles.triageCard}>
                <View style={styles.triageHeader}>
                  <Activity size={14} color="#0C7AE0" strokeWidth={2.4} />
                  <Text style={styles.triageHeaderText}>TRIAGE PREVIO DEL CONSULTANTE</Text>
                </View>

                <View style={styles.triageBadgesRow}>
                  {session.intake.moodScore ? (
                    <View
                      style={[
                        styles.triageMoodBadge,
                        {
                          backgroundColor:
                            MOOD_MAP[session.intake.moodScore]?.bg || '#EFF6FF',
                          borderColor:
                            MOOD_MAP[session.intake.moodScore]?.color || '#0C7AE0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.triageMoodDot,
                          {
                            backgroundColor:
                              MOOD_MAP[session.intake.moodScore]?.color || '#0C7AE0',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.triageMoodText,
                          {
                            color:
                              MOOD_MAP[session.intake.moodScore]?.color || '#0C7AE0',
                          },
                        ]}
                      >
                        Ánimo {session.intake.moodScore}/5 ·{' '}
                        {MOOD_MAP[session.intake.moodScore]?.label}
                      </Text>
                    </View>
                  ) : null}

                  {session.intake.reason ? (
                    <View style={styles.triageReasonBadge}>
                      <Text style={styles.triageReasonText}>
                        {REASON_MAP[session.intake.reason] || session.intake.reason}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {session.intake.notes ? (
                  <View style={styles.notesBox}>
                    <FileText size={13} color="#64748B" />
                    <Text style={styles.notesText} numberOfLines={2}>
                      «{session.intake.notes}»
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Secrecy Assurance */}
            <View style={styles.secrecyPill}>
              <Lock size={12} color="#0C7AE0" strokeWidth={2.2} />
              <Text style={styles.secrecyPillText}>
                Enlace punto a punto bajo secreto pastoral inviolable
              </Text>
            </View>
          </View>

          {/* Shaped Action Buttons */}
          <View style={styles.actionsFooter}>
            <TouchableOpacity
              style={styles.acceptShapedButton}
              onPress={() => onAccept(sessionType)}
              activeOpacity={0.88}
            >
              {isVideo ? (
                <Video size={20} color="#FFFFFF" strokeWidth={2.4} />
              ) : (
                <Phone size={20} color="#FFFFFF" strokeWidth={2.4} />
              )}
              <Text style={styles.acceptButtonText}>
                {isVideo ? 'Atender Videollamada' : 'Atender Llamada'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectShapedButton}
              onPress={onReject}
              activeOpacity={0.8}
            >
              <X size={16} color="#DC2626" strokeWidth={2.2} />
              <Text style={styles.rejectButtonText}>Descartar o Derivar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 28,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabletContainer: {
    maxWidth: 480,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  beaconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  beaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0C7AE0',
  },
  beaconText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0C7AE0',
    letterSpacing: 0.6,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  radarWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rippleRing2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#93C5FD',
  },
  rippleRing1: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#60A5FA',
  },
  mainIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconCircleVideo: {
    backgroundColor: '#0C7AE0',
  },
  iconCircleVoice: {
    backgroundColor: '#0284C7',
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 20,
    color: '#0F2438',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalityTag: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  modalityTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  triageCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triageHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0C7AE0',
    letterSpacing: 0.6,
  },
  triageBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triageMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  triageMoodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  triageMoodText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  triageReasonBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  triageReasonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  secrecyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secrecyPillText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionsFooter: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 10,
  },
  acceptShapedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7AE0',
    borderRadius: 22,
    paddingVertical: 14,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  acceptButtonText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rejectShapedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  rejectButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#DC2626',
  },
});
