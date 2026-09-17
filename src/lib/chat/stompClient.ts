import { ENV } from '../../config/env';
import type { ChatMessage, SendChatMessagePayload, ChatConnectionStatus } from '../../types/chat';

export function getWsChatUrl(): string {
  const apiBase = ENV.API_BASE_URL || 'http://localhost:8080';
  return apiBase.replace(/^http/, 'ws') + '/ws/chat';
}

export interface ChatStompClientOptions {
  sessionId: number;
  brokerURL?: string;
  onMessage: (message: ChatMessage) => void;
  onStatusChange?: (status: ChatConnectionStatus) => void;
  onError?: (error: unknown) => void;
}

export class ChatStompService {
  private ws: WebSocket | null = null;
  private sessionId: number;
  private options: ChatStompClientOptions;
  private isDeactivated = false;
  private connected = false;
  private reconnectTimer: any = null;

  constructor(options: ChatStompClientOptions) {
    this.sessionId = options.sessionId;
    this.options = options;
  }

  public connect(): void {
    this.isDeactivated = false;
    this.options.onStatusChange?.('connecting');

    const brokerURL = this.options.brokerURL || getWsChatUrl();

    try {
      this.ws = new WebSocket(brokerURL);

      this.ws.onopen = () => {
        if (this.isDeactivated) return;
        const connectFrame = 'CONNECT\naccept-version:1.1,1.2\nheart-beat:10000,10000\n\n\x00';
        this.ws?.send(connectFrame);
      };

      this.ws.onmessage = (event) => {
        if (this.isDeactivated) return;
        const raw = event.data as string;
        if (!raw || raw === '\n' || raw === '\r\n') {
          return;
        }

        this.handleIncomingFrames(raw);
      };

      this.ws.onerror = (err) => {
        console.warn('[STOMP WS] WebSocket error:', err);
        this.options.onError?.(err);
      };

      this.ws.onclose = () => {
        this.connected = false;
        if (!this.isDeactivated) {
          this.options.onStatusChange?.('reconnecting');
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.isDeactivated) {
              this.connect();
            }
          }, 3500);
        } else {
          this.options.onStatusChange?.('disconnected');
        }
      };
    } catch (e) {
      console.warn('[STOMP WS] Exception initiating connection:', e);
      this.options.onError?.(e);
    }
  }

  private handleIncomingFrames(raw: string): void {
    const frames = raw.split('\x00');
    for (const frame of frames) {
      const trimmed = frame.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('CONNECTED')) {
        this.connected = true;
        this.options.onStatusChange?.('connected');

        const subFrame =
          'SUBSCRIBE\nid:sub-session-' +
          this.sessionId +
          '\ndestination:/topic/sessions/' +
          this.sessionId +
          '\n\n\x00';
        this.ws?.send(subFrame);
      } else if (trimmed.startsWith('MESSAGE')) {
        const splitIndex = trimmed.indexOf('\n\n');
        if (splitIndex !== -1) {
          const body = trimmed.substring(splitIndex + 2);
          try {
            const parsed: ChatMessage = JSON.parse(body);
            this.options.onMessage(parsed);
          } catch (parseErr) {
            console.warn('[STOMP WS] Error parsing message payload:', parseErr);
          }
        }
      }
    }
  }

  public sendMessage(payload: SendChatMessagePayload): boolean {
    if (!this.ws || !this.connected) {
      console.warn('[STOMP WS] Cannot send message, socket not connected');
      return false;
    }

    const json = JSON.stringify(payload);
    const sendFrame =
      'SEND\ndestination:/app/chat/' +
      this.sessionId +
      '/send\ncontent-type:application/json\n\n' +
      json +
      '\x00';

    try {
      this.ws.send(sendFrame);
      return true;
    } catch (sendErr) {
      console.warn('[STOMP WS] Failed to send frame:', sendErr);
      return false;
    }
  }

  public disconnect(): void {
    this.isDeactivated = true;
    this.connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.options.onStatusChange?.('disconnected');

    if (this.ws) {
      try {
        const discFrame = 'DISCONNECT\n\n\x00';
        this.ws.send(discFrame);
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }
}
