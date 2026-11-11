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
  Check,
  Sparkles,
  ClipboardList,
} from 'lucide-react-native';
import type { PostCallReport, CanonicalReportCategory } from '../../types/api';
import { normalizeReportCategory } from '../../types/api';

export interface NewReportModalPreviewProps {
  visible: boolean;
  sessionId: number | null;
  onClose: () => void;
  onSubmitted: (report?: PostCallReport) => void;
}

const CATEGORIES: { key: CanonicalReportCategory; label: string; desc: string }[] = [
  { key: 'SPIRITUAL', label: 'Consejería Espiritual / Oración', desc: 'Guía pastoral, intercesión y discernimiento' },
  { key: 'CRISIS', label: 'Crisis / Duelo Emocional', desc: 'Acompañamiento en dolor agudo, trauma o urgencia' },
  { key: 'FAMILY', label: 'Familia / Vínculos', desc: 'Dificultades familiares, matrimonio o crianza' },
  { key: 'PERSONAL', label: 'Personal / Confidencial', desc: 'Consulta reservada, dilemas de vocación o ética' },
  { key: 'OTHER', label: 'Otro Asunto Pastoral', desc: 'Asistencia y seguimiento pastoral general' },
];

type CategoryKey = CanonicalReportCategory;

const SEVERITY_LEVELS = [
  { level: 1, label: 'Leve', desc: 'Atención ordinaria de rutina', color: '#059669', bg: '#ECFDF5' },
  { level: 2, label: 'Moderado', desc: 'Seguimiento o consulta periódica', color: '#0C7AE0', bg: '#EFF6FF' },
  { level: 3, label: 'Alerta', desc: 'Carga sensible en monitoreo', color: '#D97706', bg: '#FFFBEB' },
  { level: 4, label: 'Urgente', desc: 'Prioridad alta de contención', color: '#EA580C', bg: '#FFF7ED' },
  { level: 5, label: 'Crítico', desc: 'Protocolo de crisis inmediata', color: '#DC2626', bg: '#FEF2F2' },
] as const;

