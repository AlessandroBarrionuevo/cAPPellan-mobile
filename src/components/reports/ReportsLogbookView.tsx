import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import type { PostCallReport } from '../../types/api';
import {
  FileText,
  Shield,
  Lock,
  Plus,
  Filter,
  Calendar,
  ChevronRight,
  ShieldAlert,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';
import { TacticalCard, TacticalButton, FilterPills } from '../common';
import NewReportModal from './NewReportModal';

export interface ReportsLogbookViewProps {
  canSupervise?: boolean;
  onOpenNewReport?: () => void;
  onNewReportPress?: () => void;
  onSelectReport?: (report: PostCallReport) => void;
  activeSessionId?: number | null;
}

const REPORT_FILTERS = [
  { id: 'all', label: 'Todos los Informes' },
  { id: 'SPIRITUAL_COUNSELING', label: 'Consejería' },
  { id: 'EMOTIONAL_CRISIS', label: 'Crisis / Duelo' },
  { id: 'PRAYER_REQUEST', label: 'Oración' },
  { id: 'high_severity', label: 'Alta Severidad' },
];

export function ReportsLogbookView({
  canSupervise = false,
  onOpenNewReport,
  onNewReportPress,
  onSelectReport,
  activeSessionId = null,
}: ReportsLogbookViewProps) {
  const { width } = useWindowDimensions();
  const [reports, setReports] = useState<PostCallReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');
  const [selectedReportDetail, setSelectedReportDetail] = useState<PostCallReport | null>(null);

  const isTablet = width > 500;

  // Mock initial reports if backend hasn't populated any yet, or fetch if available
  useEffect(() => {
    // Initial sample reports for realistic tactical display
    const sampleReports: PostCallReport[] = [
      {
        id: 101,
        sessionId: 88,
        subject: 'Acompañamiento por estrés operativo y retorno',
        category: 'EMOTIONAL_CRISIS',
        severity: 3,
        summary:
          'Se brindó contención pastoral a oficial en retorno de despliegue fronterizo. Manifiesta agotamiento y dificultad para descansar. Se compartió lectura de Salmo 91 y oración por templanza.',
        createdAt: '2026-09-08T14:30:00Z',
      },
      {
        id: 102,
        sessionId: 91,
        subject: 'Contención por duelo familiar en servicio',
        category: 'SPIRITUAL_COUNSELING',
        severity: 2,
        summary:
          'Camarada solicita orientación tras pérdida de un progenitor. Se sostuvo diálogo reflexivo bajo secreto pastoral y se coordinó seguimiento espiritual discreto.',
        createdAt: '2026-09-07T10:15:00Z',
      },
      {
        id: 103,
        sessionId: 95,
        subject: 'Intercesión por salud de hijo en terapia',
        category: 'PRAYER_REQUEST',
        severity: 4,
        summary:
          'Petición urgente de cobertura espiritual por situación de salud crítica de hijo menor. Se oró en conjunto durante llamada y se derivó intención al Muro de Oración anónimo.',
        createdAt: '2026-09-06T21:40:00Z',
      },
    ];

    setReports(sampleReports);
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'high_severity') return rep.severity >= 3;
      return rep.category === selectedFilter;
    });
  }, [reports, selectedFilter]);

  const handleReportCreated = (newReport?: PostCallReport) => {
    setShowNewModal(false);
    if (newReport) {
      setReports((prev) => [newReport, ...prev]);
    }
    Alert.alert('Acta Guardada', 'El informe pastoral ha sido sellado y archivado en la bitácora.');
  };

  const getSeverityBadge = (level: number) => {
    switch (level) {
      case 5:
        return { label: '5 - Crítico', color: '#EF4444', bg: '#FEE2E2' };
      case 4:
        return { label: '4 - Urgente', color: '#F97316', bg: '#FFEDD5' };
      case 3:
        return { label: '3 - Alerta', color: '#F59E0B', bg: '#FEF3C7' };
      case 2:
        return { label: '2 - Moderado', color: '#3B82F6', bg: '#DBEAFE' };
      case 1:
      default:
        return { label: '1 - Leve', color: '#10B981', bg: '#D1FAE5' };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SPIRITUAL_COUNSELING':
        return 'Consejería Espiritual';
      case 'EMOTIONAL_CRISIS':
        return 'Crisis / Duelo';
      case 'PRAYER_REQUEST':
        return 'Petición de Oración';
      default:
        return 'Asunto Pastoral';
    }
  };

  const renderHeader = (
    <View style={styles.headerWrapper}>
      {/* Title block */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <FileText size={20} color={Theme.colors.tacticalNavy} />
          <Text style={styles.titleHeading}>Informes de llamadas</Text>
        </View>
        <Text style={styles.legalDisclaimer}>
          Protegido por Secreto Ministerial y Fuero Canónico Art. 34-B
        </Text>
      </View>

      {/* Supervisor Segmented Switch (if Leader) */}
      {canSupervise && (
        <View style={styles.segmentedBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'my' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('my')}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'my' && styles.segmentBtnTextActive,
              ]}
            >
              Mis Actas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'team' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('team')}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'team' && styles.segmentBtnTextActive,
              ]}
            >
              Actas del Destacamento
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bento Stats Row */}
      <View style={styles.bentoRow}>
        <View style={styles.bentoCard}>
          <View style={styles.bentoTop}>
            <FileCheck size={16} color={Theme.colors.tacticalNavy} />
            <Text style={styles.bentoLabel}>Actas</Text>
          </View>
          <Text style={styles.bentoValue}>{reports.length}</Text>
        </View>

        <View style={styles.bentoCard}>
          <View style={styles.bentoTop}>
            <Lock size={15} color="#9A805B" />
            <Text style={styles.bentoLabel}>En Reserva</Text>

          </View>
          <Text style={styles.bentoValue}>{reports.length}</Text>
        </View>
      </View>
      <View style={styles.bentoRowCard}>
        <View style={styles.bentoTop}>
          <Shield size={16} color={Theme.colors.secondary} />
          <Text style={styles.bentoLabel}>Severidad Med.</Text>
        </View>
        <Text style={styles.bentoValue}>2.8</Text>
      </View>


      {/* Redactar CTA */}
      <TacticalButton
        title="Nuevo informe"
        onPress={() => {
          if (onOpenNewReport) {
            onOpenNewReport();
          } else if (onNewReportPress) {
            onNewReportPress();
          } else {
            setShowNewModal(true);
          }
        }}
        variant="primary"
        size="md"
        leftIcon={<Plus size={18} color="#FFFFFF" />}
        style={styles.newReportBtn}
      />

      {/* Filter pills */}
      <FilterPills
        items={REPORT_FILTERS}
        selectedId={selectedFilter}
        onSelect={setSelectedFilter}
        style={styles.filterPills}
      />
    </View>
  );

  const renderReportItem = ({ item }: { item: PostCallReport }) => {
    const sev = getSeverityBadge(item.severity);
    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      : 'Reciente';

    return (
      <TacticalCard style={styles.reportCard} padding={14} variant="accentBorder">
        <View style={styles.reportCardHeader}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{getCategoryLabel(item.category)}</Text>
          </View>
          <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
            <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
            <Text style={[styles.severityPillText, { color: sev.color }]}>{sev.label}</Text>
          </View>
        </View>

        <Text style={styles.reportSubject}>{item.subject}</Text>

        <Text style={styles.reportSummary} numberOfLines={2}>
          {item.summary}
        </Text>

        <View style={styles.reportFooter}>
          <View style={styles.dateRow}>
            <Calendar size={13} color={Theme.colors.onSurfaceVariant} />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewDetailBtn}
            onPress={() => {
              if (onSelectReport) {
                onSelectReport(item);
              } else {
                Alert.alert(
                  item.subject,
                  `Categoría: ${getCategoryLabel(item.category)}\nSeveridad: ${sev.label}\nFecha: ${dateStr}\n\nSíntesis:\n${item.summary}`,
                  [{ text: 'Cerrar' }]
                );
              }
            }}
          >
            <Text style={styles.viewDetailText}>Ver Acta</Text>
            <ChevronRight size={14} color={Theme.colors.tacticalNavy} />
          </TouchableOpacity>
        </View>
      </TacticalCard>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => String(item.id || item.sessionId)}
        renderItem={renderReportItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.listContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay informes con este filtro.</Text>
          </View>
        }
      />

      {/* Modal to write new report */}
      <NewReportModal
        visible={showNewModal}
        sessionId={activeSessionId || null}
        onClose={() => setShowNewModal(false)}
        onSubmitted={handleReportCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  headerWrapper: {
    marginBottom: 12,
  },
  titleSection: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  titleHeading: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  legalDisclaimer: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.secondary,
    letterSpacing: 0.2,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    padding: 3,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Theme.roundness.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...globalStyles.shadowSm,
  },
  segmentBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  segmentBtnTextActive: {
    color: Theme.colors.tacticalNavy,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.md,
    padding: 10,
    ...globalStyles.shadowSm,
  },
  bentoRowCard:{
    flex: 1,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.md,
    padding: 10,
    ...globalStyles.shadowSm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bentoTop: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  bentoLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  bentoValue: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  newReportBtn: {
    marginBottom: 14,
  },
  filterPills: {
    paddingBottom: 6,
  },
  reportCard: {
    marginBottom: 10,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
  },
  categoryPillText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.tacticalNavy,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    gap: 4,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityPillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
  },
  reportSubject: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  reportSummary: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 16,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.tacticalNavy,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
});

export default ReportsLogbookView;
