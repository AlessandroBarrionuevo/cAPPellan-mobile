import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme } from '../theme/Theme';
import { AuthUser } from '../types/api';
import { VigilHeader, BottomNavBar, CurvedBottomNavBar, NavTab } from '../components/common';
import { useAppInsets } from '../lib/safeArea';

export type AppTab =
  | 'guardia'
  | 'chat'
  | 'informes'
  | 'home'
  | 'biblia'
  | 'mas'
  | 'perfil'
  | 'content'
  | 'oraciones'
  | 'blogs'
  | 'lectura';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: AuthUser;
  onLogout: () => void;
  isChatUnlocked?: boolean;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
  user,
  onLogout,
  isChatUnlocked = false,
  showHeader = true,
  showBottomNav = true,
}: AppLayoutProps) {
  const insets = useAppInsets();

  const isChaplainRole = user.role === 'CHAPLAIN' || user.role === 'CHAPLAIN_LEADER';

  // Map sub-tabs and role views to the active bottom nav item
  const getNavTab = (): NavTab => {
    if (user.role === 'CHAPLAIN_CONTENT_LEADER') {
      switch (activeTab) {
        case 'guardia':
          return 'guardia';
        case 'chat':
          return 'chat';
        case 'informes':
          return 'informes';
        case 'perfil':
          return 'perfil';
        case 'content':
        default:
          return 'content';
      }
    }

    if (isChaplainRole) {
      switch (activeTab) {
        case 'chat':
          return 'chat';
        case 'informes':
          return 'informes';
        case 'perfil':
          return 'perfil';
        case 'guardia':
        case 'home':
        default:
          return 'guardia';
      }
    }

    if (user.role === 'SUPERUSER') {
      switch (activeTab) {
        case 'chat':
          return 'chat';
        case 'informes':
          return 'informes';
        case 'perfil':
          return 'perfil';
        case 'home':
        default:
          return 'home';
      }
    }

    // Default for BASIC role
    switch (activeTab) {
      case 'biblia':
      case 'lectura':
        return 'biblia';
      case 'mas':
      case 'content':
      case 'oraciones':
      case 'blogs':
        return 'mas';
      case 'perfil':
        return 'perfil';
      case 'home':
      default:
        return 'home';
    }
  };

  const getSectionBadge = (): string => {
    switch (activeTab) {
      case 'guardia':
        return 'Guardia';
      case 'chat':
        return 'Chat 1:1';
      case 'informes':
        return 'Informes';
      case 'biblia':
      case 'lectura':
        return 'Biblia';
      case 'mas':
        return 'Comunidad';
      case 'content':
        return 'Contenido';
      case 'oraciones':
        return 'Muro de Oración';
      case 'blogs':
        return 'Crónicas & Blogs';
      case 'perfil':
        return 'Perfil';
      case 'home':
      default:
        return 'Inicio';
    }
  };

  const isSubScreen =
    (activeTab === 'content' || activeTab === 'oraciones' || activeTab === 'blogs') &&
    user.role !== 'CHAPLAIN_CONTENT_LEADER';

  // Determine if top header should display
  // Screens with dedicated top headers or hero banners do not need outer VigilHeader
  const shouldRenderHeader =
    showHeader &&
    activeTab !== 'home' &&
    activeTab !== 'guardia' &&
    activeTab !== 'chat' &&
    activeTab !== 'informes' &&
    activeTab !== 'perfil' &&
    activeTab !== 'lectura' &&
    activeTab !== 'biblia';

  const hasTopHeroBanner = activeTab === 'home';

  return (
    <View style={[styles.container, { paddingTop: hasTopHeroBanner ? 0 : insets.top }]}>
      <StatusBar style="dark" />

      {/* Optional Top Header for secondary screens */}
      {shouldRenderHeader && (
        <VigilHeader
          title={activeTab === 'oraciones' || activeTab === 'mas' || activeTab === 'blogs' ? 'cAPPellan' : 'cAPPellan'}
          subtitle="Servicio de Capellanía"
          sectionBadge={getSectionBadge()}
          showBack={isSubScreen}
          onBack={
            isSubScreen
              ? () => onTabChange(isChaplainRole ? 'guardia' : 'mas')
              : undefined
          }
        />
      )}

      {/* Main Screen Content */}
      <View style={styles.mainContent}>{children}</View>

      {/* Modern Curved Bottom Navigation Bar (BottomNavBar preserved for fallback) */}
      {showBottomNav && (
        <CurvedBottomNavBar
          activeTab={getNavTab()}
          onTabChange={(tab) => onTabChange(tab as AppTab)}
          userRole={user.role}
          isChatUnlocked={isChatUnlocked}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
});

export default AppLayout;
