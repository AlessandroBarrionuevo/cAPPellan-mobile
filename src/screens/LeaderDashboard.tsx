import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAuthStore } from '../lib/stores/auth';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import ChaplainDashboard from './ChaplainDashboard';
import type { ChaplainInfo, AuthUser } from '../../types/api';
import { Users, UserCheck, PhoneCall, Layers } from 'lucide-react-native';

interface LeaderDashboardProps {
  onJoinCall: () => void;
  lastEndedSessionId: number | null;
  onClearEndedSession: () => void;
}

export default function LeaderDashboard(props: LeaderDashboardProps) {
  const [tab, setTab] = useState<'my_duty' | 'team'>('my_duty');
  const [teamMembers, setTeamMembers] = useState<AuthUser[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (tab === 'team') {
      loadTeam();
    }
  }, [tab]);

  const loadTeam = async () => {
    setIsLoadingTeam(true);
    try {
      // Fetch users with role CHAPLAIN
      const users = await request<AuthUser[]>(`${ENDPOINTS.USERS}?role=CHAPLAIN`);
      setTeamMembers(users || []);
    } catch (e) {
      // Fallback
    } finally {
      setIsLoadingTeam(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Segmented Tab Switch */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'my_duty' && styles.tabItemActive]}
          onPress={() => setTab('my_duty')}
        >
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
        >
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

      {/* Tab 1: Chaplain Duty */}
      {tab === 'my_duty' && <ChaplainDashboard {...props} />}

      {/* Tab 2: Team Overview */}
      {tab === 'team' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.teamContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.teamHeaderTitle}>Equipo de Capellanía</Text>
          <Text style={styles.teamHeaderSubtitle}>
            Monitoreo y asignación de guardias activas
          </Text>

          {isLoadingTeam ? (
            <ActivityIndicator
              size="large"
              color={Theme.colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : teamMembers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={36} color={Theme.colors.outline} />
              <Text style={styles.emptyText}>No hay capellanes registrados</Text>
            </View>
          ) : (
            teamMembers.map((member) => (
              <View
                key={member.userId}
                style={[styles.memberCard, globalStyles.shadowSoft]}
              >
                <View style={styles.memberAvatar}>
                  <UserCheck size={20} color={Theme.colors.primary} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberRole}>Capellán Asignado</Text>
                </View>
                <View style={styles.onlineBadge}>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    marginHorizontal: Theme.spacing.containerPadding,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: Theme.roundness.lg,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Theme.roundness.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  tabItemText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  tabItemTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  teamContentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Theme.spacing.stackMd,
    paddingBottom: 110,
  },
  teamHeaderTitle: {
    ...globalStyles.headlineMd,
    fontSize: 22,
    color: Theme.colors.primary,
  },
  teamHeaderSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  memberRole: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  onlineBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
  },
  onlineBadgeText: {
    ...globalStyles.labelCaps,
    color: '#2E7D32',
    fontSize: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    ...globalStyles.bodySm,
    marginTop: 8,
    color: Theme.colors.onSurfaceVariant,
  },
});