export function NewReportModalPreview({
  visible,
  sessionId,
  onClose,
  onSubmitted,
}: NewReportModalPreviewProps) {
  const { width, height } = useWindowDimensions();
  const [manualSessionId, setManualSessionId] = useState('');
  const [recentEndedSessions, setRecentEndedSessions] = useState<{ id: number; sessionType?: string; createdAt?: string }[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<CategoryKey>('SPIRITUAL');
  const [severity, setSeverity] = useState<number>(2);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSubjectFocused, setIsSubjectFocused] = useState(false);
  const [isSummaryFocused, setIsSummaryFocused] = useState(false);

  // Micro-interaction animations
  const modalScale = useRef(new Animated.Value(0.93)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const severityAnims = useRef<{ [key: number]: Animated.Value }>({
    1: new Animated.Value(1),
    2: new Animated.Value(1.06),
    3: new Animated.Value(1),
    4: new Animated.Value(1),
    5: new Animated.Value(1),
  }).current;

  const isTablet = width > 540;
  const isShortScreen = height < 720;

  useEffect(() => {
    if (visible) {
      modalScale.setValue(0.93);
      modalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      // If opened manually without session ID, query recent ended calls for quick selection
      if (!sessionId) {
        Promise.all([
          request<any[]>(`${ENDPOINTS.CALLS_LIST}?status=ENDED`),
          request<any[]>(ENDPOINTS.REPORTS).catch(() => []),
        ])
          .then(([callsData, reportsData]) => {
            if (Array.isArray(callsData) && callsData.length > 0) {
              const reportedSessionIds = new Set(
                (Array.isArray(reportsData) ? reportsData : [])
                  .map((r: any) => r.sessionId)
                  .filter(Boolean)
              );
              const pending = callsData.filter((c: any) => !reportedSessionIds.has(c.id ?? c.sessionId));
              const available = pending.length > 0 ? pending : callsData;
              setRecentEndedSessions(available.slice(0, 6));
              const topId = available[0]?.id ?? available[0]?.sessionId;
              if (topId && !manualSessionId) {
                setManualSessionId(String(topId));
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [visible, sessionId, modalScale, modalOpacity]);

  const currentSeverityObj =
    SEVERITY_LEVELS.find((s) => s.level === severity) || SEVERITY_LEVELS[1];

  const handleSelectSeverity = (lvl: number) => {
    setSeverity(lvl);
    if (severityAnims[lvl]) {
      Animated.sequence([
        Animated.timing(severityAnims[lvl], {
          toValue: 1.15,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(severityAnims[lvl], {
          toValue: 1.06,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }

    SEVERITY_LEVELS.forEach((s) => {
      if (s.level !== lvl && severityAnims[s.level]) {
        Animated.timing(severityAnims[s.level], {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !summary.trim()) {
      setError('Por favor completá el asunto y la síntesis pastoral.');
      return;
    }

    const resolvedSessionId =
      sessionId || (manualSessionId.trim() ? parseInt(manualSessionId.trim(), 10) : 0);

    if (!resolvedSessionId || resolvedSessionId <= 0) {
      setError('Por favor ingresá o seleccioná el N° de una llamada o chat finalizado.');
      return;
    }

    const backendCategory = normalizeReportCategory(category);

    const reportPayload: PostCallReport = {
      id: Date.now(),
      sessionId: resolvedSessionId,
      subject: subject.trim(),
      category: backendCategory,
      severity,
      summary: summary.trim(),
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setError(null);

    try {
      try {
        const res = await request<PostCallReport>(ENDPOINTS.CALL_REPORT(resolvedSessionId), {
          method: 'POST',
          body: JSON.stringify({
            subject: subject.trim(),
            category: backendCategory,
            severity,
            summary: summary.trim(),
          }),
        });
        if (res) {
          reportPayload.id = res.id || reportPayload.id;
        }
      } catch (apiErr: any) {
        const msg = apiErr?.message || '';
        if (apiErr.status === 404 || msg.includes('not found') || msg.includes('Session not found')) {
          throw new Error(`La sesión #${resolvedSessionId} no existe en el sistema. Los informes deben pertenecer a una llamada o chat real.`);
        }
        if (apiErr.status === 409 || msg.includes('ENDED') || msg.includes('already exists')) {
          throw new Error(`La sesión #${resolvedSessionId} no se encuentra finalizada o ya tiene un informe registrado.`);
        }
        if (apiErr.status === 403 || msg.includes('attending chaplain')) {
          throw new Error(`Solo el capellán que atendió la sesión #${resolvedSessionId} puede asentar su acta.`);
        }
        throw new Error(msg || 'Error al sellar el informe pastoral en el servidor.');
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

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.modalCard,
            isTablet && styles.tabletModal,
            {
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.emblemBadge}>
                <FileCheck size={20} color="#0C7AE0" strokeWidth={2.4} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.modalTitle}>Informe de Atención Pastoral</Text>
                <Text style={styles.modalSubtitle}>Registro ministerial confidencial</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <X size={18} color="#64748B" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={[styles.scrollBody, isShortScreen && styles.scrollShortScreen]}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Confidential Guarantee Banner */}
            <View style={styles.guaranteeCard}>
              <View style={styles.guaranteeRow}>
                <Lock size={14} color="#0C7AE0" strokeWidth={2.2} />
                <Text style={styles.guaranteeBadge}>RESGUARDO MINISTERIAL Y ÉTICA PASTORAL</Text>
              </View>
              <Text style={styles.guaranteeText}>
                Este informe opera bajo cifrado y secreto pastoral militar/policial inviolable. Toda anotación queda resguardada institucionalmente.
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <AlertTriangle size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Session ID or Reference */}
            <View style={styles.formCard}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.blueDot} />
                <Text style={styles.fieldLabel}>
                  {sessionId ? 'EXPEDIENTE VINCULADO' : 'N° DE SESIÓN FINALIZADA *'}
                </Text>
              </View>

              {sessionId ? (
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>SESIÓN ACTIVA #{sessionId}</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.textInput}
                    placeholder="N° de llamada o chat atendido (ej: 42)"
                    placeholderTextColor="#94A3B8"
                    value={manualSessionId}
                    onChangeText={setManualSessionId}
                    keyboardType="numeric"
                  />
                  {recentEndedSessions.length > 0 && (
                    <View style={styles.quickSessionsContainer}>
                      <Text style={styles.quickSessionsLabel}>Sesiones atendidas recientes:</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickSessionsScroll}
                      >
                        {recentEndedSessions.map((s) => {
                          const sid = s.id ?? (s as any).sessionId;
                          const isSelected = manualSessionId === String(sid);
                          const typeLabel = s.sessionType === 'CHAT' ? 'Chat' : 'Llamada';
                          return (
                            <TouchableOpacity
                              key={sid}
                              style={[
                                styles.quickSessionChip,
                                isSelected && styles.quickSessionChipActive,
                              ]}
                              onPress={() => setManualSessionId(String(sid))}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.quickSessionChipText,
                                  isSelected && styles.quickSessionChipTextActive,
                                ]}
                              >
                                #{sid} • {typeLabel}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Asunto / Motivo */}
            <View style={styles.formCard}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.blueDot} />
                <Text style={styles.fieldLabel}>ASUNTO O MOTIVO DE CONSULTA</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  isSubjectFocused && styles.textInputFocused,
                ]}
                placeholder="Ej: Acompañamiento en estrés operativo o duelo familiar..."
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
                onFocus={() => setIsSubjectFocused(true)}
                onBlur={() => setIsSubjectFocused(false)}
              />
            </View>

            {/* Categoría / Motivo Canónico */}
            <View style={styles.formCard}>
              <View style={styles.fieldLabelRow}>
                <View style={styles.blueDot} />
                <Text style={styles.fieldLabel}>CATEGORÍA PASTORAL</Text>
              </View>
              <View style={styles.pillsCol}>
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
                      <View
                        style={[
                          styles.checkCircle,
                          isSelected && styles.checkCircleActive,
                        ]}
                      >
                        {isSelected ? (
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        ) : (
                          <View style={styles.uncheckedDot} />
                        )}
                      </View>
                      <View style={styles.categoryTextCol}>
                        <Text
                          style={[
                            styles.categoryLabel,
                            isSelected && styles.categoryLabelActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                        <Text
                          style={[
                            styles.categoryDesc,
                            isSelected && styles.categoryDescActive,
                          ]}
                          numberOfLines={1}
                        >
                          {cat.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Severity Level (1 to 5) with Micro-interactions */}
            <View style={styles.formCard}>
              <View style={styles.severityHeaderRow}>
                <View style={styles.fieldLabelRow}>
                  <View style={styles.blueDot} />
                  <Text style={styles.fieldLabel}>NIVEL DE GRAVEDAD / ATENCIÓN</Text>
                </View>
                {/* <View
                  style={[
                    styles.severityBadgePill,
                    { backgroundColor: currentSeverityObj.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityBadgePillText,
                      { color: currentSeverityObj.color },
                    ]}
                  >
                    Nivel {currentSeverityObj.level}: {currentSeverityObj.label}
                  </Text>
                </View> */}
              </View>

              <View style={styles.severityGrid}>
                {SEVERITY_LEVELS.map((item) => {
                  const isSelected = severity === item.level;
                  const animScale = severityAnims[item.level] || 1;

                  return (
                    <Animated.View
                      key={item.level}
                      style={[
                        styles.severityCol,
                        { transform: [{ scale: animScale }] },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.severityButton,
                          isSelected
                            ? {
                                backgroundColor: item.bg,
                                borderColor: item.color,
                                borderWidth: 2,
                                ...Platform.select({
                                  ios: {
                                    shadowColor: item.color,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                  },
                                  android: {
                                    elevation: 2,
                                  },
                                }),
                              }
                            : styles.severityButtonDefault,
                        ]}
                        onPress={() => handleSelectSeverity(item.level)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.severityNumber,
                            isSelected && { color: item.color, fontWeight: '800' },
                          ]}
                        >
                          {item.level}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Dynamic Severity Explanation Banner */}
              <View
                style={[
                  styles.severityExplainBanner,
                  { backgroundColor: currentSeverityObj.bg, borderColor: `${currentSeverityObj.color}25` },
                ]}
              >
                <View
                  style={[
                    styles.severityDotIndicator,
                    { backgroundColor: currentSeverityObj.color },
                  ]}
                />
                <Text style={styles.severityExplainText}>
                  {currentSeverityObj.desc}
                </Text>
              </View>
            </View>

            {/* Síntesis / Resumen pastoral */}
            <View style={styles.formCard}>
              <View style={styles.severityHeaderRow}>
                <View style={styles.fieldLabelRow}>
                  <View style={styles.blueDot} />
                  <Text style={styles.fieldLabel}>SÍNTESIS PASTORAL CONFIDENCIAL</Text>
                </View>
                {/* <Text style={styles.charCount}>{summary.length}/500</Text> */}
              </View>
              <TextInput
                style={[
                  styles.textAreaInput,
                  isSummaryFocused && styles.textAreaInputFocused,
                ]}
                placeholder="Registrá aquí los puntos clave tratados, compromisos de oración, recomendaciones o necesidad de seguimiento posterior..."
                placeholderTextColor="#94A3B8"
                value={summary}
                onChangeText={setSummary}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                onFocus={() => setIsSummaryFocused(true)}
                onBlur={() => setIsSummaryFocused(false)}
              />
            </View>
          </ScrollView>

          {/* Footer Action Button */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={[
                styles.submitShapedBtn,
                isSubmitting && styles.submitShapedBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.submitShapedBtnText}>Enviar Informe</Text>
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
    paddingVertical: 18,
  },
  modalCard: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabletModal: {
    maxWidth: 520,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 18,
    color: '#0F2438',
  },
  modalSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  scrollShortScreen: {
    maxHeight: 390,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 14,
  },
  guaranteeCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.6,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  errorContainer: {
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
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0C7AE0',
  },
  fieldLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: '#334155',
    letterSpacing: 0.6,
  },
  sessionBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignSelf: 'flex-start',
  },
  sessionBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0C7AE0',
  },
  quickSessionsContainer: {
    marginTop: 10,
  },
  quickSessionsLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quickSessionsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  quickSessionChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSessionChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  quickSessionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickSessionChipTextActive: {
    color: '#0C7AE0',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
  },
  textInputFocused: {
    borderColor: '#0C7AE0',
  },
  pillsCol: {
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  categoryPillActive: {
    borderColor: '#0C7AE0',
    backgroundColor: '#EFF6FF',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  checkCircleActive: {
    backgroundColor: '#0C7AE0',
    borderColor: '#0C7AE0',
  },
  uncheckedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#1E293B',
  },
  categoryLabelActive: {
    color: '#0C7AE0',
    fontWeight: '700',
  },
  categoryDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  categoryDescActive: {
    color: '#3B82F6',
  },
  severityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  severityBadgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  severityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  severityCol: {
    flex: 1,
  },
  severityButton: {
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  severityButtonDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  severityNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  severityExplainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  severityDotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityExplainText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  charCount: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  textAreaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 88,
  },
  textAreaInputFocused: {
    borderColor: '#0C7AE0',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  submitShapedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7AE0',
    borderRadius: 20,
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
  submitShapedBtnDisabled: {
    opacity: 0.7,
  },
  submitShapedBtnText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
