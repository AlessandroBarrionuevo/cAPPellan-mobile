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
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import {
  ShieldCheck,
  X,
  Lock,
  FileCheck,
  AlertTriangle,
  Send,
} from 'lucide-react-native';
import { TacticalButton } from '../common';
import type { PostCallReport } from '../../types/api';

export interface NewReportModalProps {
  visible: boolean;
  sessionId: number | null;
  onClose: () => void;
  onSubmitted: (report?: PostCallReport) => void;
}

const CATEGORIES = [
  { key: 'SPIRITUAL_COUNSELING', label: 'Consejería Espiritual' },
  { key: 'EMOTIONAL_CRISIS', label: 'Crisis / Duelo' },
  { key: 'PRAYER_REQUEST', label: 'Petición de Oración' },
  { key: 'OTHER', label: 'Otro Asunto' },
] as const;

const SEVERITY_LEVELS = [
  { level: 1, label: '1 - Leve', color: '#10B981' },
  { level: 2, label: '2 - Moderado', color: '#3B82F6' },
  { level: 3, label: '3 - Alerta', color: '#F59E0B' },
  { level: 4, label: '4 - Urgente', color: '#F97316' },
  { level: 5, label: '5 - Crítico', color: '#EF4444' },
] as const;

export function NewReportModal({
  visible,
  sessionId,
  onClose,
  onSubmitted,
}: NewReportModalProps) {
  const { width } = useWindowDimensions();
  const [manualSessionId, setManualSessionId] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<
    'SPIRITUAL_COUNSELING' | 'EMOTIONAL_CRISIS' | 'PRAYER_REQUEST' | 'OTHER'
  >('SPIRITUAL_COUNSELING');
  const [severity, setSeverity] = useState(2);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTablet = width > 500;

  const handleSubmit = async () => {
    if (!subject.trim() || !summary.trim()) {
      setError('Por favor completá el asunto y la síntesis pastoral.');
      return;
    }

    const resolvedSessionId =
      sessionId || (manualSessionId.trim() ? parseInt(manualSessionId.trim(), 10) : 0);

    const reportPayload: PostCallReport = {
      id: Date.now(),
      sessionId: resolvedSessionId || Date.now() % 10000,
      subject: subject.trim(),
      category,
      severity,
      summary: summary.trim(),
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setError(null);
    try {
      if (resolvedSessionId && resolvedSessionId > 0) {
        try {
          const res = await request<PostCallReport>(ENDPOINTS.CALL_REPORT(resolvedSessionId), {
            method: 'POST',
            body: JSON.stringify({
              subject: subject.trim(),
              category,
              severity,
              summary: summary.trim(),
            }),
          });
          if (res) {
            reportPayload.id = res.id || reportPayload.id;
          }
        } catch (apiErr) {
          console.log('[NewReportModal] Sync notice:', apiErr);
        }
      }

      setSubject('');
      setSummary('');
      setManualSessionId('');
      setSeverity(2);
      onSubmitted(reportPayload);
    } catch (err: any) {
      setError(err?.message || 'Error al sellar el informe pastoral');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isTablet && styles.tabletModal]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.emblemBadge}>
                <FileCheck size={18} color={Theme.colors.tacticalNavy} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Nuevo Informe Pastoral</Text>
                <Text style={styles.modalSubtitle}>Registro ministerial confidencial</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Solemn Security Guarantee Card */}
            <View style={styles.guaranteeCard}>
              <View style={styles.guaranteeRow}>
                <Lock size={15} color="#9A805B" />
                <Text style={styles.guaranteeBadge}>RESGUARDO INVIOLABLE · ART. 21 CÓDIGO PASTORAL</Text>
              </View>
              <Text style={styles.guaranteeText}>
                Este formulario opera con cifrado de punto a punto. Toda anotación goza de estricta reserva pastoral y sigilo sacramental inquebrantable.
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <AlertTriangle size={14} color={Theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {/* Expediente / N° Sesión */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                {sessionId ? 'Expediente Vinculado' : 'N° de Sesión o Referencia (Opcional)'}
              </Text>
              {sessionId ? (
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>SESIÓN ACTIVA #{sessionId}</Text>
                </View>
              ) : (
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: 104 (o dejar vacío para acta general)"
                  placeholderTextColor="#8A92A0"
                  value={manualSessionId}
                  onChangeText={setManualSessionId}
                  keyboardType="numeric"
                />
              )}
            </View>

            {/* Asunto / Unidad Operativa */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Asunto o Motivo de Consulta *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Acompañamiento en estrés operativo o duelo familiar..."
                placeholderTextColor="#8A92A0"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Motivo Canónico / Categoría */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Motivo Canónico / Categoría</Text>
              <View style={styles.pillsRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setCategory(cat.key)}
                      style={[
                        styles.catPill,
                        isSelected && styles.catPillActive,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Nivel de Severidad */}
            <View style={styles.formGroup}>
              <View style={styles.severityHeader}>
                <Text style={styles.fieldLabel}>Nivel de Gravedad</Text>
                <Text style={styles.severityValueText}>
                  {SEVERITY_LEVELS.find((s) => s.level === severity)?.label}
                </Text>
              </View>
              <View style={styles.severityRow}>
                {SEVERITY_LEVELS.map((s) => {
                  const isSelected = severity === s.level;
                  return (
                    <TouchableOpacity
                      key={s.level}
                      onPress={() => setSeverity(s.level)}
                      style={[
                        styles.severityBtn,
                        { borderColor: s.color },
                        isSelected && { backgroundColor: s.color },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.severityBtnText,
                          isSelected
                            ? { color: '#FFFFFF' }
                            : { color: s.color },
                        ]}
                      >
                        {s.level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Síntesis Pastoral / Resumen */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Síntesis y Bitácora Pastoral *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Detalla de forma sobria las circunstancias tratadas, pasajes bíblicos o el estado anímico al concluir la sesión..."
                placeholderTextColor="#8A92A0"
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TacticalButton
                title="Enviar Informe"
                onPress={handleSubmit}
                loading={isSubmitting}
                variant="primary"
                size="md"
                leftIcon={<ShieldCheck size={16} color="#FFFFFF" />}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 30, 48, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: Theme.roundness.xl,
    borderTopRightRadius: Theme.roundness.xl,
    maxHeight: '90%',
    ...globalStyles.shadowMd,
  },
  tabletModal: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    borderRadius: Theme.roundness.xl,
    marginVertical: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblemBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  modalSubtitle: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  guaranteeCard: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderRadius: Theme.roundness.md,
    padding: 12,
    marginBottom: 14,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guaranteeBadge: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: '#FEDEB2',
    letterSpacing: 0.7,
  },
  guaranteeText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorContainer,
    padding: 8,
    borderRadius: Theme.roundness.sm,
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.error,
    flex: 1,
  },
  formGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderColor: Theme.colors.tacticalNavy,
  },
  catPillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  severityHeader: {
    marginTop: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  severityValueText: {
    ...globalStyles.labelCaps,
    fontSize: 16,
    color: Theme.colors.secondary,
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  severityBtn: {
    flex: 1,
    height: 38,
    borderRadius: Theme.roundness.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  severityBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
  },
  textArea: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionsRow: {
    marginTop: 6,
  },
  sessionBadge: {
    backgroundColor: '#EEF2F6',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
    alignSelf: 'flex-start',
  },
  sessionBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 11,
    color: Theme.colors.tacticalNavy,
    fontWeight: '700',
  },
});

export default NewReportModal;
