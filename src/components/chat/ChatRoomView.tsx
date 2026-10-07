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
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAppInsets } from '../../lib/safeArea';
import { ChatStompService } from '../../lib/chat/stompClient';
import { useAuthStore } from '../../lib/stores/auth';
import { useCallStore } from '../../lib/stores/call';
import { useChaplainStore } from '../../lib/stores/chaplain';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { getMyBasicProfile } from '../../lib/api/profiles';
import { SseClient } from '../../lib/api/sse';
import type { Session } from '../../types/api';
import type {
  ChatMessage,
  ChatConnectionStatus,
  ChatSenderRole,
  SendChatMessagePayload,
} from '../../types/chat';
import {
  ArrowLeft,
  Lock,
  Phone,
  Video,
  Shield,
  ShieldAlert,
  Send,
  Mic,
  PlusCircle,
  CheckCheck,
  FileText,
} from 'lucide-react-native';

export interface ChatRoomViewProps {
  sessionId?: number;
  clientToken?: string;
  isChaplainMode?: boolean;
  chaplainName?: string;
  comradeName?: string;
  onChatEnded: () => void;
  onRequestReport?: (sessionId: number) => void;
}

export function ChatRoomView({
  sessionId,
  clientToken,
  isChaplainMode = false,
  chaplainName = 'Capellán Daniel Godoy',
  comradeName = 'Camarada en Consulta',
  onChatEnded,
  onRequestReport,
}: ChatRoomViewProps) {
  const insets = useAppInsets();
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ChatConnectionStatus>('connecting');
  const [showStealthDrawer, setShowStealthDrawer] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const stompRef = useRef<ChatStompService | null>(null);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const displayTitle = isChaplainMode ? comradeName : chaplainName;
  const displaySubtitle = isChaplainMode
    ? 'cAPPellan · Canal de Acompañamiento'
    : 'cAPPellan · Confidencial';

  const [isAnonymousUser, setIsAnonymousUser] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isChaplainMode && user) {
      getMyBasicProfile()
        .then((profile) => {
          if (isMounted && profile?.isAnonymous) {
            setIsAnonymousUser(true);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isChaplainMode, user]);

  const mySenderRole: ChatSenderRole = isChaplainMode
    ? 'CHAPLAIN'
    : user
    ? 'BASIC'
    : 'GUEST';

  const mySenderName = isChaplainMode
    ? user?.username || 'Capellán'
    : isAnonymousUser
    ? 'Oficial Reservado'
    : user?.username || 'Anónimo';

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset local state whenever sessionId changes
  const [sessionStatus, setSessionStatus] = useState<'LOADING' | 'WAITING' | 'IN_PROGRESS' | 'ENDED'>(
    sessionId ? 'LOADING' : 'ENDED'
  );

  useEffect(() => {
    setMessages([]);
    setInputText('');
    setErrorMessage(null);
    setSessionStatus(sessionId ? 'LOADING' : 'ENDED');
  }, [sessionId]);

  // Centralized remote session termination handler (chaplain finishes on Web, or session ended on server)
  const isTerminatedRef = useRef(false);

  const handleRemoteSessionEnded = useCallback(() => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    setSessionStatus('ENDED');

    if (stompRef.current) {
      stompRef.current.disconnect();
      stompRef.current = null;
    }

    useChaplainStore.getState().clearAssignedCall();
    useCallStore.getState().resetCall();

    if (!isChaplainMode) {
      Alert.alert(
        'Consulta Concluida',
        'El capellán ha dado por finalizada la sesión de acompañamiento.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              onChatEnded();
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      onChatEnded();
      if (sessionId && onRequestReport) {
        onRequestReport(sessionId);
      }
    }
  }, [isChaplainMode, onChatEnded, onRequestReport, sessionId]);

  // 1. Fetch REST message history for this session only (safely merged)
  const loadMessageHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const messagesUrl = clientToken
        ? `${ENDPOINTS.CALLS_MESSAGES(sessionId)}?clientToken=${encodeURIComponent(clientToken)}`
        : ENDPOINTS.CALLS_MESSAGES(sessionId);
      const history = await request<ChatMessage[]>(messagesUrl, {
        headers: clientToken ? { 'X-Client-Token': clientToken } : {},
      });
      if (Array.isArray(history)) {
        setMessages((prev) => {
          const validHistory = history.filter(
            (m) => !m.sessionId || Number(m.sessionId) === Number(sessionId)
          );
          const historyIds = new Set(validHistory.map((m) => m.id).filter(Boolean));
          // Preserve any unrecorded live messages or pending optimistic messages
          const pendingLive = prev.filter(
            (m) => !m.id || (!historyIds.has(m.id) && m.id > 0) || (m.id && m.id < 0)
          );
          return [...validHistory, ...pendingLive];
        });
      }
    } catch (e) {
      console.warn('[ChatRoomView] Could not load message history:', e);
    }
  }, [sessionId, clientToken]);

  // 2. Pre-flight session verification before STOMP connect
  useEffect(() => {
    if (!sessionId) return;
    let isCancelled = false;

    const detailUrl = clientToken
      ? `${ENDPOINTS.CALL_DETAIL(sessionId)}?clientToken=${encodeURIComponent(clientToken)}`
      : ENDPOINTS.CALL_DETAIL(sessionId);

    request<Session>(detailUrl, {
      headers: clientToken ? { 'X-Client-Token': clientToken } : {},
    })
      .then((detail) => {
        if (isCancelled) return;
        if (!detail || detail.status === 'ENDED') {
          handleRemoteSessionEnded();
        } else if (detail.status === 'WAITING') {
          setSessionStatus('WAITING');
        } else {
          setSessionStatus('IN_PROGRESS');
        }
      })
      .catch((err: any) => {
        if (isCancelled) return;
        if (err?.status === 404 || err?.status === 409) {
          handleRemoteSessionEnded();
        } else {
          setSessionStatus('IN_PROGRESS');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sessionId, clientToken, handleRemoteSessionEnded]);

  // 3. Setup STOMP WebSocket (active when session is verified)
  useEffect(() => {
    if (!sessionId || sessionStatus === 'ENDED') return;

    loadMessageHistory();

    const stomp = new ChatStompService({
      sessionId,
      token: token || undefined,
      clientToken: clientToken || undefined,
      isChaplain: isChaplainMode,
      onMessage: (msg) => {
        // Discard any message not matching current active session
        if (msg.sessionId && Number(msg.sessionId) !== Number(sessionId)) {
          console.warn(`[ChatRoomView] Ignored foreign message for session ${msg.sessionId}`);
          return;
        }
        setMessages((prev) => {
          // If message already exists by id, ignore duplicate
          if (msg.id && prev.some((p) => p.id === msg.id)) {
            return prev;
          }
          // If an optimistic message matches, replace it seamlessly
          const optIndex = prev.findIndex(
            (p) =>
              p.id &&
              p.id < 0 &&
              p.content === msg.content &&
              p.senderRole === msg.senderRole
          );
          if (optIndex >= 0) {
            const next = [...prev];
            next[optIndex] = msg;
            return next;
          }
          return [...prev, msg];
        });
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          setErrorMessage(null);
        }
      },
      onError: (err) => {
        console.error('[ChatRoomView] Stomp error:', err);
        const text = err instanceof Error ? err.message : String(err);
        if (text.includes('already ended') || text.includes('1002')) {
          handleRemoteSessionEnded();
        } else if (text.includes('Access denied') || text.includes('Unauthorized')) {
          setErrorMessage('Acceso denegado. Volvé a iniciar sesión.');
        } else {
          setErrorMessage('Error en enlace. Reconectando...');
        }
      },
    });

    stomp.connect();
    stompRef.current = stomp;

    return () => {
      stomp.disconnect();
      stompRef.current = null;
    };
  }, [sessionId, sessionStatus, token, clientToken, isChaplainMode, loadMessageHistory, handleRemoteSessionEnded]);

  // 4. Multi-channel Remote Session Termination Monitoring (SSE + Polling)
  useEffect(() => {
    if (!sessionId || sessionStatus === 'ENDED') return;
    isTerminatedRef.current = false;

    // Real-time SSE on /calls/{sessionId}/sse
    const sseUrl = ENDPOINTS.CALL_SSE_STATUS(sessionId, clientToken);
    const sse = new SseClient(sseUrl);

    sse.addEventListener('status-change', (data: any) => {
      if (!data) return;
      if (data.status === 'ENDED') {
        handleRemoteSessionEnded();
      } else if (data.status === 'IN_PROGRESS') {
        setSessionStatus('IN_PROGRESS');
      }
    });

    sse.connect();

    // Secondary Polling fallback every 3.5s
    const pollInterval = setInterval(async () => {
      if (isTerminatedRef.current) return;
      try {
        const detail = await request<Session>(ENDPOINTS.CALL_DETAIL(sessionId));
        if (detail) {
          if (detail.status === 'ENDED') {
            handleRemoteSessionEnded();
          } else if (detail.status === 'IN_PROGRESS' && sessionStatus === 'WAITING') {
            setSessionStatus('IN_PROGRESS');
          }
        }
      } catch (err: any) {
        if (err?.status === 404 || err?.status === 409) {
          handleRemoteSessionEnded();
        }
      }
    }, 3500);

    return () => {
      sse.close();
      clearInterval(pollInterval);
    };
  }, [sessionId, clientToken, sessionStatus, handleRemoteSessionEnded]);

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (!sessionId || sessionStatus === 'ENDED') {
      Alert.alert(
        'Sin Sesión Activa',
        'No hay una sesión asignada actualmente. Para iniciar una consulta, solicitala desde la Guardia o Inicio.'
      );
      return;
    }

    if (sessionStatus === 'WAITING') {
      Alert.alert(
        'Aguardando al Capellán',
        'La sesión aún se encuentra en cola de espera. Podrás enviar mensajes en cuanto el capellán se una a la sala.'
      );
      return;
    }

    const payload: SendChatMessagePayload = {
      sessionId,
      senderRole: mySenderRole,
      senderName: mySenderName,
      content: trimmed,
      clientToken: clientToken || undefined,
    };

    if (stompRef.current?.isConnected()) {
      const sent = stompRef.current.sendMessage(payload);
      if (sent) {
        // Optimistic UI update: message appears instantly
        const optimisticMsg: ChatMessage = {
          id: -Date.now(),
          sessionId,
          senderRole: mySenderRole,
          senderName: mySenderName,
          content: trimmed,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);
      }
    } else {
      Alert.alert(
        'Canal Desconectado',
        errorMessage || 'El enlace seguro aún no está conectado. Por favor aguardá a que se establezca la conexión segura.'
      );
      return;
    }

    setInputText('');
  };

  const handleEndChat = () => {
    Alert.alert(
      'Finalizar Chat',
      isChaplainMode
        ? '¿Deseas concluir la sesión pastoral? Podrás redactar el informe correspondiente.'
        : '¿Deseas dar por concluida la sesión de acompañamiento?',
      [
        { text: 'Continuar en Chat', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: async () => {
            setIsEnding(true);
            try {
              if (sessionId) {
                await request(ENDPOINTS.CALL_END(sessionId), { method: 'POST' });
              }
            } catch (e) {
              // Ignored: If caller is BASIC user, backend enforces chaplain-only end (403),
              // but local client session should still safely terminate and reset.
            } finally {
              setIsEnding(false);
              useChaplainStore.getState().clearAssignedCall();
              useCallStore.getState().resetCall();
              onChatEnded();
              if (isChaplainMode && sessionId && onRequestReport) {
                onRequestReport(sessionId);
              }
            }
          },
        },
      ]
    );
  };

  const handlePanicExit = () => {
    Alert.alert('Cierre Inmediato', 'Saliendo de la sala y purgando vista...', [
      {
        text: 'Salir',
        onPress: () => {
          useChaplainStore.getState().clearAssignedCall();
          useCallStore.getState().resetCall();
          onChatEnded();
        },
      },
    ]);
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowStealthDrawer(false);
  };

  const isTablet = width > 500;

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe =
      (item.senderRole && item.senderRole === mySenderRole) ||
      item.senderName === mySenderName;

    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
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

          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.bubbleFooter}>
            <Text
              style={[
                styles.bubbleTime,
                isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther,
              ]}
            >
              {timeStr}
            </Text>
            {isMe && <CheckCheck size={13} color="#CBD5E1" />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header Bar */}
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
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>{displayTitle}</Text>
            <Text style={styles.headerSubtitle}>{displaySubtitle}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {isChaplainMode && sessionId && onRequestReport && (
            <TouchableOpacity
              style={styles.reportHeaderBtn}
              onPress={() => onRequestReport(sessionId)}
              activeOpacity={0.8}
            >
              <FileText size={15} color={Theme.colors.tacticalNavy} />
              <Text style={styles.reportHeaderBtnText}>Acta</Text>
            </TouchableOpacity>
          )}
          <View style={styles.lockBadge}>
            <Lock size={14} color={Theme.colors.secondary} />
          </View>
        </View>
      </View>

      {/* 2. Operational Security & Status Strip */}
      <View style={[styles.statusStrip, isTablet && styles.tabletContent]}>
        <View style={styles.statusStripCard}>
          <View style={styles.chaplainInfoRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: isChaplainMode
                    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhgKUhM5FIC82K02jlklaDgenTWM2lcfpTpcZNQ8Nrq42tc4cWzkV3gj_W1L8uyQLrCvmck9lmaCgLXgdSUuVEvGcrlq6wWC4PKxWzDskWn9x2DBpPtSmPe7WUVVkwdeM4dEA4d92ySFhcRYmsAjBq-fLehNdLZ1aN1CjkFN0fvKjJOPPwjDfxxpUlg_Phvll2Mf6LHoUmTfZC5Y5qbvgvlE48uV4cQt3KjwzsUgfAYkZAbvhNh3iIbg'
                    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1E4cdgjAUybt1cxKuEt7zlKASVb_WWeheuNaA7KO4vpWUt25tJaC3dgpBdQGU7wJXroJtaR3ZRRQBdhIMALR5LkhEM5OomDOoKQnxw0-TWVs9rBhtjgZ7OUrP98U6wMkM0vTe1eWnw-7M2W50HTMPZ475mCcZqdpkCa1asdtSdqShq8GwviMy_WbnHIpLS7-qGGp3brQsMBtg5lERg9HTcwJbgvrt-cBCeq3tuXh1QP5_KMQ_w1Tv3w',
                }}
                style={styles.chaplainAvatar}
              />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.chaplainNameCol}>
              <Text style={styles.chaplainName} numberOfLines={1}>{displayTitle}</Text>
              <Text style={styles.connectionStatusText}>
                {!sessionId || sessionStatus === 'ENDED'
                  ? 'Sin sesión activa'
                  : sessionStatus === 'WAITING'
                  ? 'Aguardando al capellán...'
                  : errorMessage
                  ? errorMessage
                  : connectionStatus === 'connected'
                  ? 'Enlace cifrado activo'
                  : connectionStatus === 'reconnecting'
                  ? 'Reconectando túnel seguro...'
                  : connectionStatus === 'error'
                  ? 'Error en el enlace seguro'
                  : 'Conectando túnel seguro...'}
              </Text>
            </View>

            {/* Quick Action Icons */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                onPress={() => Alert.alert('Llamada de Voz', 'Iniciando enlace de voz seguro...')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Phone size={15} color={Theme.colors.onSurface} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                onPress={() => Alert.alert('Videollamada', 'Iniciando videollamada encriptada...')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Video size={15} color={Theme.colors.tacticalNavy} />
              </TouchableOpacity>
              {!isChaplainMode && (
                <TouchableOpacity
                  style={styles.actionRoundBtn}
                  onPress={() => setShowStealthDrawer((p) => !p)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Shield size={15} color={Theme.colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Stealth Drawer */}
          {showStealthDrawer && (
            <View style={styles.stealthDrawer}>
              <View style={styles.stealthDrawerLeft}>
                <ShieldAlert size={15} color={Theme.colors.error} />
                <Text style={styles.stealthDrawerLabel}>Modo Salida Rápida</Text>
              </View>
              <View style={styles.stealthDrawerRight}>
                <TouchableOpacity
                  style={styles.stealthActionBtn}
                  onPress={handleClearChat}
                >
                  <Text style={styles.stealthActionText}>Limpiar Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stealthActionBtn, styles.panicBtn]}
                  onPress={handlePanicExit}
                >
                  <Text style={styles.panicBtnText}>Cerrar Inmediato</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Encryption Covenant Badge */}
          <View style={styles.encryptionCovenant}>
            <View style={styles.covenantLeft}>
              <Lock size={12} color="#9A805B" />
              <Text style={styles.covenantTitle}>CANAL CIFRADO DE PUNTO A PUNTO</Text>
            </View>
            <Text style={styles.covenantRight}>SECRETO PASTORAL</Text>
          </View>
        </View>
      </View>

      {/* 3. Messages Stream */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) =>
            item.id
              ? `msg-${item.id}`
              : item.timestamp
              ? `msg-${item.timestamp}-${index}`
              : `msg-${index}`
          }
          renderItem={renderMessageItem}
          style={styles.messagesFlatList}
          contentContainerStyle={[
            styles.messagesListContent,
            isTablet && styles.tabletContent,
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyMessagesContainer}>
              <Text style={styles.emptyMessagesText}>
                {sessionStatus === 'WAITING'
                  ? 'Aguardando al capellán de guardia para iniciar...'
                  : 'Enlace cifrado activo. Escribí tu mensaje para iniciar la conversación.'}
              </Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.chatListHeader}>
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>Hoy · Guardia Activa</Text>
              </View>

              <View style={styles.moralRefugeBanner}>
                <Shield size={16} color={Theme.colors.tacticalNavy} style={{ marginTop: 2 }} />
                <View style={styles.moralRefugeCol}>
                  <Text style={styles.moralRefugeTitle}>Refugio y Silencio Ministerial</Text>
                  <Text style={styles.moralRefugeText}>
                    Este canal es inviolable. Toda palabra o inquietud compartida queda protegida por secreto ministerial absoluto.
                  </Text>
                </View>
              </View>
            </View>
          }
        />

        {/* 4. Input Dispatch Dock */}
        <View
          style={[
            styles.inputDock,
            { paddingBottom: Math.max(insets.bottom, 16) },
            isTablet && styles.tabletContent,
          ]}
        >
          <View style={styles.inputDockCard}>
            <TouchableOpacity
              style={styles.dockIconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Mic size={18} color={Theme.colors.secondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.dockInput}
              placeholder="Escribe tu mensaje con tranquilidad..."
              placeholderTextColor="#8A92A0"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              style={styles.dockIconBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <PlusCircle size={18} color={Theme.colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Send size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dockDisclaimer}>
            Protegido por secreto ministerial, ética pastoral y cifrado inviolable
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerBar: {
    height: 56,
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
    gap: 10,
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  headerSubtitle: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  reportHeaderBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: Theme.colors.tacticalNavy,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusStrip: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusStripCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.lg,
    padding: 10,
    ...globalStyles.shadowSm,
  },
  chaplainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  chaplainAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chaplainNameCol: {
    flex: 1,
  },
  chaplainName: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  connectionStatusText: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stealthDrawer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 8,
    borderRadius: Theme.roundness.md,
    marginTop: 8,
  },
  stealthDrawerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stealthDrawerLabel: {
    ...globalStyles.labelMd,
    fontSize: 10,
    color: Theme.colors.error,
  },
  stealthDrawerRight: {
    flexDirection: 'row',
    gap: 6,
  },
  stealthActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    borderRadius: Theme.roundness.sm,
  },
  stealthActionText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  panicBtn: {
    backgroundColor: Theme.colors.error,
  },
  panicBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  encryptionCovenant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Theme.roundness.sm,
    marginTop: 8,
  },
  covenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  covenantTitle: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: '#9A805B',
    letterSpacing: 0.5,
  },
  covenantRight: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.secondary,
    letterSpacing: 0.5,
  },
  chatArea: {
    flex: 1,
  },
  messagesFlatList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessagesText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chatListHeader: {
    marginBottom: 12,
  },
  timePill: {
    alignSelf: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    marginBottom: 10,
  },
  timePillText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  moralRefugeBanner: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 10,
    borderRadius: Theme.roundness.md,
    gap: 8,
    ...globalStyles.shadowSm,
  },
  moralRefugeCol: {
    flex: 1,
  },
  moralRefugeTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  moralRefugeText: {
    ...globalStyles.bodySm,
    fontSize: 10,
    lineHeight: 14,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 10,
    borderRadius: 14,
  },
  messageBubbleMe: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderBottomLeftRadius: 2,
  },
  senderNameHeader: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
    marginBottom: 3,
  },
  messageText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: Theme.colors.onSurface,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    ...globalStyles.labelCaps,
    fontSize: 8,
  },
  bubbleTimeMe: {
    color: '#CBD5E1',
  },
  bubbleTimeOther: {
    color: Theme.colors.onSurfaceVariant,
  },
  inputDock: {
    backgroundColor: 'rgba(248, 249, 251, 0.98)',
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  inputDockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...globalStyles.shadowSm,
  },
  dockIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
    maxHeight: 80,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  dockDisclaimer: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.secondary,
    textAlign: 'center',
    marginTop: 5,
    letterSpacing: 0.5,
  },
});

export default ChatRoomView;
