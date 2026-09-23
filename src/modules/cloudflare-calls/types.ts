/**
 * Cloudflare Calls (Realtime SFU) Protocol Types
 * Decoupled & ported from Cloudflare Meet specifications.
 */

export interface SessionDescription {
  type: 'offer' | 'answer';
  sdp: string;
}

export interface TrackObject {
  location: 'local' | 'remote';
  mid?: string;
  trackName: string;
  sessionId?: string;
}

export interface ErrorResponse {
  errorCode?: string;
  errorDescription?: string;
}

export interface NewSessionRequest {
  sessionDescription: SessionDescription;
}

export interface NewSessionResponse extends ErrorResponse {
  sessionId: string;
  sessionDescription: SessionDescription;
}

export interface NewTracksRequest {
  sessionDescription?: SessionDescription;
  tracks: TrackObject[];
}

export interface TrackResponseItem {
  mid?: string;
  trackName: string;
  status?: string;
  error?: string;
}

export interface NewTracksResponse extends ErrorResponse {
  sessionDescription?: SessionDescription;
  tracks?: TrackResponseItem[];
  requiresImmediateRenegotiation?: boolean;
}

export interface CloseTracksRequest {
  sessionDescription?: SessionDescription;
  tracks: Array<{ mid?: string; trackName?: string }>;
}

export interface CloudflareCallsConfig {
  appId: string;
  token: string;
  apiUrl?: string;
  iceServers?: any[];
}

export type CallsConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';
