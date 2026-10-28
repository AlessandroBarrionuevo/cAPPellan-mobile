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
  Rect,
  Circle,
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
  ArrowUpRight,
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
  const [reportsCardWidth, setReportsCardWidth] = useState(0);
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
      if (isToday) return `Hoy · ${timeStr} hs`;
      return `${d.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} · ${timeStr} hs`;
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
  const reportsCardW = reportsCardWidth || Math.min(width - 32, 420);
  const reportsCardH = 220;

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
      {/* 3. Operational Real-Time KPIs */}
      <View style={styles.statsSection}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsSectionTitle}>MÉTRICAS OPERATIVAS</Text>
          <Text style={styles.statsShiftTime}>Bitácora en Tiempo Real</Text>
        </View>

        <View style={styles.kpiRow}>
          {/* KPI 1: Total Actas */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <FileCheck size={15} color={Theme.colors.tacticalNavy} />
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>Registradas</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{totalReportsCount}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Total Actas</Text>
          </View>

          {/* KPI 2: Casos Críticos */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <ShieldAlert size={15} color="#DC2626" />
              <View style={[styles.kpiBadgeNeutral, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.kpiBadgeNeutralText, { color: '#B91C1C' }]}>Sev. ≥ 4</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, criticalAlertsCount > 0 && { color: '#DC2626' }]}>
              {criticalAlertsCount}
            </Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Casos Críticos</Text>
          </View>

          {/* KPI 3: Desglose Canales */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <Activity size={15} color="#059669" />
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>Canales</Text>
              </View>
            </View>
            <View style={styles.kpiLeyend}>
              <Text style={styles.kpiValue}>
                {videoCount}V · {chatCount}C
              </Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>Video / Chat</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. Compact Pastoral Reports Card (Insurance Card Style) */}
      <View
        style={[styles.insuranceCard, globalStyles.shadowSoft]}
        onLayout={(e) => setReportsCardWidth(e.nativeEvent.layout.width)}
      >
        {/* SVG Gradient Background (White to Navy with ambient organic curves) */}
        <Svg
          style={StyleSheet.absoluteFill}
          width={reportsCardW}
          height={reportsCardH}
          viewBox={`0 0 ${reportsCardW} ${reportsCardH}`}
        >
          <Defs>
            <LinearGradient id="dutyReportCardGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="26%" stopColor="#F8FAFC" />
              <Stop offset="48%" stopColor="#1E40AF" />
              <Stop offset="76%" stopColor="#0C2340" />
              <Stop offset="100%" stopColor="#061224" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={reportsCardW} height={reportsCardH} rx="24" fill="url(#dutyReportCardGrad)" />
          {/* Subtle concentric translucent curves replicating reference image */}
          <Circle cx={reportsCardW * 0.88} cy={reportsCardH * 0.28} r={95} fill="rgba(255, 255, 255, 0.12)" />
          <Circle cx={reportsCardW * 0.95} cy={reportsCardH * 0.44} r={65} fill="rgba(255, 255, 255, 0.08)" />
          <Circle cx={reportsCardW * 0.50} cy={reportsCardH * 0.88} r={135} fill="rgba(255, 255, 255, 0.05)" />
          <Circle cx={reportsCardW * 0.12} cy={reportsCardH * 0.12} r={65} fill="rgba(255, 255, 255, 0.35)" />
        </Svg>

        <View style={styles.insuranceCardContent}>
          {/* Top Row: Emblem + Title & Subtitle + Arrow ↗ Link */}
          <View style={styles.cardTopRow}>
            <View style={styles.cardTopLeft}>
              <View style={styles.cardEmblemBadge}>
                <ShieldCheck size={20} color="#0C7AE0" strokeWidth={2.4} />
              </View>
              <View style={styles.cardTitleCol}>
                <Text style={styles.cardTitleText}>Informes de Guardia</Text>
                <Text style={styles.cardSubtitleText}>Libro de Guardia y Asistencia</Text>
              </View>
            </View>
            {onNavigateToInformes && (
              <TouchableOpacity
                style={styles.cardArrowBtn}
                onPress={onNavigateToInformes}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowUpRight size={17} color="#0A192F" strokeWidth={2.4} />
              </TouchableOpacity>
            )}
          </View>

          {/* Middle Row (2 Columns): Titular de Guardia | Total de Actas */}
          <View style={styles.cardMiddleRow}>
            <View style={styles.cardMetaColLeft}>
              <Text style={styles.cardMetaLabel}>TITULAR DE GUARDIA</Text>
              <Text style={styles.cardMetaValue} numberOfLines={1}>
                {user ? `Cap. ${user.username}` : 'Capellán de Servicio'}
              </Text>
            </View>
            <View style={styles.cardMetaColRight}>
              <Text style={[styles.cardMetaLabel, styles.alignRight]}>TOTAL DE ACTAS</Text>
              <Text style={[styles.cardMetaValue, styles.alignRight]} numberOfLines={1}>
                {totalReportsCount} {totalReportsCount === 1 ? 'acta' : 'actas'}
              </Text>
            </View>
          </View>

          {/* Bottom Row: Último Registro | Pill Button Redactar */}
          <View style={styles.cardBottomRow}>
            <TouchableOpacity
              style={styles.cardMetaColLeft}
              onPress={() => latestReport && onViewReportDetails && onViewReportDetails(latestReport)}
              activeOpacity={latestReport && onViewReportDetails ? 0.75 : 1}
            >
              <Text style={styles.cardMetaLabel}>ÚLTIMO REGISTRO</Text>
              <Text style={styles.cardMetaValue} numberOfLines={1}>
                {latestReport ? formatReportDate(latestReport.createdAt) : 'Sin actas registradas'}
              </Text>
              {latestReport?.subject ? (
                <Text style={styles.cardSubjectSub} numberOfLines={1}>
                  {latestReport.subject}
                </Text>
              ) : null}
            </TouchableOpacity>

            <View style={styles.cardActionCol}>
              {onOpenNewReport && (
                <TouchableOpacity
                  style={styles.cardPillBtn}
                  onPress={onOpenNewReport}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardPillBtnText}>Redactar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
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
  // 4. Compact Pastoral Reports Card (Insurance Card Style)
  insuranceCard: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0C2340',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0C2340',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  insuranceCardContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  cardEmblemBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
  },
  cardTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    color: '#0A192F',
    letterSpacing: 0.2,
  },
  cardSubtitleText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#475569',
    marginTop: 1,
  },
  cardArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(12, 122, 224, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  cardMetaColLeft: {
    flex: 1,
    paddingRight: 10,
  },
  cardMetaColRight: {
    alignItems: 'flex-end',
  },
  cardMetaLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardMetaValue: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  alignRight: {
    textAlign: 'right',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  cardSubjectSub: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 2,
  },
  cardActionCol: {
    marginLeft: 12,
  },
  cardPillBtn: {
    backgroundColor: '#050D1A',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardPillBtnText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
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
    backgroundColor: '#F8F9FA',
    borderRadius: Theme.roundness.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  dutyReportTop: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dutyReportDateRow: {
    marginBottom: 6,
    gap: 6,
    flexDirection: 'column',
    alignItems: 'flex-start',
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
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
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
