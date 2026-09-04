import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useFonts, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useAuthStore } from './src/lib/stores/auth';
import { useCallStore } from './src/lib/stores/call';
import { useChaplainStore } from './src/lib/stores/chaplain';
import { requestNotificationPermissionAndScheduleReminder } from './src/lib/notifications';

// Layouts
import { AppLayout, AuthLayout, AppTab } from './src/layouts';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import BasicDashboard from './src/screens/BasicDashboard';
import ChaplainDashboard from './src/screens/ChaplainDashboard';
import LeaderDashboard from './src/screens/LeaderDashboard';
import SuperuserDashboard from './src/screens/SuperuserDashboard';
import CallRoomScreen from './src/screens/CallRoomScreen';
import ContentScreen from './src/screens/ContentScreen';
import LecturaScreen from './src/screens/LecturaScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [inCallView, setInCallView] = useState(false);
  const [lastEndedSessionId, setLastEndedSessionId] = useState<number | null>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const checkSession = useAuthStore((state) => state.checkSession);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    checkSession();
    requestNotificationPermissionAndScheduleReminder();
  }, [checkSession]);

  if (!fontsLoaded) {
    return null;
  }

  // 1. Unauthenticated -> Show Auth Layout + Login
  if (!isAuthenticated || !user) {
    return (
      <AuthLayout>
        <LoginScreen />
      </AuthLayout>
    );
  }

  // 2. Active in Call Room
  if (inCallView) {
    return (
      <CallRoomScreen
        onCallEnded={() => {
          const currentSession = useCallStore.getState().currentSession;
          const assignedCall = useChaplainStore.getState().assignedCall;
          const sessionId = currentSession?.sessionId || assignedCall?.sessionId || null;

          setInCallView(false);
          useChaplainStore.getState().clearAssignedCall();

          if (sessionId && (user.role === 'CHAPLAIN' || user.role === 'CHAPLAIN_LEADER')) {
            setLastEndedSessionId(sessionId);
          }
        }}
      />
    );
  }

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // 3. Render Role-Specific Main Screen
  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'CHAPLAIN':
        return (
          <ChaplainDashboard
            onJoinCall={() => setInCallView(true)}
            lastEndedSessionId={lastEndedSessionId}
            onClearEndedSession={() => setLastEndedSessionId(null)}
          />
        );
      case 'CHAPLAIN_LEADER':
        return (
          <LeaderDashboard
            onJoinCall={() => setInCallView(true)}
            lastEndedSessionId={lastEndedSessionId}
            onClearEndedSession={() => setLastEndedSessionId(null)}
          />
        );
      case 'SUPERUSER':
        return <SuperuserDashboard />;
      case 'BASIC':
      default:
        return (
          <BasicDashboard
            onJoinCall={() => setInCallView(true)}
            onNavigateToBible={() => setActiveTab('lectura')}
            onNavigateToContent={() => setActiveTab('content')}
          />
        );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderDashboardByRole();
      case 'content':
        return <ContentScreen />;
      case 'lectura':
        return <LecturaScreen />;
      default:
        return renderDashboardByRole();
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      onLogout={handleLogout}
      showHeader={activeTab !== 'lectura'}
    >
      {renderContent()}
    </AppLayout>
  );
}
