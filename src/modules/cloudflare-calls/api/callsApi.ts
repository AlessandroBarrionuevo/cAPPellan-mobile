/**
 * Cloudflare Calls REST Client
 * Interacts directly with Cloudflare Realtime SFU endpoints.
 */

import type {
  CloudflareCallsConfig,
  NewSessionRequest,
  NewSessionResponse,
  NewTracksRequest,
  NewTracksResponse,
  CloseTracksRequest,
  TrackObject,
} from '../types';

export class CallsApi {
  private appId: string;
  private token: string;
  private baseUrl: string;

  constructor(config: CloudflareCallsConfig) {
    this.appId = config.appId;
    this.token = config.token;
    this.baseUrl = (config.apiUrl || 'https://rtc.live.cloudflare.com/v1').replace(/\/$/, '');
  }

  private get headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initializes a new WebRTC session on Cloudflare Realtime SFU
   * POST /apps/{appId}/sessions/new
   */
  async createSession(offerSdp: string): Promise<NewSessionResponse> {
    const url = `${this.baseUrl}/apps/${this.appId}/sessions/new`;
    const body: NewSessionRequest = {
      sessionDescription: {
        type: 'offer',
        sdp: offerSdp,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`[Cloudflare Calls] Failed to create session (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as NewSessionResponse;
    if (data.errorCode) {
      throw new Error(`[Cloudflare Calls] Session error: ${data.errorDescription || data.errorCode}`);
    }

    return data;
  }

  /**
   * Adds or pulls tracks in an existing Cloudflare Calls session
   * POST /apps/{appId}/sessions/{sessionId}/tracks/new
   */
  async addTracks(
    sessionId: string,
    tracks: TrackObject[],
    offerSdp?: string
  ): Promise<NewTracksResponse> {
    const url = `${this.baseUrl}/apps/${this.appId}/sessions/${sessionId}/tracks/new`;
    const body: NewTracksRequest = {
      tracks,
      sessionDescription: offerSdp
        ? {
            type: 'offer',
            sdp: offerSdp,
          }
        : undefined,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`[Cloudflare Calls] Failed to add tracks (${res.status}): ${errorText}`);
    }

    const data = (await res.json()) as NewTracksResponse;
    if (data.errorCode) {
      throw new Error(`[Cloudflare Calls] Track error: ${data.errorDescription || data.errorCode}`);
    }

    return data;
  }

  /**
   * Closes specific tracks in a session
   * POST /apps/{appId}/sessions/{sessionId}/tracks/close
   */
  async closeTracks(
    sessionId: string,
    tracks: Array<{ mid?: string; trackName?: string }>
  ): Promise<void> {
    const url = `${this.baseUrl}/apps/${this.appId}/sessions/${sessionId}/tracks/close`;
    const body: CloseTracksRequest = { tracks };

    try {
      await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('[Cloudflare Calls] Warning closing tracks:', err);
    }
  }
}
