export type AppRole = 'BASIC' | 'CHAPLAIN' | 'CHAPLAIN_LEADER' | 'SUPERUSER';

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

export interface Session {
  id: number;
  livekitRoomName: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  userId: number;
  chaplainId: number | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
}

export interface CallResponse {
  sessionId: number;
  livekitRoomName: string;
  token: string;
}

export interface PostCallReport {
  id?: number;
  sessionId: number;
  subject: string;
  category: 'SPIRITUAL' | 'FAMILY' | 'PERSONAL' | 'CRISIS' | 'OTHER';
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
