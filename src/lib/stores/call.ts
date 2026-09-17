import { createStore } from './createStore';
import { request, ApiError, setClientToken, getClientToken } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { CallResponse, SessionType, CallIntake, CallRequestPayload } from '../../types/api';

export type CallStatus = 'IDLE' | 'REQUESTING' | 'WAITING' | 'IN_PROGRESS' | 'ENDED';

let heartbeatTimer: any = null;

interface CallState {
  currentSession: CallResponse | null;
  callStatus: CallStatus;
  error: string | null;

  requestCall: (type?: SessionType, intake?: CallIntake) => Promise<void>;
  reconnect: (sessionId?: number) => Promise<boolean>;
  endCall: (sessionId?: number) => Promise<void>;
  startHeartbeat: (sessionId: number) => void;
  stopHeartbeat: () => void;
  setCallStatus: (status: CallStatus) => void;
  resetCall: () => void;
  setSession: (session: CallResponse | null) => void;
}

export const useCallStore = createStore<CallState>((set, get) => ({
  currentSession: null,
  callStatus: 'IDLE',
  error: null,

  requestCall: async (type: SessionType = 'VIDEO', intake?: CallIntake) => {
    set({ callStatus: 'REQUESTING', error: null });
    try {
      const payload: CallRequestPayload = {
        type,
        ...(intake || {}),
      };

      const response = await request<CallResponse>(ENDPOINTS.CALLS_REQUEST, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const sessionWithDefaults: CallResponse = {
        ...response,
        sessionType: response.sessionType || type,
      };

      if (response.clientToken) {
        setClientToken(response.clientToken);
      }

      set({
        currentSession: sessionWithDefaults,
        callStatus: 'WAITING',
        error: null,
      });

      get().startHeartbeat(response.sessionId);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        set({
          callStatus: 'IDLE',
          error:
            'No hay capellanes disponibles en este momento. Por favor, intentá de nuevo más tarde.',
        });
      } else {
        const message =
          error instanceof Error ? error.message : 'Error al solicitar atención';
        set({
          callStatus: 'IDLE',
          error: message,
        });
      }
    }
  },

  reconnect: async (sessionId?: number): Promise<boolean> => {
    const session = get().currentSession;
    const id = sessionId ?? session?.sessionId;
    const cToken = session?.clientToken || getClientToken();

    if (!id) return false;

    try {
      const response = await request<CallResponse>(ENDPOINTS.CALLS_RECONNECT(id), {
        method: 'POST',
        headers: cToken ? { 'X-Client-Token': cToken } : {},
      });

      const updated: CallResponse = {
        ...response,
        sessionType: response.sessionType || session?.sessionType || 'VIDEO',
        clientToken: response.clientToken || cToken || undefined,
      };

      if (response.clientToken) {
        setClientToken(response.clientToken);
      }

      set({
        currentSession: updated,
        callStatus: 'IN_PROGRESS',
        error: null,
      });

      get().startHeartbeat(id);
      return true;
    } catch (err) {
      console.warn('[CallStore] Fallback reconnection failed:', err);
      return false;
    }
  },

  endCall: async (sessionId?: number) => {
    const session = get().currentSession;
    const id = sessionId ?? session?.sessionId;
    const cToken = session?.clientToken || getClientToken();

    get().stopHeartbeat();

    if (id) {
      try {
        await request(ENDPOINTS.CALL_END(id), {
          method: 'POST',
          headers: cToken ? { 'X-Client-Token': cToken } : {},
        });
      } catch (err) {
        console.warn('[CallStore] Error ending session on backend:', err);
      }
    }

    set({ callStatus: 'ENDED' });
  },

  startHeartbeat: (sessionId: number) => {
    get().stopHeartbeat();
    heartbeatTimer = setInterval(async () => {
      const current = get().currentSession;
      if (!current || current.sessionId !== sessionId) {
        get().stopHeartbeat();
        return;
      }

      try {
        const cToken = current.clientToken || getClientToken();
        await request(ENDPOINTS.CALLS_HEARTBEAT(sessionId), {
          method: 'POST',
          headers: cToken ? { 'X-Client-Token': cToken } : {},
        });
      } catch (e) {
        console.warn('[CallStore] Heartbeat ping failed:', e);
      }
    }, 35000);
  },

  stopHeartbeat: () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  },

  setCallStatus: (status: CallStatus) => {
    set({ callStatus: status });
  },

  resetCall: () => {
    get().stopHeartbeat();
    setClientToken(null);
    set({
      currentSession: null,
      callStatus: 'IDLE',
      error: null,
    });
  },

  setSession: (session: CallResponse | null) => {
    if (session?.clientToken) {
      setClientToken(session.clientToken);
    }
    set({ currentSession: session });
  },
}));
