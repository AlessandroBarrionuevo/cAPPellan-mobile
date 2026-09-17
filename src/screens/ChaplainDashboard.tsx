import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme } from '../theme/Theme';
import { useChaplainStore } from '../lib/stores/chaplain';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { request, setClientToken } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { useAppInsets } from '../lib/safeArea';
import DutyConsole from '../components/duty/DutyConsole';
import NewReportModal from '../components/reports/NewReportModal';
import type { CallResponse, SessionType, PostCallReport } from '../types/api';

export interface ChaplainDashboardProps {
  onJoinCall: () => void;
  onJoinChat: () => void;
  lastEndedSessionId: number | null;
  onClearEndedSession: () => void;
  onNavigateToInformes?: () => void;
  onNavigatePrayerWall?: () => void;
}

export default function ChaplainDashboard({
  onJoinCall,
  onJoinChat,
  lastEndedSessionId,
  onClearEndedSession,
  onNavigateToInformes,
  onNavigatePrayerWall,
}: ChaplainDashboardProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();

  const [isToggling, setIsToggling] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const status = useChaplainStore((state) => state.status);
  const toggleStatus = useChaplainStore((state) => state.toggleStatus);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const setAssignedCall = useChaplainStore((state) => state.setAssignedCall);
  const user = useAuthStore((state) => state.user);

  // Trigger report modal if a call just ended
  useEffect(() => {
    if (lastEndedSessionId) {
      setSelectedSessionId(lastEndedSessionId);
      setShowReportModal(true);
    }
  }, [lastEndedSessionId]);


  const handleToggle = async (val: boolean) => {
    setIsToggling(true);
    try {
      await toggleStatus(val ? 'ONLINE' : 'OFFLINE');
    } catch (err: any) {
      Alert.alert('Error de Guardia', err.message || 'No se pudo actualizar el estado de disponibilidad');
    } finally {
      setIsToggling(false);
    }
  };

  const handleAcceptCall = (sessionType: SessionType) => {
    if (sessionType === 'CHAT') {
      onJoinChat();
    } else {
      onJoinCall();
    }
  };

  const isTablet = width > 500;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom, 20) + 100 },
        isTablet && styles.tabletContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Duty Console matching Stitch: Header + Radar + KPIs + Bitácora Preview + Muro Preview */}
      <DutyConsole
        user={user}
        isOnline={status === 'ONLINE'}
        isToggling={isToggling}
        onToggleOnline={handleToggle}
        incomingCall={assignedCall}
        onAcceptCall={handleAcceptCall}
        onOpenNewReport={() => {
          setSelectedSessionId(lastEndedSessionId || 0);
          setShowReportModal(true);
        }}
        onNavigateToInformes={onNavigateToInformes}
        onNavigatePrayerWall={onNavigatePrayerWall}
        onViewReportDetails={(report: PostCallReport) => {
          Alert.alert(
            `Acta #${report.id || report.sessionId}`,
            `Asunto: ${report.subject}\nSeveridad: ${report.severity}/5\n\nSíntesis:\n${report.summary}`
          );
        }}
      />

      {/* New Report Modal */}
      <NewReportModal
        visible={showReportModal}
        sessionId={selectedSessionId || lastEndedSessionId || null}
        onClose={() => {
          setShowReportModal(false);
          setSelectedSessionId(null);
          onClearEndedSession();
        }}
        onSubmitted={() => {
          setShowReportModal(false);
          setSelectedSessionId(null);
          onClearEndedSession();
          Alert.alert(
            'Acta Asentada con Éxito',
            'El informe pastoral ha sido registrado y preservado bajo resguardo canónico inviolable.'
          );
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
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
  },
  tabletContent: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
});
