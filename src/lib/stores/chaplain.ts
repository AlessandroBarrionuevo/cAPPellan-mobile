import { createStore } from './createStore';
import { request } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useAuthStore } from './auth';
import { saveChaplainStatus, loadChaplainStatus } from '../storage';
import type { CallResponse } from '../../types/api';

export type ChaplainStatus = 'ONLINE' | 'OFFLINE' | 'IN_CALL';

interface ChaplainState {
  status: ChaplainStatus;
  assignedCall: CallResponse | null;

  toggleStatus: (newStatus: 'ONLINE' | 'OFFLINE') => Promise<void>;
  restoreStatus: () => Promise<void>;
  setAssignedCall: (call: CallResponse | null) => void;
  clearAssignedCall: () => void;
  setStatus: (status: ChaplainStatus) => void;
}

export const useChaplainStore = createStore<ChaplainState>((set, get) => ({
  status: 'OFFLINE',
  assignedCall: null,

  toggleStatus: async (newStatus: 'ONLINE' | 'OFFLINE') => {
    const user = useAuthStore.getState().user;
    if (!user?.userId) {
      throw new Error('Identidad de capellán no disponible');
    }

    await request(ENDPOINTS.CHAPLAIN_STATUS(user.userId), {
      method: 'POST',
      body: JSON.stringify({ status: newStatus }),
    });

    await saveChaplainStatus(newStatus);
    set({ status: newStatus });
  },

  restoreStatus: async () => {
    const saved = await loadChaplainStatus();
    if (get().status !== 'IN_CALL') {
      set({ status: saved });
    }
    const user = useAuthStore.getState().user;
    if (saved === 'ONLINE' && user?.userId) {
      request(ENDPOINTS.CHAPLAIN_STATUS(user.userId), {
        method: 'POST',
        body: JSON.stringify({ status: 'ONLINE' }),
      }).catch((err) => {
        console.warn('[ChaplainStore] Could not re-sync ONLINE status with backend:', err);
      });
    }
  },

  setAssignedCall: (call: CallResponse | null) => {
    set({ assignedCall: call, status: call ? 'IN_CALL' : get().status });
  },

  clearAssignedCall: () => {
    set({ assignedCall: null, status: 'ONLINE' });
  },

  setStatus: (status: ChaplainStatus) => {
    if (status === 'ONLINE' || status === 'OFFLINE') {
      void saveChaplainStatus(status);
    }
    set({ status });
  },
}));
