import React, { useState, useEffect } from 'react';
import { Alert, Platform, AppState } from 'react-native';
import { SafeAppProvider } from './src/lib/safeArea';
import { useFonts } from 'expo-font';
import { IosevkaCharon_500Medium, IosevkaCharon_700Bold } from '@expo-google-fonts/iosevka-charon';
import { Commissioner_400Regular, Commissioner_600SemiBold } from '@expo-google-fonts/commissioner';
import { Alef_400Regular, Alef_700Bold } from '@expo-google-fonts/alef';
import {
  Zain_200ExtraLight,
  Zain_300Light,
  Zain_300Light_Italic,
  Zain_400Regular,
  Zain_400Regular_Italic,
  Zain_700Bold,
  Zain_800ExtraBold,
  Zain_900Black,
} from '@expo-google-fonts/zain';
import { useAuthStore } from './src/lib/stores/auth';
import { useCallStore } from './src/lib/stores/call';
import { useChaplainStore } from './src/lib/stores/chaplain';
import { request, setClientToken, getAuthToken, getApiBaseUrl, ApiError } from './src/lib/api/client';
import { ENDPOINTS } from './src/lib/api/endpoints';
import { SseClient } from './src/lib/api/sse';
import {
  setupNotificationChannels,
  registerDevicePushToken,
  unregisterDevicePushToken,
  dismissIncomingCallNotifications,
  startIncomingCallVibration,
  stopIncomingCallVibration,
} from './src/lib/notifications';
import {
  canUseFullScreenIntent,
  openFullScreenIntentSettings,
  displayNativeIncomingCall,
  dismissNativeIncomingCall,
  turnScreenOnAndDismissKeyguard,
  getInitialCallData,
  consumeLastRejectedSessionId,
  addIncomingCallRejectedListener,
  setNativeAuthContext,
} from './modules/incoming-call';
import * as Notifications from 'expo-notifications';

// Layouts
import { AppLayout, AuthLayout, AppTab } from './src/layouts';

