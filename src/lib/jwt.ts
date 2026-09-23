/**
 * JWT Decoder for Room Access Tokens
 * Hermes and React Native compatible without external heavy dependencies.
 */

export interface DecodedRoomToken {
  provider: 'livekit' | 'cloudflare';
  rawPayload: Record<string, any>;
  appId?: string;
  roomName?: string;
  sessionId?: string | number;
}

/**
 * Safe base64 decoding for React Native (Hermes engine)
 */
function decodeBase64(str: string): string {
  // If native atob is available and functional, try it first
  if (typeof atob === 'function') {
    try {
      return atob(str);
    } catch {
      // Fallback to manual decoder
    }
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const cleaned = str.replace(/[^A-Za-z0-9+/=]/g, '');

  let bc = 0;
  let bs = 0;
  for (let idx = 0; idx < cleaned.length; idx++) {
    const char = cleaned.charAt(idx);
    const charIndex = chars.indexOf(char);
    if (charIndex >= 0) {
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
      }
    }
  }

  return output;
}

/**
 * Parses and decodes a JWT payload to detect room provider and configuration.
 */
export function decodeRoomToken(token: string): DecodedRoomToken {
  if (!token || typeof token !== 'string') {
    return {
      provider: 'livekit',
      rawPayload: {},
    };
  }

  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return {
        provider: 'livekit',
        rawPayload: {},
      };
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const binaryStr = decodeBase64(padded);
    const jsonStr = decodeURIComponent(
      Array.from(binaryStr)
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonStr);

    // Check for explicit Cloudflare Calls claims
    const isCloudflare =
      payload.provider === 'cloudflare' ||
      payload.provider === 'calls' ||
      payload.sfu === 'cloudflare' ||
      payload.sfu === 'calls' ||
      payload.service === 'cloudflare' ||
      payload.service === 'calls' ||
      payload.video_provider === 'cloudflare' ||
      payload.video_provider === 'calls' ||
      payload.cfCalls === true ||
      payload.cloudflare === true ||
      payload.calls === true;

    return {
      provider: isCloudflare ? 'cloudflare' : 'livekit',
      rawPayload: payload,
      appId: payload.appId || payload.callsAppId || payload.cfAppId,
      roomName: payload.room || payload.roomName || payload.video?.room,
      sessionId: payload.sessionId || payload.sub,
    };
  } catch (err) {
    console.warn('[JWT] Error decoding room token, defaulting to livekit:', err);
    return {
      provider: 'livekit',
      rawPayload: {},
    };
  }
}
