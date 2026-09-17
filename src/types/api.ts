export type AppRole = 'BASIC' | 'CHAPLAIN' | 'CHAPLAIN_LEADER' | 'CHAPLAIN_CONTENT_LEADER' | 'SUPERUSER';

export type ContentType = 'SPOTIFY' | 'YOUTUBE' | 'IMAGE' | 'VIDEO';

export interface ContentItem {
  id: number;
  title: string;
  description: string;
  mediaUrl: string;
  type: ContentType;
  authorId: number;
  likesCount: number;
  isLikedByMe?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequestPayload {
  title: string;
  description: string;
  mediaUrl: string;
  type: ContentType;
}

export interface LikeResponse {
  contentId: number;
  likesCount: number;
  liked: boolean;
}

export interface AuthUser {
  userId: number;
  username: string;
  role: AppRole;
  leaderId?: number | null;
}

export interface LoginResponse {
  token: string;
  role: AppRole;
}

export type SessionType = 'VIDEO' | 'CHAT';

export type IntakeReason = 'FAMILIAR' | 'TRABAJO' | 'ECONOMICO' | 'FE' | 'OTRO';

export interface CallIntake {
  moodScore?: number;
  reason?: IntakeReason | string;
  notes?: string;
  metadata?: string;
}

export interface CallRequestPayload {
  type?: SessionType;
  moodScore?: number;
  reason?: IntakeReason | string;
  notes?: string;
  metadata?: string;
}

export interface Session {
  id: number;
  livekitRoomName?: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  sessionType?: SessionType;
  userId: number;
  chaplainId: number | null;
  clientToken?: string;
  intake?: CallIntake | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
}

export interface CallResponse {
  sessionId: number;
  sessionType?: SessionType;
  livekitRoomName?: string;
  token?: string | null;
  clientToken?: string | null;
  intake?: CallIntake | null;
}

export interface PostCallReport {
  id?: number;
  sessionId: number;
  subject: string;
  category:
    | 'SPIRITUAL_COUNSELING'
    | 'EMOTIONAL_CRISIS'
    | 'PRAYER_REQUEST'
    | 'OTHER'
    | 'SPIRITUAL'
    | 'FAMILY'
    | 'PERSONAL'
    | 'CRISIS';
  severity: number;
  summary: string;
  createdBy?: number;
  createdAt?: string;
}

export interface ChaplainInfo {
  id: number;
  username: string;
  role: AppRole;
  status: 'ONLINE' | 'OFFLINE' | 'IN_CALL';
  userId?: number | null;
  enteredQueueAt?: string | null;
}
