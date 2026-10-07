import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import Svg, { Path } from 'react-native-svg';
import {
  Phone,
  Video,
  MessageSquare,
  ShieldCheck,
  X,
  HeartHandshake,
  Check,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import type { CallIntake, IntakeReason, SessionType } from '../../types/api';

export type ExtendedSessionType = SessionType | 'AUDIO' | 'VOICE';

export interface CallIntakeModalPreviewProps {
  visible: boolean;
  sessionType?: ExtendedSessionType;
  onClose: () => void;
  onSubmit: (intake?: CallIntake) => void;
  isSubmitting?: boolean;
}

interface MoodOption {
  score: number;
  label: string;
  sub: string;
  color: string;
  bg: string;
  activeBorder: string;
  IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    score: 1,
    label: 'En Calma',
    sub: 'Tranquilo y enfocado',
    color: '#059669',
    bg: '#ECFDF5',
    activeBorder: '#10B981',
    IconComponent: Smile,
  },
  {
    score: 2,
    label: 'Inquieto',
    sub: 'Tensión leve o dudas',
    color: '#0284C7',
    bg: '#F0F9FF',
    activeBorder: '#0284C7',
    IconComponent: Smile,
  },
  {
    score: 3,
    label: 'Preocupado',
    sub: 'Carga mental o familiar',
    color: '#0C7AE0',
    bg: '#EFF6FF',
    activeBorder: '#0C7AE0',
    IconComponent: Meh,
  },
  {
    score: 4,
    label: 'Angustiado',
    sub: 'Presión o estrés alto',
    color: '#EA580C',
    bg: '#FFF7ED',
    activeBorder: '#F97316',
    IconComponent: Frown,
  },
  {
    score: 5,
    label: 'En Crisis',
    sub: 'Desborde o urgencia',
    color: '#DC2626',
    bg: '#FEF2F2',
    activeBorder: '#EF4444',
    IconComponent: AlertCircle,
  },
];

const REASON_OPTIONS: { key: IntakeReason; label: string; desc: string }[] = [
  { key: 'FAMILIAR', label: 'Familiar / Pareja', desc: 'Vínculos, hogar, crianza' },
  { key: 'TRABAJO', label: 'Servicio / Operativo', desc: 'Tensión de guardia o misión' },
  { key: 'ECONOMICO', label: 'Económico / Legal', desc: 'Previsión y orden personal' },
  { key: 'FE', label: 'Espiritual / Fe', desc: 'Oración, discernimiento y paz' },
  { key: 'OTRO', label: 'Situación Personal', desc: 'Consulta abierta y reservada' },
];

