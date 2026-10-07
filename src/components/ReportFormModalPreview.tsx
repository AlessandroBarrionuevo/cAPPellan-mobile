import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import {
  ClipboardList,
  ShieldCheck,
  X,
  Lock,
  Check,
  AlertTriangle,
} from 'lucide-react-native';

export interface ReportFormModalPreviewProps {
  visible: boolean;
  sessionId: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORIES = [
  { key: 'SPIRITUAL_COUNSELING', label: 'Consejería Espiritual' },
  { key: 'EMOTIONAL_CRISIS', label: 'Crisis Emocional' },
  { key: 'PRAYER_REQUEST', label: 'Petición de Oración' },
  { key: 'OTHER', label: 'Otro' },
] as const;

type CategoryType = (typeof CATEGORIES)[number]['key'];

const SEVERITY_COLORS: Record<number, { color: string; bg: string; label: string }> = {
  1: { color: '#059669', bg: '#ECFDF5', label: '1 - Leve' },
  2: { color: '#0C7AE0', bg: '#EFF6FF', label: '2 - Moderado' },
  3: { color: '#D97706', bg: '#FFFBEB', label: '3 - Alerta' },
  4: { color: '#EA580C', bg: '#FFF7ED', label: '4 - Urgente' },
  5: { color: '#DC2626', bg: '#FEF2F2', label: '5 - Crítico' },
};

export default function ReportFormModalPreview({
  visible,
  sessionId,
  onClose,
  onSubmitted,
}: ReportFormModalPreviewProps) {
  const { width } = useWindowDimensions();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<CategoryType>('SPIRITUAL_COUNSELING');
  const [severity, setSeverity] = useState(3);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTablet = width > 520;
  const modalScale = useRef(new Animated.Value(0.93)).current;

  useEffect(() => {
    if (visible) {
      modalScale.setValue(0.93);
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, modalScale]);

  const handleSubmit = async () => {
    if (!sessionId) return;
    if (!subject.trim() || !summary.trim()) {
      setError('Por favor completá el asunto y resumen');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await request(ENDPOINTS.CALL_REPORT(sessionId), {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          severity,
          summary: summary.trim(),
        }),
      });

      onSubmitted();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el informe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.modalCard,
            isTablet && styles.tabletCard,
            { transform: [{ scale: modalScale }] },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <ClipboardList size={20} color="#0C7AE0" strokeWidth={2.4} />
              </View>
              <View>
                <Text style={styles.titleText}>Informe de Atención</Text>
                <Text style={styles.subtitleText}>Expediente #{sessionId || 'General'}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#64748B" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {error && (
              <View style={styles.errorBanner}>
                <AlertTriangle size={14} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Asunto */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>ASUNTO DE LA CONSULTA *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Acompañamiento en duelo o estrés"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Categoría */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CATEGORÍA PASTORAL</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryPill,
                        isSelected && styles.categoryPillActive,
                      ]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={12} color="#0C7AE0" strokeWidth={2.8} />}
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSelected && styles.categoryPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gravedad (1 a 5) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>NIVEL DE GRAVEDAD</Text>
                <Text
                  style={[
                    styles.severityLabel,
                    { color: SEVERITY_COLORS[severity]?.color || '#0C7AE0' },
                  ]}
                >
                  {SEVERITY_COLORS[severity]?.label}
                </Text>
              </View>

              <View style={styles.severityRow}>
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const isSelected = severity === lvl;
                  const itemColor = SEVERITY_COLORS[lvl]?.color || '#0C7AE0';
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.severityItem,
                        isSelected && {
                          backgroundColor: SEVERITY_COLORS[lvl]?.bg || '#EFF6FF',
                          borderColor: itemColor,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSeverity(lvl)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.severityItemText,
                          isSelected && { color: itemColor, fontWeight: '800' },
                        ]}
                      >
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Resumen */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>RESUMEN DE LA SESIÓN *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalles confidenciales de la conversación y acuerdos pastorales..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={summary}
                onChangeText={setSummary}
                textAlignVertical="top"
              />
            </View>

            {/* Canonical Note */}
            <View style={styles.noteBox}>
              <Lock size={12} color="#0C7AE0" />
              <Text style={styles.noteText}>Información protegida bajo sigilo sacramental y ética militar.</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.submitButtonText}>Guardar Informe</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    width: '100%',
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletCard: {
    maxWidth: 480,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    color: '#0F2438',
  },
  subtitleText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#64748B',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: '#334155',
    letterSpacing: 0.6,
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0C7AE0',
  },
  categoryPillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#0C7AE0',
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  severityItem: {
    flex: 1,
    aspectRatio: 1.1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  severityItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  noteText: {
    fontSize: 11,
    color: '#0284C7',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7AE0',
    borderRadius: 20,
    paddingVertical: 13,
    gap: 8,
  },
  submitButtonText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
