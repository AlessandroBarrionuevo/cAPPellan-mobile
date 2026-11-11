import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
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
import { NewReportModalPreview } from '../components/reports/NewReportModalPreview';
import { SharedDashboardWidgets, DashboardHeader } from '../components/dashboard';
import { AppPreloader, ENABLE_APP_PRELOADER } from '../components/common';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Activity,
  Shield,
  FileText,
  AlertTriangle,
  Phone,
  MessageSquare,
  Calendar,
  ChevronRight,
  X,
  User,
} from 'lucide-react-native';
import type { AuthUser, CallResponse, SessionType, PostCallReport } from '../types/api';

export interface LeaderDashboardProps {
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

export default function LeaderDashboard({
  onJoinCall,
  onJoinChat,
  lastEndedSessionId,
  onClearEndedSession,
  onNavigateToInformes,
  onNavigatePrayerWall,
  onNavigateToBible,
  onNavigateToContent,
  onNavigateToBlogs,
}: LeaderDashboardProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();

  const [tab, setTab] = useState<'my_duty' | 'team'>('my_duty');
  const [teamSubTab, setTeamSubTab] = useState<'reports' | 'members'>('reports');
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [reports, setReports] = useState<PostCallReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<PostCallReport | null>(null);

  // Duty and report states
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
      loadTeamReports();
    }
  }, [tab]);

  const loadTeam = async () => {
    setIsLoadingTeam(true);
    try {
      const leaderParam = user?.userId ? `&leaderId=${user.userId}` : '';
      const users = await request<AuthUser[]>(`${ENDPOINTS.USERS}?role=CHAPLAIN${leaderParam}`);
      setTeamMembers(users || []);
    } catch (e) {
      // Fallback
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const loadTeamReports = async () => {
    setIsLoadingReports(true);
    try {
      const leaderParam = user?.userId ? `?leaderId=${user.userId}` : '';
      const data = await request<PostCallReport[]>(`${ENDPOINTS.REPORTS}${leaderParam}`);
      setReports(data || []);
    } catch (e) {
      // Fallback
    } finally {
      setIsLoadingReports(false);
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

  const handleAcceptCall = async (sessionType: SessionType) => {
    try {
      const refreshed = await request<CallResponse>(ENDPOINTS.CALLS_ASSIGNED);
      if (refreshed) {
        setAssignedCall(refreshed);
        useCallStore.getState().setSession(refreshed);
      }
    } catch (err) {
      console.warn('[LeaderDashboard] Error claiming assigned call:', err);
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
        greeting="Comando Pastoral"
        roleBadge="LÍDER"
      />

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
              loadTeamReports();
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
            <Text style={styles.teamHeaderTitle}>Supervisión de Escuadrón</Text>
            <Text style={styles.teamHeaderSubtitle}>
              Monitoreo de guardias, atenciones y actas pastorales de tu equipo.
            </Text>
          </View>

          {/* Squad KPIs */}
          {(() => {
            const criticalCount = reports.filter((r) => r.severity >= 4).length;
            return (
              <View style={styles.teamStatsRow}>
                <View style={[styles.teamStatCard, globalStyles.shadowSoft]}>
                  <Users size={16} color={Theme.colors.tacticalNavy} />
                  <Text style={styles.teamStatValue}>{teamMembers.length}</Text>
                  <Text style={styles.teamStatLabel}>Capellanes</Text>
                </View>
                <View style={[styles.teamStatCard, globalStyles.shadowSoft]}>
                  <FileText size={16} color="#059669" />
                  <Text style={styles.teamStatValue}>{reports.length}</Text>
                  <Text style={styles.teamStatLabel}>Fichas Totales</Text>
                </View>
                <View
                  style={[
                    styles.teamStatCard,
                    globalStyles.shadowSoft,
                    criticalCount > 0 && { borderColor: '#F87171', backgroundColor: '#FEF2F2' },
                  ]}
                >
                  <AlertTriangle
                    size={16}
                    color={criticalCount > 0 ? '#DC2626' : Theme.colors.outline}
                  />
                  <Text
                    style={[
                      styles.teamStatValue,
                      criticalCount > 0 && { color: '#DC2626' },
                    ]}
                  >
                    {criticalCount}
                  </Text>
                  <Text style={styles.teamStatLabel}>Casos Críticos</Text>
                </View>
              </View>
            );
          })()}

          {/* Sub-tab segmented bar */}
          <View style={styles.subTabBar}>
            <TouchableOpacity
              style={[
                styles.subTabItem,
                teamSubTab === 'reports' && styles.subTabItemActive,
              ]}
              onPress={() => setTeamSubTab('reports')}
              activeOpacity={0.8}
            >
              <FileText
                size={14}
                color={
                  teamSubTab === 'reports'
                    ? Theme.colors.tacticalNavy
                    : Theme.colors.outline
                }
              />
              <Text
                style={[
                  styles.subTabItemText,
                  teamSubTab === 'reports' && styles.subTabItemTextActive,
                ]}
              >
                Fichas del Equipo ({reports.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subTabItem,
                teamSubTab === 'members' && styles.subTabItemActive,
              ]}
              onPress={() => setTeamSubTab('members')}
              activeOpacity={0.8}
            >
              <Users
                size={14}
                color={
                  teamSubTab === 'members'
                    ? Theme.colors.tacticalNavy
                    : Theme.colors.outline
                }
              />
              <Text
                style={[
                  styles.subTabItemText,
                  teamSubTab === 'members' && styles.subTabItemTextActive,
                ]}
              >
                Capellanes ({teamMembers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sub-tab 1: Reports Feed */}
          {teamSubTab === 'reports' && (
            <View style={{ gap: 10, marginTop: 6 }}>
              {isLoadingReports ? (
                <ActivityIndicator
                  size="large"
                  color={Theme.colors.tacticalNavy}
                  style={{ marginTop: 30 }}
                />
              ) : reports.length === 0 ? (
                <View style={[styles.emptyCard, globalStyles.shadowSoft]}>
                  <FileText size={36} color={Theme.colors.outline} />
                  <Text style={styles.emptyTitle}>Sin actas registradas</Text>
                  <Text style={styles.emptyText}>
                    Tus capellanes asignados aún no han cargado fichas posteriores a sus guardias.
                  </Text>
                </View>
              ) : (
                reports.map((report) => {
                  const isSevere = report.severity >= 4;
                  const channel = report.sessionType || 'VIDEO';

                  return (
                    <TouchableOpacity
                      key={report.id || report.sessionId}
                      style={[
                        styles.reportCard,
                        globalStyles.shadowSoft,
                        isSevere && styles.reportCardSevere,
                      ]}
                      onPress={() => setSelectedReportDetail(report)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.reportCardHeader}>
                        <View style={styles.reportAuthorBadge}>
                          <User size={12} color={Theme.colors.tacticalNavy} />
                          <Text style={styles.reportAuthorText}>
                            {report.chaplainUsername || `Capellán #${report.createdBy}`}
                          </Text>
                        </View>

                        <View style={styles.reportChannelBadge}>
                          {channel === 'CHAT' ? (
                            <MessageSquare size={11} color="#0284C7" />
                          ) : (
                            <Phone size={11} color="#059669" />
                          )}
                          <Text style={styles.reportChannelText}>
                            {channel === 'CHAT' ? 'Chat' : 'Llamada'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.reportSeverityPill,
                            isSevere
                              ? styles.reportSeveritySevere
                              : report.severity === 3
                              ? styles.reportSeverityWarning
                              : styles.reportSeverityNormal,
                          ]}
                        >
                          {isSevere && <AlertTriangle size={10} color="#FFFFFF" />}
                          <Text
                            style={[
                              styles.reportSeverityText,
                              isSevere && { color: '#FFFFFF', fontWeight: 'bold' },
                            ]}
                          >
                            Sev. {report.severity}/5
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.reportSubject} numberOfLines={1}>
                        {report.subject}
                      </Text>
                      <Text style={styles.reportSummary} numberOfLines={2}>
                        {report.summary}
                      </Text>

                      <View style={styles.reportCardFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} color={Theme.colors.outline} />
                          <Text style={styles.reportDate}>
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Fecha reciente'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Text style={styles.reportViewMore}>Ver Detalle</Text>
                          <ChevronRight size={13} color={Theme.colors.tacticalNavy} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* Sub-tab 2: Team Members */}
          {teamSubTab === 'members' && (
            <View style={{ gap: 10, marginTop: 6 }}>
              {isLoadingTeam ? (
                <ActivityIndicator
                  size="large"
                  color={Theme.colors.tacticalNavy}
                  style={{ marginTop: 30 }}
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
                      <Text style={styles.memberRole}>
                        Capellán de Equipo · ID #{member.userId}
                      </Text>
                    </View>
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineBadgeDot} />
                      <Text style={styles.onlineBadgeText}>ACTIVO</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Report Detail Modal */}
          <Modal
            visible={!!selectedReportDetail}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedReportDetail(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, globalStyles.shadowSoft]}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCategory}>
                      ACTA #{selectedReportDetail?.id || selectedReportDetail?.sessionId} • {selectedReportDetail?.category}
                    </Text>
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {selectedReportDetail?.subject}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedReportDetail(null)}
                    style={styles.closeBtn}
                  >
                    <X size={20} color={Theme.colors.outline} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Meta box */}
                  <View style={styles.modalMetaBox}>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Capellán:</Text>
                      <Text style={styles.modalMetaValue}>
                        {selectedReportDetail?.chaplainUsername || `#${selectedReportDetail?.createdBy}`}
                      </Text>
                    </View>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Canal:</Text>
                      <Text style={styles.modalMetaValue}>
                        {selectedReportDetail?.sessionType === 'CHAT' ? 'Chat Escrito' : 'Llamada de Video/Voz'}
                      </Text>
                    </View>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Severidad:</Text>
                      <Text
                        style={[
                          styles.modalMetaValue,
                          (selectedReportDetail?.severity ?? 0) >= 4 && {
                            color: '#DC2626',
                            fontWeight: 'bold',
                          },
                        ]}
                      >
                        {selectedReportDetail?.severity}/5
                      </Text>
                    </View>
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Fecha:</Text>
                      <Text style={styles.modalMetaValue}>
                        {selectedReportDetail?.createdAt
                          ? new Date(selectedReportDetail.createdAt).toLocaleString('es-AR')
                          : 'Reciente'}
                      </Text>
                    </View>
                  </View>

                  {/* Summary */}
                  <Text style={styles.modalSectionLabel}>SÍNTESIS PASTORAL</Text>
                  <View style={styles.modalSummaryBox}>
                    <Text style={styles.modalSummaryText}>
                      {selectedReportDetail?.summary}
                    </Text>
                  </View>

                  {(selectedReportDetail?.severity ?? 0) >= 4 && (
                    <View style={styles.modalAlertBanner}>
                      <AlertTriangle size={16} color="#DC2626" />
                      <Text style={styles.modalAlertText}>
                        Alerta de supervisión: Caso crítico catalogado con severidad alta. Corresponde verificar seguimiento y derivación institucional.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
      {showPreloader ? (
        <AppPreloader
          isAppReady={isDashboardReady}
          subtitle="CONSOLA DE LIDERAZGO"
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
  sharedWidgetsWrapper: {
    marginTop: 16,
    width: '100%',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: Theme.roundness.sm,
    padding: 3,
    marginTop: 10,
    marginBottom: 4,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: Theme.roundness.xs,
  },
  subTabItemActive: {
    backgroundColor: '#FFFFFF',
    ...globalStyles.shadowSoft,
  },
  subTabItemText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  subTabItemTextActive: {
    color: Theme.colors.tacticalNavy,
    fontWeight: 'bold',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  reportCardSevere: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  reportAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  reportAuthorText: {
    ...globalStyles.bodySm,
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.tacticalNavy,
  },
  reportChannelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportChannelText: {
    ...globalStyles.bodySm,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  reportSeverityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reportSeverityNormal: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  reportSeverityWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reportSeveritySevere: {
    backgroundColor: '#DC2626',
  },
  reportSeverityText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: '#065F46',
  },
  reportSubject: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
    marginTop: 2,
  },
  reportSummary: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 15,
  },
  reportCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reportDate: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.outline,
  },
  reportViewMore: {
    ...globalStyles.bodySm,
    fontSize: 10,
    fontWeight: 'bold',
    color: Theme.colors.tacticalNavy,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Theme.roundness.lg,
    borderTopRightRadius: Theme.roundness.lg,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalCategory: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.tacticalNavy,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  modalMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalMetaLabel: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.outline,
  },
  modalMetaValue: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.onSurface,
  },
  modalSectionLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.outline,
    marginBottom: 6,
  },
  modalSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalSummaryText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurface,
    lineHeight: 18,
  },
  modalAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: Theme.roundness.sm,
    marginBottom: 20,
  },
  modalAlertText: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: '#991B1B',
    flex: 1,
  },
});
