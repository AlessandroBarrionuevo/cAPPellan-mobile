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
  commentsCount?: number;
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
  avatarUrl?: string | null;
}

export interface LoginResponse {
  token: string;
  role: AppRole;
}

export type SessionType = 'VIDEO' | 'CHAT';

export type IntakeReason = 'FAMILIAR' | 'TRABAJO' | 'ECONOMICO' | 'FE' | 'OTRO';

export type EndReason =
  | 'MISSED_TIMEOUT'
  | 'CHAPLAIN_BUSY'
  | 'CANCELLED_BY_CALLER'
  | 'COMPLETED';

export interface CallIntake {
  moodScore?: number;
  reason?: IntakeReason | string;
  notes?: string;
  metadata?: Record<string, any> | string;
  anonymous?: boolean;
  isAnonymous?: boolean;
}

export interface CallRequestPayload {
  type?: SessionType;
  moodScore?: number;
  reason?: IntakeReason | string;
  notes?: string;
  metadata?: Record<string, any> | string;
  anonymous?: boolean;
  isAnonymous?: boolean;
}

export interface Session {
  id: number;
  livekitRoomName?: string;
  provider?: 'livekit' | 'cloudflare';
  callsAppId?: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  sessionType?: SessionType;
  userId: number;
  chaplainId: number | null;
  clientToken?: string;
  callerName?: string | null;
  intake?: CallIntake | null;
  createdAt: string;
  updatedAt: string;
  endedAt: string | null;
  endReason?: EndReason | string | null;
}

export interface CallResponse {
  sessionId: number;
  sessionType?: SessionType;
  provider?: 'livekit' | 'cloudflare';
  callsAppId?: string;
  livekitRoom?: string;
  livekitRoomName?: string;
  token?: string | null;
  clientToken?: string | null;
  callerName?: string | null;
  intake?: CallIntake | null;
  status?: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  endReason?: EndReason | string | null;
}

export type CanonicalReportCategory =
  | 'SPIRITUAL'
  | 'FAMILY'
  | 'PERSONAL'
  | 'CRISIS'
  | 'OTHER';

export type ReportCategory =
  | CanonicalReportCategory
  | 'SPIRITUAL_COUNSELING'
  | 'EMOTIONAL_CRISIS'
  | 'PRAYER_REQUEST';

export function normalizeReportCategory(cat?: string): CanonicalReportCategory {
  switch (cat) {
    case 'SPIRITUAL_COUNSELING':
    case 'PRAYER_REQUEST':
    case 'SPIRITUAL':
      return 'SPIRITUAL';
    case 'EMOTIONAL_CRISIS':
    case 'CRISIS':
      return 'CRISIS';
    case 'FAMILY':
      return 'FAMILY';
    case 'PERSONAL':
      return 'PERSONAL';
    default:
      return 'OTHER';
  }
}

export interface PostCallReport {
  id?: number;
  sessionId: number;
  subject: string;
  category: ReportCategory;
  severity: number;
  summary: string;
  createdBy?: number;
  createdAt?: string;
  chaplainUsername?: string | null;
  leaderId?: number | null;
  leaderUsername?: string | null;
  sessionType?: SessionType | null;
}

export interface ReportStats {
  totalReports: number;
  criticalAlertsCount: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  bySessionType: Record<string, number>;
}

export interface ChaplainInfo {
  id: number;
  username: string;
  role: AppRole;
  status: 'ONLINE' | 'OFFLINE' | 'IN_CALL';
  userId?: number | null;
  enteredQueueAt?: string | null;
}

export interface PrayerItem {
  id: number;
  title: string;
  description: string;
  content?: string[];
  authorName?: string;
  isAnonymous?: boolean;
  prayerCount: number;
  createdAt: string;
}

export interface PrayerComment {
  id: number;
  prayerRequestId: number;
  userId: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CreatePrayerRequest {
  title: string;
  description: string;
  content?: string[];
  authorName?: string;
  isAnonymous?: boolean;
}

export interface ChaplainTeamMember {
  userId: number;
  username: string;
  fullName: string;
  militaryForce?: string | null;
  yearsOfService?: number | null;
  isActiveInForce?: boolean | null;
  militaryRank?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
}

export interface BasicProfile {
  userId: number;
  username: string;
  fullName: string;
  isAnonymous: boolean;
  phone?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string | null;
}

export interface UpdateBasicProfileRequest {
  fullName?: string;
  isAnonymous?: boolean;
  anonymous?: boolean;
  phone?: string;
  location?: string;
}

export type MilitaryForce =
  | 'EJERCITO'
  | 'ARMADA'
  | 'FUERZA_AEREA'
  | 'GENDARMERIA'
  | 'PREFECTURA'
  | 'POLICIA_FEDERAL'
  | 'POLICIA_PROVINCIAL'
  | 'POLICIA_DE_LA_CIUDAD'
  | 'SERVICIO_PENITENCIARIO'
  | 'OTRA';

export interface ChaplainProfile {
  userId: number;
  username: string;
  fullName: string;
  militaryForce?: MilitaryForce | string | null;
  yearsOfService?: number | null;
  isActiveInForce?: boolean | null;
  militaryRank?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  updatedAt?: string | null;
}

export interface UpdateChaplainProfileRequest {
  fullName?: string;
  militaryForce?: MilitaryForce | string;
  yearsOfService?: number;
  isActiveInForce?: boolean;
  militaryRank?: string;
  bio?: string;
  avatarUrl?: string;
}

