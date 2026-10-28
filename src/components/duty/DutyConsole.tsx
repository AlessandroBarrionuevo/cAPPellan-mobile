import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
} from 'react-native-svg';
import { Theme, globalStyles } from '../../theme/Theme';
import { InstitutionalEmblem } from '../common';
import {
  Video,
  MessageSquare,
  Clock,
  User,
  Timer,
  Heart,
  Radio,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Activity,
  FileText,
  Lock,
  Plus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import type { CallResponse, SessionType, AuthUser, PostCallReport, ReportStats } from '../../types/api';
import ChaplainDutyCardBanner from './ChaplainDutyCardBanner';

export interface DutyConsoleProps {
  user?: AuthUser | null;
  isOnline: boolean;
  isToggling?: boolean;
  onToggleOnline: (val: boolean) => void;
  incomingCall?: CallResponse | null;
  onAcceptCall?: (sessionType: SessionType) => void;
  onOpenNewReport?: () => void;
  onNavigateToInformes?: () => void;
  onNavigatePrayerWall?: () => void;
  onViewReportDetails?: (report: PostCallReport) => void;
  stats?: ReportStats | {
    servedToday?: number;
    listeningHours?: string;
    avgResponseTime?: string;
  } | null;
  reports?: PostCallReport[];
  hideHeader?: boolean;
  refreshTrigger?: number;
}

export default function DutyConsole({
  user,
  isOnline,
  isToggling = false,
  onToggleOnline,
  incomingCall = null,
  onAcceptCall,
  onOpenNewReport,
  onNavigateToInformes,
  onNavigatePrayerWall,
  onViewReportDetails,
  stats,
  reports,
  hideHeader = false,
  refreshTrigger = 0,
}: DutyConsoleProps) {
  const { width } = useWindowDimensions();
  const [notchedCardWidth, setNotchedCardWidth] = useState(0);
  const [internalReports, setInternalReports] = useState<PostCallReport[]>([]);
  const [internalStats, setInternalStats] = useState<ReportStats | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Dynamic fetch of real reports and real stats from backend
  const loadDutyData = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const reportsData = await request<PostCallReport[]>(ENDPOINTS.REPORTS);
      if (Array.isArray(reportsData)) {
        setInternalReports(reportsData);
      }
    } catch (err) {
      console.warn('[DutyConsole] Error fetching reports:', err);
    }

    try {
      const statsData = await request<ReportStats>(ENDPOINTS.REPORT_STATS);
      if (statsData) {
        setInternalStats(statsData);
      }
    } catch (err) {
      console.warn('[DutyConsole] Error fetching stats:', err);
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadDutyData();
  }, [loadDutyData, refreshTrigger]);

  const effectiveReports = reports ?? internalReports;
  const effectiveStats = (stats && 'totalReports' in stats) ? (stats as ReportStats) : internalStats;
  // Pulse animation for online indicator & incoming alert
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isOnline || incomingCall) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isOnline, incomingCall, pulseAnim]);

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'EMOTIONAL_CRISIS':
      case 'CRISIS':
        return { label: 'Crisis / Duelo', bg: '#FEF3C7', text: '#92400E' };
      case 'SPIRITUAL_COUNSELING':
      case 'SPIRITUAL':
        return { label: 'Consejería', bg: '#DBEAFE', text: '#1E40AF' };
      case 'PRAYER_REQUEST':
        return { label: 'Oración', bg: '#EDE9FE', text: '#5B21B6' };
      case 'FAMILY':
        return { label: 'Familia', bg: '#DCFCE7', text: '#166534' };
      case 'PERSONAL':
        return { label: 'Personal', bg: '#E0E7FF', text: '#3730A3' };
      default:
        return { label: 'Asistencia', bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getSeverityDot = (sev: number) => {
    if (sev >= 4) return '#EF4444';
    if (sev === 3) return '#F59E0B';
    return '#3B82F6';
  };

  const formatReportDate = (rawDate?: string) => {
    if (!rawDate) return 'Reciente';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Hoy · ${timeStr}`;
      return `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} · ${timeStr}`;
    } catch {
      return rawDate;
    }
  };

  // Dynamic Real Metrics calculation from backend
  const totalReportsCount = effectiveStats?.totalReports ?? effectiveReports.length;
  const criticalAlertsCount =
    effectiveStats?.criticalAlertsCount ??
    effectiveReports.filter((r) => r.severity >= 4).length;
  const videoCount =
    effectiveStats?.bySessionType?.['VIDEO'] ??
    effectiveReports.filter((r) => r.sessionType === 'VIDEO').length;
  const chatCount =
    effectiveStats?.bySessionType?.['CHAT'] ??
    effectiveReports.filter((r) => r.sessionType === 'CHAT').length;

  const latestReport = effectiveReports[0];
  const nW = notchedCardWidth || Math.min(width - 32, 420);
  const nH = 180;
  const notchW = 142;
  const notchH = 58;
  const xCut = nW - notchW;
  const yCut = nH - notchH;
  const R = 24;
  const r = 18;

  const notchedCardPath = `M ${R} 0 H ${nW - R} A ${R} ${R} 0 0 1 ${nW} ${R} V ${yCut - R} A ${R} ${R} 0 0 1 ${nW - R} ${yCut} H ${xCut + r} A ${r} ${r} 0 0 0 ${xCut} ${yCut + r} V ${nH - R} A ${R} ${R} 0 0 1 ${xCut - R} ${nH} H ${R} A ${R} ${R} 0 0 1 0 ${nH - R} V ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;

  return (
    <View style={styles.container}>
      {/* 1. Header & Identity Card with Duty Switch */}
      {!hideHeader && (
        <View style={[styles.headerCard, globalStyles.shadowSoft]}>
          <View style={styles.headerLeft}>
            <View style={styles.emblemWrapper}>
              <InstitutionalEmblem size={38} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>cAPPellan</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {user ? `Cap. ${user.username}` : 'Cap. Morales'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. Live Dispatch Radar Capsule */}
      {incomingCall ? (
        <View style={[styles.dispatchCapsule, styles.dispatchCapsuleActive]}>
          <View style={styles.dispatchHeader}>
            <View style={styles.alertBadge}>
              <Animated.View
                style={[
                  styles.alertDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.alertBadgeText}>DESPACHO INMEDIATO</Text>
            </View>
            <Text style={styles.alertTimeText}>Espera: 14 seg</Text>
          </View>

          <Text style={styles.dispatchTitle}>
            {incomingCall.callerName || (incomingCall.sessionType === 'CHAT' ? 'Solicitud de Chat' : 'Consulta en Espera')}
          </Text>
          <Text style={styles.dispatchDesc}>
            {incomingCall.callerName && !incomingCall.callerName.toLowerCase().startsWith('invitado')
              ? 'Llamada con identidad identificada · Atención pastoral directa.'
              : 'Personal en servicio · Identidad reservada bajo fuero ministerial.'}
          </Text>

          {/* Action Buttons: 1-Tap Dual Choice */}
          <View style={styles.dispatchActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnVideo]}
              onPress={() => onAcceptCall && onAcceptCall('VIDEO')}
              activeOpacity={0.85}
            >
              <Video size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Videollamada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnChat]}
              onPress={() => onAcceptCall && onAcceptCall('CHAT')}
              activeOpacity={0.85}
            >
              <MessageSquare size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Chat Escrito</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={isOnline ? styles.listeningCapsule : styles.offlineCapsule}
          onPress={() => onToggleOnline && onToggleOnline(!isOnline)}
          activeOpacity={0.85}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator
              size="small"
              color={isOnline ? '#059669' : Theme.colors.outline}
            />
          ) : isOnline ? (
            <>
              <View style={styles.listeningIconBox}>
                <Radio size={20} color="#059669" />
              </View>
              <View style={styles.listeningTextCol}>
                <Text style={styles.listeningTitle}>Guardia Activa · Radar Escucha</Text>
                <Text style={styles.listeningSub}>
                  Terminal en alerta de alta disponibilidad para recibir videollamadas o mensajes.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.offlineIconBox}>
                <WifiOff size={20} color={Theme.colors.outline} />
              </View>
              <View style={styles.offlineTextCol}>
                <Text style={styles.offlineTitle}>Fuera de Guardia</Text>
                <Text style={styles.offlineSub}>
                  Toca aquí para ponerte en servicio y recibir solicitudes.
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* 2b. Chaplain Duty Card Banner (Visual inspired by photo - keeping existing intact) */}
      {!incomingCall && (
        <ChaplainDutyCardBanner
          isOnline={isOnline}
          isToggling={isToggling}
          onToggle={onToggleOnline}
          user={user}
        />
      )}
      {/*
      {incomingCall ? (
        <View style={[styles.dispatchCapsule, styles.dispatchCapsuleActive]}>
          <View style={styles.dispatchHeader}>
            <View style={styles.alertBadge}>
              <Animated.View
                style={[
                  styles.alertDot,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={styles.alertBadgeText}>DESPACHO INMEDIATO</Text>
            </View>
            <Text style={styles.alertTimeText}>Espera: 14 seg</Text>
          </View>

          <Text style={styles.dispatchTitle}>
            {incomingCall.callerName || (incomingCall.sessionType === 'CHAT' ? 'Solicitud de Chat' : 'Consulta en Espera')}
          </Text>
          <Text style={styles.dispatchDesc}>
            {incomingCall.callerName && !incomingCall.callerName.toLowerCase().startsWith('invitado')
              ? 'Llamada con identidad identificada · Atención pastoral directa.'
              : 'Personal en servicio · Identidad reservada bajo fuero ministerial.'}
          </Text>

       
          <View style={styles.dispatchActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnVideo]}
              onPress={() => onAcceptCall && onAcceptCall('VIDEO')}
              activeOpacity={0.85}
            >
              <Video size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Videollamada</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnChat]}
              onPress={() => onAcceptCall && onAcceptCall('CHAT')}
              activeOpacity={0.85}
            >
              <MessageSquare size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Chat Escrito</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isOnline ? (
        <View style={styles.listeningCapsule}>
          <View style={styles.listeningIconBox}>
            <Radio size={20} color="#059669" />
          </View>
          <View style={styles.listeningTextCol}>
            <Text style={styles.listeningTitle}>Guardia Activa · Radar Escucha</Text>
            <Text style={styles.listeningSub}>
              Terminal en alerta de alta disponibilidad para recibir videollamadas o mensajes.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.offlineCapsule}>
          <View style={styles.offlineIconBox}>
            <WifiOff size={20} color={Theme.colors.outline} />
          </View>
          <View style={styles.offlineTextCol}>
            <Text style={styles.offlineTitle}>Terminal Fuera de Guardia</Text>
            <Text style={styles.offlineSub}>
              Toca el botón superior para ponerte en servicio y recibir solicitudes.
            </Text>
          </View>
        </View>
      )}
      */}
      {/* 3. Notched Operational Overview Card (Fintech / Notch Design) */}
      <View
        style={[styles.notchedCardWrapper, globalStyles.shadowSoft]}
        onLayout={(e) => setNotchedCardWidth(e.nativeEvent.layout.width)}
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width={nW}
          height={nH}
          viewBox={`0 0 ${nW} ${nH}`}
        >
          <Defs>
            <LinearGradient id="notchedCardBlueGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#0852CD" />
              <Stop offset="100%" stopColor="#003FA8" />
            </LinearGradient>
          </Defs>
          <Path d={notchedCardPath} fill="url(#notchedCardBlueGrad)" />
        </Svg>

        {/* Top Content: Primary Metric + Subtitle & Icon */}
        <View style={styles.notchedCardTop}>
          <View style={styles.notchedCardHeadlineCol}>
            <Text style={styles.notchedCardPrimaryValue}>
              {totalReportsCount} {totalReportsCount === 1 ? 'Acta' : 'Actas'}
            </Text>
            <Text style={styles.notchedCardSubtitle}>
              {criticalAlertsCount > 0 ? `${criticalAlertsCount} críticas · ` : 'Al día · '}
              {videoCount} Video · {chatCount} Chat
            </Text>
          </View>
          <View style={styles.notchedCardTopIconBadge}>
            <Radio size={16} color="rgba(255, 255, 255, 0.85)" />
          </View>
        </View>

        {/* Bottom Left: Metadata Columns (Titular & Último Registro) */}
        <View style={[styles.notchedCardBottomLeft, { width: xCut - 24 }]}>
          <View style={styles.notchedMetaCol}>
            <Text style={styles.notchedMetaLabel}>TITULAR</Text>
            <Text style={styles.notchedMetaValue} numberOfLines={1}>
              {user ? `Cap. ${user.username}` : 'Capellán'}
            </Text>
          </View>
          <View style={styles.notchedMetaCol}>
            <Text style={styles.notchedMetaLabel}>ÚLTIMO</Text>
            <Text style={styles.notchedMetaValue} numberOfLines={1}>
              {latestReport ? formatReportDate(latestReport.createdAt) : (isOnline ? 'En guardia' : 'Fuera turno')}
            </Text>
          </View>
        </View>

        {/* Bottom Right: Docked Pill Button nested inside the Cutout Notch */}
        {onOpenNewReport && (
          <View
            style={[
              styles.notchedButtonDock,
              {
                left: xCut + 6,
                top: yCut + 6,
                width: notchW - 8,
                height: notchH - 8,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.notchedPillBtn}
              onPress={onOpenNewReport}
              activeOpacity={0.85}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.notchedPillBtnText}>Redactar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 4. Compact Pastoral Reports Preview (#Sección de Informes) */}
      <View style={[styles.reportsSection, globalStyles.shadowSoft]}>
        <View style={styles.reportsHeader}>
          <View style={styles.reportsTitleRow}>
            <Text style={styles.reportsTitle}>Informes de guardia</Text>
            {effectiveReports.length > 0 && (
              <Text style={styles.reportsSubtitle}>
                {effectiveReports.length} {effectiveReports.length === 1 ? 'acta registrada' : 'actas registradas'}
              </Text>
            )}
          </View>
          {onOpenNewReport && (
            <TouchableOpacity
              style={styles.newReportSmallBtn}
              onPress={onOpenNewReport}
              activeOpacity={0.8}
            >
              <Plus size={13} color="#FFFFFF" />
              <Text style={styles.newReportSmallBtnText}>Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoadingReports && effectiveReports.length === 0 ? (
          <View style={styles.reportsLoadingBox}>
            <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />
            <Text style={styles.reportsLoadingText}>Cargando bitácora pastoral...</Text>
          </View>
        ) : effectiveReports.length === 0 ? (
          <View style={styles.emptyReportsBox}>
            <FileText size={22} color={Theme.colors.outline} />
            <Text style={styles.emptyReportsTitle}>Sin informes registrados</Text>
            <Text style={styles.emptyReportsSub}>
              Luego de atender una llamada o chat pastoral, completá el acta para archivarla en la bitácora.
            </Text>
            {onOpenNewReport && (
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={onOpenNewReport}
                activeOpacity={0.85}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Redactar Primer Informe</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.reportsList}>
            {effectiveReports.slice(0, 3).map((report) => {
              const badge = getCategoryBadge(report.category);
              const dotColor = getSeverityDot(report.severity);

              return (
                <View key={report.id || report.sessionId} style={styles.dutyReportCard}>
                  <View style={styles.dutyReportTop}>
                    <View style={styles.dutyReportDateRow}>
                      <Text style={styles.dutyReportDate}>
                        {formatReportDate(report.createdAt)}
                      </Text>
                      <View style={styles.dutyReportMeta}>
                        <View style={[styles.dutyCategoryBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.dutyCategoryBadgeText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                        {report.sessionType && (
                          <View style={styles.sessionTypePill}>
                            {report.sessionType === 'CHAT' ? (
                              <MessageSquare size={10} color="#505F76" />
                            ) : (
                              <Video size={10} color="#505F76" />
                            )}
                            <Text style={styles.sessionTypePillText}>
                              {report.sessionType === 'CHAT' ? 'Chat' : 'Video'}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                    </View>
                    <View style={styles.dutyBadgages}>
                      {report.chaplainUsername && (
                        <View style={styles.chaplainAuthorBadge}>
                          <User size={10} color="#0c7ae0" />
                          <Text style={styles.chaplainAuthorBadgeText} numberOfLines={1}>
                            {report.chaplainUsername}
                          </Text>
                        </View>
                      )}
                      
                    </View>
                  </View>

                  {report.subject ? (
                    <Text style={styles.dutyReportSubject} numberOfLines={1}>
                      {report.subject}
                    </Text>
                  ) : null}

                  <Text style={styles.dutyReportSummary} numberOfLines={2}>
                    {report.summary}
                  </Text>

                  <View style={styles.dutyReportBottom}>
                    <View style={styles.guaranteeTag}>
                      <View style={styles.severityRow}>
                        <Text style={styles.severityLabel}>Severidad {report.severity}/5</Text>
                        <View style={[styles.severityDot, { backgroundColor: dotColor }]} />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => onViewReportDetails && onViewReportDetails(report)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewActaBtnText}>Ver acta →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Link to Full Informes Screen */}
        {onNavigateToInformes && (
          <TouchableOpacity
            style={styles.viewAllReportsRow}
            onPress={onNavigateToInformes}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllReportsText}>Ver todas las actas en bitácora</Text>
            <ChevronRight size={15} color={Theme.colors.tacticalNavy} />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Community Prayer Wall Oversight Snippet (#Muro de Oración) */}
      {onNavigatePrayerWall && (
        <TouchableOpacity
          style={[styles.prayerCard, globalStyles.shadowSoft]}
          onPress={onNavigatePrayerWall}
          activeOpacity={0.85}
        >
          <View style={styles.prayerHeader}>
            <View style={styles.prayerTitleRow}>
              <Heart size={16} color="#9A805B" />
              <Text style={styles.prayerTitle}>Intercesión Comunitaria Urgente</Text>
            </View>
            <View style={styles.prayerCountBadge}>
              <Text style={styles.prayerCountText}>18 activas</Text>
            </View>
          </View>

          <View style={styles.prayerContentBox}>
            <Text style={styles.prayerQuote}>
              «Por el Cabo 1ro. González en patrulla de alta montaña, fortaleza en la tormenta.»
            </Text>
            <View style={styles.prayerFooter}>
              <Text style={styles.prayerComradesCount}>24 camaradas orando</Text>
              <View style={styles.prayerLink}>
                <Text style={styles.prayerLinkText}>Unirme en oración</Text>
                <ArrowRight size={13} color={Theme.colors.tacticalNavy} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 14,
  },
  // 1. Header Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  emblemWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    lineHeight: 20,
    color: Theme.colors.onSurface,
  },
  headerSub: {
    fontSize: 11,
    lineHeight: 15,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  dutyTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
  },
  dutyPillOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  dutyPillOffline: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotOnline: {
    backgroundColor: '#059669',
  },
  dotOffline: {
    backgroundColor: '#9CA3AF',
  },
  dutyPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textOnline: {
    color: '#065F46',
  },
  textOffline: {
    color: '#4B5563',
  },
  // 2. Dispatch Capsule
  dispatchCapsule: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderRadius: Theme.roundness.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dispatchCapsuleActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  dispatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },
  alertBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: '#FDE68A',
    letterSpacing: 0.6,
  },
  alertTimeText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  dispatchTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    lineHeight: 22,
    color: '#FEF3C7',
    marginBottom: 4,
  },
  dispatchDesc: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: '#E2E8F0',
    marginBottom: 14,
  },
  dispatchActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: Theme.roundness.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  actionBtnVideo: {
    backgroundColor: '#059669',
  },
  actionBtnChat: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  actionBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  // Listening state
  listeningCapsule: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Theme.roundness.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listeningIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningTextCol: {
    flex: 1,
  },
  listeningTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#166534',
    marginBottom: 2,
  },
  listeningSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: '#15803D',
  },
  // Offline state
  offlineCapsule: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Theme.roundness.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offlineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextCol: {
    flex: 1,
  },
  offlineTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  offlineSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.outline,
  },
  // 3. Notched Operational Overview Card (Fintech / Notch Design)
  notchedCardWrapper: {
    height: 180,
    width: '100%',
    position: 'relative',
    marginVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#003FA8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  notchedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    zIndex: 2,
  },
  notchedCardHeadlineCol: {
    flex: 1,
    paddingRight: 12,
  },
  notchedCardPrimaryValue: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  notchedCardSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 4,
    fontWeight: '500',
  },
  notchedCardTopIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchedCardBottomLeft: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    flexDirection: 'row',
    gap: 16,
    zIndex: 2,
  },
  notchedMetaCol: {
    flex: 1,
  },
  notchedMetaLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  notchedMetaValue: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  notchedButtonDock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  notchedPillBtn: {
    width: '100%',
    height: '100%',
    backgroundColor: '#161616',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  notchedPillBtnText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // 3. Shift KPIs
  statsSection: {
    marginTop: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  statsSectionTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 0.7,
  },
  statsShiftTime: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.tacticalNavy,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 84,
    justifyContent: 'space-between',
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiBadgeGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  kpiBadgeGreenText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#059669',
  },
  kpiBadgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  kpiBadgeNeutralText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
  },
  kpiValue: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    lineHeight: 24,
    color: Theme.colors.onSurface,
  },
  kpiLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: Theme.colors.onSurfaceVariant,
  },
  kpiLeyend: {
    flexDirection: 'column',
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    lineHeight: 24,
    color: Theme.colors.onSurface,
  },
  // 4. Reports Section
  reportsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reportsTitleRow: {
    flex: 1,
  },
  reportsTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    lineHeight: 18,
    color: Theme.colors.onSurface,
  },
  reportsSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  reportsLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reportsLoadingText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: Theme.colors.outline,
  },
  emptyReportsBox: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginVertical: 4,
  },
  emptyReportsTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#475569',
    marginTop: 6,
  },
  emptyReportsSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 240,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  emptyCreateBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  newReportSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newReportSmallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportsList: {
    gap: 10,
  },
  dutyReportCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    
  },
  dutyReportTop: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dutyReportDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  chaplainAuthorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  chaplainAuthorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0c7ae0',
    maxWidth: 120,
  },
  dutyBadgages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 6,
    width: '100%',
  },
  dutyReportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  sessionTypePillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  dutyReportSubject: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 3,
  },
  dutyReportDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.onSurfaceVariant,
  },
  dutyCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dutyCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  severityLabel: {
    fontSize: 10,
    color: Theme.colors.primaryContainer,
    fontWeight: '500',
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dutyReportSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    marginBottom: 8,
  },
  dutyReportBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  guaranteeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guaranteeTagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9A805B',
  },
  viewActaBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.tacticalNavy,
  },
  viewAllReportsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  viewAllReportsText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.tacticalNavy,
  },
  // 5. Prayer Card
  prayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prayerHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prayerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.onSurface,
  },
  prayerCountBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  prayerCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  prayerContentBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: Theme.roundness.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  prayerQuote: {
    fontFamily: Theme.fonts.headline,
    fontStyle: 'italic',
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  prayerFooter: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  prayerComradesCount: {
    fontSize: 10,
    color: Theme.colors.primaryContainer,
  },
  prayerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  prayerLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.tacticalNavy,
  },
});
