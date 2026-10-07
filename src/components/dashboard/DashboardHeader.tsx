import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Theme } from '../../theme/Theme';
import { useAppInsets } from '../../lib/safeArea';
import type { AuthUser } from '../../types/api';

export interface DashboardHeaderProps {
  user?: AuthUser | null;
  greeting?: string;
  roleBadge?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function DashboardHeader({
  user,
  greeting = 'Bienvenido',
  roleBadge,
  rightAction,
  style,
}: DashboardHeaderProps) {
  const insets = useAppInsets();

  const displayName =
    (user as any)?.fullName ||
    user?.username ||
    (user as any)?.email ||
    'Usuario';

  return (
    <View style={[styles.headerBar, { paddingTop: insets.top + 8 }, style]}>
      <View style={styles.userRow}>
        <View style={styles.logoCircle}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textCol}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingText}>{greeting}</Text>
            {roleBadge && (
              <View style={styles.roleBadgeContainer}>
                <Text style={styles.roleBadgeText}>{roleBadge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>

      {rightAction && <View style={styles.rightActionWrapper}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 14,
  },
  roleBadgeContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0c7ae0',
    letterSpacing: 0.4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2438',
    letterSpacing: -0.2,
  },
  rightActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DashboardHeader;
