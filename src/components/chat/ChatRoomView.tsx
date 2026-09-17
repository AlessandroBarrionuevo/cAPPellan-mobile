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
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
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

  const displayTitle = isChaplainMode ? comradeName : chaplainName;
  const displaySubtitle = isChaplainMode
    ? 'cAPPellan · Canal de Acompañamiento'
    : 'cAPPellan · Confidencial';

  const mySenderRole: ChatSenderRole = isChaplainMode
    ? 'CHAPLAIN'
    : user
    ? 'USER'
    : 'GUEST';

  const mySenderName = isChaplainMode
    ? user?.username || 'Capellán'
    : user?.username || 'Anónimo';

  // 1. Fetch REST message history
  const loadMessageHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const history = await request<ChatMessage[]>(ENDPOINTS.CALLS_MESSAGES(sessionId));
      if (Array.isArray(history)) {
        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(String(m.id || m.timestamp || m.content), m));
          history.forEach((m) => map.set(String(m.id || m.timestamp || m.content), m));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.warn('[ChatRoomView] Could not load message history:', e);
    }
  }, [sessionId]);

  // 2. Setup STOMP WebSocket
  useEffect(() => {
    if (!sessionId) return;

    loadMessageHistory();

    const stomp = new ChatStompService({
      sessionId,
      onMessage: (msg) => {
        setMessages((prev) => {
          if (msg.id && prev.some((p) => p.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    stomp.connect();
    stompRef.current = stomp;

    return () => {
      stomp.disconnect();
      stompRef.current = null;
    };
  }, [sessionId, clientToken, loadMessageHistory]);

  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !sessionId) return;

    const payload: SendChatMessagePayload = {
      sessionId,
      senderRole: mySenderRole,
      senderName: mySenderName,
      content: trimmed,
      clientToken: clientToken || undefined,
    };

    if (stompRef.current?.isConnected()) {
      stompRef.current.sendMessage(payload);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...payload,
          timestamp: new Date().toISOString(),
        },
      ]);
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
              // Ignored
            } finally {
              setIsEnding(false);
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
        onPress: onChatEnded,
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
                {connectionStatus === 'connected' ? 'Enlace cifrado activo' : 'Conectando túnel seguro...'}
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
          keyExtractor={(item) => String(item.id || item.timestamp || Math.random())}
          renderItem={renderMessageItem}
          contentContainerStyle={[
            styles.messagesListContent,
            isTablet && styles.tabletContent,
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  messagesListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
