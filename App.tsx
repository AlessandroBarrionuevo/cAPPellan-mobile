import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { SafeAppProvider } from './src/lib/safeArea';
import { useFonts, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useAuthStore } from './src/lib/stores/auth';
import { useCallStore } from './src/lib/stores/call';
import { useChaplainStore } from './src/lib/stores/chaplain';
import { request, setClientToken, getAuthToken } from './src/lib/api/client';
import { ENDPOINTS } from './src/lib/api/endpoints';
import { SseClient } from './src/lib/api/sse';
import { requestNotificationPermissionAndScheduleReminder } from './src/lib/notifications';

// Layouts
import { AppLayout, AuthLayout, AppTab } from './src/layouts';

// Screens & Views
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import BasicDashboard from './src/screens/BasicDashboard';
import ChaplainDashboard from './src/screens/ChaplainDashboard';
import LeaderDashboard from './src/screens/LeaderDashboard';
import SuperuserDashboard from './src/screens/SuperuserDashboard';
import CallRoomScreen from './src/screens/CallRoomScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import PrayerWallScreen from './src/screens/PrayerWallScreen';
import ContentScreen from './src/screens/ContentScreen';
import LecturaScreen from './src/screens/LecturaScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HubScreen from './src/screens/HubScreen';
import BlogFeedScreen from './src/screens/BlogFeedScreen';
import ReportsLogbookView from './src/components/reports/ReportsLogbookView';
import IncomingSessionModal from './src/components/duty/IncomingSessionModal';
import type { CallResponse, SessionType } from './src/types/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [inCallView, setInCallView] = useState(false);
  const [inChatView, setInChatView] = useState(false);
  const [lastEndedSessionId, setLastEndedSessionId] = useState<number | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const checkSession = useAuthStore((state) => state.checkSession);

  // Chaplain & Call states
  const chaplainStatus = useChaplainStore((state) => state.status);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const setAssignedCall = useChaplainStore((state) => state.setAssignedCall);
  const clearAssignedCall = useChaplainStore((state) => state.clearAssignedCall);
  const currentSession = useCallStore((state) => state.currentSession);

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

  // Ensure chaplain roles land directly on the appropriate initial tab
  useEffect(() => {
    if (user?.role === 'CHAPLAIN_CONTENT_LEADER') {
      if (activeTab === 'home') {
        setActiveTab('content');
      }
    } else if (user?.role === 'CHAPLAIN' || user?.role === 'CHAPLAIN_LEADER') {
      if (activeTab === 'home') {
        setActiveTab('guardia');
      }
    }
  }, [user?.role]);

  // Global Real-Time SSE Push with Polling Fallback for assigned calls when chaplain is ONLINE
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (
      user.role !== 'CHAPLAIN' &&
      user.role !== 'CHAPLAIN_LEADER' &&
      user.role !== 'CHAPLAIN_CONTENT_LEADER' &&
      user.role !== 'SUPERUSER'
    ) return;
    if (chaplainStatus !== 'ONLINE') return;
    if (inCallView || inChatView) return;

    const handleIncomingAssigned = (assigned: CallResponse) => {
      if (!assigned || !assigned.sessionId) return;

      const currentAssigned = useChaplainStore.getState().assignedCall;
      if (
        currentAssigned?.sessionId === assigned.sessionId &&
        currentAssigned?.token === assigned.token
      ) {
        return;
      }

      setAssignedCall(assigned);
      useCallStore.getState().setSession(assigned);
      if (assigned.clientToken) {
        setClientToken(assigned.clientToken);
      }
      setShowIncomingModal(true);
    };

    // 1. Primary: SSE Stream for real-time dispatch with full intake
    const token = getAuthToken();
    const sseUrl = ENDPOINTS.CALLS_SSE_ASSIGNED(token || undefined);
    const sse = new SseClient(sseUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    sse.addEventListener('incoming-call', (data: any) => {
      if (data) {
        handleIncomingAssigned(data);
      }
    });

    sse.connect();

    // 2. Secondary: Defensive polling fallback (relaxed to 6s)
    const interval = setInterval(async () => {
      try {
        const assigned = await request<CallResponse>(ENDPOINTS.CALLS_ASSIGNED);
        if (assigned && assigned.sessionId) {
          handleIncomingAssigned(assigned);
        }
      } catch (err) {
        // 204 No Content or transient glitch
      }
    }, 6000);

    return () => {
      sse.close();
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.role, chaplainStatus, inCallView, inChatView, setAssignedCall]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  // 1. Unauthenticated -> Show Auth Layout + Mode Screen
  const renderAppBody = () => {
    if (!isAuthenticated || !user) {
      if (authMode === 'register') {
        return (
          <AuthLayout>
            <RegisterScreen onNavigateToLogin={() => setAuthMode('login')} />
          </AuthLayout>
        );
      }

      if (authMode === 'forgot_password') {
        return (
          <AuthLayout>
            <ForgotPasswordScreen onNavigateToLogin={() => setAuthMode('login')} />
          </AuthLayout>
        );
      }

      return (
        <AuthLayout>
          <LoginScreen
            onNavigateToRegister={() => setAuthMode('register')}
            onNavigateToForgotPassword={() => setAuthMode('forgot_password')}
          />
        </AuthLayout>
      );
    }

    // 2. Active in Fullscreen Call Room
    if (inCallView) {
      return (
        <CallRoomScreen
          onCallEnded={() => {
            const currentSes = useCallStore.getState().currentSession;
            const assigned = useChaplainStore.getState().assignedCall;
            const sessionId = currentSes?.sessionId || assigned?.sessionId || null;

            setInCallView(false);
            useChaplainStore.getState().clearAssignedCall();

            if (
              sessionId &&
              (user.role === 'CHAPLAIN' ||
                user.role === 'CHAPLAIN_LEADER' ||
                user.role === 'CHAPLAIN_CONTENT_LEADER')
            ) {
              setLastEndedSessionId(sessionId);
              setActiveTab('informes');
            }
          }}
        />
      );
    }

    // 3. Active in Fullscreen Chat Room (if opened modally)
    if (inChatView) {
      return (
        <ChatRoomScreen
          onChatEnded={() => {
            const currentSes = useCallStore.getState().currentSession;
            const assigned = useChaplainStore.getState().assignedCall;
            const sessionId = currentSes?.sessionId || assigned?.sessionId || null;

            setInChatView(false);
            useChaplainStore.getState().clearAssignedCall();

            if (
              sessionId &&
              (user.role === 'CHAPLAIN' ||
                user.role === 'CHAPLAIN_LEADER' ||
                user.role === 'CHAPLAIN_CONTENT_LEADER')
            ) {
              setLastEndedSessionId(sessionId);
              setActiveTab('informes');
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

    const isChaplainStaff =
      user.role === 'CHAPLAIN' ||
      user.role === 'CHAPLAIN_LEADER' ||
      user.role === 'CHAPLAIN_CONTENT_LEADER';
    const isChatUnlocked = !isChaplainStaff || Boolean(assignedCall || currentSession);

    const renderDashboardByRole = () => {
      switch (user.role) {
        case 'CHAPLAIN_CONTENT_LEADER':
          return <ContentScreen />;
        case 'CHAPLAIN':
          return (
            <ChaplainDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={() => setActiveTab('oraciones')}
            />
          );
        case 'CHAPLAIN_LEADER':
          return (
            <LeaderDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={() => setActiveTab('oraciones')}
            />
          );
        case 'SUPERUSER':
          return <SuperuserDashboard />;
        case 'BASIC':
        default:
          return (
            <BasicDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToPrayers={() => setActiveTab('oraciones')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
            />
          );
      }
    };

    const renderContent = () => {
      switch (activeTab) {
        case 'guardia':
          return (
            <ChaplainDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={() => setActiveTab('oraciones')}
            />
          );
        case 'home':
          return renderDashboardByRole();
        case 'chat':
          return (
            <ChatRoomScreen
              onChatEnded={() => {
                clearAssignedCall();
                useCallStore.getState().resetCall();
                setActiveTab(
                  user.role === 'CHAPLAIN_CONTENT_LEADER'
                    ? 'content'
                    : isChaplainStaff
                    ? 'guardia'
                    : 'home'
                );
              }}
              onRequestReport={(sessionId) => {
                setLastEndedSessionId(sessionId);
                setActiveTab('informes');
              }}
            />
          );
        case 'informes':
          return (
            <ReportsLogbookView
              canSupervise={user.role === 'CHAPLAIN_LEADER' || user.role === 'SUPERUSER'}
              activeSessionId={lastEndedSessionId}
            />
          );
        case 'content':
          return <ContentScreen />;
        case 'blogs':
          return <BlogFeedScreen />;
        case 'biblia':
        case 'lectura':
          return <LecturaScreen />;
        case 'oraciones':
          return <PrayerWallScreen />;
        case 'perfil':
          return <ProfileScreen />;
        case 'mas':
          return (
            <HubScreen
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToPrayers={() => setActiveTab('oraciones')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
              onContactChaplain={() => setActiveTab(isChaplainStaff ? 'guardia' : 'home')}
            />
          );
        default:
          return renderDashboardByRole();
      }
    };

    return (
      <>
        <AppLayout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLogout={handleLogout}
          isChatUnlocked={isChatUnlocked}
        >
          {renderContent()}
        </AppLayout>

        {/* Global Incoming Session Alert Modal (Pop-up) for Chaplains */}
        <IncomingSessionModal
          visible={showIncomingModal && Boolean(assignedCall)}
          session={assignedCall}
          onAccept={(sessionType: SessionType) => {
            setShowIncomingModal(false);
            if (sessionType === 'CHAT') {
              setActiveTab('chat');
            } else {
              setInCallView(true);
            }
          }}
          onReject={() => {
            setShowIncomingModal(false);
            clearAssignedCall();
          }}
        />
      </>
    );
  };

  return (
    <SafeAppProvider style={{ flex: 1 }}>
      {renderAppBody()}
    </SafeAppProvider>
  );
}
