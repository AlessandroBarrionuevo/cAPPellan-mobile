import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { SharedDashboardWidgets, DashboardHeader } from '../components/dashboard';
import { useAuthStore } from '../lib/stores/auth';
import { useAppInsets } from '../lib/safeArea';
import { Tv, Plus, BookOpen, FileText, Sparkles } from 'lucide-react-native';

export interface ChaplainContentDashboardProps {
  onNavigateToContent: () => void;
  onNavigateToBlogs: () => void;
  onNavigateToBible?: () => void;
  onNavigateToPrayers?: (initialTab?: 'prayer' | 'gratitude') => void;
  onJoinCall?: () => void;
  onJoinChat?: () => void;
}

export default function ChaplainContentDashboard({
  onNavigateToContent,
  onNavigateToBlogs,
  onNavigateToBible,
  onNavigateToPrayers,
  onJoinCall,
  onJoinChat,
}: ChaplainContentDashboardProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();
  const user = useAuthStore((state) => state.user);
  const isTablet = width > 500;

  return (
    <View style={styles.container}>
      {/* Top Header Bar: App Logo + Name/Email */}
      <DashboardHeader
        user={user}
        greeting="Pastoral Audiovisual"
        roleBadge="CONTENIDOS"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
          isTablet && styles.tabletContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ROLE WIDGET: Content Leader Console */}
        <View style={styles.consoleCard}>
          <View style={styles.consoleTopRow}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>LÍDER DE CONTENIDOS</Text>
            </View>
            <Tv size={20} color="#0c7ae0" />
          </View>

          <Text style={styles.consoleTitle}>
            Pastoral Audiovisual & Formación
          </Text>
          <Text style={styles.consoleSubtitle}>
            Administrá los contenidos multimedia, podcasts de Spotify, videos y crónicas para la comunidad.
          </Text>

          {/* Pill Action Buttons (Search-bar design: White background, blue circle with icon) */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionPillButton}
              onPress={onNavigateToContent}
              activeOpacity={0.85}
            >
              <View style={styles.pillLeftContent}>
                <View style={styles.pillBlueCircle}>
                  <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text style={styles.pillButtonLabel} numberOfLines={1}>
                  Nuevo Contenido
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillButton}
              onPress={onNavigateToBlogs}
              activeOpacity={0.85}
            >
              <View style={styles.pillLeftContent}>
                <View style={styles.pillBlueCircle}>
                  <FileText size={18} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <Text style={styles.pillButtonLabel} numberOfLines={1}>
                  Crónicas & Blogs
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      {/* 2. SHARED DASHBOARD WIDGETS (Perlita, Muro de Oración, Contenidos, Roster, Confidencialidad) */}
      <View style={styles.sharedWidgetsWrapper}>
        <SharedDashboardWidgets
          onNavigateToBible={onNavigateToBible}
          onNavigateToContent={onNavigateToContent}
          onNavigateToPrayers={onNavigateToPrayers}
          onNavigateToBlogs={onNavigateToBlogs}
          onJoinCall={onJoinCall}
          onJoinChat={onJoinChat}
          showRoster={true}
        />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabletContent: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  consoleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  consoleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6D28D9',
  },
  badgeText: {
    ...globalStyles.labelCaps,
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '700',
  },
  consoleTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 19,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  consoleSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionPillButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pillLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pillButtonLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.2,
  },
  pillBlueCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharedWidgetsWrapper: {
    width: '100%',
  },
});