// Screens & Views
import LoginScreen from './src/screens/LoginScreen'; // Original screen preserved
import LoginScreenPreview from './src/screens/LoginScreenPreview';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import BasicDashboard from './src/screens/BasicDashboard'; // Original intact
import BasicDashboardPreview from './src/screens/BasicDashboardPreview';
import ChaplainDashboard from './src/screens/ChaplainDashboard';
import ChaplainContentDashboard from './src/screens/ChaplainContentDashboard';
import LeaderDashboard from './src/screens/LeaderDashboard';
import SuperuserDashboard from './src/screens/SuperuserDashboard';
import CallRoomScreen from './src/screens/CallRoomScreen';
import CallRoomScreenPreview from './src/screens/CallRoomScreenPreview'; // Previous UI intact for rollback
import VideoCallPreview from './src/screens/VideoCallPreview';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatPreview from './src/screens/ChatPreview';
import PrayerWallScreen from './src/screens/PrayerWallScreen';
import ContentScreen from './src/screens/ContentScreen';
import LecturaScreen from './src/screens/LecturaScreen'; // Fallback intact
import BibleReaderPreview from './src/screens/BibleReaderPreview';
import ProfileScreen from './src/screens/ProfileScreen';
import HubScreen from './src/screens/HubScreen';
import BlogFeedScreen from './src/screens/BlogFeedScreen';
import ReportsLogbookView from './src/components/reports/ReportsLogbookView';
import IncomingSessionModal from './src/components/duty/IncomingSessionModal';
import IncomingSessionModalPreview from './src/components/duty/IncomingSessionModalPreview';
import { AppPreloader, ENABLE_APP_PRELOADER } from './src/components/common';
import type { CallResponse, SessionType } from './src/types/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [inCallView, setInCallView] = useState(false);
  const [inChatView, setInChatView] = useState(false);
  const [lastEndedSessionId, setLastEndedSessionId] = useState<number | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [prayerWallTab, setPrayerWallTab] = useState<'prayer' | 'gratitude'>('prayer');
  const [showPreloader, setShowPreloader] = useState<boolean>(ENABLE_APP_PRELOADER);

  const handleNavigateToPrayers = (tab?: 'prayer' | 'gratitude') => {
    if (tab) setPrayerWallTab(tab);
    setActiveTab('oraciones');
  };

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const checkSession = useAuthStore((state) => state.checkSession);

  const isChaplainStaff =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'CHAPLAIN_CONTENT_LEADER' ||
    user?.role === 'SUPERUSER';

  // Chaplain & Call states
  const chaplainStatus = useChaplainStore((state) => state.status);
  const assignedCall = useChaplainStore((state) => state.assignedCall);
  const setAssignedCall = useChaplainStore((state) => state.setAssignedCall);
  const clearAssignedCall = useChaplainStore((state) => state.clearAssignedCall);
  const currentSession = useCallStore((state) => state.currentSession);

  const [fontsLoaded] = useFonts({
    // Primary (Alef)
    Alef_400Regular,
    Alef_700Bold,
    // Secondary (Zain)
    Zain_200ExtraLight,
    Zain_300Light,
    Zain_300Light_Italic,
    Zain_400Regular,
    Zain_400Regular_Italic,
    Zain_700Bold,
    Zain_800ExtraBold,
    Zain_900Black,
    // Legacy fonts preloaded for instant rollback
    IosevkaCharon_500Medium,
    IosevkaCharon_700Bold,
    Commissioner_400Regular,
    Commissioner_600SemiBold,
  });

  useEffect(() => {
    setupNotificationChannels();
    checkSession();
  }, [checkSession]);

  // Register push token & restore saved duty status when logged in
  useEffect(() => {
    if (isAuthenticated) {
      const token = getAuthToken();
      const baseUrl = getApiBaseUrl();
      setNativeAuthContext(token, baseUrl, user?.role);

      if (isChaplainStaff) {
        registerDevicePushToken();
        useChaplainStore.getState().restoreStatus();

        // Verify Android 14+ Full Screen Intent permission
        if (Platform.OS === 'android') {
          const hasPermission = canUseFullScreenIntent();
          if (!hasPermission) {
            Alert.alert(
              'Pantalla Completa de Llamadas',
              'Para que tu teléfono encienda la pantalla automáticamente durante una llamada de guardia, activa el permiso de notificaciones a pantalla completa.',
              [
                { text: 'Más tarde', style: 'cancel' },
                { text: 'Activar', onPress: () => openFullScreenIntentSettings() },
              ]
            );
          }
        }
      } else {
        unregisterDevicePushToken();
        useChaplainStore.getState().clearAssignedCall();
      }
    } else {
      setNativeAuthContext(null, null, null);
    }
  }, [isAuthenticated, user?.role, isChaplainStaff]);

  // Native Push Notifications listener (Incoming calls & Cancel calls from backend)
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as any;
      if (!data) return;

      if (data.type === 'INCOMING_CALL') {
        const currentUser = useAuthStore.getState().user;
        const currentRole = currentUser?.role;
        const isStaff =
          currentRole === 'CHAPLAIN' ||
          currentRole === 'CHAPLAIN_LEADER' ||
          currentRole === 'CHAPLAIN_CONTENT_LEADER' ||
          currentRole === 'SUPERUSER';

        if (!isStaff) {
          console.warn('[App] Ignoring INCOMING_CALL notification for non-chaplain role:', currentRole);
          return;
        }

        const isChat = data.sessionType === 'CHAT';
        const rawCallerName = data.callerName && typeof data.callerName === 'string' && data.callerName.trim().length > 0
          ? data.callerName.trim()
          : undefined;

        const existingAssigned = useChaplainStore.getState().assignedCall;
        const isSameSession = existingAssigned?.sessionId === Number(data.sessionId);
        const assigned: CallResponse = {
          ...(isSameSession ? existingAssigned : {}),
          sessionId: Number(data.sessionId),
          sessionType: data.sessionType || existingAssigned?.sessionType || 'VIDEO',
          livekitRoomName: data.livekitRoom || existingAssigned?.livekitRoomName,
          token: data.token || existingAssigned?.token,
          callerName: rawCallerName || existingAssigned?.callerName,
          intake: existingAssigned?.intake || (data.callerMood ? { moodScore: Number(data.callerMood) } : undefined),
        };
        if (!isSameSession) {
          startIncomingCallVibration();
          turnScreenOnAndDismissKeyguard();
        }
        displayNativeIncomingCall({
          sessionId: assigned.sessionId,
          callerName: assigned.callerName || (isChat ? 'Solicitud de Chat Pastoral' : 'Consulta de Guardia'),
          sessionType: assigned.sessionType,
          token: assigned.token,
          livekitRoom: assigned.livekitRoomName,
        });
        useChaplainStore.getState().setAssignedCall(assigned);
        useCallStore.getState().setSession(assigned);
        setShowIncomingModal(true);
      } else if (data.type === 'CANCEL_CALL') {
        stopIncomingCallVibration();
        dismissIncomingCallNotifications();
        if (data.sessionId) {
          dismissNativeIncomingCall(Number(data.sessionId));
        }
        const currentAssigned = useChaplainStore.getState().assignedCall;
        if (!data.sessionId || currentAssigned?.sessionId === Number(data.sessionId)) {
          setShowIncomingModal(false);
          useChaplainStore.getState().clearAssignedCall();
          useCallStore.getState().resetCall();
          Alert.alert('Guardia', 'Solicitud cancelada o atendida en otro dispositivo.');
        }
      }
    });

    const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'INCOMING_CALL') {
        const currentUser = useAuthStore.getState().user;
        const currentRole = currentUser?.role;
        const isStaff =
          currentRole === 'CHAPLAIN' ||
          currentRole === 'CHAPLAIN_LEADER' ||
          currentRole === 'CHAPLAIN_CONTENT_LEADER' ||
          currentRole === 'SUPERUSER';

        if (!isStaff) {
          console.warn('[App] Ignoring notification response for non-chaplain role:', currentRole);
          return;
        }

        const isChat = data.sessionType === 'CHAT';
        if (response.actionIdentifier === 'REJECT') {
          stopIncomingCallVibration();
          dismissIncomingCallNotifications();
          if (data.sessionId) {
            dismissNativeIncomingCall(Number(data.sessionId));
            request(ENDPOINTS.CALL_END(Number(data.sessionId)), { method: 'POST' }).catch(() => {});
          }
          setShowIncomingModal(false);
          useChaplainStore.getState().clearAssignedCall();
          useCallStore.getState().resetCall();
          return;
        }

        const rawCallerName = data.callerName && typeof data.callerName === 'string' && data.callerName.trim().length > 0
          ? data.callerName.trim()
          : undefined;

        const existingAssigned = useChaplainStore.getState().assignedCall;
        const isSameSession = existingAssigned?.sessionId === Number(data.sessionId);
        const assigned: CallResponse = {
          ...(isSameSession ? existingAssigned : {}),
          sessionId: Number(data.sessionId),
          sessionType: data.sessionType || existingAssigned?.sessionType || 'VIDEO',
          livekitRoomName: data.livekitRoom || existingAssigned?.livekitRoomName,
          token: data.token || existingAssigned?.token,
          callerName: rawCallerName || existingAssigned?.callerName,
          intake: existingAssigned?.intake || (data.callerMood ? { moodScore: Number(data.callerMood) } : undefined),
        };

        if (response.actionIdentifier === 'ACCEPT') {
          stopIncomingCallVibration();
          dismissIncomingCallNotifications();
          if (data.sessionId) {
            dismissNativeIncomingCall(Number(data.sessionId));
          }
          try {
            const acceptResponse = await request<CallResponse>(
              ENDPOINTS.CALL_ACCEPT(assigned.sessionId),
              {
                method: 'POST',
                headers: {
                  'X-Device-Channel': 'MOBILE',
                },
              }
            );

            const finalSession: CallResponse = {
              ...assigned,
              ...(acceptResponse || {}),
              callerName: acceptResponse?.callerName || assigned.callerName,
            };
            useChaplainStore.getState().setAssignedCall(finalSession);
            useCallStore.getState().setSession(finalSession);
            if (finalSession.clientToken) {
              setClientToken(finalSession.clientToken);
            }
            setShowIncomingModal(false);

            if (isChat || finalSession.sessionType === 'CHAT') {
              setActiveTab('chat');
            } else {
              setInCallView(true);
            }
            return;
          } catch (err) {
            console.warn('[App] Direct accept from notification failed:', err);
          }
        }

        startIncomingCallVibration();
        useChaplainStore.getState().setAssignedCall(assigned);
        useCallStore.getState().setSession(assigned);
        if (assigned.clientToken) {
          setClientToken(assigned.clientToken);
        }
        setShowIncomingModal(true);
      }
    };

    // Native Intent check for calls opened via FullScreenIntent / Heads-up notification
    const checkIncomingCallIntent = async () => {
      const currentUser = useAuthStore.getState().user;
      const currentRole = currentUser?.role;
      const isStaff =
        currentRole === 'CHAPLAIN' ||
        currentRole === 'CHAPLAIN_LEADER' ||
        currentRole === 'CHAPLAIN_CONTENT_LEADER' ||
        currentRole === 'SUPERUSER';

      if (!isStaff) return;

      const rejectedId = consumeLastRejectedSessionId();
      if (rejectedId) {
        stopIncomingCallVibration();
        dismissIncomingCallNotifications();
        dismissNativeIncomingCall(rejectedId);
        dismissNativeIncomingCall(1001);
        request(ENDPOINTS.CALL_END(rejectedId), { method: 'POST' }).catch(() => {});
        setShowIncomingModal(false);
        useChaplainStore.getState().clearAssignedCall();
        useCallStore.getState().resetCall();
        return;
      }

      const callData = getInitialCallData();
      if (!callData || !callData.sessionId) return;

      const isChat = callData.sessionType === 'CHAT';
      const rawCallerName = callData.callerName && typeof callData.callerName === 'string' && callData.callerName.trim().length > 0
        ? callData.callerName.trim()
        : undefined;

      const existingAssigned = useChaplainStore.getState().assignedCall;
      const isSameSession = existingAssigned?.sessionId === Number(callData.sessionId);
      const assigned: CallResponse = {
        ...(isSameSession ? existingAssigned : {}),
        sessionId: Number(callData.sessionId),
        sessionType: (callData.sessionType as any) || existingAssigned?.sessionType || 'VIDEO',
        livekitRoomName: callData.livekitRoom || existingAssigned?.livekitRoomName,
        token: callData.token || existingAssigned?.token,
        callerName: rawCallerName || existingAssigned?.callerName,
      };

      if (callData.action === 'REJECT') {
        stopIncomingCallVibration();
        dismissIncomingCallNotifications();
        dismissNativeIncomingCall(assigned.sessionId);
        dismissNativeIncomingCall(1001);
        try {
          await request(ENDPOINTS.CALL_END(assigned.sessionId), { method: 'POST' });
        } catch (err) {
          console.warn('[App] Direct intent reject failed:', err);
        }
        setShowIncomingModal(false);
        useChaplainStore.getState().clearAssignedCall();
        useCallStore.getState().resetCall();
        return;
      }

      if (callData.action === 'ACCEPT') {
        stopIncomingCallVibration();
        dismissIncomingCallNotifications();
        dismissNativeIncomingCall(assigned.sessionId);
        try {
          const acceptResponse = await request<CallResponse>(
            ENDPOINTS.CALL_ACCEPT(assigned.sessionId),
            {
              method: 'POST',
              headers: { 'X-Device-Channel': 'MOBILE' },
            }
          );
          const finalSession: CallResponse = {
            ...assigned,
            ...(acceptResponse || {}),
            callerName: acceptResponse?.callerName || assigned.callerName,
          };
          useChaplainStore.getState().setAssignedCall(finalSession);
          useCallStore.getState().setSession(finalSession);
          if (finalSession.clientToken) {
            setClientToken(finalSession.clientToken);
          }
          setShowIncomingModal(false);
          if (isChat || finalSession.sessionType === 'CHAT') {
            setActiveTab('chat');
          } else {
            setInCallView(true);
          }
          return;
        } catch (err) {
          console.warn('[App] Intent direct accept failed:', err);
        }
      }

      startIncomingCallVibration();
      turnScreenOnAndDismissKeyguard();
      useChaplainStore.getState().setAssignedCall(assigned);
      useCallStore.getState().setSession(assigned);
      if (assigned.clientToken) {
        setClientToken(assigned.clientToken);
      }
      setShowIncomingModal(true);
    };

    checkIncomingCallIntent();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkIncomingCallIntent();
      }
    });

    // Handle cold-start notification tap when app was killed
    Notifications.getLastNotificationResponseAsync()
      .then((initialResponse) => {
        if (initialResponse) {
          handleNotificationResponse(initialResponse);
        }
      })
      .catch(() => {});

    const responseSub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    const rejectNativeSub = addIncomingCallRejectedListener((event) => {
      const currentUser = useAuthStore.getState().user;
      const currentRole = currentUser?.role;
      const isStaff =
        currentRole === 'CHAPLAIN' ||
        currentRole === 'CHAPLAIN_LEADER' ||
        currentRole === 'CHAPLAIN_CONTENT_LEADER' ||
        currentRole === 'SUPERUSER';

      if (!isStaff) return;

      const rejectedSessionId = event?.sessionId;
      stopIncomingCallVibration();
      dismissIncomingCallNotifications();
      if (rejectedSessionId) {
        dismissNativeIncomingCall(Number(rejectedSessionId));
        request(ENDPOINTS.CALL_END(Number(rejectedSessionId)), { method: 'POST' }).catch(() => {});
      }
      dismissNativeIncomingCall(1001);
      setShowIncomingModal(false);
      useChaplainStore.getState().clearAssignedCall();
      useCallStore.getState().resetCall();
    });

    return () => {
      appStateSub.remove();
      receivedSub.remove();
      responseSub.remove();
      rejectNativeSub?.remove();
    };
  }, []);

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
      const isSameSession = currentAssigned?.sessionId === assigned.sessionId;
      const mergedAssigned: CallResponse = isSameSession
        ? {
            ...currentAssigned,
            ...assigned,
            callerName: assigned.callerName || currentAssigned?.callerName,
            intake: assigned.intake || currentAssigned?.intake,
            token: assigned.token || currentAssigned?.token,
            livekitRoomName: assigned.livekitRoomName || currentAssigned?.livekitRoomName,
          }
        : assigned;

      if (
        isSameSession &&
        currentAssigned?.token === mergedAssigned.token &&
        currentAssigned?.callerName === mergedAssigned.callerName &&
        Boolean(currentAssigned?.intake?.reason) === Boolean(mergedAssigned.intake?.reason)
      ) {
        return;
      }

      if (!isSameSession) {
        startIncomingCallVibration();
      }
      setAssignedCall(mergedAssigned);
      useCallStore.getState().setSession(mergedAssigned);
      if (mergedAssigned.clientToken) {
        setClientToken(mergedAssigned.clientToken);
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

    sse.addEventListener('call-answered', (data: any) => {
      stopIncomingCallVibration();
      dismissIncomingCallNotifications();
      const currentAssigned = useChaplainStore.getState().assignedCall;
      if (!data?.sessionId || currentAssigned?.sessionId === Number(data.sessionId)) {
        setShowIncomingModal(false);
        useChaplainStore.getState().clearAssignedCall();
        useCallStore.getState().resetCall();
        Alert.alert('Llamada Atendida', 'La llamada ya fue atendida desde la consola Web.');
      }
    });

    sse.addEventListener('call-cancelled', (data: any) => {
      stopIncomingCallVibration();
      dismissIncomingCallNotifications();
      const currentAssigned = useChaplainStore.getState().assignedCall;
      if (!data?.sessionId || currentAssigned?.sessionId === Number(data.sessionId)) {
        setShowIncomingModal(false);
        useChaplainStore.getState().clearAssignedCall();
        useCallStore.getState().resetCall();
      }
    });

    sse.connect();

    return () => {
      sse.close();
    };
  }, [isAuthenticated, user?.role, chaplainStatus, inCallView, inChatView, setAssignedCall]);

  const isAppReady = Boolean(fontsLoaded && !isLoading);

  if (!isAppReady && !showPreloader) {
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
          <LoginScreenPreview
            onNavigateToRegister={() => setAuthMode('register')}
            onNavigateToForgotPassword={() => setAuthMode('forgot_password')}
          />
        </AuthLayout>
      );
    }

    // 2. Active in Fullscreen Video Call Room (Switch to CallRoomScreenPreview for instant rollback)
    if (inCallView) {
      return (
        <VideoCallPreview
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
          onOpenChat={() => setInChatView(true)}
        />
      );
    }

    // 3. Active in Fullscreen Chat Room (if opened modally)
    if (inChatView) {
      return (
        <ChatPreview
          onBack={() => setInChatView(false)}
          onNavigateToPrayers={() => {
            setInChatView(false);
            handleNavigateToPrayers();
          }}
          onChatEnded={() => {
            const currentSes = useCallStore.getState().currentSession;
            const assigned = useChaplainStore.getState().assignedCall;
            const sessionId = currentSes?.sessionId || assigned?.sessionId || null;

            setInChatView(false);
            useChaplainStore.getState().clearAssignedCall();
            useCallStore.getState().resetCall();

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
          onPress: async () => {
            stopIncomingCallVibration();
            dismissIncomingCallNotifications();
            setNativeAuthContext(null, null, null);
            await unregisterDevicePushToken();
            useChaplainStore.getState().clearAssignedCall();
            logout();
          },
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
          return (
            <ChaplainContentDashboard
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToPrayers={handleNavigateToPrayers}
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
            />
          );
        case 'CHAPLAIN':
          return (
            <ChaplainDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setActiveTab('chat')}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={handleNavigateToPrayers}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
            />
          );
        case 'CHAPLAIN_LEADER':
          return (
            <LeaderDashboard
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setInChatView(true)}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={handleNavigateToPrayers}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
            />
          );
        case 'SUPERUSER':
          return <SuperuserDashboard />;
        case 'BASIC':
        default:
          return (
            <BasicDashboardPreview
              onJoinCall={() => setInCallView(true)}
              onJoinChat={() => setInChatView(true)}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToPrayers={handleNavigateToPrayers}
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
              onJoinChat={() => setInChatView(true)}
              lastEndedSessionId={lastEndedSessionId}
              onClearEndedSession={() => setLastEndedSessionId(null)}
              onNavigateToInformes={() => setActiveTab('informes')}
              onNavigatePrayerWall={() => setActiveTab('oraciones')}
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToBlogs={() => setActiveTab('blogs')}
            />
          );
        case 'home':
          return renderDashboardByRole();
        case 'chat':
          return (
            <ChatPreview
              onNavigateToPrayers={handleNavigateToPrayers}
              onBack={() => {
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
          return <BibleReaderPreview onBack={() => setActiveTab('home')} />;
        case 'oraciones':
          return <PrayerWallScreen initialTab={prayerWallTab} />;
        case 'perfil':
          return <ProfileScreen />;
        case 'mas':
          return (
            <HubScreen
              onNavigateToBible={() => setActiveTab('lectura')}
              onNavigateToContent={() => setActiveTab('content')}
              onNavigateToPrayers={handleNavigateToPrayers}
              onNavigateToBlogs={() => setActiveTab('blogs')}
              onContactChaplain={() => setActiveTab(isChaplainStaff ? 'guardia' : 'home')}
              onNavigateToGuardia={() => setActiveTab('guardia')}
              onNavigateToInformes={() => setActiveTab('informes')}
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

        {/* Global Incoming Session Alert Modal (Pop-up) for Chaplains Preview */}
        <IncomingSessionModalPreview
          visible={showIncomingModal && Boolean(assignedCall)}
          session={assignedCall}
          onAccept={async (sessionType: SessionType) => {
            stopIncomingCallVibration();
            dismissIncomingCallNotifications();
            if (assignedCall?.sessionId) {
              dismissNativeIncomingCall(assignedCall.sessionId);
            }
            dismissNativeIncomingCall(1001);
            if (!assignedCall?.sessionId) return;

            try {
              // Section 4: Atomic Resolution POST /calls/{sessionId}/accept?channel=MOBILE
              const acceptResponse = await request<CallResponse>(
                ENDPOINTS.CALL_ACCEPT(assignedCall.sessionId),
                {
                  method: 'POST',
                  headers: {
                    'X-Device-Channel': 'MOBILE',
                  },
                }
              );

              if (acceptResponse) {
                const finalSession: CallResponse = {
                  ...assignedCall,
                  ...acceptResponse,
                  callerName: acceptResponse.callerName || assignedCall.callerName,
                };
                setAssignedCall(finalSession);
                useCallStore.getState().setSession(finalSession);
                if (finalSession.clientToken) {
                  setClientToken(finalSession.clientToken);
                }
              }

              setShowIncomingModal(false);

              if (sessionType === 'CHAT' || acceptResponse?.sessionType === 'CHAT') {
                setActiveTab('chat');
              } else {
                setInCallView(true);
              }
            } catch (err: any) {
              console.warn('[App] Error accepting call on backend:', err?.status, err?.message, err?.body);
              setShowIncomingModal(false);
              useChaplainStore.getState().clearAssignedCall();
              useCallStore.getState().resetCall();

              // Scenario B: Conflict (Web Console already answered) — HTTP 409 Conflict
              if (err instanceof ApiError && err.status === 409) {
                const message =
                  err.body?.status === 'ALREADY_TAKEN' || err.body?.error?.includes('already')
                    ? 'La llamada ya fue atendida desde la consola Web.'
                    : err.message || 'La llamada ya no se encuentra disponible.';
                Alert.alert('Llamada Atendida', message);
              } else {
                Alert.alert(
                  'Aviso de Conexión',
                  err?.message || 'No se pudo conectar a la llamada de guardia.'
                );
              }
            }
          }}
          onReject={() => {
            stopIncomingCallVibration();
            dismissIncomingCallNotifications();
            const sid = assignedCall?.sessionId || useChaplainStore.getState().assignedCall?.sessionId;
            if (sid) {
              dismissNativeIncomingCall(sid);
              request(ENDPOINTS.CALL_END(sid), { method: 'POST' }).catch((err) =>
                console.warn('[App] Error ending rejected call on backend:', err)
              );
            }
            dismissNativeIncomingCall(1001);
            setShowIncomingModal(false);
            clearAssignedCall();
            useCallStore.getState().resetCall();
          }}
        />
      </>
    );
  };

  return (
    <SafeAppProvider style={{ flex: 1 }}>
      {isAppReady ? renderAppBody() : null}
      {showPreloader && (!isAppReady || !isAuthenticated || !user) ? (
        <AppPreloader
          isAppReady={isAppReady}
          fontsLoaded={fontsLoaded}
          onFinish={() => setShowPreloader(false)}
        />
      ) : null}
    </SafeAppProvider>
  );
}
