import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
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
  avatarUrl?: string | null;
  showAvatar?: boolean;
  onPressAvatar?: () => void;
}

export function DashboardHeader({
  user,
  greeting = 'Bienvenido',
  roleBadge,
  rightAction,
  style,
  avatarUrl,
  showAvatar = false,
  onPressAvatar,
}: DashboardHeaderProps) {
  const insets = useAppInsets();
  const [imageError, setImageError] = useState(false);

  const displayName =
    (user as any)?.fullName ||
    user?.username ||
    (user as any)?.email ||
    'Usuario';

  const resolvedAvatar = showAvatar ? (avatarUrl ?? user?.avatarUrl) : null;
  const shouldRenderAvatar = Boolean(resolvedAvatar && !imageError);

  const AvatarContainer = onPressAvatar ? TouchableOpacity : View;

  return (
    <View style={[styles.headerBar, { paddingTop: insets.top + 8 }, style]}>
      <View style={styles.userRow}>
        <AvatarContainer
          style={styles.logoCircle}
          {...(onPressAvatar ? { onPress: onPressAvatar, activeOpacity: 0.8 } : {})}
        >
          {shouldRenderAvatar ? (
            <Image
              source={{ uri: resolvedAvatar! }}
              style={styles.avatarImg}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          )}
        </AvatarContainer>
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
    overflow: 'hidden',
  },
  logoImg: {
    width: 26,
    height: 26,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
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
