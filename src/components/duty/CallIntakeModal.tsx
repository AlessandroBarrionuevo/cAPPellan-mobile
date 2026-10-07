import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Video,
  MessageSquare,
  ShieldCheck,
  X,
  HeartHandshake,
  Check,
} from 'lucide-react-native';
import type { CallIntake, IntakeReason, SessionType } from '../../types/api';

export interface CallIntakeModalProps {
  visible: boolean;
  sessionType: SessionType;
  onClose: () => void;
  onSubmit: (intake?: CallIntake) => void;
  isSubmitting?: boolean;
}

const MOOD_OPTIONS: { score: number; label: string; sub: string; color: string; bg: string }[] = [
  { score: 1, label: 'Tranquilo', sub: 'En calma', color: '#059669', bg: '#ECFDF5' },
  { score: 2, label: 'Inquieto', sub: 'Algo de tensión', color: '#0284C7', bg: '#F0F9FF' },
  { score: 3, label: 'Preocupado', sub: 'Carga mental o familiar', color: '#D97706', bg: '#FFFBEB' },
  { score: 4, label: 'Angustiado', sub: 'Presión / Estrés alto', color: '#EA580C', bg: '#FFF7ED' },
  { score: 5, label: 'Crítico', sub: 'Desborde o crisis', color: '#DC2626', bg: '#FEF2F2' },
];

const REASON_OPTIONS: { key: IntakeReason; label: string }[] = [
  { key: 'FAMILIAR', label: 'Familiar / Pareja' },
  { key: 'TRABAJO', label: 'Servicio / Operativo' },
  { key: 'ECONOMICO', label: 'Económico / Legal' },
  { key: 'FE', label: 'Espiritual / Fe' },
  { key: 'OTRO', label: 'Situación Personal' },
];

