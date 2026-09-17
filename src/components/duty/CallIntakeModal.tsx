import React, { useState } from 'react';
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
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  HeartHandshake,
  Video,
  MessageSquare,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react-native';
import type { CallIntake, IntakeReason, SessionType } from '../../types/api';

export interface CallIntakeModalProps {
  visible: boolean;
  sessionType: SessionType;
  onClose: () => void;
  onSubmit: (intake?: CallIntake) => void;
  isSubmitting?: boolean;
}

const MOOD_OPTIONS: { score: number; label: string; color: string }[] = [
  { score: 1, label: 'Tranquilo', color: '#10B981' },
  { score: 2, label: 'Inquieto', color: '#06B6D4' },
  { score: 3, label: 'Preocupado', color: '#F59E0B' },
  { score: 4, label: 'Angustiado / Enojado', color: '#F97316' },
  { score: 5, label: 'Muy angustiado / Muy enojado', color: '#EF4444' },
];

const REASON_OPTIONS: { key: IntakeReason; label: string }[] = [
  { key: 'FAMILIAR', label: 'Familiar' },
  { key: 'TRABAJO', label: 'Trabajo / Servicio' },
  { key: 'ECONOMICO', label: 'Económico' },
  { key: 'FE', label: 'Fe / Espiritual' },
  { key: 'OTRO', label: 'Otro' },
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

  const isVideo = sessionType === 'VIDEO';
  const isTablet = width > 500;

  const currentMoodObj = MOOD_OPTIONS.find((m) => m.score === selectedMood) || MOOD_OPTIONS[2];

  const handleConfirmWithIntake = () => {
    onSubmit({
      moodScore: selectedMood,
      reason: selectedReason,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  const handleSkipIntake = () => {
    // Sube la llamada sin contestar la encuesta (modo directo)
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
                  <Video size={14} color="#10B981" />
                ) : (
                  <MessageSquare size={14} color="#38BDF8" />
                )}
                <Text style={[styles.typeBadgeText, isVideo ? styles.typeTextVideo : styles.typeTextChat]}>
                  {isVideo ? 'Videollamada Pastoral' : 'Chat Confidencial'}
                </Text>
              </View>
              <Text style={styles.modalTitle}>Ficha de Triage Inicial</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={isSubmitting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            Completar esta breve orientación ayuda al capellán a prepararse para tu atención.
          </Text>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Mood Score: 1 to 5 */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>¿CÓMO TE SENTÍS EN ESTE MOMENTO?</Text>
                <Text style={[styles.moodActiveTag, { color: currentMoodObj.color }]}>
                  {currentMoodObj.score} · {currentMoodObj.label}
                </Text>
              </View>

              {/* Number buttons 1-5 */}
              <View style={styles.moodNumbersRow}>
                {MOOD_OPTIONS.map((item) => {
                  const isSelected = item.score === selectedMood;
                  return (
                    <TouchableOpacity
                      key={item.score}
                      style={[
                        styles.moodNumberBtn,
                        isSelected && {
                          borderColor: item.color,
                          backgroundColor: `${item.color}22`,
                        },
                      ]}
                      onPress={() => setSelectedMood(item.score)}
                      activeOpacity={0.7}
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
                  );
                })}
              </View>

              {/* Mood descriptive pill */}
              <View
                style={[
                  styles.moodLegendPill,
                  { borderColor: `${currentMoodObj.color}40`, backgroundColor: `${currentMoodObj.color}14` },
                ]}
              >
                <View style={[styles.moodDot, { backgroundColor: currentMoodObj.color }]} />
                <Text style={[styles.moodLegendText, { color: currentMoodObj.color }]}>
                  Nivel {currentMoodObj.score}: {currentMoodObj.label}
                </Text>
              </View>
            </View>

            {/* 2. Reason of Consultation */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>MOTIVO PRINCIPAL DE CONSULTA</Text>
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
                      activeOpacity={0.7}
                    >
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
              <Text style={styles.sectionLabel}>DETALLE O MENSAJE PREVIO (OPCIONAL)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Ej. Necesito hablar urgente, situación difícil..."
                placeholderTextColor="#64748B"
                value={notes}
                onChangeText={setNotes}
                maxLength={240}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Confidentiality Reminder */}
            <View style={styles.secrecyCard}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.secrecyText}>
                Esta información solo la ve el capellán asignado bajo Secreto Ministerial.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isVideo ? styles.submitBtnVideo : styles.submitBtnChat,
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleConfirmWithIntake}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <HeartHandshake size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Conectando...' : 'Solicitar Asistencia'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkipIntake}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.skipBtnText}>No contestar y llamar directo</Text>
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
    backgroundColor: 'rgba(10, 15, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#0F172A',
    borderRadius: Theme.roundness.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...globalStyles.shadowMd,
  },
  tabletCard: {
    maxWidth: 480,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeVideo: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeBadgeChat: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  typeBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  typeTextVideo: {
    color: '#6EE7B7',
  },
  typeTextChat: {
    color: '#7DD3FC',
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalSub: {
    ...globalStyles.bodySm,
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 14,
  },
  formScroll: {
    marginBottom: 12,
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
    color: '#CBD5E1',
    letterSpacing: 0.5,
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
  moodNumberBtn: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodNumberText: {
    fontSize: 18,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#E2E8F0',
  },
  moodLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moodLegendText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reasonChipSelected: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderColor: '#F59E0B',
  },
  reasonChipText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: '#CBD5E1',
  },
  reasonChipTextSelected: {
    color: '#FDE68A',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    minHeight: 72,
    marginTop: 6,
  },
  secrecyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginTop: 4,
  },
  secrecyText: {
    flex: 1,
    fontSize: 11,
    color: '#6EE7B7',
    lineHeight: 15,
  },
  footerActions: {
    gap: 8,
    marginTop: 4,
  },
  submitBtn: {
    minHeight: 46,
    borderRadius: Theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  submitBtnVideo: {
    backgroundColor: '#059669',
  },
  submitBtnChat: {
    backgroundColor: '#0284C7',
  },
  submitBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  skipBtn: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});
