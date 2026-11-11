import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { DashboardHeader } from '../components/dashboard';
import { AppPreloader, ENABLE_APP_PRELOADER } from '../components/common';
import { useAuthStore } from '../lib/stores/auth';
import type { AuthUser, AppRole, PostCallReport, ReportStats } from '../types/api';
import {
  UserPlus,
  Shield,
  User,
  X,
  RefreshCw,
  Users,
  FileText,
  BarChart3,
  AlertTriangle,
  Phone,
  MessageSquare,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowRightLeft,
  Eye,
  EyeOff,
} from 'lucide-react-native';

export default function SuperuserDashboard() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<'teams' | 'reports' | 'stats' | 'users'>('teams');

  // Users & Teams state
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Reassignment state
  const [reassignTarget, setReassignTarget] = useState<AuthUser | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [role, setRole] = useState<AppRole>('CHAPLAIN');
  const [assignedLeaderId, setAssignedLeaderId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reports state
  const [reports, setReports] = useState<PostCallReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<PostCallReport | null>(null);

  // Stats state
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDashboardReady, setIsDashboardReady] = useState(false);
  const [showPreloader, setShowPreloader] = useState<boolean>(ENABLE_APP_PRELOADER);

  useEffect(() => {
    void Promise.allSettled([loadUsers(), loadReports(), loadStats()]).then(() => {
      setIsDashboardReady(true);
    });
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await request<AuthUser[]>(ENDPOINTS.USERS);
      setUsers(data || []);
    } catch (err: any) {
      // Fallback
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      const data = await request<PostCallReport[]>(ENDPOINTS.REPORTS);
      setReports(data || []);
    } catch (err: any) {
      // Fallback
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await request<ReportStats>(ENDPOINTS.REPORT_STATS);
      setStats(data || null);
    } catch (err: any) {
      // Fallback
    } finally {
      setIsLoadingStats(false);
    }
  };

  const leaders = users.filter((u) => u.role === 'CHAPLAIN_LEADER');
  const chaplains = users.filter((u) => u.role === 'CHAPLAIN');
  const unassignedChaplains = chaplains.filter((u) => u.leaderId == null);

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Completá usuario y contraseña');
      return;
    }

    setIsCreating(true);
    try {
      await request(ENDPOINTS.USERS, {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role,
          userId: role === 'CHAPLAIN' ? assignedLeaderId : null,
        }),
      });

      Alert.alert('Éxito', `Usuario ${username} creado correctamente`);
      setShowCreateModal(false);
      setUsername('');
      setPassword('');
      setAssignedLeaderId(null);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el usuario');
    } finally {
      setIsCreating(false);
    }
  };

  const handleReassign = async (chaplainId: number, newLeaderId: number | null) => {
    setIsReassigning(true);
    try {
      await request(ENDPOINTS.USER_DETAIL(chaplainId), {
        method: 'PATCH',
        body: JSON.stringify({ userId: newLeaderId }),
      });

      Alert.alert('Éxito', 'Equipo actualizado correctamente');
      setReassignTarget(null);
      loadUsers();
      loadReports();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo reasignar el capellán');
    } finally {
      setIsReassigning(false);
    }
  };

  const filteredReports = onlyCritical
    ? reports.filter((r) => r.severity >= 4)
    : reports;

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <DashboardHeader
        user={user}
        greeting="Comando General"
        roleBadge="SUPERUSER"
      />

      {/* Top Segmented Navigation Tabs */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, tab === 'teams' && styles.tabItemActive]}
            onPress={() => setTab('teams')}
            activeOpacity={0.8}
          >
            <Shield size={14} color={tab === 'teams' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text style={[styles.tabItemText, tab === 'teams' && styles.tabItemTextActive]}>
              Equipos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tab === 'reports' && styles.tabItemActive]}
            onPress={() => setTab('reports')}
            activeOpacity={0.8}
          >
            <FileText size={14} color={tab === 'reports' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text style={[styles.tabItemText, tab === 'reports' && styles.tabItemTextActive]}>
              Reportes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tab === 'stats' && styles.tabItemActive]}
            onPress={() => setTab('stats')}
            activeOpacity={0.8}
          >
            <BarChart3 size={14} color={tab === 'stats' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text style={[styles.tabItemText, tab === 'stats' && styles.tabItemTextActive]}>
              Métricas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, tab === 'users' && styles.tabItemActive]}
            onPress={() => setTab('users')}
            activeOpacity={0.8}
          >
            <Users size={14} color={tab === 'users' ? Theme.colors.tacticalNavy : Theme.colors.outline} />
            <Text style={[styles.tabItemText, tab === 'users' && styles.tabItemTextActive]}>
              Cuentas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: TEAMS & SQUAD MANAGEMENT */}
        {tab === 'teams' && (
          <View style={{ gap: 14 }}>
            {/* KPI Row */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
                <ShieldCheck size={18} color={Theme.colors.tacticalNavy} />
                <Text style={styles.kpiValue}>{leaders.length}</Text>
                <Text style={styles.kpiLabel}>Equipos / Líderes</Text>
              </View>
              <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
                <Users size={18} color="#059669" />
                <Text style={styles.kpiValue}>{chaplains.length}</Text>
                <Text style={styles.kpiLabel}>Capellanes Totales</Text>
              </View>
              <View
                style={[
                  styles.kpiCard,
                  globalStyles.shadowSoft,
                  unassignedChaplains.length > 0 && { borderColor: '#FCD34D', backgroundColor: '#FEFCE8' },
                ]}
              >
                <AlertCircle
                  size={18}
                  color={unassignedChaplains.length > 0 ? '#D97706' : Theme.colors.outline}
                />
                <Text
                  style={[
                    styles.kpiValue,
                    unassignedChaplains.length > 0 && { color: '#D97706' },
                  ]}
                >
                  {unassignedChaplains.length}
                </Text>
                <Text style={styles.kpiLabel}>Sin Asignar</Text>
              </View>
            </View>

            {/* Unassigned Chaplains Alert Card */}
            {unassignedChaplains.length > 0 && (
              <View style={[styles.unassignedBox, globalStyles.shadowSoft]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <AlertCircle size={15} color="#D97706" />
                  <Text style={styles.unassignedTitle}>
                    Capellanes sin equipo asignado ({unassignedChaplains.length})
                  </Text>
                </View>
                <Text style={styles.unassignedSubtitle}>
                  Estos efectivos no tienen un Capellán Líder designado para supervisión:
                </Text>
                <View style={{ gap: 6, marginTop: 8 }}>
                  {unassignedChaplains.map((ch) => (
                    <View key={ch.userId} style={styles.unassignedRow}>
                      <Text style={styles.unassignedName}>{ch.username}</Text>
                      <TouchableOpacity
                        style={styles.assignBtn}
                        onPress={() => setReassignTarget(ch)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.assignBtnText}>Asignar Líder</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Teams List */}
            <Text style={styles.sectionTitle}>Equipos Conformados ({leaders.length})</Text>

            {isLoadingUsers ? (
              <ActivityIndicator size="large" color={Theme.colors.tacticalNavy} style={{ marginTop: 20 }} />
            ) : leaders.length === 0 ? (
              <View style={[styles.emptyCard, globalStyles.shadowSoft]}>
                <Shield size={32} color={Theme.colors.outline} />
                <Text style={styles.emptyTitle}>No hay líderes designados</Text>
                <Text style={styles.emptyText}>
                  Creá o promovés usuarios al rol CHAPLAIN_LEADER para crear escuadras.
                </Text>
              </View>
            ) : (
              leaders.map((leader) => {
                const members = chaplains.filter((c) => c.leaderId === leader.userId);

                return (
                  <View key={leader.userId} style={[styles.teamCard, globalStyles.shadowSoft]}>
                    <View style={styles.teamCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.leaderAvatar}>
                          <ShieldCheck size={18} color={Theme.colors.tacticalNavy} />
                        </View>
                        <View>
                          <Text style={styles.teamTitle}>Equipo {leader.username}</Text>
                          <Text style={styles.teamLeaderSub}>Líder a cargo (ID #{leader.userId})</Text>
                        </View>
                      </View>
                      <View style={styles.teamMemberBadge}>
                        <Text style={styles.teamMemberBadgeText}>
                          {members.length} {members.length === 1 ? 'efectivo' : 'efectivos'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.teamMembersContainer}>
                      {members.length === 0 ? (
                        <Text style={styles.noMembersText}>Sin capellanes asignados a este líder aún.</Text>
                      ) : (
                        members.map((member) => (
                          <View key={member.userId} style={styles.memberItemRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <User size={13} color={Theme.colors.outline} />
                              <Text style={styles.memberItemName}>{member.username}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.reassignBtn}
                              onPress={() => setReassignTarget(member)}
                              activeOpacity={0.8}
                            >
                              <ArrowRightLeft size={11} color={Theme.colors.tacticalNavy} />
                              <Text style={styles.reassignBtnText}>Mover</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: REPORTS EXPLORER WITH DISCRIMINATION */}
        {tab === 'reports' && (
          <View style={{ gap: 12 }}>
            <View style={styles.reportsToolRow}>
              <View>
                <Text style={styles.sectionTitle}>Reportes y Actas Globales</Text>
                <Text style={styles.sectionSubtitle}>
                  Discriminados por autor, equipo y severidad
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.urgentFilterBtn, onlyCritical && styles.urgentFilterBtnActive]}
                onPress={() => setOnlyCritical(!onlyCritical)}
                activeOpacity={0.8}
              >
                <AlertTriangle size={12} color={onlyCritical ? '#FFFFFF' : '#DC2626'} />
                <Text
                  style={[
                    styles.urgentFilterBtnText,
                    onlyCritical && { color: '#FFFFFF', fontWeight: 'bold' },
                  ]}
                >
                  Solo Críticos (≥4)
                </Text>
              </TouchableOpacity>
            </View>

            {isLoadingReports ? (
              <ActivityIndicator size="large" color={Theme.colors.tacticalNavy} style={{ marginTop: 20 }} />
            ) : filteredReports.length === 0 ? (
              <View style={[styles.emptyCard, globalStyles.shadowSoft]}>
                <FileText size={32} color={Theme.colors.outline} />
                <Text style={styles.emptyTitle}>Sin fichas registradas</Text>
                <Text style={styles.emptyText}>No hay reportes que coincidan con el filtro.</Text>
              </View>
            ) : (
              filteredReports.map((report) => {
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
                      {/* Author badge */}
                      <View style={styles.reportAuthorBadge}>
                        <User size={11} color={Theme.colors.tacticalNavy} />
                        <Text style={styles.reportAuthorText}>
                          {report.chaplainUsername || `#${report.createdBy}`}
                        </Text>
                      </View>

                      {/* Team badge */}
                      <View style={styles.reportTeamBadge}>
                        <Shield size={10} color={Theme.colors.outline} />
                        <Text style={styles.reportTeamText}>
                          {report.leaderUsername
                            ? `Equipo ${report.leaderUsername}`
                            : report.leaderId
                            ? `Equipo #${report.leaderId}`
                            : 'Sin equipo'}
                        </Text>
                      </View>

                      {/* Channel */}
                      <View style={styles.reportChannelBadge}>
                        {channel === 'CHAT' ? (
                          <MessageSquare size={10} color="#0284C7" />
                        ) : (
                          <Phone size={10} color="#059669" />
                        )}
                        <Text style={styles.reportChannelText}>
                          {channel === 'CHAT' ? 'Chat' : 'Llamada'}
                        </Text>
                      </View>

                      {/* Severity */}
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
                        {isSevere && <AlertTriangle size={9} color="#FFFFFF" />}
                        <Text
                          style={[
                            styles.reportSeverityText,
                            isSevere && { color: '#FFFFFF', fontWeight: 'bold' },
                          ]}
                        >
                          {report.severity}/5
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
                            : 'Reciente'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Text style={styles.reportViewMore}>Ver Ficha</Text>
                        <ChevronRight size={13} color={Theme.colors.tacticalNavy} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* TAB 3: MACRO PLATFORM STATS */}
        {tab === 'stats' && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>Métricas Globales de Plataforma</Text>
            <Text style={styles.sectionSubtitle}>
              Volumen y calidad de las atenciones pastorales en tiempo real
            </Text>

            {isLoadingStats ? (
              <ActivityIndicator size="large" color={Theme.colors.tacticalNavy} style={{ marginTop: 20 }} />
            ) : !stats ? (
              <View style={[styles.emptyCard, globalStyles.shadowSoft]}>
                <BarChart3 size={32} color={Theme.colors.outline} />
                <Text style={styles.emptyTitle}>Sin métricas disponibles</Text>
                <Text style={styles.emptyText}>No se registraron datos suficientes para procesar métricas.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {/* Macro Counters */}
                <View style={styles.kpiRow}>
                  <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
                    <FileText size={18} color={Theme.colors.tacticalNavy} />
                    <Text style={styles.kpiValue}>{stats.totalReports}</Text>
                    <Text style={styles.kpiLabel}>Actas Totales</Text>
                  </View>
                  <View
                    style={[
                      styles.kpiCard,
                      globalStyles.shadowSoft,
                      stats.criticalAlertsCount > 0 && {
                        borderColor: '#F87171',
                        backgroundColor: '#FEF2F2',
                      },
                    ]}
                  >
                    <AlertTriangle
                      size={18}
                      color={stats.criticalAlertsCount > 0 ? '#DC2626' : Theme.colors.outline}
                    />
                    <Text
                      style={[
                        styles.kpiValue,
                        stats.criticalAlertsCount > 0 && { color: '#DC2626' },
                      ]}
                    >
                      {stats.criticalAlertsCount}
                    </Text>
                    <Text style={styles.kpiLabel}>Casos Críticos</Text>
                  </View>
                </View>

                {/* Channel Breakdown */}
                <View style={[styles.statsSectionBox, globalStyles.shadowSoft]}>
                  <Text style={styles.statsBoxTitle}>CANAL DE ATENCIÓN</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <View style={styles.channelStatItem}>
                      <Phone size={14} color="#059669" />
                      <Text style={styles.channelStatVal}>{stats.bySessionType['VIDEO'] || 0}</Text>
                      <Text style={styles.channelStatLabel}>Llamadas Video/Voz</Text>
                    </View>
                    <View style={styles.channelStatItem}>
                      <MessageSquare size={14} color="#0284C7" />
                      <Text style={styles.channelStatVal}>{stats.bySessionType['CHAT'] || 0}</Text>
                      <Text style={styles.channelStatLabel}>Terminal de Chat</Text>
                    </View>
                  </View>
                </View>

                {/* Category Breakdown */}
                <View style={[styles.statsSectionBox, globalStyles.shadowSoft]}>
                  <Text style={styles.statsBoxTitle}>DISTRIBUCIÓN POR CATEGORÍA</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <View key={cat} style={styles.categoryStatRow}>
                        <Text style={styles.categoryStatName}>{cat}</Text>
                        <Text style={styles.categoryStatCount}>{count} casos</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 4: USERS DIRECTORY */}
        {tab === 'users' && (
          <View style={{ gap: 12 }}>
            <View style={styles.actionRow}>
              <View>
                <Text style={styles.sectionTitle}>Directorio de Cuentas ({users.length})</Text>
                <Text style={styles.sectionSubtitle}>Administración de credenciales y roles</Text>
              </View>

              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <UserPlus size={16} color="#FFFFFF" />
                <Text style={styles.createBtnText}>Nuevo Usuario</Text>
              </TouchableOpacity>
            </View>

            {isLoadingUsers ? (
              <ActivityIndicator size="large" color={Theme.colors.tacticalNavy} style={{ marginTop: 20 }} />
            ) : (
              users.map((item) => (
                <View key={item.userId} style={[styles.userCard, globalStyles.shadowSoft]}>
                  <View style={styles.userAvatar}>
                    <User size={18} color={Theme.colors.tacticalNavy} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.username}</Text>
                    <Text style={styles.userRole}>
                      ID #{item.userId}
                      {item.leaderId ? ` · Líder ID #${item.leaderId}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      item.role === 'SUPERUSER' && { backgroundColor: '#FCE8E6' },
                      item.role === 'CHAPLAIN_LEADER' && { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        item.role === 'SUPERUSER' && { color: '#C5221F' },
                        item.role === 'CHAPLAIN_LEADER' && { color: '#0369A1' },
                      ]}
                    >
                      {item.role}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* CREATE USER MODAL WITH LEADER PICKER */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, globalStyles.shadowSoft]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: capellan_carlos"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 4 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showCreatePassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordEyeBtn}
                  onPress={() => setShowCreatePassword((prev) => !prev)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showCreatePassword ? (
                    <EyeOff size={18} color={Theme.colors.onSurfaceVariant} />
                  ) : (
                    <Eye size={18} color={Theme.colors.onSurfaceVariant} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Rol en la Plataforma</Text>
              <View style={styles.roleOptions}>
                {(
                  [
                    'BASIC',
                    'CHAPLAIN',
                    'CHAPLAIN_LEADER',
                    'CHAPLAIN_CONTENT_LEADER',
                    'SUPERUSER',
                  ] as AppRole[]
                ).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOptionPill,
                      role === r && styles.roleOptionPillActive,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleOptionPillText,
                        role === r && styles.roleOptionPillTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Leader assignment when role is CHAPLAIN */}
              {role === 'CHAPLAIN' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>Asignar Capellán Líder / Equipo</Text>
                  <View style={{ gap: 6, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        styles.leaderOptionPill,
                        assignedLeaderId === null && styles.leaderOptionPillActive,
                      ]}
                      onPress={() => setAssignedLeaderId(null)}
                    >
                      <Text
                        style={[
                          styles.leaderOptionText,
                          assignedLeaderId === null && styles.leaderOptionTextActive,
                        ]}
                      >
                        Sin equipo asignado (por ahora)
                      </Text>
                    </TouchableOpacity>

                    {leaders.map((ldr) => (
                      <TouchableOpacity
                        key={ldr.userId}
                        style={[
                          styles.leaderOptionPill,
                          assignedLeaderId === ldr.userId && styles.leaderOptionPillActive,
                        ]}
                        onPress={() => setAssignedLeaderId(ldr.userId)}
                      >
                        <Text
                          style={[
                            styles.leaderOptionText,
                            assignedLeaderId === ldr.userId && styles.leaderOptionTextActive,
                          ]}
                        >
                          Equipo {ldr.username} (ID #{ldr.userId})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateUser}
                disabled={isCreating}
                activeOpacity={0.85}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirmar Creación</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REASSIGN CHAPLAIN MODAL */}
      <Modal visible={!!reassignTarget} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, globalStyles.shadowSoft]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalCategory}>REASIGNACIÓN DE EQUIPO</Text>
                <Text style={styles.modalTitle}>
                  {reassignTarget?.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReassignTarget(null)}
                style={styles.closeBtn}
              >
                <X size={20} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sectionSubtitle, { marginBottom: 12 }]}>
                Seleccioná a qué Capellán Líder responderá este efectivo:
              </Text>

              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.reassignOption,
                    reassignTarget?.leaderId == null && styles.reassignOptionActive,
                  ]}
                  onPress={() => reassignTarget && handleReassign(reassignTarget.userId, null)}
                  disabled={isReassigning}
                >
                  <Text style={styles.reassignOptionText}>Desvincular (Sin Líder)</Text>
                </TouchableOpacity>

                {leaders.map((ldr) => (
                  <TouchableOpacity
                    key={ldr.userId}
                    style={[
                      styles.reassignOption,
                      reassignTarget?.leaderId === ldr.userId && styles.reassignOptionActive,
                    ]}
                    onPress={() => reassignTarget && handleReassign(reassignTarget.userId, ldr.userId)}
                    disabled={isReassigning}
                  >
                    <Text style={styles.reassignOptionText}>
                      Equipo {ldr.username} (ID #{ldr.userId})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REPORT DETAIL MODAL */}
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
              <View style={styles.modalMetaBox}>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Capellán Autor:</Text>
                  <Text style={styles.modalMetaValue}>
                    {selectedReportDetail?.chaplainUsername || `#${selectedReportDetail?.createdBy}`}
                  </Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Equipo / Líder:</Text>
                  <Text style={styles.modalMetaValue}>
                    {selectedReportDetail?.leaderUsername
                      ? `Equipo ${selectedReportDetail.leaderUsername}`
                      : 'Sin equipo'}
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
              </View>

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
                    Alerta de supervisión: Caso crítico registrado con severidad alta.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showPreloader ? (
        <AppPreloader
          isAppReady={isDashboardReady}
          subtitle="PANEL DE SUPERUSUARIO"
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
    paddingHorizontal: 16,
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
    gap: 5,
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
    fontSize: 10,
  },
  tabItemTextActive: {
    color: Theme.colors.tacticalNavy,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 3,
  },
  kpiValue: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  kpiLabel: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  unassignedBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  unassignedTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13,
    color: '#92400E',
  },
  unassignedSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: '#78350F',
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  unassignedName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  assignBtn: {
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assignBtnText: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 9,
  },
  sectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  sectionSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leaderAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  teamLeaderSub: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  teamMemberBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teamMemberBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.tacticalNavy,
  },
  teamMembersContainer: {
    padding: 10,
    gap: 6,
  },
  noMembersText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.outline,
    textAlign: 'center',
    paddingVertical: 8,
  },
  memberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  memberItemName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reassignBtnText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.tacticalNavy,
    fontSize: 9,
  },
  reportsToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  urgentFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  urgentFilterBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  urgentFilterBtnText: {
    ...globalStyles.labelCaps,
    color: '#DC2626',
    fontSize: 9,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  reportCardSevere: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  reportAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportAuthorText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: Theme.colors.tacticalNavy,
  },
  reportTeamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportTeamText: {
    ...globalStyles.bodySm,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  reportChannelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportChannelText: {
    ...globalStyles.bodySm,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  reportSeverityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reportSeverityNormal: {
    backgroundColor: '#ECFDF5',
  },
  reportSeverityWarning: {
    backgroundColor: '#FEF3C7',
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
    fontSize: 13,
    color: Theme.colors.onSurface,
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
  statsSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsBoxTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.tacticalNavy,
  },
  channelStatItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  channelStatVal: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  channelStatLabel: {
    ...globalStyles.bodySm,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  categoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryStatName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  categoryStatCount: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.tacticalNavy,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.md,
  },
  createBtnText: {
    ...globalStyles.labelCaps,
    color: '#FFFFFF',
    fontSize: 10,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  userRole: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  roleBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
  },
  roleBadgeText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.tacticalNavy,
    fontSize: 9,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  emptyText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  modalCategory: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.tacticalNavy,
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    ...globalStyles.labelCaps,
    color: Theme.colors.tacticalNavy,
    marginBottom: 4,
    marginTop: 10,
    fontSize: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    padding: 10,
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
  },
  passwordEyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  roleOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#F1F5F9',
  },
  roleOptionPillActive: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  roleOptionPillText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  roleOptionPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  leaderOptionPill: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaderOptionPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Theme.colors.tacticalNavy,
  },
  leaderOptionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  leaderOptionTextActive: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.tacticalNavy,
  },
  submitBtn: {
    backgroundColor: Theme.colors.tacticalNavy,
    height: 44,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  submitBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  reassignOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reassignOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Theme.colors.tacticalNavy,
  },
  reassignOptionText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  modalMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 12,
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