export default function CallIntakeModal({
  visible,
  sessionType,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CallIntakeModalProps) {
  const { width } = useWindowDimensions();
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [selectedReason, setSelectedReason] = useState<IntakeReason>('FAMILIAR');
  const [notes, setNotes] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  // Micro-interaction: Animated scale for selected mood button
  const scaleAnims = useRef<{ [key: number]: Animated.Value }>({
    1: new Animated.Value(1),
    2: new Animated.Value(1),
    3: new Animated.Value(1.06),
    4: new Animated.Value(1),
    5: new Animated.Value(1),
  }).current;

  const isVideo = sessionType === 'VIDEO';
  const isTablet = width > 500;

  const currentMoodObj = MOOD_OPTIONS.find((m) => m.score === selectedMood) || MOOD_OPTIONS[2];

  const handleSelectMood = (score: number) => {
    setSelectedMood(score);
    // Micro-interaction bounce
    if (scaleAnims[score]) {
      Animated.sequence([
        Animated.timing(scaleAnims[score], {
          toValue: 1.15,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[score], {
          toValue: 1.06,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // Reset others
    MOOD_OPTIONS.forEach((m) => {
      if (m.score !== score && scaleAnims[m.score]) {
        Animated.timing(scaleAnims[m.score], {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }).start();
      }
    });
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

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, isTablet && styles.tabletCard]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.typeBadge, isVideo ? styles.typeBadgeVideo : styles.typeBadgeChat]}>
                {isVideo ? (
                  <Video size={13} color="#059669" strokeWidth={2.2} />
                ) : (
                  <MessageSquare size={13} color="#0284C7" strokeWidth={2.2} />
                )}
                <Text style={[styles.typeBadgeText, isVideo ? styles.typeTextVideo : styles.typeTextChat]}>
                  {isVideo ? 'Videollamada de Guardia' : 'Canal Escrito Confidencial'}
                </Text>
              </View>
              <Text style={styles.modalTitle}>Orientación Pastoral Previa</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isSubmitting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            Esta breve guía le permite al capellán comprender tu necesidad y preparar una atención humana y precisa.
          </Text>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Mood Score: 1 to 5 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>¿CÓMO ESTÁ TU ÁNIMO EN ESTA GUARDIA?</Text>
                <Text style={[styles.moodActiveTag, { color: currentMoodObj.color }]}>
                  {currentMoodObj.score}/5 · {currentMoodObj.label}
                </Text>
              </View>

              {/* Number buttons 1-5 with Micro-interactions */}
              <View style={styles.moodNumbersRow}>
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = item.score === selectedMood;
                  const animScale = scaleAnims[item.score] || 1;

                  return (
                    <Animated.View
                      key={item.score}
                      style={[
                        styles.moodNumberWrapper,
                        { transform: [{ scale: animScale }] },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.moodNumberBtn,
                          isSelected
                            ? {
                                borderColor: item.color,
                                backgroundColor: item.bg,
                                borderWidth: 2,
                              }
                            : styles.moodNumberBtnDefault,
                        ]}
                        onPress={() => handleSelectMood(item.score)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.moodNumberText,
                            isSelected && { color: item.color, fontWeight: '800' },
                          ]}
                        >
                          {item.score}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Mood descriptive pill */}
              <View
                style={[
                  styles.moodLegendPill,
                  { borderColor: `${currentMoodObj.color}35`, backgroundColor: currentMoodObj.bg },
                ]}
              >
                <View style={[styles.moodDot, { backgroundColor: currentMoodObj.color }]} />
                <View style={styles.moodLegendTexts}>
                  <Text style={[styles.moodLegendTitle, { color: currentMoodObj.color }]}>
                    Nivel {currentMoodObj.score}: {currentMoodObj.label}
                  </Text>
                  <Text style={styles.moodLegendSub}>{currentMoodObj.sub}</Text>
                </View>
              </View>
            </View>

            {/* 2. Reason of Consultation */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>MOTIVO O ÁREA DE ACOMPAÑAMIENTO</Text>
              <View style={styles.reasonsGrid}>
                {REASON_OPTIONS.map((item) => {
                  const isSelected = item.key === selectedReason;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.reasonChip,
                        isSelected && styles.reasonChipSelected,
                      ]}
                      onPress={() => setSelectedReason(item.key)}
                      activeOpacity={0.75}
                    >
                      {isSelected && (
                        <Check size={12} color="#0F1E36" strokeWidth={2.8} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.reasonChipText,
                          isSelected && styles.reasonChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Notes (Optional) */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>BREVE MENSAJE O CONTEXTO (OPCIONAL)</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  isInputFocused && styles.notesInputFocused,
                ]}
                placeholder="Podés dejar una nota breve o inquietud específica..."
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

            {/* Confidentiality Reminder Badge */}
            <View style={styles.secrecyCard}>
              <ShieldCheck size={16} color="#059669" strokeWidth={2.2} />
              <Text style={styles.secrecyText}>
                Información protegida bajo Secreto Ministerial y Ética Pastoral Militar/Policial.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions with Rounded Buttons */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isVideo ? styles.submitBtnVideo : styles.submitBtnNavy,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleConfirmWithIntake}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              <HeartHandshake size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Conectando con guardia...' : 'Solicitar Asistencia Pastoral'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipIntake}
              disabled={isSubmitting}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.skipBtnText}>Omitir cuestionario y conectar directo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...globalStyles.shadowLg,
  },
  tabletCard: {
    maxWidth: 480,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  typeBadgeVideo: {
    backgroundColor: '#ECFDF5',
  },
  typeBadgeChat: {
    backgroundColor: '#F0F9FF',
  },
  typeBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9.5,
    letterSpacing: 0.5,
    fontFamily: Theme.fonts.headlineBold,
  },
  typeTextVideo: {
    color: '#059669',
  },
  typeTextChat: {
    color: '#0284C7',
  },
  modalTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 18,
    color: '#0F172A',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSub: {
    ...globalStyles.bodySm,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  formScroll: {
    marginBottom: 10,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: '#475569',
    letterSpacing: 0.5,
    fontFamily: Theme.fonts.headlineBold,
  },
  moodActiveTag: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  moodNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  moodNumberWrapper: {
    flex: 1,
    maxWidth: 58,
  },
  moodNumberBtn: {
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodNumberBtnDefault: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  moodNumberText: {
    fontSize: 18,
    fontFamily: Theme.fonts.headlineBold,
    color: '#334155',
  },
  moodLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  moodDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  moodLegendTexts: {
    flex: 1,
  },
  moodLegendTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
  },
  moodLegendSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonChipSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  reasonChipText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#475569',
  },
  reasonChipTextSelected: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#92400E',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    color: '#0F172A',
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    minHeight: 74,
    marginTop: 4,
  },
  notesInputFocused: {
    borderColor: Theme.colors.tacticalNavy,
    backgroundColor: '#FFFFFF',
  },
  secrecyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 2,
    marginBottom: 4,
  },
  secrecyText: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  footerActions: {
    gap: 8,
    marginTop: 6,
  },
  submitBtn: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...globalStyles.shadowSm,
  },
  submitBtnNavy: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  submitBtnVideo: {
    backgroundColor: '#059669',
  },
  submitBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  skipBtn: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
