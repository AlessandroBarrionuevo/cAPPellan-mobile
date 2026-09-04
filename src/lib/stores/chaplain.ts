import { createStore } from './createStore';
import { request } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useAuthStore } from './auth';
import type { CallResponse } from '../../types/api';

export type ChaplainStatus = 'ONLINE' | 'OFFLINE' | 'IN_CALL';

interface ChaplainState {
  status: ChaplainStatus;
  assignedCall: CallResponse | null;

  toggleStatus: (newStatus: 'ONLINE' | 'OFFLINE') => Promise<void>;
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

    set({ status: newStatus });
  },

  setAssignedCall: (call: CallResponse | null) => {
    set({ assignedCall: call, status: call ? 'IN_CALL' : get().status });
  },

  clearAssignedCall: () => {
    set({ assignedCall: null, status: 'ONLINE' });
  },

  setStatus: (status: ChaplainStatus) => {
    set({ status });
  },
}));
