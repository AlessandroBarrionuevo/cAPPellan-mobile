import { createStore } from './createStore';
import { request, ApiError, setAuthToken, setOnUnauthorizedHandler } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { saveAuthSession, loadAuthSession, clearAuthSession } from '../storage';
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
  isLoading: true, // Start with loading true until initial checkSession runs

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await request<LoginResponse>(ENDPOINTS.AUTH_LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      // Set in-memory token so subsequent calls carry Authorization header
      setAuthToken(response.token);
      set({ token: response.token });

      const user = await request<AuthUser>(ENDPOINTS.AUTH_ME);

      if (user.role !== response.role) {
        throw new Error('La sesión devolvió un rol inconsistente.');
      }

      // Persist to local disk so session survives app restart
      await saveAuthSession(response.token, user);

      set({
        token: response.token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      void clearAuthSession();
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
    void clearAuthSession();
    setAuthToken(null);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    // 1. First recover local session from storage (instant offline restore)
    const stored = await loadAuthSession();
    if (stored.token && stored.user) {
      setAuthToken(stored.token);
      set({
        token: stored.token,
        user: stored.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthToken(null);
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    // 2. Validate session against backend silently in the background
    try {
      const user = await request<AuthUser>(ENDPOINTS.AUTH_ME);
      await saveAuthSession(stored.token, user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const err = error as { status?: number };
      if (err.status === 401) {
        get().clearAuth();
      } else {
        // Network offline or server temporarily unavailable: keep stored session
        set({ isLoading: false });
      }
    }
  },

  setUser: (user: AuthUser) => {
    const token = get().token;
    if (token) {
      void saveAuthSession(token, user);
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    void clearAuthSession();
    setAuthToken(null);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },
}));

// Automatically clear session and logout on 401 Unauthorized API responses
setOnUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});
