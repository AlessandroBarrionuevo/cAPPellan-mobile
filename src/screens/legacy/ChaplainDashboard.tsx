import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useChaplainStore } from '../../lib/stores/chaplain';
import { useAuthStore } from '../../lib/stores/auth';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import ReportFormModal from '../../components/ReportFormModal';
import type { CallResponse } from '../../types/api';
import {
  Radio,
  PhoneCall,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileText,
} from 'lucide-react-native';

interface ChaplainDashboardProps {
  onJoinCall: () => void;
  lastEndedSessionId: number | null;
  onClearEndedSession: () => void;
}

export default function ChaplainDashboard({
  onJoinCall,
  lastEndedSessionId,
  onClearEndedSession,
}: ChaplainDashboardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const status = useChaplainStore((state) => state.status);
  const toggleStatus = useChaplainStore((state) => state.toggleStatus);
  const setAssignedCall = useChaplainStore((state) => state.setAssignedCall);
  const user = useAuthStore((state) => state.user);

  // Trigger report modal if a call just ended
  useEffect(() => {
    if (lastEndedSessionId) {
      setShowReportModal(true);
    }
  }, [lastEndedSessionId]);

  // Polling for incoming calls when ONLINE
  useEffect(() => {
    if (status !== 'ONLINE') return;

    const interval = setInterval(async () => {
      try {
        const assigned = await request<CallResponse>(ENDPOINTS.CALLS_ASSIGNED);
        if (assigned && assigned.sessionId) {
          setAssignedCall(assigned);
          onJoinCall();
        }
      } catch (err) {
        // 204 or connection error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [status, setAssignedCall, onJoinCall]);

  const handleToggle = async (val: boolean) => {
    setIsToggling(true);
    try {
      await toggleStatus(val ? 'ONLINE' : 'OFFLINE');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cambiar el estado');
    } finally {
      setIsToggling(false);
    }
  };

  const isOnline = status === 'ONLINE';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Chaplain Header Card */}
      <View style={[styles.headerCard, globalStyles.shadowSoft]}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleTag}>Panel de Atención</Text>
          <Text style={styles.chaplainName}>
            Capellán {user?.username || ''}
          </Text>
          <Text style={styles.dutyStatusText}>
            Estado actual:{' '}
            <Text
              style={{
                color: isOnline ? Theme.colors.secondary : Theme.colors.outline,
                fontWeight: '700',
              }}
            >
              {isOnline ? 'EN SERVICIO (ONLINE)' : 'FUERA DE SERVICIO'}
            </Text>
          </Text>
        </View>

        {/* Online/Offline Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Disponibilidad</Text>
          {isToggling ? (
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={handleToggle}
              trackColor={{ false: '#D0D5DD', true: Theme.colors.secondaryContainer }}
              thumbColor={isOnline ? Theme.colors.secondary : '#98A2B3'}
            />
          )}
        </View>
      </View>

      {/* Real-time Status Card */}
      {isOnline && (
        <View style={[styles.liveStatusCard, globalStyles.shadowSoft]}>
          <View style={styles.pulseIndicator} />
          <View style={{ flex: 1 }}>
            <Text style={styles.liveTitle}>A la espera de llamadas</Text>
            <Text style={styles.liveSubtitle}>
              Cuando un usuario solicite atención, sonarás y se abrirá la sala
              automáticamente.
            </Text>
          </View>
        </View>
      )}

      {/* Duty Metrics Section */}
      <Text style={styles.sectionHeading}>Resumen de Guardia</Text>
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, globalStyles.shadowSoft]}>
          <View style={styles.metricIconBox}>
            <PhoneCall size={20} color={Theme.colors.primary} />
          </View>
          <Text style={styles.metricValue}>Activo</Text>
          <Text style={styles.metricLabel}>Recepción 1:1</Text>
        </View>

        <View style={[styles.metricCard, globalStyles.shadowSoft]}>
          <View style={styles.metricIconBox}>
            <ShieldCheck size={20} color={Theme.colors.secondary} />
          </View>
          <Text style={styles.metricValue}>WebRTC</Text>
          <Text style={styles.metricLabel}>LiveKit Server</Text>
        </View>
      </View>

      {/* Manual Report Trigger (if ended call is pending) */}
      {lastEndedSessionId && (
        <TouchableOpacity
          style={styles.pendingReportButton}
          onPress={() => setShowReportModal(true)}
        >
          <FileText size={18} color="#FFFFFF" />
          <Text style={styles.pendingReportButtonText}>
            Completar Informe de Sesión #{lastEndedSessionId}
          </Text>
        </TouchableOpacity>
      )}

      {/* Report Form Modal */}
      <ReportFormModal
        visible={showReportModal}
        sessionId={lastEndedSessionId}
        onClose={() => setShowReportModal(false)}
        onSubmitted={() => {
          setShowReportModal(false);
          onClearEndedSession();
          Alert.alert('Éxito', 'Informe guardado correctamente');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Theme.spacing.stackMd,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    marginBottom: 16,
  },
  headerInfo: {
    marginBottom: 16,
  },
  roleTag: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    marginBottom: 4,
  },
  chaplainName: {
    ...globalStyles.headlineMd,
    fontSize: 22,
    color: Theme.colors.primary,
  },
  dutyStatusText: {
    ...globalStyles.bodySm,
    marginTop: 6,
    color: Theme.colors.onSurfaceVariant,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  toggleLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 15,
    color: Theme.colors.primary,
  },
  liveStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: Theme.roundness.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CEEAD6',
    marginBottom: 20,
    gap: 12,
  },
  pulseIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E8E3E',
  },
  liveTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 15,
    color: '#137333',
  },
  liveSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: '#3C4043',
    marginTop: 2,
  },
  sectionHeading: {
    ...globalStyles.headlineMd,
    fontSize: 18,
    color: Theme.colors.primary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 16,
    color: Theme.colors.primary,
  },
  metricLabel: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  pendingReportButton: {
    backgroundColor: Theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Theme.roundness.lg,
    gap: 8,
  },
  pendingReportButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
