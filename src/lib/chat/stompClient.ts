import { ENV } from '../../config/env';
import type { ChatMessage, SendChatMessagePayload, ChatConnectionStatus } from '../../types/chat';

export function getWsChatUrl(): string {
  const apiBase = ENV.API_BASE_URL || 'http://localhost:8080';
  return apiBase.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://') + '/ws/chat';
}

function formatAuthHeader(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

export interface ChatStompClientOptions {
  sessionId: number;
  brokerURL?: string;
  token?: string;
  clientToken?: string;
  isChaplain?: boolean;
  onMessage: (message: ChatMessage) => void;
  onStatusChange?: (status: ChatConnectionStatus) => void;
  onStageNotice?: (notice: string) => void;
  onError?: (error: unknown) => void;
}

export class ChatStompService {
  private ws: WebSocket | null = null;
  private sessionId: number;
  private options: ChatStompClientOptions;
  private isDeactivated = false;
  private connected = false;
  private fatalError = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;

  private rxBuffer: string = '';
  private sendQueue: SendChatMessagePayload[] = [];

  constructor(options: ChatStompClientOptions) {
    this.sessionId = options.sessionId;
    this.options = options;
  }

  public connect(): void {
    if (!this.sessionId || isNaN(Number(this.sessionId)) || Number(this.sessionId) <= 0) {
      console.warn('[STOMP WS] ⚠️ Aborting connect: invalid sessionId:', this.sessionId);
      this.options.onStatusChange?.('error');
      this.options.onStageNotice?.('Error: ID de sesión no válido');
      return;
    }

    this.fatalError = false;
    this.isDeactivated = false;
    this.rxBuffer = '';
    this.options.onStatusChange?.('connecting');
    this.options.onStageNotice?.('Iniciando túnel seguro cifrado...');

    let brokerURL = this.options.brokerURL || getWsChatUrl();
    const queryParams: string[] = [];
    if (this.options.token) {
      queryParams.push(`token=${encodeURIComponent(this.options.token)}`);
    }
    if (this.options.clientToken) {
      queryParams.push(`clientToken=${encodeURIComponent(this.options.clientToken)}`);
    }
    if (queryParams.length > 0) {
      brokerURL += (brokerURL.includes('?') ? '&' : '?') + queryParams.join('&');
    }

    console.log(`[STOMP WS] 🚀 Connecting to: ${brokerURL} | Session #${this.sessionId} | isChaplain: ${Boolean(this.options.isChaplain)}`);

    try {
      this.ws = new WebSocket(brokerURL);

      this.ws.onopen = () => {
        if (this.isDeactivated || this.fatalError) return;
        console.log('[STOMP WS] 🟢 Transport WebSocket OPEN. Sending STOMP CONNECT frame (binary)...');
        this.options.onStageNotice?.('Autenticando credenciales de guardia...');

        let connectHeaders = 'CONNECT\naccept-version:1.1,1.2\nhost:localhost\nheart-beat:10000,10000';
        if (this.options.token) {
          connectHeaders += `\nAuthorization:${formatAuthHeader(this.options.token)}`;
        }
        if (this.options.clientToken) {
          connectHeaders += `\nX-Client-Token:${this.options.clientToken.trim()}`;
        }
        const connectFrame = `${connectHeaders}\n\n\x00`;
        this.sendRawFrame(connectFrame);
      };

      this.ws.onmessage = (event) => {
        if (this.isDeactivated) return;
        try {
          let raw = '';
          if (typeof event.data === 'string') {
            raw = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            raw = new TextDecoder().decode(event.data);
          } else if (event.data && typeof (event.data as any).text === 'function') {
            (event.data as any).text().then((txt: string) => {
              this.processIncomingChunk(txt);
            });
            return;
          } else {
            raw = String(event.data || '');
          }

          this.processIncomingChunk(raw);
        } catch (err) {
          console.warn('[STOMP WS] ⚠️ Error in onmessage handler:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[STOMP WS] ⚠️ WebSocket transport error:', err);
        this.options.onError?.(err);
      };

      this.ws.onclose = (event: WebSocketCloseEvent) => {
        this.connected = false;
        this.stopHeartbeat();
        console.warn(`[STOMP WS] 🔌 Closed. Code: ${event.code}, reason: ${event.reason || 'None'}`);

        // Terminal Spring STOMP rejection or authentication failure
        if (event.code === 1002 || event.code === 1008 || event.code === 4003 || this.fatalError) {
          console.warn(`[STOMP WS] ❌ Closed with terminal code ${event.code} or fatal error. Reconnection halted.`);
          this.fatalError = true;
          this.options.onStatusChange?.('error');
          this.options.onStageNotice?.('Enlace rechazado por el servidor');
          return;
        }

        if (!this.isDeactivated) {
          this.options.onStatusChange?.('reconnecting');
          this.options.onStageNotice?.('Reconectando túnel seguro...');
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.isDeactivated && !this.fatalError) {
              console.log('[STOMP WS] 🔄 Reconnect timer firing...');
              this.connect();
            }
          }, 3500);
        } else {
          this.options.onStatusChange?.('disconnected');
          this.options.onStageNotice?.('Túnel cerrado');
        }
      };
    } catch (e) {
      console.warn('[STOMP WS] Exception initiating connection:', e);
      this.options.onError?.(e);
    }
  }

  private sendRawFrame(frame: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[STOMP WS] ⚠️ Cannot send frame, WebSocket is not open');
      return;
    }

    try {
      if (typeof TextEncoder !== 'undefined') {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(frame);
        // Transmit as binary ArrayBuffer to prevent Android/JNI null byte (\0) truncation!
        this.ws.send(bytes.buffer);
      } else {
        this.ws.send(frame);
      }
    } catch (err) {
      console.warn('[STOMP WS] ⚠️ Binary transmission failed, falling back to string:', err);
      this.ws.send(frame);
    }
  }

  private processIncomingChunk(raw: string): void {
    if (!raw) return;
    this.rxBuffer += raw;
    const parts = this.rxBuffer.split('\x00');

    // Missing null-byte recovery for Android if native layer stripped \0:
    if (
      parts.length === 1 &&
      (raw.startsWith('CONNECTED') || raw.startsWith('MESSAGE') || raw.startsWith('ERROR')) &&
      (raw.includes('\n\n') || raw.includes('\r\n\r\n'))
    ) {
      console.log('[STOMP WS] ℹ️ Processing incoming frame with inferred NULL terminator');
      const trimmed = parts[0].trim();
      this.rxBuffer = '';
      this.handleFrame(trimmed);
      return;
    }

    this.rxBuffer = parts.pop() || '';

    for (const frame of parts) {
      const trimmed = frame.trim();
      if (!trimmed || trimmed === '\n' || trimmed === '\r\n') continue;
      this.handleFrame(trimmed);
    }
  }

  private handleFrame(frame: string): void {
    if (frame.startsWith('CONNECTED')) {
      this.connected = true;
      console.log(`[STOMP WS] 🤝 CONNECTED frame received! Session #${this.sessionId} authenticated.`);
      this.options.onStatusChange?.('connected');
      this.options.onStageNotice?.('Sintonizando sala confidencial...');
      this.startHeartbeat();

      let subHeaders = `SUBSCRIBE\nid:sub-session-${this.sessionId}\ndestination:/topic/sessions/${this.sessionId}`;
      if (this.options.token) {
        subHeaders += `\nAuthorization:${formatAuthHeader(this.options.token)}`;
      }
      if (this.options.clientToken) {
        subHeaders += `\nX-Client-Token:${this.options.clientToken.trim()}`;
      }
      const subFrame = `${subHeaders}\n\n\x00`;
      console.log(`[STOMP WS] 📡 Subscribing to: /topic/sessions/${this.sessionId}`);
      this.sendRawFrame(subFrame);
      this.options.onStageNotice?.('Enlace seguro establecido. Ingresando a la sala...');

      // Flush any queued messages now that tunnel is authenticated & subscribed
      if (this.sendQueue.length > 0) {
        console.log(`[STOMP WS] 📬 Flushing ${this.sendQueue.length} queued message(s)...`);
        const pending = [...this.sendQueue];
        this.sendQueue = [];
        for (const queuedPayload of pending) {
          this.sendMessage(queuedPayload);
        }
      }
    } else if (frame.startsWith('MESSAGE')) {
      let bodyIndex = frame.indexOf('\r\n\r\n');
      let headerOffset = 4;
      if (bodyIndex === -1) {
        bodyIndex = frame.indexOf('\n\n');
        headerOffset = 2;
      }
      if (bodyIndex !== -1) {
        const headersPart = frame.substring(0, bodyIndex);
        const body = frame.substring(bodyIndex + headerOffset);

        // Destination isolation: verify destination matches this session
        const destMatch = headersPart.match(/destination:(.+)/i);
        if (destMatch) {
          const dest = destMatch[1].trim();
          if (dest !== `/topic/sessions/${this.sessionId}`) {
            console.warn(`[STOMP WS] ⚠️ Dropping frame intended for foreign destination: ${dest}`);
            return;
          }
        }

        try {
          const parsed: ChatMessage = JSON.parse(body);
          if (parsed.sessionId && Number(parsed.sessionId) !== Number(this.sessionId)) {
            console.warn(
              `[STOMP WS] ⚠️ Dropping message with foreign sessionId: ${parsed.sessionId} (expected ${this.sessionId})`
            );
            return;
          }
          console.log(`[STOMP WS] 📥 Incoming MESSAGE #${parsed.id || 'new'} from [${parsed.senderRole}] ${parsed.senderName}: "${parsed.content}"`);
          this.options.onMessage(parsed);
        } catch (parseErr) {
          console.warn('[STOMP WS] ⚠️ Error parsing message payload:', parseErr);
        }
      }
    } else if (frame.startsWith('ERROR')) {
      console.error('[STOMP WS] ❌ STOMP ERROR Frame received from server:\n', frame);
      this.fatalError = true;
      this.options.onStatusChange?.('error');
      this.options.onStageNotice?.('Error en el protocolo STOMP');
      this.options.onError?.(new Error(frame));
    }
  }

  public sendMessage(payload: SendChatMessagePayload): boolean {
    if (!this.sessionId || isNaN(Number(this.sessionId)) || Number(this.sessionId) <= 0) {
      console.warn('[STOMP WS] ⚠️ Cannot send message, invalid sessionId:', this.sessionId);
      return false;
    }

    if (!this.ws || !this.connected) {
      console.log(`[STOMP WS] ⏳ Socket not connected yet; buffering message in queue: "${payload.content}"`);
      this.sendQueue.push(payload);
      return false;
    }

    const isChaplain = this.options.isChaplain ?? Boolean(this.options.token);
    const body = isChaplain
      ? { content: payload.content }
      : {
          content: payload.content,
          clientToken: payload.clientToken || this.options.clientToken || undefined,
          senderName: payload.senderName || 'Anónimo',
        };

    const json = JSON.stringify(body);
    let sendHeaders = `SEND\ndestination:/app/chat/${this.sessionId}/send\ncontent-type:application/json`;
    if (this.options.token) {
      sendHeaders += `\nAuthorization:${formatAuthHeader(this.options.token)}`;
    }
    if (this.options.clientToken) {
      sendHeaders += `\nX-Client-Token:${this.options.clientToken.trim()}`;
    }
    const sendFrame = `${sendHeaders}\n\n${json}\x00`;

    try {
      console.log(`[STOMP WS] 📤 Dispatching message to /app/chat/${this.sessionId}/send: "${payload.content}"`);
      this.sendRawFrame(sendFrame);
      return true;
    } catch (sendErr) {
      console.warn('[STOMP WS] ⚠️ Failed to send frame:', sendErr);
      return false;
    }
  }

  public disconnect(): void {
    this.isDeactivated = true;
    this.connected = false;
    this.rxBuffer = '';
    this.sendQueue = [];
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.options.onStatusChange?.('disconnected');

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          const unsubFrame = `UNSUBSCRIBE\nid:sub-session-${this.sessionId}\n\n\x00`;
          this.sendRawFrame(unsubFrame);
          const discFrame = 'DISCONNECT\n\n\x00';
          this.sendRawFrame(discFrame);
        }
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Spring STOMP negotiated 10000ms heartbeat interval; transmit newline keep-alive at 9000ms
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connected) {
        try {
          this.ws.send('\n');
        } catch (e) {
          console.warn('[STOMP WS] Failed to send heartbeat frame:', e);
        }
      }
    }, 9000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
