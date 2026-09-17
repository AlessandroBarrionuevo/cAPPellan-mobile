import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAppInsets } from '../../lib/safeArea';
import {
  Shield,
  MessageSquare,
  FileText,
  BookOpen,
  LayoutGrid,
  User,
  Lock,
  Tv,
} from 'lucide-react-native';
import type { AppRole } from '../../types/api';

export type NavTab =
  | 'guardia'
  | 'chat'
  | 'informes'
  | 'home'
  | 'biblia'
  | 'mas'
  | 'perfil'
  | 'content';

interface BottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole?: AppRole;
  isChatUnlocked?: boolean;
  style?: ViewStyle;
}

export function BottomNavBar({
  activeTab,
  onTabChange,
  userRole = 'BASIC',
  isChatUnlocked = false,
  style,
}: BottomNavBarProps) {
  const insets = useAppInsets();

  const isContentLeader = userRole === 'CHAPLAIN_CONTENT_LEADER';
  const isChaplainRole = userRole === 'CHAPLAIN' || userRole === 'CHAPLAIN_LEADER';
  const isSuperuser = userRole === 'SUPERUSER';

  const tabs = isContentLeader
    ? [
        {
          key: 'content' as NavTab,
          label: 'Contenido',
          icon: Tv,
        },
        {
          key: 'guardia' as NavTab,
          label: 'Guardia',
          icon: Shield,
        },
        {
          key: 'chat' as NavTab,
          label: 'Chat',
          icon: MessageSquare,
        },
        {
          key: 'informes' as NavTab,
          label: 'Informes',
          icon: FileText,
        },
        {
          key: 'perfil' as NavTab,
          label: 'Perfil',
          icon: User,
        },
      ]
    : isChaplainRole
    ? [
        {
          key: 'guardia' as NavTab,
          label: 'Guardia',
          icon: Shield,
        },
        {
          key: 'chat' as NavTab,
          label: 'Chat Directo',
          icon: MessageSquare,
        },
        {
          key: 'informes' as NavTab,
          label: 'Informes',
          icon: FileText,
        },
        {
          key: 'perfil' as NavTab,
          label: 'Perfil',
          icon: User,
        },
      ]
    : isSuperuser
    ? [
        {
          key: 'home' as NavTab,
          label: 'Comando',
          icon: Shield,
        },
        {
          key: 'chat' as NavTab,
          label: 'Chat',
          icon: MessageSquare,
        },
        {
          key: 'informes' as NavTab,
          label: 'Informes',
          icon: FileText,
        },
        {
          key: 'perfil' as NavTab,
          label: 'Perfil',
          icon: User,
        },
      ]
    : [
        {
          key: 'home' as NavTab,
          label: 'Inicio',
          icon: Shield,
        },
        {
          key: 'biblia' as NavTab,
          label: 'Biblia',
          icon: BookOpen,
        },
        {
          key: 'mas' as NavTab,
          label: 'Más',
          icon: LayoutGrid,
        },
        {
          key: 'perfil' as NavTab,
          label: 'Perfil',
          icon: User,
        },
      ];

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 12) }, style]}>
      <View style={styles.tabBarInner}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isChatTab = tab.key === 'chat';
          const isLocked = isChatTab && (isChaplainRole || isContentLeader) && !isChatUnlocked;
          const IconComponent = tab.icon;

          const handlePress = () => {
            if (isLocked) {
              Alert.alert(
                'Canal en Espera',
                'La sala de chat 1:1 se desbloqueará automáticamente al recibir una consulta pastoral entrante.'
              );
              return;
            }
            onTabChange(tab.key);
          };

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={handlePress}
              activeOpacity={isLocked ? 0.6 : 0.85}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
                isLocked && styles.tabButtonLocked,
              ]}
            >
              <View style={styles.iconWrapper}>
                <IconComponent
                  size={20}
                  color={isActive ? '#FFFFFF' : isLocked ? '#94A3B8' : Theme.colors.secondary}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                {isLocked && (
                  <View style={styles.lockBadge}>
                    <Lock size={8} color="#64748B" />
                  </View>
                )}
                {isChatTab && isChatUnlocked && (
                  <View style={styles.activeDotBadge} />
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isActive
                    ? styles.tabLabelActive
                    : isLocked
                    ? styles.tabLabelLocked
                    : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: 'rgba(248, 249, 251, 0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    ...globalStyles.shadowSoft,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
    minHeight: 46,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Theme.roundness.lg,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.tacticalNavy,
    ...globalStyles.shadowSm,
  },
  tabButtonLocked: {
    opacity: 0.6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: -3,
    right: -7,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeDotBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabLabel: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: Theme.colors.secondary,
  },
  tabLabelLocked: {
    color: '#94A3B8',
  },
});

export default BottomNavBar;
