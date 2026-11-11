import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme } from '../theme/Theme';
import { useChaplainStore } from '../lib/stores/chaplain';
import { useCallStore } from '../lib/stores/call';
import { useAuthStore } from '../lib/stores/auth';
import { request, setClientToken, ApiError } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { useAppInsets } from '../lib/safeArea';
import { dismissIncomingCallNotifications } from '../lib/notifications';
import { getChaplainProfile } from '../lib/api/profiles';
import DutyConsole from '../components/duty/DutyConsole';
import { NewReportModalPreview } from '../components/reports/NewReportModalPreview';
import { SharedDashboardWidgets, DashboardHeader } from '../components/dashboard';
import { AppPreloader, ENABLE_APP_PRELOADER } from '../components/common';
import type { CallResponse, SessionType, PostCallReport } from '../types/api';

export interface ChaplainDashboardProps {
  onJoinCall: () => void;
  onJoinChat: () => void;
  lastEndedSessionId: number | null;
  onClearEndedSession: () => void;
  onNavigateToInformes?: () => void;
  onNavigatePrayerWall?: (initialTab?: 'prayer' | 'gratitude') => void;
  onNavigateToBible?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToBlogs?: () => void;
}

export default function ChaplainDashboard({
  onJoinCall,
  onJoinChat,
  lastEndedSessionId,
  onClearEndedSession,
  onNavigateToInformes,
  onNavigatePrayerWall,
  onNavigateToBible,
  onNavigateToContent,
  onNavigateToBlogs,
}: ChaplainDashboardProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();

  const [isToggling, setIsToggling] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDashboardReady, setIsDashboardReady] = useState(false);
  const [showPreloader, setShowPreloader] = useState<boolean>(ENABLE_APP_PRELOADER);

  const status = useChaplainStore((state) => state.status);
  const toggleStatus = useChaplainStore((state) => state.toggleStatus);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const setAssignedCall = useChaplainStore((state) => state.setAssignedCall);
  const user = useAuthStore((state) => state.user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);

  // Synchronize avatar from user in auth store if it updates
  useEffect(() => {
    if (user?.avatarUrl !== undefined) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  // Fetch freshest chaplain profile to guarantee profile picture is consumed
  useEffect(() => {
    let isMounted = true;
    if (user?.userId && user?.role === 'CHAPLAIN') {
      getChaplainProfile(user.userId)
        .then((profile) => {
          if (!isMounted || !profile) return;
          if (profile.avatarUrl) {
            setAvatarUrl(profile.avatarUrl);
          }
          const currentUser = useAuthStore.getState().user;
          if (
            currentUser &&
            (currentUser.avatarUrl !== profile.avatarUrl || currentUser.fullName !== profile.fullName)
          ) {
            useAuthStore.getState().setUser({
              ...currentUser,
              avatarUrl: profile.avatarUrl || null,
              fullName: profile.fullName || currentUser.fullName,
            });
          }
        })
        .catch((err) => {
          console.log('[ChaplainDashboard] Chaplain profile not found or offline:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user?.userId, user?.role]);

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

  const handleAcceptCall = async (sessionType: SessionType) => {
    void dismissIncomingCallNotifications();
    if (assignedCall?.sessionId) {
      try {
        const refreshed = await request<CallResponse>(
          ENDPOINTS.CALL_ACCEPT(assignedCall.sessionId),
          {
            method: 'POST',
            headers: {
              'X-Device-Channel': 'MOBILE',
            },
          }
        );
        if (refreshed) {
          const merged: CallResponse = {
            ...assignedCall,
            ...refreshed,
            callerName: refreshed.callerName || assignedCall.callerName,
          };
          setAssignedCall(merged);
          useCallStore.getState().setSession(merged);
        }
      } catch (err: any) {
        console.warn('[ChaplainDashboard] Error accepting assigned call:', err);
        if (err instanceof ApiError && err.status === 409) {
          Alert.alert('Llamada Atendida', 'La llamada ya fue atendida desde la consola Web.');
          useChaplainStore.getState().clearAssignedCall();
          return;
        }
      }
    }

    if (sessionType === 'CHAT') {
      onJoinChat();
    } else {
      onJoinCall();
    }
  };

  const isTablet = width > 500;

  return (
    <View style={styles.container}>
      {/* Top Header Bar: App Logo + Name/Email */}
      <DashboardHeader
        user={user}
        greeting="Servicio Pastoral"
        roleBadge="CAPELLÁN"
        showAvatar={true}
        avatarUrl={avatarUrl}
      />

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
          hideHeader={true}
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
          refreshTrigger={refreshTrigger}
          onViewReportDetails={(report: PostCallReport) => {
            Alert.alert(
              `Acta #${report.id || report.sessionId}: ${report.subject}`,
              `Capellán: ${report.chaplainUsername || (user?.username ? `Cap. ${user.username}` : 'Servicio Pastoral')}\nSeveridad: ${report.severity}/5\nCategoría: ${report.category}\n\nSíntesis:\n${report.summary}`
            );
          }}
        />

      {/* 2. SHARED DASHBOARD WIDGETS (Perlita, Muro de Oración, Contenidos, Roster, Confidencialidad) */}
      <View style={styles.sharedWidgetsWrapper}>
        <SharedDashboardWidgets
          onNavigateToBible={onNavigateToBible}
          onNavigateToContent={onNavigateToContent}
          onNavigateToPrayers={onNavigatePrayerWall}
          onNavigateToBlogs={onNavigateToBlogs}
          onJoinCall={onJoinCall}
          onJoinChat={onJoinChat}
          showRoster={true}
          onInitialLoadComplete={() => setIsDashboardReady(true)}
        />
      </View>

      {/* New Report Modal Preview */}
      <NewReportModalPreview
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
          setRefreshTrigger((prev) => prev + 1);
          Alert.alert(
            'Acta Asentada con Éxito',
            'El informe pastoral ha sido registrado y preservado bajo resguardo canónico inviolable.'
          );
        }}
      />
    </ScrollView>
    {showPreloader ? (
      <AppPreloader
        isAppReady={isDashboardReady}
        subtitle="CONSOLA DE CAPELLANÍA"
        onFinish={() => setShowPreloader(false)}
      />
    ) : null}
    </View>
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
  sharedWidgetsWrapper: {
    marginTop: 16,
    width: '100%',
  },
});
