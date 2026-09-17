import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
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
  Plus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react-native';
import type { CallResponse, SessionType, AuthUser, PostCallReport } from '../../types/api';

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
  stats?: {
    servedToday?: number;
    listeningHours?: string;
    avgResponseTime?: string;
  };
}

// Sample recent acts for the duty overview
const RECENT_DUTY_REPORTS: PostCallReport[] = [
  {
    id: 101,
    sessionId: 88,
    subject: 'Duelo Moral y Retorno de Patrulla',
    category: 'EMOTIONAL_CRISIS',
    severity: 3,
    summary:
      'Acompañamiento a oficial de servicio en zona de frontera. Dificultad para conciliar deber operativo con angustia familiar. Se brindó contención y oración por templanza.',
    createdAt: 'Hoy · 08:35 hs',
  },
  {
    id: 102,
    sessionId: 91,
    subject: 'Estrés Operativo y Guardia Nocturna',
    category: 'SPIRITUAL_COUNSELING',
    severity: 2,
    summary:
      'Reintegro de patrulla nocturna. Ejercicios de respiración y lectura del Salmo 91. Evolución serena y templanza restaurada bajo secreto de confesión.',
    createdAt: 'Ayer · 19:10 hs',
  },
];

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
  stats = {
    servedToday: 4,
    listeningHours: '5.2h',
    avgResponseTime: '< 28s',
  },
}: DutyConsoleProps) {
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

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'EMOTIONAL_CRISIS':
        return { label: 'Duelo Moral', bg: '#FEF3C7', text: '#92400E' };
      case 'SPIRITUAL_COUNSELING':
        return { label: 'Estrés Operativo', bg: '#DBEAFE', text: '#1E40AF' };
      default:
        return { label: 'Asistencia', bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getSeverityDot = (sev: number) => {
    if (sev >= 4) return '#EF4444';
    if (sev === 3) return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <View style={styles.container}>
      {/* 1. Header & Identity Card with Duty Switch */}
      <View style={[styles.headerCard, globalStyles.shadowSoft]}>
        <View style={styles.headerLeft}>
          <View style={styles.emblemWrapper}>
            <InstitutionalEmblem size={38} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>cAPPellaaan</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {user ? `Cap. ${user.username}` : 'Cap. Morales'}
            </Text>
          </View>
        </View>
      </View>

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

          <Text style={styles.dispatchTitle}>Consulta Reservada en Espera</Text>
          <Text style={styles.dispatchDesc}>
            Personal militar · Base de despliegue · Identidad reservada bajo fuero ministerial.
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

          <Text style={styles.dispatchTitle}>Consulta Reservada en Espera</Text>
          <Text style={styles.dispatchDesc}>
            Personal militar · Base de despliegue · Identidad reservada bajo fuero ministerial.
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
      {/* 3. Operational Shift KPIs */}
      <View style={styles.statsSection}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsSectionTitle}>MÉTRICAS DEL TURNO</Text>
          <Text style={styles.statsShiftTime}>06:00 - 14:00</Text>
        </View>

        <View style={styles.kpiRow}>
          {/* KPI 1: Atendidos Hoy */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <User size={15} color={Theme.colors.tacticalNavy} />
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>+1 vs ayer</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{stats.servedToday ?? 4}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Llamadas</Text>
          </View>

          {/* KPI 2: Horas Escucha */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <Clock size={15} color="#9A805B" />
              <View style={styles.kpiBadgeNeutral}>
                <Text style={styles.kpiBadgeNeutralText}>Meta 6h</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{stats.listeningHours ?? '5.2 hs'}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Escucha</Text>
          </View>

          {/* KPI 3: Tiempo Respuesta */}
          <View style={[styles.kpiCard, globalStyles.shadowSoft]}>
            <View style={styles.kpiTop}>
              <Timer size={15} color="#059669" />
              <View style={styles.kpiBadgeGreen}>
                <Text style={styles.kpiBadgeGreenText}>Óptimo</Text>
              </View>
            </View >
            <View style={styles.kpiLeyend}>
              <Text style={styles.kpiValue}>{stats.avgResponseTime ?? '< 28 s'}</Text>
              <Text style={styles.kpiLabel} numberOfLines={1}>Tiempo Resp.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. Compact Pastoral Reports Preview (#Sección de Informes) */}
      <View style={[styles.reportsSection, globalStyles.shadowSoft]}>
        <View style={styles.reportsHeader}>
          <View style={styles.reportsTitleRow}>
            <Text style={styles.reportsTitle}>Informes de llamadas</Text>
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

        <View style={styles.reportsList}>
          {RECENT_DUTY_REPORTS.map((report) => {
            const badge = getCategoryBadge(report.category);
            const dotColor = getSeverityDot(report.severity);

            return (
              <View key={report.id} style={styles.dutyReportCard}>
                <View style={styles.dutyReportTop}>
                  <Text style={styles.dutyReportDate}>{report.createdAt}</Text>
                  <View style={styles.dutyBadgages}>
                    <View style={styles.dutyReportMeta}>

                      <View style={[styles.dutyCategoryBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.dutyCategoryBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.severityRow}>
                      <Text style={styles.severityLabel}>Severidad {report.severity}/5</Text>
                      <View style={[styles.severityDot, { backgroundColor: dotColor }]} />
                    </View>
                  </View>
                </View>

                <Text style={styles.dutyReportSummary} numberOfLines={2}>
                  {report.summary}
                </Text>

                <View style={styles.dutyReportBottom}>

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
  dutyBadgages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 8,
    width: '100%',
  },
  dutyReportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
