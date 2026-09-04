import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { ClipboardList, Star, X } from 'lucide-react-native';

interface ReportFormModalProps {
  visible: boolean;
  sessionId: number | null;
  onClose: () => void;
  onSubmitted: () => void;
}

const CATEGORIES = [
  { key: 'SPIRITUAL', label: 'Espiritual' },
  { key: 'FAMILY', label: 'Familiar' },
  { key: 'PERSONAL', label: 'Personal' },
  { key: 'CRISIS', label: 'Crisis' },
  { key: 'OTHER', label: 'Otro' },
] as const;

export default function ReportFormModal({
  visible,
  sessionId,
  onClose,
  onSubmitted,
}: ReportFormModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'SPIRITUAL' | 'FAMILY' | 'PERSONAL' | 'CRISIS' | 'OTHER'>('SPIRITUAL');
  const [severity, setSeverity] = useState(3);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, globalStyles.shadowSoft]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <ClipboardList size={22} color={Theme.colors.primary} />
              <Text style={styles.titleText}>Informe de Atención</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Theme.colors.outline} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Asunto */}
            <Text style={styles.label}>Asunto de la consulta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Acompañamiento en duelo"
              value={subject}
              onChangeText={setSubject}
            />

            {/* Categoría */}
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    category === cat.key && styles.categoryPillActive,
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      category === cat.key && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gravedad (1 a 5) */}
            <Text style={styles.label}>Nivel de Gravedad / Atención</Text>
            <View style={styles.severityRow}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.severityItem,
                    severity === lvl && styles.severityItemActive,
                  ]}
                  onPress={() => setSeverity(lvl)}
                >
                  <Text
                    style={[
                      styles.severityItemText,
                      severity === lvl && styles.severityItemTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resumen */}
            <Text style={styles.label}>Resumen de la sesión</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalles confidenciales de la conversación..."
              multiline
              numberOfLines={4}
              value={summary}
              onChangeText={setSummary}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Theme.colors.onPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>Guardar Informe</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    color: Theme.colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    ...globalStyles.labelCaps,
    color: Theme.colors.primary,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#F3F6FA',
    borderRadius: Theme.roundness.lg,
    padding: 12,
    fontSize: 15,
    fontFamily: Theme.fonts.body,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#F0F4F8',
  },
  categoryPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  categoryPillText: {
    ...globalStyles.bodySm,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityItemActive: {
    backgroundColor: Theme.colors.secondary,
  },
  severityItemText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  severityItemTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    height: 50,
    borderRadius: Theme.roundness.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    marginBottom: 8,
  },
});