export default function CallIntakeModalPreview({
  visible,
  sessionType = 'VIDEO',
  onClose,
  onSubmit,
  isSubmitting = false,
}: CallIntakeModalPreviewProps) {
  const { width, height } = useWindowDimensions();
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [selectedReason, setSelectedReason] = useState<IntakeReason>('FAMILIAR');
  const [notes, setNotes] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  // Micro-interaction anims
  const modalScale = useRef(new Animated.Value(0.94)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const buttonPressScale = useRef(new Animated.Value(1)).current;

  const scaleAnims = useRef<{ [key: number]: Animated.Value }>({
    1: new Animated.Value(1),
    2: new Animated.Value(1),
    3: new Animated.Value(1.05),
    4: new Animated.Value(1),
    5: new Animated.Value(1),
  }).current;

  const isVideo = sessionType === 'VIDEO';
  const isAudio = sessionType === 'AUDIO' || sessionType === 'VOICE';
  const isChat = sessionType === 'CHAT';
  const isTablet = width > 540;
  const isShortScreen = height < 700;

  useEffect(() => {
    if (visible) {
      modalScale.setValue(0.94);
      modalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalScale, modalOpacity]);

  const currentMoodObj = MOOD_OPTIONS.find((m) => m.score === selectedMood) || MOOD_OPTIONS[2];

  const handleSelectMood = (score: number) => {
    setSelectedMood(score);

    // Spring micro-interaction for active score
    if (scaleAnims[score]) {
      Animated.sequence([
        Animated.timing(scaleAnims[score], {
          toValue: 1.14,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[score], {
          toValue: 1.05,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Reset remaining options
    MOOD_OPTIONS.forEach((m) => {
      if (m.score !== score && scaleAnims[m.score]) {
        Animated.timing(scaleAnims[m.score], {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handlePressInBtn = () => {
    Animated.spring(buttonPressScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutBtn = () => {
    Animated.spring(buttonPressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmWithIntake = () => {
    onSubmit({
      moodScore: selectedMood,
      reason: selectedReason,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  const handleSkipIntake = () => {
    onSubmit(undefined);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.backdropOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.modalWrapper,
            isTablet && styles.tabletWrapper,
            {
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          {/* Header Card */}
          <View style={styles.headerContainer}>
            <View style={styles.headerInfoCol}>
              {/* Service Modality Pill */}
              <View
                style={[
                  styles.modalityBadge,
                  isVideo
                    ? styles.modalityBadgeVideo
                    : isAudio
                    ? styles.modalityBadgeAudio
                    : styles.modalityBadgeChat,
                ]}
              >
                {isVideo ? (
                  <Video size={14} color="#0C7AE0" strokeWidth={2.4} />
                ) : isAudio ? (
                  <Phone size={14} color="#0C7AE0" strokeWidth={2.4} />
                ) : (
                  <MessageSquare size={14} color="#0C7AE0" strokeWidth={2.4} />
                )}
                <Text style={styles.modalityBadgeText}>
                  {isVideo
                    ? 'Videollamada de Guardia'
                    : isAudio
                    ? 'Llamada de Voz Pastoral'
                    : 'Chat Escrito Reservado'}
                </Text>
              </View>

              <Text style={styles.modalHeading}>Orientación Pastoral Previa</Text>
              <Text style={styles.modalSubheading}>
                Completá este breve formulario para conectar con la asistencia indicada.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeRoundButton}
              onPress={onClose}
              disabled={isSubmitting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Form Scroll Body */}
          <ScrollView
            style={[styles.scrollableForm, isShortScreen && styles.scrollShortScreen]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContentContainer}
          >
            {/* 1. Mood Level (1 to 5) with Micro-interactions */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleWithDot}>
                  <View style={styles.blueDot} />
                  <Text style={styles.sectionTitleText}>ESTADO DE ÁNIMO</Text>
                </View>
                <View style={[styles.activeMoodTag, { backgroundColor: currentMoodObj.bg }]}>
                  <Text style={[styles.activeMoodTagText, { color: currentMoodObj.color }]}>
                    Nivel {currentMoodObj.score}/5
                  </Text>
                </View>
              </View>

              {/* Number Buttons 1 to 5 */}
              <View style={styles.moodSelectorGrid}>
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = item.score === selectedMood;
                  const animScale = scaleAnims[item.score] || 1;
                  const Icon = item.IconComponent;

                  return (
                    <Animated.View
                      key={item.score}
                      style={[
                        styles.moodNumberCol,
                        { transform: [{ scale: animScale }] },
                      ]}
                    >
                      <Pressable
                        style={[
                          styles.moodSquareButton,
                          isSelected
                            ? {
                                backgroundColor: item.bg,
                                borderColor: item.activeBorder,
                                borderWidth: 2,
                                shadowColor: item.color,
                                shadowOpacity: 0.18,
                                shadowRadius: 6,
                                elevation: 3,
                              }
                            : styles.moodSquareButtonDefault,
                        ]}
                        onPress={() => handleSelectMood(item.score)}
                      >
                        {/* <Icon
                          size={18}
                          color={isSelected ? item.color : '#94A3B8'}
                          strokeWidth={isSelected ? 2.5 : 2}
                        /> */}
                        <Text
                          style={[
                            styles.moodNumberDigit,
                            isSelected && { color: item.color, fontWeight: '800' },
                          ]}
                        >
                          {item.score}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Active Mood Pill Banner */}
              <View
                style={[
                  styles.moodStatusBanner,
                  { backgroundColor: currentMoodObj.bg, borderColor: `${currentMoodObj.color}25` },
                ]}
              >
                <View style={[styles.moodStatusIndicator, { backgroundColor: currentMoodObj.color }]} />
                <View style={styles.moodStatusTextCol}>
                  <Text style={[styles.moodStatusTitle, { color: currentMoodObj.color }]}>
                    {currentMoodObj.label}
                  </Text>
                  <Text style={styles.moodStatusSubtitle}>{currentMoodObj.sub}</Text>
                </View>
              </View>
            </View>

            {/* 2. Reason of Consultation */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleWithDot}>
                <View style={styles.blueDot} />
                <Text style={styles.sectionTitleText}>MOTIVO O ÁREA DE ACOMPAÑAMIENTO</Text>
              </View>

              <View style={styles.reasonChipsContainer}>
                {REASON_OPTIONS.map((item) => {
                  const isSelected = item.key === selectedReason;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.reasonPill,
                        isSelected && styles.reasonPillActive,
                      ]}
                      onPress={() => setSelectedReason(item.key)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.reasonCheckCircle,
                          isSelected && styles.reasonCheckCircleActive,
                        ]}
                      >
                        {isSelected ? (
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <View style={styles.reasonUncheckedDot} />
                        )}
                      </View>
                      <View style={styles.reasonTextCol}>
                        <Text
                          style={[
                            styles.reasonPillLabel,
                            isSelected && styles.reasonPillLabelActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.reasonPillSub,
                            isSelected && styles.reasonPillSubActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Notes (Optional) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleWithDot}>
                  <View style={styles.blueDot} />
                  <Text style={styles.sectionTitleText}>DETALLE O INQUIETUD (OPCIONAL)</Text>
                </View>
                <Text style={styles.charCountText}>{notes.length}/240</Text>
              </View>

              <TextInput
                style={[
                  styles.shapedTextInput,
                  isInputFocused && styles.shapedTextInputFocused,
                ]}
                placeholder="Si querés, podés anticipar brevemente tu inquietud..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                maxLength={240}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </View>

            {/* Confidentiality Guarantee Card */}
            <View style={styles.confidentialCard}>
              <View style={styles.shieldIconWrapper}>
                <ShieldCheck size={18} color="#0C7AE0" strokeWidth={2.4} />
              </View>
              <View style={styles.confidentialTextCol}>
                <Text style={styles.confidentialTitle}>SECRETO MINISTERIAL Y PASTORAL</Text>
                <Text style={styles.confidentialBody}>
                  La información ingresada es confidencial, inviolable y protegida bajo secreto de confesión y contención.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Shaped Action Buttons Footer */}
          <View style={styles.footerContainer}>
            <Animated.View style={{ transform: [{ scale: buttonPressScale }] }}>
              <TouchableOpacity
                style={[
                  styles.pillContainer,
                  isSubmitting && styles.pillContainerDisabled,
                ]}
                onPress={handleConfirmWithIntake}
                onPressIn={handlePressInBtn}
                onPressOut={handlePressOutBtn}
                disabled={isSubmitting}
                activeOpacity={0.82}
              >
                {/* Left Icon Badge with Outer Arc & Elevated White Circle */}
                <View style={styles.badgeWrapper}>
                  <Svg width={54} height={54} viewBox="0 0 54 54" style={styles.arcSvg}>
                    <Path
                      d="M 27 3 A 24 24 0 0 0 27 51"
                      stroke="#0C7AE0"
                      strokeWidth={3}
                      fill="none"
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View style={styles.whiteDisc}>
                    <View style={styles.innerBlueCircle}>
                      {isVideo ? (
                        <Video size={16} color="#FFFFFF" strokeWidth={2.4} />
                      ) : isAudio ? (
                        <Phone size={16} color="#FFFFFF" strokeWidth={2.4} />
                      ) : (
                        <HeartHandshake size={16} color="#FFFFFF" strokeWidth={2.4} />
                      )}
                    </View>
                  </View>
                </View>

                {/* Pill Capsule Body */}
                <View style={styles.pillBody}>
                  <View style={styles.pillTextContent}>
                    <View style={styles.pillTitleRow}>
                      <Text style={styles.pillTitleText} numberOfLines={1}>
                        {isSubmitting
                          ? 'Conectando con guardia...'
                          : isVideo
                          ? 'Iniciar Llamada'
                          : isAudio
                          ? 'Llamar'
                          : 'Solicitar Asistencia'}
                      </Text>
                    </View>
                    
                  </View>

                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipRoundedButton}
              onPress={handleSkipIntake}
              disabled={isSubmitting}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
            >
              <Text style={styles.skipRoundedText}>Omitir cuestionario e ingresar directo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  modalWrapper: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0c7ae0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletWrapper: {
    maxWidth: 500,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerInfoCol: {
    flex: 1,
    paddingRight: 10,
  },
  modalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  modalityBadgeVideo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  modalityBadgeAudio: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  modalityBadgeChat: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  modalityBadgeText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#0C7AE0',
    letterSpacing: 0.3,
  },
  modalHeading: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 19,
    lineHeight: 25,
    color: '#0F2438',
  },
  modalSubheading: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 3,
  },
  closeRoundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollableForm: {
    paddingHorizontal: 20,
  },
  scrollShortScreen: {
    maxHeight: 380,
  },
  scrollContentContainer: {
    paddingVertical: 16,
    gap: 16,
  },
  sectionCard: {
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  blueDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0C7AE0',
  },
  sectionTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#334155',
    letterSpacing: 0.6,
  },
  activeMoodTag: {
    paddingHorizontal: 9,
    borderRadius: 12,
    marginBottom: 10,
  },
  activeMoodTagText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
  },
  moodSelectorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  moodNumberCol: {
    flex: 1,
  },
  moodSquareButton: {
    flexDirection: 'row',
    aspectRatio: 0.95,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodSquareButtonDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  moodNumberDigit: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 16,
    color: '#475569',
  },
  moodStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  moodStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  moodStatusTextCol: {
    flex: 1,
  },
  moodStatusTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
  },
  moodStatusSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
  },
  reasonChipsContainer: {
    gap: 8,
  },
  reasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reasonPillActive: {
    borderColor: '#0C7AE0',
    backgroundColor: '#EFF6FF',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  reasonCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  reasonCheckCircleActive: {
    backgroundColor: '#0C7AE0',
    borderColor: '#0C7AE0',
  },
  reasonUncheckedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  reasonTextCol: {
    flex: 1,
  },
  reasonPillLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#1E293B',
  },
  reasonPillLabelActive: {
    color: '#0C7AE0',
    fontFamily: Theme.fonts.headlineBold,
  },
  reasonPillSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  reasonPillSubActive: {
    color: '#3B82F6',
  },
  charCountText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#94A3B8',
  },
  shapedTextInput: {
    fontFamily: Theme.fonts.body,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 74,
  },
  shapedTextInputFocused: {
    borderColor: '#0C7AE0',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  confidentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  shieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidentialTextCol: {
    flex: 1,
  },
  confidentialTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  confidentialBody: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
    marginTop: 2,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  pillContainerDisabled: {
    opacity: 0.7,
  },
  badgeWrapper: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: -16,
  },
  arcSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  whiteDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  innerBlueCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0C7AE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBody: {
    flex: 1,
    height: 50,
    backgroundColor: '#0C7AE0',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pillTextContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  pillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  pillTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  pillTagText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  pillDescText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#E0F2FE',
    lineHeight: 16,
  },
  skipRoundedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  skipRoundedText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13.5,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
