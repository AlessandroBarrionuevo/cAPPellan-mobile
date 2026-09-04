import { createStore } from './createStore';
import { request, ApiError } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { AuthUser, LoginResponse } from '../../types/api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = createStore<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await request<LoginResponse>(ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      set({ token: response.token });

      const user = await request<AuthUser>(ENDPOINTS.AUTH_ME);

      if (user.role !== response.role) {
        throw new Error('La sesión devolvió un rol inconsistente.');
      }

      set({
        token: response.token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false, token: null, user: null, isAuthenticated: false });
      if (err instanceof ApiError) {
        if (err.status === 401) {
          throw new Error('Credenciales inválidas');
        }
        if (err.body?.error) {
          throw new Error(err.body.error);
        }
      }
      throw new Error(
        err instanceof Error ? err.message : 'Error de conexión con el servidor.'
      );
    }
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await request<AuthUser>(ENDPOINTS.AUTH_ME);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401) {
        get().clearAuth();
      } else {
        set({ isLoading: false });
      }
    }
  },

  setUser: (user: AuthUser) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },
}));
