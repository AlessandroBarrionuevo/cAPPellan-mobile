import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme, globalStyles } from '../theme/Theme';
import { AuthUser } from '../types/api';
import { Home, BookOpen, Layers, LogOut } from 'lucide-react-native';

export type AppTab = 'home' | 'content' | 'lectura';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  user: AuthUser;
  onLogout: () => void;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function AppLayout({
  children,
  activeTab,
  onTabChange,
  user,
  onLogout,
  showHeader = true,
  showBottomNav = true,
}: AppLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header AppBar */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>CapellanAPP</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user.role}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.usernameText}>{user.username}</Text>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <LogOut size={20} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Screen Content */}
      <View style={styles.mainContent}>{children}</View>

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <View style={styles.bottomNav}>
          {/* Tab 1: Home */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'home' && styles.tabButtonActive]}
            onPress={() => onTabChange('home')}
            activeOpacity={0.8}
          >
            <Home
              size={20}
              color={
                activeTab === 'home'
                  ? Theme.colors.onSecondaryContainer
                  : Theme.colors.onSurfaceVariant
              }
              strokeWidth={activeTab === 'home' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'home'
                      ? Theme.colors.onSecondaryContainer
                      : Theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Inicio
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Content */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'content' && styles.tabButtonActive]}
            onPress={() => onTabChange('content')}
            activeOpacity={0.8}
          >
            <Layers
              size={20}
              color={
                activeTab === 'content'
                  ? Theme.colors.onSecondaryContainer
                  : Theme.colors.onSurfaceVariant
              }
              strokeWidth={activeTab === 'content' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'content'
                      ? Theme.colors.onSecondaryContainer
                      : Theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Contenido
            </Text>
          </TouchableOpacity>

          {/* Tab 3: Lectura */}
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'lectura' && styles.tabButtonActive]}
            onPress={() => onTabChange('lectura')}
            activeOpacity={0.8}
          >
            <BookOpen
              size={20}
              color={
                activeTab === 'lectura'
                  ? Theme.colors.onSecondaryContainer
                  : Theme.colors.onSurfaceVariant
              }
              strokeWidth={activeTab === 'lectura' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === 'lectura'
                      ? Theme.colors.onSecondaryContainer
                      : Theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Lectura
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.containerPadding,
    backgroundColor: Theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  roleBadge: {
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.roundness.sm,
  },
  roleBadgeText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSecondaryContainer,
    fontSize: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usernameText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: Theme.colors.primary,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#FCE8E6',
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E7EEFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 16,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: Theme.roundness.full,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.secondaryContainer,
  },
  tabText: {
    ...globalStyles.labelCaps,
    marginTop: 4,
    fontSize: 10,
  },
});
