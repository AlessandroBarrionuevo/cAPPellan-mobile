import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
  Alert,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  Home,
  Shield,
  MessageSquare,
  FileText,
  BookOpen,
  LayoutGrid,
  User,
  Lock,
  Tv,
} from 'lucide-react-native';
import { Theme } from '../../theme/Theme';
import { useAppInsets } from '../../lib/safeArea';
import type { AppRole } from '../../types/api';
import type { NavTab } from './BottomNavBar';

export interface CurvedBottomNavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole?: AppRole;
  isChatUnlocked?: boolean;
  style?: ViewStyle;
}

export function CurvedBottomNavBar({
  activeTab,
  onTabChange,
  userRole = 'BASIC',
  isChatUnlocked = false,
  style,
}: CurvedBottomNavBarProps) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();

  // Floating Logo pulse animation on press
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleCenterPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    if (userRole === 'CHAPLAIN' || userRole === 'CHAPLAIN_LEADER') {
      onTabChange('guardia');
    } else if (userRole === 'CHAPLAIN_CONTENT_LEADER') {
      onTabChange('content');
    } else {
      onTabChange('home');
    }
  };

  const isContentLeader = userRole === 'CHAPLAIN_CONTENT_LEADER';
  const isChaplainRole = userRole === 'CHAPLAIN' || userRole === 'CHAPLAIN_LEADER';
  const isSuperuser = userRole === 'SUPERUSER';

  // 2 items on Left, 2 items on Right
  const { leftTabs, rightTabs } = isContentLeader
    ? {
        leftTabs: [
          { key: 'content' as NavTab, label: 'Contenido', icon: Tv },
          { key: 'guardia' as NavTab, label: 'Guardia', icon: Shield },
        ],
        rightTabs: [
          { key: 'chat' as NavTab, label: 'Chat', icon: MessageSquare },
          { key: 'perfil' as NavTab, label: 'Perfil', icon: User },
        ],
      }
    : isChaplainRole
    ? {
        leftTabs: [
          { key: 'guardia' as NavTab, label: 'Guardia', icon: Shield },
          { key: 'chat' as NavTab, label: 'Chat Directo', icon: MessageSquare },
        ],
        rightTabs: [
          { key: 'informes' as NavTab, label: 'Informes', icon: FileText },
          { key: 'perfil' as NavTab, label: 'Perfil', icon: User },
        ],
      }
    : isSuperuser
    ? {
        leftTabs: [
          { key: 'home' as NavTab, label: 'Comando', icon: Shield },
          { key: 'chat' as NavTab, label: 'Chat', icon: MessageSquare },
        ],
        rightTabs: [
          { key: 'informes' as NavTab, label: 'Informes', icon: FileText },
          { key: 'perfil' as NavTab, label: 'Perfil', icon: User },
        ],
      }
    : {
        leftTabs: [
          { key: 'home' as NavTab, label: 'Inicio', icon: Home },
          { key: 'biblia' as NavTab, label: 'Biblia', icon: BookOpen },
        ],
        rightTabs: [
          { key: 'mas' as NavTab, label: 'Comunidad', icon: LayoutGrid },
          { key: 'perfil' as NavTab, label: 'Perfil', icon: User },
        ],
      };

  // Dimensions for Curved Cradle Notch
  const bottomInset = Math.max(insets.bottom, 12);
  const barHeight = 64 + bottomInset;
  const centerX = width / 2;
  const cornerRadius = 28; // Curved sides
  const cradleRadius = 36;
  const cradleDepth = 26;

  // SVG Path: smooth rounded corners on sides + dipped cradle in center
  const d = `
    M 0, ${cornerRadius}
    A ${cornerRadius}, ${cornerRadius} 0 0 1 ${cornerRadius}, 0
    L ${centerX - cradleRadius - 10}, 0
    C ${centerX - cradleRadius + 2}, 0, ${centerX - cradleRadius + 4}, ${cradleDepth}, ${centerX}, ${cradleDepth}
    C ${centerX + cradleRadius - 4}, ${cradleDepth}, ${centerX + cradleRadius - 2}, 0, ${centerX + cradleRadius + 10}, 0
    L ${width - cornerRadius}, 0
    A ${cornerRadius}, ${cornerRadius} 0 0 1 ${width}, ${cornerRadius}
    L ${width}, ${barHeight}
    L 0, ${barHeight}
    Z
  `;

  const renderTab = (tab: { key: NavTab; label: string; icon: any }) => {
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
        activeOpacity={isLocked ? 0.6 : 0.75}
        style={styles.tabButton}
      >
        <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
          <IconComponent
            size={20}
            color={isActive ? '#FFFFFF' : isLocked ? '#94A3B8' : '#64748B'}
            strokeWidth={isActive ? 2.4 : 1.8}
          />
          {isLocked && (
            <View style={styles.lockBadge}>
              <Lock size={8} color="#64748B" />
            </View>
          )}
          {isChatTab && isChatUnlocked && <View style={styles.activeDotBadge} />}
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
  };

  return (
    <View style={[styles.container, { height: barHeight }, style]}>
      {/* Curved SVG Background with Side Curves & Center Cradle */}
      <Svg
        width={width}
        height={barHeight}
        style={[StyleSheet.absoluteFillObject, { overflow: 'visible' }]}
      >
        <Path d={d} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth={1} />
      </Svg>

      {/* Floating Center Button with App Logo */}
      <View style={[styles.floatingCenterWrapper, { left: centerX - 30 }]}>
        <TouchableOpacity
          onPress={handleCenterPress}
          activeOpacity={0.88}
        >
          <Animated.View
            style={[
              styles.floatingCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Tab Items Row (2 Left, Spacer for Center, 2 Right) */}
      <View style={[styles.contentRow, { paddingBottom: bottomInset - 4 }]}>
        {/* Left Side: 2 Options */}
        <View style={styles.sideGroup}>{leftTabs.map(renderTab)}</View>

        {/* Center Cradle Gap for Floating Logo */}
        <View style={styles.centerGap} />

        {/* Right Side: 2 Options */}
        <View style={styles.sideGroup}>{rightTabs.map(renderTab)}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    marginBottom:0,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  floatingCenterWrapper: {
    position: 'absolute',
    top: -24,
    zIndex: 50,
  },
  floatingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0c7ae0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  centerGap: {
    width: 76,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  iconWrapperActive: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderRadius: 19,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.tacticalNavy,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lockBadge: {
    position: 'absolute',
    top: -3,
    right: -5,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeDotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
    color: Theme.colors.tacticalNavy,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  tabLabelLocked: {
    color: '#94A3B8',
  },
});

export default CurvedBottomNavBar;
