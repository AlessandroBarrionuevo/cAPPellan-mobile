export type ChatSenderRole = 'GUEST' | 'USER' | 'CHAPLAIN';

export interface ChatMessage {
  id?: number;
  sessionId: number;
  senderRole: ChatSenderRole;
  senderName: string;
  content: string;
  clientToken?: string | null;
  timestamp?: string;
}

export interface SendChatMessagePayload {
  sessionId: number;
  senderRole: ChatSenderRole;
  senderName: string;
  content: string;
  clientToken?: string;
}

export type ChatConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
