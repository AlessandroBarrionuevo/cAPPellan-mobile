import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAuthStore } from '../lib/stores/auth';
import { useChaplainStore } from '../lib/stores/chaplain';
import { useCallStore } from '../lib/stores/call';
import { request, setClientToken } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { useAppInsets } from '../lib/safeArea';
import DutyConsole from '../components/duty/DutyConsole';
import NewReportModal from '../components/reports/NewReportModal';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Activity,
  Shield,
} from 'lucide-react-native';
import type { AuthUser, CallResponse, SessionType, PostCallReport } from '../types/api';

export interface LeaderDashboardProps {
  onJoinCall: () => void;
  onJoinChat: () => void;
  lastEndedSessionId: number | null;
  onClearEndedSession: () => void;
  onNavigateToInformes?: () => void;
  onNavigatePrayerWall?: () => void;
}

export default function LeaderDashboard({
  onJoinCall,
  onJoinChat,
  lastEndedSessionId,
  onClearEndedSession,
  onNavigateToInformes,
  onNavigatePrayerWall,
}: LeaderDashboardProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();

  const [tab, setTab] = useState<'my_duty' | 'team'>('my_duty');
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  // Duty and report states
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


  useEffect(() => {
    if (tab === 'team') {
      loadTeam();
    }
  }, [tab]);

  const loadTeam = async () => {
    setIsLoadingTeam(true);
    try {
      const users = await request<AuthUser[]>(`${ENDPOINTS.USERS}?role=CHAPLAIN`);
      setTeamMembers(users || []);
    } catch (e) {
      // Fallback
    } finally {
      setIsLoadingTeam(false);
    }
  };

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
    <View style={styles.container}>
      {/* Top Segmented Tab Switch */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, tab === 'my_duty' && styles.tabItemActive]}
            onPress={() => setTab('my_duty')}
            activeOpacity={0.8}
          >
            <ShieldCheck size={15} color={tab === 'my_duty' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text
              style={[
                styles.tabItemText,
                tab === 'my_duty' && styles.tabItemTextActive,
              ]}
            >
              Mi Guardia
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tab === 'team' && styles.tabItemActive]}
            onPress={() => setTab('team')}
            activeOpacity={0.8}
          >
            <Users size={15} color={tab === 'team' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text
              style={[
                styles.tabItemText,
                tab === 'team' && styles.tabItemTextActive,
              ]}
            >
              Equipo ({teamMembers.length || '•'})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab 1: Leader's Duty & Reports with Supervise Mode */}
      {tab === 'my_duty' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 },
            isTablet && styles.tabletContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
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
                'El informe pastoral ha sido registrado bajo resguardo institucional.'
              );
            }}
          />
        </ScrollView>
      )}

      {/* Tab 2: Team Roster & Duty Supervision */}
      {tab === 'team' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.teamContentContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 100 },
            isTablet && styles.tabletContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.teamHeader}>
            <Text style={styles.teamHeaderTitle}>Escuadrón de Capellanía</Text>
            <Text style={styles.teamHeaderSubtitle}>
              Supervisión de guardias operativas y estado de disponibilidad en tiempo real.
            </Text>
          </View>

          {/* Squad KPIs */}
          <View style={styles.teamStatsRow}>
            <View style={[styles.teamStatCard, globalStyles.shadowSoft]}>
              <Activity size={16} color="#059669" />
              <Text style={styles.teamStatValue}>{teamMembers.length}</Text>
              <Text style={styles.teamStatLabel}>Total Capellanes</Text>
            </View>
            <View style={[styles.teamStatCard, globalStyles.shadowSoft]}>
              <Shield size={16} color={Theme.colors.tacticalNavy} />
              <Text style={styles.teamStatValue}>100%</Text>
              <Text style={styles.teamStatLabel}>Cobertura Red</Text>
            </View>
          </View>

          {isLoadingTeam ? (
            <ActivityIndicator
              size="large"
              color={Theme.colors.tacticalNavy}
              style={{ marginTop: 40 }}
            />
          ) : teamMembers.length === 0 ? (
            <View style={[styles.emptyCard, globalStyles.shadowSoft]}>
              <Users size={36} color={Theme.colors.outline} />
              <Text style={styles.emptyTitle}>Sin capellanes asignados</Text>
              <Text style={styles.emptyText}>
                No se registran efectivos subordinados en la lista de guardia actual.
              </Text>
            </View>
          ) : (
            teamMembers.map((member) => (
              <View
                key={member.userId}
                style={[styles.memberCard, globalStyles.shadowSoft]}
              >
                <View style={styles.memberAvatar}>
                  <UserCheck size={20} color={Theme.colors.tacticalNavy} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberRole}>Capellán Destacado · ID #{member.userId}</Text>
                </View>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineBadgeDot} />
                  <Text style={styles.onlineBadgeText}>ACTIVO</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabBarWrapper: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 10,
    paddingBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: Theme.roundness.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Theme.roundness.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    ...globalStyles.shadowSoft,
  },
  tabItemText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabItemTextActive: {
    color: Theme.colors.tacticalNavy,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 12,
    gap: 14,
  },
  teamContentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 14,
    gap: 12,
  },
  tabletContent: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  teamHeader: {
    marginBottom: 4,
  },
  teamHeaderTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  teamHeaderSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  teamStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  teamStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
  },
  teamStatValue: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    color: Theme.colors.onSurface,
    lineHeight: 24,
  },
  teamStatLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  memberRole: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  onlineBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  onlineBadgeText: {
    ...globalStyles.labelCaps,
    color: '#065F46',
    fontSize: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  emptyText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
