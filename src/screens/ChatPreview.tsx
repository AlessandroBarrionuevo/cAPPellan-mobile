import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAppInsets } from '../lib/safeArea';
import { ChatStompService } from '../lib/chat/stompClient';
import { useAuthStore } from '../lib/stores/auth';
import { useCallStore } from '../lib/stores/call';
import { useChaplainStore } from '../lib/stores/chaplain';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import { SseClient } from '../lib/api/sse';
import type { Session, CallIntake, SessionType } from '../types/api';
import type {
  ChatMessage,
  ChatConnectionStatus,
  ChatSenderRole,
  SendChatMessagePayload,
} from '../types/chat';
import CallIntakeModalPreview from '../components/duty/CallIntakeModalPreview';
import NoChaplainAvailableModal from '../components/duty/NoChaplainAvailableModal';
import {
  ArrowLeft,
  Lock,
  Phone,
  Shield,
  Send,
  CheckCheck,
  MessageSquare,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';

export interface ChatPreviewProps {
  onBack?: () => void;
  onChatEnded?: () => void;
  sessionId?: number;
  clientToken?: string;
  isChaplainMode?: boolean;
  chaplainName?: string;
  comradeName?: string;
}

interface InspirationalQuote {
  verse: string;
  reference: string;
}

const INSPIRATIONAL_PHRASES: InspirationalQuote[] = [
  {
    verse: '«Cercano está el Señor a los quebrantados de corazón, y salva a los contritos de espíritu.»',
    reference: 'Salmos 34:18',
  },
  {
    verse: '«Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.»',
    reference: 'Mateo 11:28',
  },
  {
    verse: '«No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.»',
    reference: 'Isaías 41:10',
  },
  {
    verse: '«La paz os dejo, mi paz os doy; no se turbe vuestro corazón, ni tenga miedo.»',
    reference: 'Juan 14:27',
  },
  {
    verse: '«Dios es nuestro amparo y nuestra fortaleza, nuestro pronto auxilio en las tribulaciones.»',
    reference: 'Salmos 46:1',
  },
  {
    verse: '«Echa sobre el Señor tu carga, y él te sustentará; jamás dejará caído al justo.»',
    reference: 'Salmos 55:22',
  },
];

const DEFAULT_CHAPLAIN_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1E4cdgjAUybt1cxKuEt7zlKASVb_WWeheuNaA7KO4vpWUt25tJaC3dgpBdQGU7wJXroJtaR3ZRRQBdhIMALR5LkhEM5OomDOoKQnxw0-TWVs9rBhtjgZ7OUrP98U6wMkM0vTe1eWnw-7M2W50HTMPZ475mCcZqdpkCa1asdtSdqShq8GwviMy_WbnHIpLS7-qGGp3brQsMBtg5lERg9HTcwJbgvrt-cBCeq3tuXh1QP5_KMQ_w1Tv3w';

export default function ChatPreview({
  onBack,
  onChatEnded,
  sessionId: propSessionId,
  clientToken: propClientToken,
  isChaplainMode: propIsChaplainMode,
  chaplainName = 'Capellán Daniel Godoy',
  comradeName = 'Camarada en Consulta',
}: ChatPreviewProps) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const isTablet = width > 500;

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const currentSession = useCallStore((state) => state.currentSession);
  const callStatus = useCallStore((state) => state.callStatus);
  const callError = useCallStore((state) => state.error);
  const requestCall = useCallStore((state) => state.requestCall);
  const endCall = useCallStore((state) => state.endCall);
  const resetCall = useCallStore((state) => state.resetCall);
  const assignedCall = useChaplainStore((state) => state.assignedCall);

  const isChaplainRole =
    propIsChaplainMode ??
    (user?.role === 'CHAPLAIN' ||
      user?.role === 'CHAPLAIN_LEADER' ||
      user?.role === 'SUPERUSER');

  // Resolve session from props or stores with strict type validation
  const rawSessionId =
    propSessionId ||
    (isChaplainRole
      ? assignedCall?.sessionId || currentSession?.sessionId
      : currentSession?.sessionId || assignedCall?.sessionId);

  const effectiveSessionId: number | null =
    rawSessionId && !isNaN(Number(rawSessionId)) && Number(rawSessionId) > 0
      ? Number(rawSessionId)
      : null;

  const rawClientToken =
    propClientToken ||
    (isChaplainRole
      ? assignedCall?.clientToken || currentSession?.clientToken
      : currentSession?.clientToken || assignedCall?.clientToken);

  const effectiveClientToken: string | null =
    rawClientToken &&
    typeof rawClientToken === 'string' &&
    rawClientToken.trim().length > 0 &&
    rawClientToken !== 'undefined'
      ? rawClientToken.trim()
      : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>('connecting');
  const [connectingStageNotice, setConnectingStageNotice] = useState<string>(
    'Iniciando túnel seguro cifrado...'
  );
  const [hasInitiallyConnected, setHasInitiallyConnected] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'LOADING' | 'WAITING' | 'IN_PROGRESS' | 'ENDED'>(
    effectiveSessionId ? 'LOADING' : 'ENDED'
  );
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  // Motivational quote rotator during loading
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % INSPIRATIONAL_PHRASES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Life-cycle debug logger for Metro terminal
  useEffect(() => {
    console.log(
      `[ChatPreview] 🟢 Mounted. SessionId: ${effectiveSessionId} | ClientToken: ${
        effectiveClientToken ? 'Present' : 'None'
      } | Role: ${isChaplainRole ? 'CHAPLAIN' : user ? 'BASIC' : 'GUEST'} | ConnectionStatus: ${connectionStatus}`
    );
    return () => {
      console.log(`[ChatPreview] 🧹 Unmounted session #${effectiveSessionId}`);
    };
  }, [effectiveSessionId, effectiveClientToken, isChaplainRole, user, connectionStatus]);

  // Fallback and Intake Modal States
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const stompRef = useRef<ChatStompService | null>(null);
  const isTerminatedRef = useRef(false);

  const displayTitle = isChaplainRole ? comradeName : chaplainName;
  const mySenderRole: ChatSenderRole = isChaplainRole
    ? 'CHAPLAIN'
    : user
    ? 'BASIC'
    : 'GUEST';
  const mySenderName = isChaplainRole
    ? user?.username || 'Capellán'
    : user?.username || 'Oficial Reservado';

  // Watch for call store errors (e.g. 404 No chaplains available)
  useEffect(() => {
    if (callError && (callError.includes('No hay capellanes') || callError.includes('disponibles'))) {
      setShowFallbackModal(true);
    }
  }, [callError]);

  // Central remote session termination handler
  const handleRemoteSessionEnded = useCallback(() => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setSessionStatus('ENDED');

    if (stompRef.current) {
      stompRef.current.disconnect();
      stompRef.current = null;
    }

    useChaplainStore.getState().clearAssignedCall();
    resetCall();

    if (!isChaplainRole) {
      Alert.alert(
        'Consulta Concluida',
        'El capellán ha dado por finalizada la sesión de acompañamiento.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              if (onChatEnded) onChatEnded();
              else if (onBack) onBack();
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      if (onChatEnded) onChatEnded();
      else if (onBack) onBack();
    }
  }, [isChaplainRole, onChatEnded, onBack, resetCall]);

  // 1. Fetch REST message history when a real session is connected
  const loadHistory = useCallback(async () => {
    if (!effectiveSessionId) return;
    try {
      console.log(`[ChatPreview] 🔄 Fetching history for session #${effectiveSessionId}...`);
      const messagesUrl = effectiveClientToken
        ? `${ENDPOINTS.CALLS_MESSAGES(effectiveSessionId)}?clientToken=${encodeURIComponent(
            effectiveClientToken
          )}`
        : ENDPOINTS.CALLS_MESSAGES(effectiveSessionId);

      const history = await request<ChatMessage[]>(messagesUrl, {
        headers: effectiveClientToken ? { 'X-Client-Token': effectiveClientToken } : {},
      });

      if (Array.isArray(history)) {
        console.log(`[ChatPreview] 📥 History loaded: ${history.length} message(s)`);
        setMessages((prev) => {
          const validHistory = history.filter(
            (m) => !m.sessionId || Number(m.sessionId) === Number(effectiveSessionId)
          );
          const historyIds = new Set(validHistory.map((m) => m.id).filter(Boolean));
          const pendingOptimistic = prev.filter(
            (m) => m.id && m.id < 0 && !historyIds.has(m.id)
          );
          return [...validHistory, ...pendingOptimistic];
        });
      }
    } catch (err) {
      console.warn('[ChatPreview] ⚠️ Failed to load history:', err);
    }
  }, [effectiveSessionId, effectiveClientToken]);

  // 2. Pre-flight session verification & remote termination watch
  useEffect(() => {
    if (!effectiveSessionId) {
      setSessionStatus('ENDED');
      return;
    }

    let isMounted = true;
    isTerminatedRef.current = false;

    const checkSessionStatus = async () => {
      try {
        const detailUrl = effectiveClientToken
          ? `${ENDPOINTS.CALL_DETAIL(effectiveSessionId)}?clientToken=${encodeURIComponent(
              effectiveClientToken
            )}`
          : ENDPOINTS.CALL_DETAIL(effectiveSessionId);

        const detail = await request<Session>(detailUrl, {
          headers: effectiveClientToken ? { 'X-Client-Token': effectiveClientToken } : {},
        });

        if (!isMounted) return;

        if (!detail || detail.status === 'ENDED') {
          console.log(`[ChatPreview] 🛑 Remote session status ended (Session #${effectiveSessionId})`);
          handleRemoteSessionEnded();
        } else if (detail.status === 'WAITING') {
          setSessionStatus('WAITING');
        } else if (detail.status === 'IN_PROGRESS') {
          setSessionStatus('IN_PROGRESS');
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.status === 404 || err?.status === 409) {
          console.warn(`[ChatPreview] ⚠️ Session check error ${err?.status}, handling termination.`);
          handleRemoteSessionEnded();
        }
      }
    };

    void checkSessionStatus();

    // Secondary poll: every 6 seconds check if session is still alive
    const interval = setInterval(checkSessionStatus, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveSessionId, effectiveClientToken, handleRemoteSessionEnded]);

  // 3. Setup Live WebSocket / STOMP Service immediately upon mounting with active session
  useEffect(() => {
    if (!effectiveSessionId) {
      return;
    }

    // Load message history from server immediately
    void loadHistory();

    console.log(`[ChatPreview] 🚀 Initializing STOMP client for session #${effectiveSessionId}...`);

    const stomp = new ChatStompService({
      sessionId: effectiveSessionId,
      token: token || undefined,
      clientToken: effectiveClientToken || undefined,
      isChaplain: isChaplainRole,
      onMessage: (incoming: ChatMessage) => {
        if (
          incoming.sessionId &&
          Number(incoming.sessionId) !== Number(effectiveSessionId)
        ) {
          return;
        }

        console.log(
          `[ChatPreview] 📥 Incoming message #${incoming.id || 'temp'} from ${incoming.senderName} (${incoming.senderRole}): "${incoming.content}"`
        );

        setMessages((prev) => {
          if (incoming.id && prev.some((p) => p.id === incoming.id)) {
            return prev;
          }
          // Replace matching optimistic message
          const optIdx = prev.findIndex(
            (p) =>
              p.id &&
              p.id < 0 &&
              p.content === incoming.content &&
              p.senderRole === incoming.senderRole
          );
          if (optIdx >= 0) {
            const next = [...prev];
            next[optIdx] = incoming;
            return next;
          }
          return [...prev, incoming];
        });
      },
      onStatusChange: (status) => {
        console.log(`[ChatPreview] 🔄 Connection status changed -> ${status}`);
        setConnectionStatus(status);
        if (status === 'connected') {
          setHasInitiallyConnected(true);
          setStatusNotice(null);
          setConnectingStageNotice('Enlace seguro activo. Ingresando a la sala...');
        } else if (status === 'reconnecting') {
          setStatusNotice('Reconectando túnel seguro...');
          setConnectingStageNotice('Reconectando túnel seguro...');
        } else if (status === 'error') {
          setStatusNotice('Reintentando enlace...');
          setConnectingStageNotice('Reintentando enlace con el servidor...');
        }
      },
      onStageNotice: (notice) => {
        console.log(`[ChatPreview] 📢 STOMP stage notice: ${notice}`);
        setConnectingStageNotice(notice);
      },
      onError: (err) => {
        console.warn('[ChatPreview] ⚠️ Stomp error:', err);
      },
    });

    stomp.connect();
    stompRef.current = stomp;

    return () => {
      console.log(`[ChatPreview] 🔌 Disconnecting STOMP for session #${effectiveSessionId}`);
      stomp.disconnect();
      stompRef.current = null;
    };
  }, [effectiveSessionId, token, effectiveClientToken, isChaplainRole, loadHistory]);

  // 4. Send message handler (Strictly live STOMP, no mock simulation)
  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !effectiveSessionId) return;

    console.log(`[ChatPreview] 📤 Sending message: "${trimmed}" (Session #${effectiveSessionId})`);

    const optimisticId = -Date.now();
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      sessionId: effectiveSessionId,
      senderRole: mySenderRole,
      senderName: mySenderName,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    const payload: SendChatMessagePayload = {
      sessionId: effectiveSessionId,
      senderRole: mySenderRole,
      senderName: mySenderName,
      content: trimmed,
      clientToken: effectiveClientToken || undefined,
    };

    if (stompRef.current) {
      stompRef.current.sendMessage(payload);
    } else {
      console.warn('[ChatPreview] ⚠️ STOMP service not active when sending message');
    }
  };

  const handleEndChat = () => {
    Alert.alert(
      'Finalizar Sesión',
      '¿Deseás cerrar la sala de conversación confidencial?',
      [
        { text: 'Continuar en sala', style: 'cancel' },
        {
          text: 'Finalizar y Salir',
          style: 'destructive',
          onPress: async () => {
            if (stompRef.current) {
              stompRef.current.disconnect();
              stompRef.current = null;
            }
            if (effectiveSessionId && isChaplainRole) {
              try {
                await endCall(effectiveSessionId);
              } catch (e) {
                // Handled
              }
            }
            useChaplainStore.getState().clearAssignedCall();
            resetCall();
            if (onChatEnded) {
              onChatEnded();
            } else if (onBack) {
              onBack();
            }
          },
        },
      ]
    );
  };

  // Launch real chat request from empty state
  const handleStartChatRequest = async (intake?: CallIntake) => {
    setShowIntakeModal(false);
    try {
      await requestCall('CHAT', intake);
    } catch (err) {
      console.warn('[ChatPreview] Request call error:', err);
    }
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe =
      (item.senderRole && item.senderRole === mySenderRole) ||
      item.senderName === mySenderName;

    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowRight : styles.messageRowLeft]}>
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
            globalStyles.shadowSm,
          ]}
        >
          {!isMe && (
            <Text style={styles.senderNameHeader}>
              {item.senderName || displayTitle}
            </Text>
          )}

          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>

          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
              {timeStr}
            </Text>
            {isMe && <CheckCheck size={13} color="#D4E3FF" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  };

  // =========================================================================
  // FALLBACK / EMPTY STATE: When NO active session exists
  // Instead of hardcoding fake conversations, display the real fallback options!
  // =========================================================================
  if (!effectiveSessionId || sessionStatus === 'ENDED') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack || onChatEnded}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Atención Pastoral Confidencial</Text>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowFallbackModal(true)}
            activeOpacity={0.8}
          >
            <Phone size={17} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Empty State Banner */}
        <View style={[styles.emptyContainer, isTablet && styles.tabletContent]}>
          <View style={styles.emptyIconCircle}>
            <MessageSquare size={38} color={Theme.colors.tacticalNavy} strokeWidth={2.2} />
          </View>

          <Text style={styles.emptyTitle}>Sin Sesión de Guardia Activa</Text>
          <Text style={styles.emptySubtitle}>
            Para dialogar de manera confidencial con un capellán de guardia, iniciá tu solicitud o comunicate directamente con las líneas de asistencia de turno.
          </Text>

          <View style={styles.emptyActionsCol}>
            {/* Primary Action: Open Intake Form */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => setShowIntakeModal(true)}
              activeOpacity={0.85}
            >
              <MessageSquare size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.primaryActionButtonText}>Solicitar Chat con Capellán</Text>
            </TouchableOpacity>

            {/* Secondary Action: Open Fallback Modal with Numbers & Social Media */}
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => setShowFallbackModal(true)}
              activeOpacity={0.85}
            >
              <Phone size={18} color={Theme.colors.tacticalNavy} strokeWidth={2.2} />
              <Text style={styles.secondaryActionButtonText}>
                Otras formas de contacto
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyCovenantBox}>
            <Shield size={16} color="#0c7ae0" />
            <Text style={styles.emptyCovenantText}>
              Secreto Ministerial Inviolable · Resguardo ético y canónico de la Capellanía.
            </Text>
          </View>
        </View>

        {/* Real Call Intake Modal for Chat */}
        <CallIntakeModalPreview
          visible={showIntakeModal}
          sessionType="CHAT"
          onClose={() => setShowIntakeModal(false)}
          isSubmitting={callStatus === 'REQUESTING'}
          onSubmit={handleStartChatRequest}
        />

        {/* The requested Fallback Cartel with Emergency Numbers & Social Networks */}
        <NoChaplainAvailableModal
          visible={showFallbackModal}
          onClose={() => {
            setShowFallbackModal(false);
            resetCall();
          }}
          onRetry={() => {
            setShowFallbackModal(false);
            resetCall();
            setShowIntakeModal(true);
          }}
        />
      </View>
    );
  }

  // =========================================================================
  // CONNECTING LOADER SCREEN: Handshake, frame negotiation & sync in progress
  // =========================================================================
  if (effectiveSessionId && !hasInitiallyConnected) {
    const activeQuote =
      INSPIRATIONAL_PHRASES[activePhraseIndex] || INSPIRATIONAL_PHRASES[0];

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleEndChat}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.headerInfoCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={styles.statusText}>Iniciando enlace confidencial...</Text>
          </View>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowFallbackModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Líneas de emergencia"
          >
            <Phone size={17} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Loader Body Container */}
        <View style={[styles.loaderContainer, isTablet && styles.tabletContent]}>
          {/* Animated Spinner with Centered Secure Shield */}
          <View style={styles.loaderIconWrapper}>
            <ActivityIndicator
              size="large"
              color={Theme.colors.tacticalNavy}
              style={styles.loaderSpinner}
            />
            <View style={styles.loaderInnerShield}>
              <Shield size={28} color={Theme.colors.tacticalNavy} />
            </View>
          </View>

          <Text style={styles.loaderMainTitle}>Estableciendo Canal Seguro</Text>

          {/* Dynamic Subtitle Feedback with Current Handshake Stage */}
          <View style={styles.stageNoticePill}>
            <View style={styles.pulsingStageDot} />
            <Text style={styles.stageNoticeText}>{connectingStageNotice}</Text>
          </View>

          {/* Confidentiality Art 34-B Badge */}
          <View style={styles.loaderSecurityBadge}>
            <Lock size={12} color="#1E40AF" />
            <Text style={styles.loaderSecurityText}>
              CANAL CIFRADO PUNTO A PUNTO · ART
            </Text>
            <Text style={styles.loaderSecurityText}>
              34-B SECRETO MINISTERIAL
            </Text>
          </View>

          {/* Inspirational Motivational Quote Card */}
          <View style={styles.quoteCard}>
            <View style={styles.quoteHeaderRow}>
              <Text style={styles.quoteCardLabel}>PALABRA DE REFUGIO</Text>
            </View>
            <Text style={styles.quoteVerse}>{activeQuote.verse}</Text>
            <Text style={styles.quoteRef}>{activeQuote.reference}</Text>
          </View>

          {/* Actions Column */}
          <View style={styles.loaderActionsRow}>
            <TouchableOpacity
              style={styles.loaderFallbackBtn}
              onPress={() => setShowFallbackModal(true)}
              activeOpacity={0.85}
            >
              <Phone size={16} color={Theme.colors.tacticalNavy} strokeWidth={2.2} />
              <Text style={styles.loaderFallbackText}>
                Líneas de Guardia y Emergencia
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loaderCancelBtn}
              onPress={handleEndChat}
              activeOpacity={0.7}
            >
              <Text style={styles.loaderCancelText}>Cancelar y Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fallback Modal Accessible Anytime */}
        <NoChaplainAvailableModal
          visible={showFallbackModal}
          onClose={() => setShowFallbackModal(false)}
          onRetry={() => {
            setShowFallbackModal(false);
            if (stompRef.current) {
              stompRef.current.connect();
            }
          }}
        />
      </View>
    );
  }

  // =========================================================================
  // ACTIVE CHAT ROOM SCREEN (STOMP WebSocket RFC 6455)
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. TOP HEADER BAR */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleEndChat}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.avatarWrapper}>
            <Image source={{ uri: DEFAULT_CHAPLAIN_AVATAR }} style={styles.avatar} />
            <View
              style={[
                styles.onlineDot,
                connectionStatus !== 'connected' && styles.onlineDotConnecting,
              ]}
            />
          </View>

          <View style={styles.headerInfoCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicatorDot,
                  connectionStatus === 'connected'
                    ? styles.statusDotConnected
                    : styles.statusDotConnecting,
                ]}
              />
              <Text style={styles.statusText}>
                {statusNotice ||
                  (connectionStatus === 'connected'
                    ? 'Enlace seguro activo'
                    : 'Conectando túnel seguro...')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Emergency / Fallback Cartel Button (Direct Access to 911, 147, WhatsApp) */}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowFallbackModal(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Phone size={17} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. CONFIDENTIALITY COVENANT STRIP */}
      <View style={[styles.covenantBanner, isTablet && styles.tabletContent]}>
        <View style={styles.covenantLeft}>
          <Lock size={12} color="#0c7ae0" />
          <Text style={styles.covenantText}>CANAL CIFRADO PUNTO A PUNTO</Text>
        </View>
        {/* <Text style={styles.covenantRightText}>SECRETO MINISTERIAL</Text> */}
      </View>

      {/* WAITING ACCEPTANCE BANNER (If session was created but chaplain hasn't accepted yet) */}
      {sessionStatus === 'WAITING' && (
        <View style={[styles.waitingNoticeBanner, isTablet && styles.tabletContent]}>
          <Clock size={14} color="#D97706" />
          <Text style={styles.waitingNoticeText}>
            En cola de guardia: esperando que el capellán acepte la solicitud...
          </Text>
        </View>
      )}

      {/* 3. MESSAGE STREAM */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) =>
            item.id ? `msg-${item.id}` : `msg-idx-${index}`
          }
          renderItem={renderMessageItem}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesListContent,
            isTablet && styles.tabletContent,
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>Hoy · Guardia Pastoral Activa</Text>
              </View>

              <View style={styles.refugeNoticeCard}>
                <Shield size={16} color={Theme.colors.primary} style={{ marginTop: 2 }} />
                <View style={styles.refugeNoticeCol}>
                  <Text style={styles.refugeNoticeTitle}>Refugio Espiritual y Reserva Total</Text>
                  <Text style={styles.refugeNoticeBody}>
                    Toda consulta compartida en este espacio está blindada bajo el secreto pastoral. Ningún registro será divulgado a terceros ni mandos.
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesText}>
                {sessionStatus === 'WAITING'
                  ? 'Aguardando que el capellán se una a la sala...'
                  : 'Canal ministerial establecido. Escribí tu mensaje para iniciar el diálogo.'}
              </Text>
            </View>
          }
        />

        {/* 4. BOTTOM INPUT DISPATCH DOCK */}
        <View
          style={[
            styles.inputDock,
            { paddingBottom: Math.max(insets.bottom, 14) },
            isTablet && styles.tabletContent,
          ]}
        >
          <View style={styles.inputDockCard}>
            <TextInput
              style={styles.dockTextInput}
              placeholder="Escribe tu mensaje con tranquilidad..."
              placeholderTextColor="#8A92A0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={4000}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              activeOpacity={0.85}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Send size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dockDisclaimer}>
            Protegido por secreto pastoral inviolable · Transmisión RFC 6455
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Fallback Cartel Accessible at Any Time */}
      <NoChaplainAvailableModal
        visible={showFallbackModal}
        onClose={() => setShowFallbackModal(false)}
        onRetry={() => {
          setShowFallbackModal(false);
          setShowIntakeModal(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  tabletContent: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  headerBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  headerInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#0C1C30',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  covenantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBEAFE',
  },
  covenantLeft: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  covenantText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#1E40AF',
    letterSpacing: 0.3,
  },
  covenantRightText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9,
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  waitingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  waitingNoticeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: 16,
  },
  datePill: {
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  datePillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#475569',
  },
  refugeNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  refugeNoticeCol: {
    flex: 1,
  },
  refugeNoticeTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2,
  },
  refugeNoticeBody: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: '#64748B',
  },
  emptyMessagesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyMessagesText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMe: {
    backgroundColor: '#0c7ae0',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  senderNameHeader: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#0c7ae0',
    marginBottom: 3,
  },
  messageText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#0F172A',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
  },
  bubbleTimeMe: {
    color: '#D4E3FF',
  },
  bubbleTimeOther: {
    color: '#94A3B8',
  },
  inputDock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  inputDockCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dockTextInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 110,
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  dockDisclaimer: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },

  // EMPTY / FALLBACK SCREEN STYLES
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyActionsCol: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.tacticalNavy,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.tacticalNavy,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryActionButtonText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: Theme.colors.tacticalNavy,
  },
  emptyCovenantBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  emptyCovenantText: {
    fontFamily: Theme.fonts.body,
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 15,
  },

  // CONNECTING LOADER STYLES
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  loaderIconWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  loaderSpinner: {
    transform: [{ scale: 1.6 }],
    position: 'absolute',
  },
  loaderInnerShield: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderMainTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  stageNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pulsingStageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  stageNoticeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: '#0369A1',
  },
  loaderSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  loaderSecurityText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#1E40AF',
    letterSpacing: 0.3,
  },
  quoteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quoteHeaderRow: {
    marginBottom: 8,
  },
  quoteCardLabel: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 1.2,
  },
  quoteVerse: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 20,
    color: '#1E293B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  quoteRef: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: '#0c7ae0',
    textAlign: 'right',
  },
  loaderActionsRow: {
    width: '100%',
    gap: 12,
  },
  loaderFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.tacticalNavy,
    paddingVertical: 13,
    borderRadius: 12,
  },
  loaderFallbackText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: Theme.colors.tacticalNavy,
  },
  loaderCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loaderCancelText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#64748B',
  },
});
