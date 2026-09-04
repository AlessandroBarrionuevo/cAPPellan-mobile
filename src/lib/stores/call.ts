import { createStore } from './createStore';
import { request, ApiError } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { CallResponse } from '../../types/api';

export type CallStatus = 'IDLE' | 'REQUESTING' | 'WAITING' | 'IN_PROGRESS' | 'ENDED';

interface CallState {
  currentSession: CallResponse | null;
  callStatus: CallStatus;
  error: string | null;

  requestCall: () => Promise<void>;
  setCallStatus: (status: CallStatus) => void;
  resetCall: () => void;
  setSession: (session: CallResponse | null) => void;
}

export const useCallStore = createStore<CallState>((set) => ({
  currentSession: null,
  callStatus: 'IDLE',
  error: null,

  requestCall: async () => {
    set({ callStatus: 'REQUESTING', error: null });
    try {
      const response = await request<CallResponse>(ENDPOINTS.CALLS_REQUEST, {
        method: 'POST',
      });

      set({
        currentSession: response,
        callStatus: 'WAITING',
        error: null,
      });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        set({
          callStatus: 'IDLE',
          error: 'No hay capellanes disponibles en este momento. Por favor, intentá de nuevo más tarde.',
        });
      } else {
        const message = error instanceof Error ? error.message : 'Error al solicitar llamada';
        set({
          callStatus: 'IDLE',
          error: message,
        });
      }
    }
  },

  setCallStatus: (status: CallStatus) => {
    set({ callStatus: status });
  },

  resetCall: () => {
    set({
      currentSession: null,
      callStatus: 'IDLE',
      error: null,
    });
  },

  setSession: (session: CallResponse | null) => {
    set({ currentSession: session });
  },
}));
